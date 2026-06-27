# Backend deployment

This project currently supports backend deployment with container images and a production-oriented Docker Compose manifest. Kubernetes can use the same images and environment variables.

## CI image publishing

Backend CI runs `mvn package`, builds all backend images, and publishes images to GitHub Container Registry on pushes to `dev` and `main`.

Published image pattern:

```text
ghcr.io/<owner>/<repo>/<service>:<12-char-git-sha>
ghcr.io/<owner>/<repo>/<service>:<branch-name>
```

Services:

- `user-service`
- `article-service`
- `comment-service`
- `interaction-service`
- `follower-service`
- `notification-service`
- `api-gateway`

For this repository the default namespace used by deployment examples is `ghcr.io/tanphong04/social-media-blog-platform`.

## Compose deployment

`deploy/compose/backend.compose.yml` runs only the backend application services. It expects PostgreSQL, Kafka, and Redis to be provisioned separately or supplied by another Compose/project network.

Example:

```powershell
$env:IMAGE_NAMESPACE="tanphong04/social-media-blog-platform"
$env:IMAGE_TAG="dev"
$env:JWT_ISSUER="https://api.example.com"
$env:JWT_KEY_ID="prod-2026-01"
$env:JWT_PRIVATE_KEY="<managed private key>"
$env:JWT_PUBLIC_KEY="<managed public key>"
$env:POSTGRES_USER="<db user>"
$env:POSTGRES_PASSWORD="<db password>"
$env:KAFKA_BOOTSTRAP_SERVERS="kafka:9092"
$env:REDIS_HOST="redis"
$env:CORS_ALLOWED_ORIGINS="https://app.example.com"
docker-compose -f deploy/compose/backend.compose.yml up -d
```

The Gateway is the only service published to the host by default. Internal service URLs use Compose DNS names such as `http://user-service:8081`.

## Required configuration

Set these values per environment:

- Database URLs: `USER_DB_URL`, `ARTICLE_DB_URL`, `COMMENT_DB_URL`, `INTERACTION_DB_URL`, `FOLLOWER_DB_URL`, `NOTIFICATION_DB_URL`.
- Database credentials: `POSTGRES_USER`, `POSTGRES_PASSWORD`.
- Kafka: `KAFKA_BOOTSTRAP_SERVERS`.
- Redis for Gateway rate limits: `REDIS_HOST`, `REDIS_PORT`.
- JWT issuer and key material: `JWT_ISSUER`, `JWT_KEY_ID`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`.
- Resource JWT verification: prefer `JWT_JWK_SET_URI=http://user-service:8081/.well-known/jwks.json` inside the backend network, or set `JWT_PUBLIC_KEY`.
- CORS: `CORS_ALLOWED_ORIGINS`.
- Proxy trust: `TRUST_FORWARDED_FOR=true` only behind a trusted load balancer or reverse proxy.

Do not store production secrets in Git, checked-in Compose files, image labels, or CI logs. Use the deployment platform's secret store and inject values as environment variables or mounted secret files.

## Migration strategy

Services run Flyway at startup with `ddl-auto=validate`. Each service owns its database and migrations.

Recommended rollout:

1. Take a database backup or snapshot before production migration.
2. Deploy one service at a time when its migration changes schema.
3. Let Flyway complete before routing traffic to the new task/pod.
4. Keep old service instances running only if the migration is backward-compatible.
5. Verify readiness and smoke tests before proceeding to the next service.

Rollback rules:

- If startup fails before a migration is applied, roll back the image and fix the migration in a new commit.
- If a migration applied successfully, do not edit the applied migration file. Add a forward corrective migration.
- If data repair is required, record exact SQL in the incident notes and run it during a controlled maintenance window.

## Smoke tests

Run smoke checks through the API Gateway after deployment:

```powershell
.\scripts\smoke-backend.ps1 -BaseUrl "https://api.example.com"
```

The default smoke test checks readiness and public read endpoints only. To include register/profile flow:

```powershell
.\scripts\smoke-backend.ps1 -BaseUrl "https://api.example.com" -CreateUser
```

Expected checks:

- Gateway readiness is `UP`.
- Public article feed responds.
- Public comments page responds.
- Public interaction state responds.
- Public followers page responds.
- Optional register/profile flow returns a usable access token.

## Current local deployment blocker

Local Docker engine is unavailable in the current workstation state. `docker info --format "{{.ServerVersion}}"` fails with `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine; ... The system cannot find the file specified.` Until Docker Desktop or another Docker engine is running, local image builds, Compose `up`, and Testcontainers cannot be executed here.
