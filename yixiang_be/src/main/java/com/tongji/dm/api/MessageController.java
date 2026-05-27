package com.tongji.dm.api;

import com.tongji.auth.token.JwtService;
import com.tongji.common.exception.BusinessException;
import com.tongji.common.exception.ErrorCode;
import com.tongji.dm.api.dto.ConversationDto;
import com.tongji.dm.api.dto.MessageDto;
import com.tongji.dm.mapper.DmConversationMapper;
import com.tongji.dm.mapper.DmMessageMapper;
import com.tongji.dm.model.DmConversation;
import com.tongji.dm.model.DmMessage;
import com.tongji.dm.sse.DmSseEmitterRegistry;
import com.tongji.user.domain.User;
import com.tongji.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
public class MessageController {

    private final DmConversationMapper convMapper;
    private final DmMessageMapper msgMapper;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final DmSseEmitterRegistry sseRegistry;

    @GetMapping("/conversations")
    public List<ConversationDto> listConversations(@AuthenticationPrincipal Jwt jwt,
                                                   @RequestParam(defaultValue = "30") int limit) {
        long uid = jwtService.extractUserId(jwt);
        List<DmConversation> convs = convMapper.listByUser(uid, Math.min(limit, 100));

        List<Long> otherIds = convs.stream()
                .map(c -> c.getUser1Id().equals(uid) ? c.getUser2Id() : c.getUser1Id())
                .distinct().toList();
        if (otherIds.isEmpty()) return List.of();

        Map<Long, User> userMap = userMapper.listByIds(otherIds)
                .stream().collect(Collectors.toMap(User::getId, u -> u));

        return convs.stream().map(c -> {
            long otherId = c.getUser1Id().equals(uid) ? c.getUser2Id() : c.getUser1Id();
            User other = userMap.get(otherId);
            int unread = c.getUser1Id().equals(uid) ? c.getUnread1() : c.getUnread2();
            return new ConversationDto(
                    c.getId(), otherId,
                    other != null ? other.getNickname() : "用户已注销",
                    other != null ? other.getAvatar() : null,
                    other != null && Boolean.TRUE.equals(other.getVerified()),
                    c.getLastMsgPreview(), c.getLastMsgAt(), unread);
        }).toList();
    }

    @PostMapping("/conversations")
    @Transactional
    public ConversationDto startConversation(@RequestParam long targetUserId,
                                              @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        if (uid == targetUserId) throw new BusinessException(ErrorCode.BAD_REQUEST, "不能与自己对话");

        DmConversation existing = convMapper.findBetween(uid, targetUserId);
        if (existing != null) return toDto(existing, uid);

        DmConversation conv = new DmConversation();
        conv.setId(ThreadLocalRandom.current().nextLong(Long.MAX_VALUE));
        conv.setUser1Id(Math.min(uid, targetUserId));
        conv.setUser2Id(Math.max(uid, targetUserId));
        try {
            convMapper.insert(conv);
        } catch (DuplicateKeyException e) {
            DmConversation raced = convMapper.findBetween(uid, targetUserId);
            if (raced != null) return toDto(raced, uid);
            throw e;
        }
        return toDto(convMapper.findById(conv.getId()), uid);
    }

    @GetMapping("/conversations/{convId}/messages")
    public List<MessageDto> listMessages(@PathVariable long convId,
                                          @RequestParam(required = false) Long beforeId,
                                          @RequestParam(defaultValue = "30") int size,
                                          @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        DmConversation conv = requireConvAccess(convId, uid);

        List<DmMessage> msgs = msgMapper.listByConv(convId, beforeId, Math.min(size, 50));
        convMapper.clearUnread(convId, uid, conv.getUser1Id());

        List<Long> senderIds = msgs.stream().map(DmMessage::getSenderId).distinct().toList();
        Map<Long, User> userMap = senderIds.isEmpty() ? Map.of()
                : userMapper.listByIds(senderIds).stream().collect(Collectors.toMap(User::getId, u -> u));

        return msgs.stream().map(m -> {
            User sender = userMap.get(m.getSenderId());
            return new MessageDto(m.getId(), m.getConvId(), m.getSenderId(),
                    sender != null ? sender.getNickname() : "?",
                    sender != null ? sender.getAvatar() : null,
                    m.getBody(), m.getSentAt(), m.getSenderId().equals(uid));
        }).toList();
    }

    @PostMapping("/conversations/{convId}/messages")
    @Transactional
    public MessageDto sendMessage(@PathVariable long convId,
                                   @RequestBody Map<String, String> body,
                                   @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        DmConversation conv = requireConvAccess(convId, uid);

        String text = body.get("body");
        if (text == null || text.isBlank()) throw new BusinessException(ErrorCode.BAD_REQUEST, "消息内容不能为空");
        if (text.length() > 2000) throw new BusinessException(ErrorCode.BAD_REQUEST, "消息过长");

        DmMessage msg = new DmMessage();
        msg.setId(ThreadLocalRandom.current().nextLong(Long.MAX_VALUE));
        msg.setConvId(convId);
        msg.setSenderId(uid);
        msg.setBody(text.trim());
        msgMapper.insert(msg);

        String preview = text.length() > 50 ? text.substring(0, 50) + "…" : text;
        convMapper.updateLastMsg(convId, preview);

        long recipientId = conv.getUser1Id().equals(uid) ? conv.getUser2Id() : conv.getUser1Id();
        convMapper.incrementUnread(convId, recipientId, conv.getUser1Id());

        User sender = userMapper.findById(uid);
        DmMessage saved = msgMapper.findById(msg.getId());
        if (saved == null) saved = msg;
        DmMessage committed = saved;
        Runnable notifyClients = () -> {
            String payload = "{\"convId\":" + convId + ",\"messageId\":" + committed.getId() + "}";
            sseRegistry.sendMessageEvent(recipientId, payload);
            sseRegistry.sendMessageEvent(uid, payload);
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    notifyClients.run();
                }
            });
        } else {
            notifyClients.run();
        }
        return new MessageDto(msg.getId(), convId, uid,
                sender != null ? sender.getNickname() : "?",
                sender != null ? sender.getAvatar() : null,
                msg.getBody(), saved.getSentAt(), true);
    }

    @GetMapping("/unread-count")
    public Map<String, Integer> unreadCount(@AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        return Map.of("unreadCount", convMapper.totalUnread(uid));
    }

    @PostMapping("/conversations/{convId}/read")
    public ResponseEntity<Void> markRead(@PathVariable long convId,
                                          @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        DmConversation conv = requireConvAccess(convId, uid);
        convMapper.clearUnread(convId, uid, conv.getUser1Id());
        return ResponseEntity.noContent().build();
    }

    private DmConversation requireConvAccess(long convId, long uid) {
        DmConversation conv = convMapper.findById(convId);
        if (conv == null) throw new BusinessException(ErrorCode.BAD_REQUEST, "会话不存在");
        if (!conv.getUser1Id().equals(uid) && !conv.getUser2Id().equals(uid)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return conv;
    }

    private ConversationDto toDto(DmConversation conv, long uid) {
        long otherId = conv.getUser1Id().equals(uid) ? conv.getUser2Id() : conv.getUser1Id();
        User other = userMapper.findById(otherId);
        int unread = conv.getUser1Id().equals(uid) ? (conv.getUnread1() != null ? conv.getUnread1() : 0)
                : (conv.getUnread2() != null ? conv.getUnread2() : 0);
        return new ConversationDto(conv.getId(), otherId,
                other != null ? other.getNickname() : "用户已注销",
                other != null ? other.getAvatar() : null,
                other != null && Boolean.TRUE.equals(other.getVerified()),
                conv.getLastMsgPreview(), conv.getLastMsgAt(), unread);
    }
}
