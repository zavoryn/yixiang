-- V4: direct messaging tables
CREATE TABLE IF NOT EXISTS dm_conversations (
    id               BIGINT        NOT NULL,
    user1_id         BIGINT        NOT NULL COMMENT 'smaller of the two user ids',
    user2_id         BIGINT        NOT NULL COMMENT 'larger of the two user ids',
    unread1          INT           NOT NULL DEFAULT 0,
    unread2          INT           NOT NULL DEFAULT 0,
    last_msg_preview VARCHAR(200)  NOT NULL DEFAULT '',
    last_msg_at      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    created_at       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uk_participants (user1_id, user2_id),
    INDEX idx_dm_user1 (user1_id, last_msg_at DESC),
    INDEX idx_dm_user2 (user2_id, last_msg_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dm_messages (
    id          BIGINT    NOT NULL,
    conv_id     BIGINT    NOT NULL,
    sender_id   BIGINT    NOT NULL,
    body        TEXT      NOT NULL,
    sent_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    read_at     DATETIME(3) DEFAULT NULL,
    PRIMARY KEY (id),
    INDEX idx_msg_conv (conv_id, id DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
