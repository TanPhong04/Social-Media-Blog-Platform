param(
    [string]$BaseUrl = "http://localhost:8080",
    [switch]$CreateUser,
    [string]$Email = "smoke-$([guid]::NewGuid().ToString('N'))@example.com",
    [string]$Password = "password123",
    [string]$DisplayName = "Smoke Test"
)

$ErrorActionPreference = "Stop"
$base = $BaseUrl.TrimEnd("/")

function Invoke-SmokeRequest {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Path,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )

    $uri = "$base$Path"
    Write-Host "Checking $Name -> $Method $uri"
    $parameters = @{
        Method = $Method
        Uri = $uri
        Headers = $Headers
    }
    if ($null -ne $Body) {
        $parameters.ContentType = "application/json"
        $parameters.Body = ($Body | ConvertTo-Json -Depth 10)
    }
    Invoke-RestMethod @parameters | Out-Null
}

Invoke-SmokeRequest -Name "gateway readiness" -Path "/actuator/health/readiness"
Invoke-SmokeRequest -Name "published article feed" -Path "/api/v1/articles"
Invoke-SmokeRequest -Name "public comments page" -Path "/api/v1/comments/articles/$([guid]::NewGuid())"
Invoke-SmokeRequest -Name "public interaction state" -Path "/api/v1/interactions/ARTICLE/$([guid]::NewGuid())"
Invoke-SmokeRequest -Name "public followers page" -Path "/api/v1/follows/users/$([guid]::NewGuid())/followers"

if ($CreateUser) {
    $tokens = Invoke-RestMethod -Method Post -Uri "$base/api/v1/auth/register" -ContentType "application/json" -Body (@{
        email = $Email
        password = $Password
        displayName = $DisplayName
    } | ConvertTo-Json)

    if (-not $tokens.accessToken) {
        throw "Register smoke did not return an access token."
    }

    Invoke-SmokeRequest -Name "authenticated profile" -Path "/api/v1/users/me" -Headers @{
        Authorization = "Bearer $($tokens.accessToken)"
    }
}

Write-Host "Backend smoke checks passed for $base"
