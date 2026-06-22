CREATE TABLE outbox_events(id UUID PRIMARY KEY,aggregate_type VARCHAR(80) NOT NULL,aggregate_id UUID NOT NULL,event_type VARCHAR(120) NOT NULL,event_version INTEGER NOT NULL,payload TEXT NOT NULL,occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,published_at TIMESTAMP WITH TIME ZONE,attempts INTEGER NOT NULL DEFAULT 0,status VARCHAR(20) NOT NULL);
CREATE INDEX idx_comment_outbox_pending ON outbox_events(status,occurred_at);
CREATE TABLE article_projection(article_id UUID PRIMARY KEY,active BOOLEAN NOT NULL,updated_at TIMESTAMP WITH TIME ZONE NOT NULL);
CREATE TABLE processed_events(event_id UUID PRIMARY KEY,event_type VARCHAR(120) NOT NULL,processed_at TIMESTAMP WITH TIME ZONE NOT NULL);
