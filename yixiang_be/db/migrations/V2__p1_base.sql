-- yixiang_be/db/migrations/V2__p1_base.sql
-- Phase 1 base: users 3 new cols + 4 new tables (topics, drafts, user_settings, activities).

-- 1. users 三列新字段 -----------------------------------------------------
ALTER TABLE users
    ADD COLUMN verified     TINYINT      NOT NULL DEFAULT 0   COMMENT '认证标记: 0=普通,1=已认证 (管理后台上线前由 SQL 手工更新)' AFTER tags_json,
    ADD COLUMN role_title   VARCHAR(20)  NULL                 COMMENT '角色头衔，如「华润元大基金管理-公司基金经理」'                AFTER verified,
    ADD COLUMN banner_image VARCHAR(500) NULL                 COMMENT '个人主页顶部 banner 图 URL'                                    AFTER role_title;

-- 2. topics 表 -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS topics (
    tag           VARCHAR(64)  NOT NULL PRIMARY KEY,
    post_count    INT          NOT NULL DEFAULT 0,
    view_count    BIGINT       NOT NULL DEFAULT 0,
    last_used_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_hot (post_count DESC, last_used_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT '话题主表，PK=tag (话题字符串本身)';

-- 3. drafts 表 -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS drafts (
    id           BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    user_id      BIGINT UNSIGNED NOT NULL,
    title        VARCHAR(120) NULL,
    content_url  VARCHAR(500) NULL              COMMENT 'OSS markdown URL，与 know_posts.content_url 同结构',
    tags         JSON         NULL,
    circle_id    BIGINT UNSIGNED NULL,
    cover_image  VARCHAR(500) NULL,
    updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_user (user_id, updated_at DESC),
    CONSTRAINT fk_draft_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    CONSTRAINT fk_draft_circle FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT '草稿箱: 每个用户的未发布稿件';

-- 4. user_settings 表 ----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_settings (
    user_id           BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    notification_pref JSON         NULL                  COMMENT '通知偏好 JSON，如 {"like":true,"comment":true,"follow":false,"system":true}',
    privacy           JSON         NULL                  COMMENT '隐私设置 JSON，如 {"hideFollowing":false,"hideCollections":true}',
    theme             VARCHAR(16)  NOT NULL DEFAULT 'light',
    language          VARCHAR(16)  NOT NULL DEFAULT 'zh-CN',
    updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_us_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT '用户偏好设置';

-- 5. activities 表 -------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
    id          BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL                COMMENT '行为发起人',
    type        ENUM('POST','LIKE','FAVORITE','FOLLOW','JOIN_CIRCLE') NOT NULL,
    target_type ENUM('POST','USER','CIRCLE') NOT NULL,
    target_id   BIGINT UNSIGNED NOT NULL,
    payload     JSON         NULL                       COMMENT '冗余信息，如 post 标题/封面，避免读放大',
    created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_user_time (user_id, created_at DESC),
    INDEX idx_archive (created_at)                      COMMENT '90 天归档定时任务用',
    CONSTRAINT fk_act_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT '用户行为时间线，由 Kafka 消费者从 counter-events 和 outbox 聚合';
