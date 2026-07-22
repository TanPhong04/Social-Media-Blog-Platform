ALTER TABLE users ADD COLUMN username VARCHAR(50);
ALTER TABLE users ADD COLUMN dob VARCHAR(20);

-- Tự động sinh username mặc định cho các tài khoản cũ để tránh bị trùng NULL
UPDATE users SET username = 'user_' || substring(id::text, 1, 8) WHERE username IS NULL;

-- Áp dụng ràng buộc UNIQUE cho username
ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
