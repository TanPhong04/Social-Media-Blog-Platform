CREATE TABLE chat_messages (
    id UUID PRIMARY KEY,
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_chat_messages_sender_recipient ON chat_messages(sender_id, recipient_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
