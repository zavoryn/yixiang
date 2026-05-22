-- V3: circle_files table for shared file storage in circles
CREATE TABLE IF NOT EXISTS circle_files (
    id           BIGINT       NOT NULL,
    circle_id    BIGINT       NOT NULL,
    uploader_id  BIGINT       NOT NULL,
    filename     VARCHAR(255) NOT NULL,
    file_size    BIGINT       DEFAULT 0,
    mime_type    VARCHAR(100) DEFAULT NULL,
    oss_key      VARCHAR(500) NOT NULL,
    oss_url      VARCHAR(1000) NOT NULL,
    created_at   DATETIME(3)  DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    INDEX idx_cf_circle_id  (circle_id),
    INDEX idx_cf_uploader_id (uploader_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT '圈子共享文件';
