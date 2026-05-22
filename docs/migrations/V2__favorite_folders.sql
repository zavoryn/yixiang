-- Phase 6: Favorite Folders
-- Run this once against your MySQL database

CREATE TABLE IF NOT EXISTS favorite_folders (
    id         BIGINT       NOT NULL,
    user_id    BIGINT       NOT NULL,
    name       VARCHAR(50)  NOT NULL,
    created_at DATETIME(3)  DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    INDEX idx_ff_user_id (user_id)
);

ALTER TABLE user_favorites
    ADD COLUMN IF NOT EXISTS folder_id BIGINT DEFAULT NULL,
    ADD INDEX  idx_uf_folder (user_id, folder_id);
