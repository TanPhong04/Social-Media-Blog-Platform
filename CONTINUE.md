# Continuation handoff

Updated: 2026-06-22 (Asia/Saigon)

## Completed

- Root Maven reactor using Java 21, Spring Boot 3.4.6 and Spring Cloud 2024.0.1.
- `backend/user-service`:
  - PostgreSQL Flyway schema for users and hashed refresh tokens.
  - Register/login with BCrypt and normalized email.
  - HS256 access JWT and one-time rotating refresh tokens.
  - Authenticated read/update current profile.
  - Structured validation and domain errors.
  - Transactional `outbox_events` table and `UserRegistered` event created in the registration transaction.
  - Scheduled Kafka outbox publisher with acknowledgement, retries, terminal failed status, and unit tests.
  - Correlation ID from the HTTP request is preserved in the event envelope.
  - Logout endpoint, refresh-token revocation, and scheduled expired/revoked token cleanup.
  - PostgreSQL `FOR UPDATE SKIP LOCKED` row claiming prevents concurrent outbox publishers from selecting the same batch.
- `backend/article-service`:
  - Independent `article_db` Flyway schema for articles and tags.
  - Authenticated create/edit/publish/unpublish/soft-delete operations with ownership checks.
  - Public published feed and slug lookup; author draft listing.
  - Stable paginated JSON representation.
  - Transactional ArticlePublished/ArticleDeleted outbox events with request correlation ID.
  - Kafka publisher with SKIP LOCKED claiming, retry/failed state, and tests.
- `backend/comment-service`:
  - Independent `comment_db` Flyway schema.
  - Public paginated article comments, authenticated root comments/replies, ownership checks, editing, and soft deletion.
  - Gateway route on port 8083 and integration tests.
  - Transactional CommentCreated/CommentDeleted outbox events with correlation propagation.
  - SKIP LOCKED Kafka publisher with acknowledgement, retry, terminal failure, and tests.
  - Idempotent ArticlePublished/ArticleDeleted consumer with processed-event deduplication and local article projection.
  - Comment creation is rejected for unknown, unpublished, or deleted articles.
- `backend/interaction-service`:
  - Independent `interaction_db`, Gateway route, and JWT authorization.
  - Idempotent like/unlike for ARTICLE and COMMENT with a database uniqueness constraint.
  - Public aggregate count plus authenticated current-user state.
  - Idempotent article/comment event consumers with processed-event deduplication and target projection.
  - InteractionCreated/InteractionRemoved transactional outbox, correlation propagation, SKIP LOCKED publisher, retry/failure state, and tests.
- `backend/follower-service`:
  - Independent `follower_db`, Gateway route, and JWT authorization.
  - Idempotent follow/unfollow with database uniqueness and self-follow prevention.
  - Public paginated followers/following lists and authenticated relationship status/counts.
  - Idempotent UserRegistered consumer with local user projection.
  - UserFollowed/UserUnfollowed transactional outbox, correlation propagation, SKIP LOCKED publisher, retry/failure state, and tests.
- `backend/api-gateway`:
  - Routes auth/user endpoints to port 8081.
  - Adds/propagates `X-Correlation-ID`.
  - CORS configuration.
- Local Docker Compose for PostgreSQL, Kafka (KRaft), Redis, and MinIO.
- Architecture and phased roadmap documentation.

## Verification evidence

- `mvn test`: BUILD SUCCESS; 28 tests passed (5 user-service, 4 article-service, 6 comment-service, 6 interaction-service, 6 follower-service, 1 gateway).
- `mvn -pl backend/comment-service test`: BUILD SUCCESS; 6 tests passed after the final Comment publisher test was added.
- `mvn -pl backend/interaction-service test`: BUILD SUCCESS; 6 tests passed.
- `mvn -pl backend/follower-service test`: BUILD SUCCESS; 6 tests passed.
- `docker-compose config --quiet`: exit code 0.
- The installed Docker CLI does not support `docker compose`; use `docker-compose`.

## Known limitations / immediate work

1. Flutter scaffold is not present. `flutter create`, `flutter create --no-pub`, and `flutter doctor -v` all hung without output and were terminated.
2. JWT uses one shared HMAC secret. This is acceptable for local M1; asymmetric signing/JWKS is preferred before production.
3. Outbox publisher has unit coverage but no real Kafka integration test. Docker Desktop is not running (`docker_engine` named pipe missing), so Testcontainers cannot start.
4. Notification Service, personalized feed and Flutter are not implemented yet.
6. Tests use H2. Add PostgreSQL/Kafka Testcontainers after Docker Desktop is available.

## Exact next implementation order

1. Run `mvn test` and preserve the green baseline.
2. Implement Notification Service consumers and unread state.
3. Implement personalized feed from follower relationships.
4. Start Docker Desktop for Testcontainers, and repair/reinstall Flutter SDK for the client.

## Prompt for the next Codex session

```text
Continue implementing the Social Media Blog Platform in the current workspace.

First read README.md, CONTINUE.md, docs/architecture.md, and docs/roadmap.md. Inspect the actual worktree; do not recreate completed code and do not discard existing changes. Run `mvn test` to establish the baseline.

Continue from M1 in this exact order:
1. Implement Notification Service with independent notification_db and Gateway route. Idempotently consume UserFollowed, CommentCreated, InteractionCreated and ArticlePublished events; persist processed event IDs and avoid self-notifications.
2. Store recipientId, actorId, type, entity type/id, JSON metadata, createdAt and readAt. Expose authenticated paginated notifications, unread count, mark-one-read and mark-all-read APIs. Add integration and consumer deduplication tests.
3. Add a personalized feed endpoint using follower relationships without sharing databases. Prefer an event-driven author-follow projection in Article Service or a dedicated Feed Service; document and test the selected consistency model.
4. Start Docker Desktop if possible and add PostgreSQL + Kafka Testcontainers coverage. Continue source implementation if unavailable.
5. Repair Flutter SDK and implement all completed backend flows.

Rules:
- Java 21, Spring Boot 3.4.6, Spring Cloud 2024.0.1.
- Database per service; never access another service's tables.
- REST for immediate operations; Kafka events for cross-service side effects.
- Keep controllers thin, consumers idempotent, events versioned, and migrations explicit.
- Use `docker-compose` on this machine, not `docker compose`.
- After every meaningful slice, run relevant tests and fix failures.
- Continue autonomously until quota is nearly exhausted. Before stopping, update CONTINUE.md with completed work, exact test results, blockers, and replace this prompt with the next precise continuation prompt.
```
