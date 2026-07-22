-- Chuyển đổi cột avatar_url từ VARCHAR(500) sang TEXT để chứa được chuỗi ảnh Base64 nén
ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT;
