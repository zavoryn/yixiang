CREATE TABLE IF NOT EXISTS favorite_folders (
    id BIGINT UNSIGNED PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(50) NOT NULL,
    cover_url VARCHAR(500) NULL,
    item_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_fav_folder_user_name (user_id, name),
    KEY idx_fav_folder_user_created (user_id, created_at DESC)
);

SET @has_user_favorites_folder_id := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user_favorites'
      AND COLUMN_NAME = 'folder_id'
);

SET @ddl := IF(
    @has_user_favorites_folder_id = 0,
    'ALTER TABLE user_favorites ADD COLUMN folder_id BIGINT UNSIGNED NULL COMMENT ''所属收藏夹，NULL=默认''',
    'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_user_favorites_folder_idx := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user_favorites'
      AND INDEX_NAME = 'idx_uf_folder'
);

SET @ddl := IF(
    @has_user_favorites_folder_idx = 0,
    'ALTER TABLE user_favorites ADD INDEX idx_uf_folder (user_id, folder_id)',
    'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
