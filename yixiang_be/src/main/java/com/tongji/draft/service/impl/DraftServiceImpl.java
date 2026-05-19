package com.tongji.draft.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.common.exception.BusinessException;
import com.tongji.common.exception.ErrorCode;
import com.tongji.draft.api.dto.DraftCreateRequest;
import com.tongji.draft.api.dto.DraftPatchRequest;
import com.tongji.draft.api.dto.DraftResponse;
import com.tongji.draft.mapper.DraftMapper;
import com.tongji.draft.model.Draft;
import com.tongji.draft.service.DraftService;
import com.tongji.knowpost.mapper.KnowPostMapper;
import com.tongji.knowpost.model.KnowPost;
import com.tongji.topic.service.TopicService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class DraftServiceImpl implements DraftService {

    private final DraftMapper draftMapper;
    private final KnowPostMapper postMapper;
    private final ObjectMapper objectMapper;
    private final TopicService topicService;

    public DraftServiceImpl(DraftMapper draftMapper,
                            KnowPostMapper postMapper,
                            ObjectMapper objectMapper,
                            TopicService topicService) {
        this.draftMapper = draftMapper;
        this.postMapper = postMapper;
        this.objectMapper = objectMapper;
        this.topicService = topicService;
    }

    @Override
    @Transactional
    public DraftResponse create(long userId, DraftCreateRequest req) {
        Draft d = Draft.builder()
                .id(ThreadLocalRandom.current().nextLong(Long.MAX_VALUE))
                .userId(userId)
                .title(req.title())
                .contentUrl(req.contentUrl())
                .tagsJson(serializeTags(req.tags()))
                .circleId(req.circleId())
                .coverImage(req.coverImage())
                .build();
        draftMapper.insert(d);
        return toResponse(draftMapper.findById(d.getId()));
    }

    @Override
    public DraftResponse get(long userId, long draftId) {
        return toResponse(requireOwned(draftId, userId));
    }

    @Override
    public List<DraftResponse> listMine(long userId) {
        return draftMapper.listByUser(userId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public DraftResponse update(long userId, long draftId, DraftPatchRequest req) {
        requireOwned(draftId, userId);
        Draft patch = Draft.builder()
                .id(draftId)
                .title(req.title())
                .contentUrl(req.contentUrl())
                .tagsJson(req.tags() == null ? null : serializeTags(req.tags()))
                .circleId(req.circleId())
                .coverImage(req.coverImage())
                .build();
        draftMapper.update(patch);
        return toResponse(draftMapper.findById(draftId));
    }

    @Override
    @Transactional
    public void delete(long userId, long draftId) {
        int rows = draftMapper.delete(draftId, userId);
        if (rows == 0) throw new BusinessException(ErrorCode.DRAFT_NOT_FOUND);
    }

    @Override
    @Transactional
    public long publish(long userId, long draftId) {
        Draft d = requireOwned(draftId, userId);
        if (d.getTitle() == null || d.getTitle().isBlank()
            || d.getContentUrl() == null || d.getContentUrl().isBlank()) {
            throw new BusinessException(ErrorCode.DRAFT_PUBLISH_INVALID);
        }

        KnowPost post = new KnowPost();
        post.setId(ThreadLocalRandom.current().nextLong(Long.MAX_VALUE));
        post.setCreatorId(userId);
        post.setTitle(d.getTitle());
        post.setContentUrl(d.getContentUrl());
        post.setTags(d.getTagsJson());
        post.setCircleId(d.getCircleId());
        post.setDescription(null);
        post.setImgUrls(d.getCoverImage() != null ? "[\"" + d.getCoverImage() + "\"]" : null);
        post.setStatus("draft");
        post.setCreateTime(Instant.now());
        post.setUpdateTime(Instant.now());

        postMapper.insertDraft(post);
        postMapper.publish(post.getId(), userId);

        draftMapper.delete(draftId, userId);
        topicService.onPostCreated(parseTags(d.getTagsJson()));
        return post.getId();
    }

    private Draft requireOwned(long draftId, long userId) {
        Draft d = draftMapper.findById(draftId);
        if (d == null) throw new BusinessException(ErrorCode.DRAFT_NOT_FOUND);
        if (d.getUserId() == null || d.getUserId() != userId) {
            throw new BusinessException(ErrorCode.DRAFT_FORBIDDEN);
        }
        return d;
    }

    private DraftResponse toResponse(Draft d) {
        return new DraftResponse(
                d.getId(), d.getTitle(), d.getContentUrl(),
                parseTags(d.getTagsJson()),
                d.getCircleId(), d.getCoverImage(),
                d.getUpdatedAt(), d.getCreatedAt()
        );
    }

    private String serializeTags(List<String> tags) {
        if (tags == null) return null;
        try {
            return objectMapper.writeValueAsString(tags);
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<String> parseTags(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
