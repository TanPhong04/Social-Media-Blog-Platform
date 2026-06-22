CREATE TABLE target_projection(target_type VARCHAR(20) NOT NULL,target_id UUID NOT NULL,active BOOLEAN NOT NULL,updated_at TIMESTAMP WITH TIME ZONE NOT NULL,PRIMARY KEY(target_type,target_id));
CREATE TABLE interactions(id UUID PRIMARY KEY,actor_id UUID NOT NULL,target_type VARCHAR(20) NOT NULL,target_id UUID NOT NULL,created_at TIMESTAMP WITH TIME ZONE NOT NULL,CONSTRAINT uk_interaction_actor_target UNIQUE(actor_id,target_type,target_id));
CREATE INDEX idx_interactions_target ON interactions(target_type,target_id);
CREATE TABLE outbox_events(id UUID PRIMARY KEY,aggregate_type VARCHAR(80) NOT NULL,aggregate_id UUID NOT NULL,event_type VARCHAR(120) NOT NULL,event_version INTEGER NOT NULL,payload TEXT NOT NULL,occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,published_at TIMESTAMP WITH TIME ZONE,attempts INTEGER NOT NULL DEFAULT 0,status VARCHAR(20) NOT NULL);
CREATE INDEX idx_interaction_outbox_pending ON outbox_events(status,occurred_at);
CREATE TABLE processed_events(event_id UUID PRIMARY KEY,event_type VARCHAR(120) NOT NULL,processed_at TIMESTAMP WITH TIME ZONE NOT NULL);
