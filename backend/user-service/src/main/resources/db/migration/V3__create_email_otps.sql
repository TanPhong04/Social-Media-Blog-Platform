CREATE TABLE email_otps (
    id UUID PRIMARY KEY,
    email VARCHAR(320) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL
);
CREATE INDEX idx_email_otps_email ON email_otps(email);
