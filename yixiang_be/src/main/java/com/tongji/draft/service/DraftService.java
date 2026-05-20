package com.tongji.draft.service;

import com.tongji.draft.api.dto.DraftCreateRequest;
import com.tongji.draft.api.dto.DraftPatchRequest;
import com.tongji.draft.api.dto.DraftResponse;

import java.util.List;

public interface DraftService {
    DraftResponse create(long userId, DraftCreateRequest req);
    DraftResponse get(long userId, long draftId);
    List<DraftResponse> listMine(long userId);
    DraftResponse update(long userId, long draftId, DraftPatchRequest req);
    void delete(long userId, long draftId);
    long publish(long userId, long draftId);
}
