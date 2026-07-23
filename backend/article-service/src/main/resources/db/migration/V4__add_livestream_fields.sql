ALTER TABLE articles ADD COLUMN is_livestream BOOLEAN DEFAULT FALSE;
ALTER TABLE articles ADD COLUMN stream_key VARCHAR(100);
ALTER TABLE articles ADD COLUMN live_status VARCHAR(20);
ALTER TABLE articles ADD COLUMN live_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE articles ADD COLUMN live_ended_at TIMESTAMP WITH TIME ZONE;

CREATE UNIQUE INDEX idx_articles_stream_key ON articles(stream_key) WHERE stream_key IS NOT NULL;
