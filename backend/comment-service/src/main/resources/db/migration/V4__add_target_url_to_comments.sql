ALTER TABLE comments ADD COLUMN target_url VARCHAR(2048);
CREATE INDEX idx_comments_target_url ON comments(target_url);
