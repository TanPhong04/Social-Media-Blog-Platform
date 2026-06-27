# Backend security review checklist

Updated: 2026-06-27 (Asia/Saigon)

This checklist records the backend source/config security review for production acceptance. Environment-specific checks still need to be repeated in staging and production with real infrastructure, secrets, TLS, and network policy.

## Source/config review status

| Area | Status | Evidence |
| --- | --- | --- |
| Public edge | Pass | `docs/security.md` states public traffic must enter through API Gateway, and `deploy/compose/backend.compose.yml` publishes only `api-gateway` to the host. Backend service ports are exposed only to the Compose backend network. |
| Service authentication | Pass | User, article, comment, interaction, follower, and notification services use stateless Spring Security. Only public read routes and `/actuator/health/**` are `permitAll`; write and user-specific routes require JWT authentication. |
| Token signing | Pass | User Service signs RS256 JWTs with `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, and `JWT_KEY_ID`; startup rejects partial key configuration. Resource services validate issuer and verify JWTs through `JWT_JWK_SET_URI` or `JWT_PUBLIC_KEY`. |
| Key rotation | Pass | User Service supports active plus previous verification keys, publishes JWKS, and documents overlapping rotation in `docs/security.md`. |
| Passwords and refresh tokens | Pass | Passwords are BCrypt-hashed. Refresh tokens are high-entropy random values and stored as hashes with one-time rotation and revocation. |
| Request validation | Pass | Auth, profile, article, comment, and pagination inputs have explicit validation limits documented in `docs/security.md`; invalid inputs use the standard API error envelope. |
| Rate limits | Pass | API Gateway applies Redis-backed request rate limits to auth, article writes, comments, interactions, follows, and notification write endpoints. |
| CORS | Pass | Local profile allows localhost development origins. Staging/prod require explicit `CORS_ALLOWED_ORIGINS`; credentials are allowed only for configured origins. |
| Correlation IDs | Pass | Gateway and services propagate `X-Correlation-ID`; events preserve the correlation ID for auditability across async flows. |
| Secrets in repository | Pass | Production secret values are not checked in. `.env.example` contains placeholders/defaults only, and `docs/deployment.md` requires platform secret storage. |
| Actuator exposure | Pass with deployment requirement | Services expose health/info/prometheus, but security config only permits unauthenticated `/actuator/health/**`. Metrics endpoints must remain private through deployment network policy. |
| Database isolation | Pass | Each service owns its database URL/migrations; architecture docs forbid cross-service table access. |
| Migration safety | Pass | Services run Flyway with Hibernate `ddl-auto=validate`; deployment docs require backups, one-service-at-a-time rollout, and forward corrective migrations. |
| Event safety | Pass with integration-test gap | Consumers deduplicate by event ID and outbox publishers use durable retry/failure state. Real Kafka DLT and replay behavior still needs Testcontainers or staging verification. |
| Container publishing | Pass with runtime verification gap | CI builds images and publishes GHCR images on `dev`/`main`; local image build cannot be rerun until Docker is available. |

## Pre-deploy verification gates

Before any production cutover, verify these items in the target environment:

1. Direct service ports are inaccessible from the public internet; only the API Gateway or load balancer is public.
2. TLS terminates at the trusted edge, and forwarded headers are trusted only from that edge.
3. `CORS_ALLOWED_ORIGINS` contains exact frontend origins, with no wildcard production origin.
4. `JWT_ISSUER` exactly matches the public issuer expected by clients and resource services.
5. `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, and prior `JWT_VERIFICATION_KEYS` are injected from the secret manager, not image/env files in Git.
6. Resource services use `JWT_JWK_SET_URI` in staging/prod unless a documented single-key exception is approved.
7. PostgreSQL users are least-privilege per database, and backups are enabled before Flyway migrations.
8. Kafka topics, DLT topics, and consumer groups exist with the retention policy documented in `docs/kafka-topics.md`.
9. Prometheus endpoints are reachable only by monitoring infrastructure.
10. Run `.\scripts\smoke-backend.ps1 -BaseUrl "<staging-gateway-url>"` after deployment; add `-CreateUser` only in disposable staging data.

## Current blockers

- Docker Desktop is not running, so local Testcontainers, image builds, and Compose `up` cannot be executed.
- No staging Gateway URL or credentials are configured in this workspace, so staging smoke tests cannot be executed here.
