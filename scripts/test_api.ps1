$body = @{
    email = "test4@example.com"
    password = "password123"
    displayName = "Test User 4"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://axion.id.vn/api/v1/auth/register" -Method Post -Body $body -ContentType "application/json"
