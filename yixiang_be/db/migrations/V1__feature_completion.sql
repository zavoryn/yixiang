-- yixiang_be/db/migrations/V1__feature_completion.sql

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
    id           BIGINT       NOT NULL PRIMARY KEY,
    recipient_id BIGINT       NOT NULL,
    actor_id     BIGINT       NULL,
    type         ENUM('LIKE','COMMENT','FOLLOW','SYSTEM') NOT NULL,
    entity_type  ENUM('POST','COMMENT') NULL,
    entity_id    BIGINT       NULL,
    content      VARCHAR(255) NULL,
    is_read      TINYINT      NOT NULL DEFAULT 0,
    created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_recipient (recipient_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 收藏记录表（支持列表查询，补充 counter 模块只存计数的不足）
CREATE TABLE IF NOT EXISTS user_favorites (
    id         BIGINT      NOT NULL PRIMARY KEY,
    user_id    BIGINT      NOT NULL,
    post_id    BIGINT      NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_user_post (user_id, post_id),
    INDEX idx_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 圈子表
CREATE TABLE IF NOT EXISTS circles (
    id           BIGINT       NOT NULL PRIMARY KEY,
    name         VARCHAR(50)  NOT NULL,
    description  TEXT         NULL,
    avatar_url   VARCHAR(512) NULL,
    owner_id     BIGINT       NOT NULL,
    visibility   ENUM('PUBLIC','PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    status       ENUM('ACTIVE','DISBANDED') NOT NULL DEFAULT 'ACTIVE',
    category     VARCHAR(50)  NULL,
    member_count INT          NOT NULL DEFAULT 0,
    post_count   INT          NOT NULL DEFAULT 0,
    created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_category (category, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 圈子成员表
CREATE TABLE IF NOT EXISTS circle_members (
    id        BIGINT NOT NULL PRIMARY KEY,
    circle_id BIGINT NOT NULL,
    user_id   BIGINT NOT NULL,
    role      ENUM('OWNER','ADMIN','MEMBER') NOT NULL DEFAULT 'MEMBER',
    status    ENUM('ACTIVE','PENDING')       NOT NULL DEFAULT 'ACTIVE',
    joined_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_circle_user (circle_id, user_id),
    INDEX idx_user (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- know_posts 新增圈子关联列和精华标记
ALTER TABLE know_posts
    ADD COLUMN circle_id   BIGINT  NULL    COMMENT '所属圈子ID，NULL表示公开帖子' AFTER creator_id,
    ADD COLUMN is_featured TINYINT NOT NULL DEFAULT 0 COMMENT '是否被圈主标为精华' AFTER circle_id;

ALTER TABLE know_posts ADD INDEX idx_circle (circle_id, create_time);
ALTER TABLE know_posts ADD INDEX idx_circle_featured (circle_id, is_featured, create_time);
