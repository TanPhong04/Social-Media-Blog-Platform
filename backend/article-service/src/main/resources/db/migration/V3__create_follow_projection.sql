CREATE TABLE follow_projection(
 follower_id UUID NOT NULL,
 followed_id UUID NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE NOT NULL,
 PRIMARY KEY(follower_id,followed_id)
);
CREATE INDEX idx_article_follow_projection_follower ON follow_projection(follower_id);

CREATE TABLE processed_events(
 event_id UUID PRIMARY KEY,
 event_type VARCHAR(120) NOT NULL,
 processed_at TIMESTAMP WITH TIME ZONE NOT NULL
);
