# Delivery roadmap

## M1 - Foundation and identity (current)

- [x] Maven multi-module repository
- [x] PostgreSQL, Kafka, Redis, MinIO local infrastructure
- [x] API Gateway routing and correlation ID
- [x] Register, login, rotating refresh token, current profile
- [x] Backend integration tests
- [x] Transactional outbox and `UserRegistered` publication
- [x] Propagate gateway correlation ID into event envelope
- [ ] Add PostgreSQL/Kafka integration test (Docker Desktop is not running)
- [ ] Flutter authentication client (blocked by local Flutter CLI hanging)

## M2 - Articles

- [x] Article-owned PostgreSQL database and Flyway migrations
- [x] Draft/create/edit/publish/unpublish/delete lifecycle
- [x] Slug, tags, pagination, ownership checks
- [x] `ArticlePublished` and `ArticleDeleted` outbox events
- Feed and article-detail Flutter screens

## M3 - Social interactions

- [x] Comment service with replies, ownership, and soft deletion
- [x] CommentCreated/CommentDeleted outbox events
- [x] Idempotent article-event projection in Comment Service
- [x] Interaction service for article/comment likes, counts, target projection, and outbox
- [x] Follower service, user projection, relationship events, and pagination
- [x] Fan-out-on-read personalized feed using Article Service follow projection
- [x] Idempotent Kafka consumers
- [x] Dead-letter topics

## M4 - Notifications and production readiness

- [x] Notification service and unread state
- [ ] PostgreSQL Testcontainers for every service
- [ ] Kafka Testcontainers for outbox publishers and consumers
- [x] Consumer retry/backoff and dead-letter topics
- [ ] Observability: structured logs, metrics, Kafka topic docs, and health/readiness complete; runbooks still pending
- [ ] Security hardening: JWKS complete; rate limits and environment-specific CORS/config still pending
- [ ] API contracts and gateway route tests
- [ ] Flutter client for all completed backend flows
- [x] Backend service Dockerfiles
- [x] CI pipeline for Maven package and Docker image build
- [ ] Image publishing, staging deployment, and smoke tests
