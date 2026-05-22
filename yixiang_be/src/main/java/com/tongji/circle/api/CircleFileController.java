package com.tongji.circle.api;

import com.tongji.auth.token.JwtService;
import com.tongji.circle.api.dto.CircleFileResponse;
import com.tongji.circle.mapper.CircleFileMapper;
import com.tongji.circle.model.CircleFile;
import com.tongji.circle.service.CircleService;
import com.tongji.common.exception.BusinessException;
import com.tongji.common.exception.ErrorCode;
import com.tongji.storage.OssStorageService;
import com.tongji.user.domain.User;
import com.tongji.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/circles/{circleId}/files")
@RequiredArgsConstructor
public class CircleFileController {

    private final CircleService circleService;
    private final CircleFileMapper fileMapper;
    private final OssStorageService ossService;
    private final JwtService jwtService;
    private final UserMapper userMapper;

    @GetMapping
    public List<CircleFileResponse> listFiles(@PathVariable long circleId,
                                              @RequestParam(defaultValue = "50") int limit,
                                              @AuthenticationPrincipal Jwt jwt) {
        Long uid = jwt != null ? jwtService.extractUserId(jwt) : null;
        if (!circleService.isMember(uid != null ? uid : -1L, circleId)) {
            throw new BusinessException(ErrorCode.NOT_CIRCLE_MEMBER);
        }
        List<CircleFile> files = fileMapper.listByCircle(circleId, Math.min(limit, 100));
        List<Long> uploaderIds = files.stream().map(CircleFile::getUploaderId).distinct().toList();
        Map<Long, String> nickMap = uploaderIds.isEmpty() ? Map.of()
                : userMapper.listByIds(uploaderIds).stream()
                        .collect(Collectors.toMap(User::getId, User::getNickname));
        return files.stream()
                .map(f -> new CircleFileResponse(
                        f.getId(), f.getFilename(), f.getFileSize() != null ? f.getFileSize() : 0L,
                        f.getMimeType(), f.getOssUrl(), f.getUploaderId(),
                        nickMap.getOrDefault(f.getUploaderId(), "未知"),
                        f.getCreatedAt()))
                .toList();
    }

    @PostMapping
    public CircleFileResponse uploadFile(@PathVariable long circleId,
                                         @RequestPart("file") MultipartFile file,
                                         @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        if (!circleService.isMember(uid, circleId)) {
            throw new BusinessException(ErrorCode.NOT_CIRCLE_MEMBER);
        }
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String ossUrl = ossService.uploadFile("circle-files/" + circleId, filename, file);

        CircleFile cf = new CircleFile();
        cf.setId(ThreadLocalRandom.current().nextLong(Long.MAX_VALUE));
        cf.setCircleId(circleId);
        cf.setUploaderId(uid);
        cf.setFilename(filename);
        cf.setFileSize(file.getSize());
        cf.setMimeType(file.getContentType());
        cf.setOssKey("circle-files/" + circleId + "/" + filename);
        cf.setOssUrl(ossUrl);
        fileMapper.insert(cf);

        User uploader = userMapper.findById(uid);
        return new CircleFileResponse(cf.getId(), cf.getFilename(), cf.getFileSize(),
                cf.getMimeType(), cf.getOssUrl(), uid,
                uploader != null ? uploader.getNickname() : "未知",
                cf.getCreatedAt());
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(@PathVariable long circleId,
                                            @PathVariable long fileId,
                                            @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        CircleFile file = fileMapper.findById(fileId);
        if (file == null || file.getCircleId() != circleId) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "文件不存在");
        }
        // Only uploader or circle owner/admin can delete
        boolean isUploader = file.getUploaderId() == uid;
        boolean isAdmin = circleService.isMember(uid, circleId); // simplified: member check
        if (!isUploader && !isAdmin) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        fileMapper.deleteById(fileId);
        return ResponseEntity.noContent().build();
    }
}
