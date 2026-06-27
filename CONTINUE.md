# Continuation handoff

Updated: 2026-06-27 (Asia/Saigon)

## Completed

- Root Maven reactor using Java 21, Spring Boot 3.4.6 and Spring Cloud 2024.0.1.
- `backend/user-service`:
  - PostgreSQL Flyway schema for users and hashed refresh tokens.
  - Register/login with BCrypt and normalized email.
  - RS256 access JWT, public `/.well-known/jwks.json`, and one-time rotating refresh tokens.
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
- `backend/notification-service`:
  - Independent `notification_db`, Gateway route, and JWT authorization.
  - Authenticated paginated notification inbox, unread count, mark-one-read, and mark-all-read APIs.
  - Idempotently consumes UserFollowed/UserUnfollowed, CommentCreated, InteractionCreated, and ArticlePublished events.
  - Stores recipient, actor, notification type, entity type/id, metadata, created/read timestamps, follow projection, and processed event IDs.
- `backend/article-service` personalized feed:
  - Idempotently consumes UserFollowed/UserUnfollowed events into a local follow projection.
  - Exposes authenticated `/api/v1/articles/following` fan-out-on-read feed for published articles by followed authors.
  - Documents eventual consistency and keeps database ownership boundaries intact.
- Backend reliability and operability:
  - Kafka consumers in article, comment, interaction, follower, and notification services use Spring Kafka retry/backoff with dead-letter publishing to `<source-topic>.DLT`.
  - Kafka retry and dead-letter paths log structured failure context including topic, partition, offset, event ID, event type, correlation ID, delivery attempt, and root cause.
  - Outbox publishers expose pending/failed gauges, publish latency timers, and publish success/failure counters.
  - Kafka consumers expose processed/retry/dead-letter counters, and Notification Service records article notification fan-out size.
  - Kafka topic names, publisher ownership, consumers, DLT naming, retention assumptions, and replay behavior are documented in `docs/kafka-topics.md`.
  - Article, comment, interaction, follower, notification, user, and gateway modules expose actuator health/info/prometheus with health probes enabled.
  - Service health endpoints are public at `/actuator/health/**`; authenticated API routes remain protected.
  - All backend services and the API Gateway have Java 21 runtime Dockerfiles.
  - GitHub Actions backend CI runs `mvn package`, builds all backend Docker images, and publishes GHCR images on `dev`/`main` pushes.
  - Backend services and the API Gateway enable Spring Boot ECS structured console logs.
  - Prometheus dashboard notes, first alert suggestions, and runbooks for failed outbox rows, stuck consumers, migration failures, Kafka replay, and DLT recovery are documented in `docs/operations.md`.
  - Production-oriented backend Compose, migration/rollback guidance, secret/config guidance, image publishing notes, and Gateway smoke tests are documented in `docs/deployment.md`.
- Backend security hardening:
  - User Service signs access tokens with RSA/RS256, validates issuer, and exposes a public JWKS endpoint at `/.well-known/jwks.json`.
  - User Service supports overlapping JWT key rotation by publishing configured previous public keys in JWKS and validating against the active plus previous keys during the rotation window.
  - Article, comment, interaction, follower, notification, and user resource-server paths verify JWTs with RSA public keys and issuer validation.
  - Resource services can use `JWT_PUBLIC_KEY` for static public-key verification or `JWT_JWK_SET_URI` for JWKS-based verification.
  - Local development defaults generate the same deterministic RSA key pair across services; production must override with real managed keys.
  - Gateway/service authentication boundaries, key rotation workflow, and validation limits are documented in `docs/security.md`.
  - Pagination parameters are guarded across article, comment, follower, and notification list APIs.
- Backend API quality:
  - Public REST contract is documented in `docs/openapi/social-blog-api.yaml`.
  - API error envelopes are normalized across user, article, comment, interaction, follower, and notification services.
  - Invalid request-body validation, malformed JSON, invalid path/query parameter types, pagination errors, and service domain errors return the standard `timestamp/status/code/message/path/fields` shape where applicable.
  - Pagination, fixed sorting behavior, REST compatibility, and Kafka event-version compatibility rules are documented in `docs/api-conventions.md`.
- `backend/api-gateway`:
  - Routes auth/user endpoints to port 8081.
  - Routes article, comment, interaction, follower, and notification endpoints.
  - Adds/propagates `X-Correlation-ID`.
  - Redis-backed rate limits for auth, article writes, comments, likes, follows, and notification write endpoints.
  - Profile-specific CORS configuration for local, staging, and production.
  - Public REST contract is documented in `docs/openapi/social-blog-api.yaml`.
  - Gateway route contract tests verify documented service prefixes and representative OpenAPI JSON response schemas.
- Local Docker Compose for PostgreSQL, Kafka (KRaft), Redis, and MinIO.
- Architecture and phased roadmap documentation.

## Verification evidence

- `mvn test`: BUILD SUCCESS; 32 tests passed before personalized feed work.
- `mvn -pl backend/article-service test`: BUILD SUCCESS; 5 tests passed after adding follow projection and following feed.
- `mvn test`: BUILD SUCCESS; 33 tests passed after personalized feed work.
- `mvn test`: BUILD SUCCESS; 33 tests passed after Kafka DLT/retry and actuator/prometheus changes.
- `mvn package`: BUILD SUCCESS; 33 tests passed and backend service jars were repackaged for Docker images.
- `mvn -pl backend/user-service test`: BUILD SUCCESS; 5 tests passed after replacing HS256 with RS256/JWKS.
- `mvn test`: BUILD SUCCESS; 33 tests passed after RS256/JWKS issuer and resource-server verification changes.
- `mvn -pl backend/article-service,backend/comment-service,backend/interaction-service,backend/follower-service,backend/notification-service test`: BUILD SUCCESS; 29 tests passed after structured Kafka failure logging changes.
- `mvn -pl backend/user-service,backend/article-service,backend/comment-service,backend/interaction-service,backend/follower-service,backend/notification-service test`: BUILD SUCCESS; 34 tests passed after backend metrics changes.
- `mvn test`: BUILD SUCCESS after backend metrics merge to `dev`.
- `mvn test`: BUILD SUCCESS; 39 tests passed after adding API Gateway Redis-backed rate limits and profile-specific CORS configuration.
- `mvn -pl backend/api-gateway test`: BUILD SUCCESS; 5 tests passed after adding gateway rate-limit route assertions and client-key resolver tests.
- `mvn -pl backend/api-gateway test "-Dspring.profiles.active=prod" "-DCORS_ALLOWED_ORIGINS=https://app.example.com"`: BUILD SUCCESS; 5 tests passed and production CORS placeholders resolved.
- `docker-compose config --quiet`: exit code 0 after gateway rate-limit/CORS work; Docker printed `WARNING: Error loading config file: open C:\Users\dev-phong\.docker\config.json: Access is denied.`
- `mvn -pl backend/user-service test`: BUILD SUCCESS; 7 tests passed after JWT overlap verification-key support.
- `mvn -pl backend/user-service,backend/article-service,backend/comment-service,backend/follower-service,backend/notification-service test`: BUILD SUCCESS; 30 tests passed after key rotation and validation changes. First sandboxed run failed because Maven needed network access for a missing parent POM; rerun with approved Maven network access passed.
- `mvn -pl backend/article-service test`: BUILD SUCCESS; 6 tests passed after article pagination/content validation coverage.
- `mvn test`: BUILD SUCCESS; 42 tests passed after security boundary, key rotation, and validation review work.
- `docker-compose config --quiet`: exit code 0 after security docs/env changes; Docker printed `WARNING: Error loading config file: open C:\Users\dev-phong\.docker\config.json: Access is denied.`
- `mvn -pl backend/api-gateway test`: BUILD SUCCESS; 7 tests passed after adding OpenAPI contract coverage and gateway route prefix contract tests.
- `mvn test`: BUILD SUCCESS; 44 tests passed after API contract and gateway route contract work.
- `docker info --format "{{.ServerVersion}}"`: failed before Testcontainers work with `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine; ... The system cannot find the file specified.`
- `mvn -pl backend/user-service,backend/article-service,backend/comment-service,backend/interaction-service,backend/follower-service,backend/notification-service test`: BUILD SUCCESS; 48 tests passed after standardizing API error envelopes and adding API convention docs.
- `mvn test`: BUILD SUCCESS; 48 tests passed after API error envelope and convention work.
- `mvn test`: BUILD SUCCESS; 48 tests passed after adding backend operations runbooks and dashboard notes.
- `docker-compose -f deploy/compose/backend.compose.yml config --quiet`: exit code 0 after adding production-oriented backend Compose; Docker printed `WARNING: Error loading config file: open C:\Users\dev-phong\.docker\config.json: Access is denied.`
- PowerShell smoke script syntax validation with `[scriptblock]::Create((Get-Content -Raw scripts\smoke-backend.ps1))`: passed.
- `mvn test`: BUILD SUCCESS; 48 tests passed after backend deployment readiness work.
- Previous baseline: 28 tests passed before notification and feed work.
- `mvn -pl backend/comment-service test`: BUILD SUCCESS; 6 tests passed after the final Comment publisher test was added.
- `mvn -pl backend/interaction-service test`: BUILD SUCCESS; 6 tests passed.
- `mvn -pl backend/follower-service test`: BUILD SUCCESS; 6 tests passed.
- `docker-compose config --quiet`: exit code 0.
- The installed Docker CLI does not support `docker compose`; use `docker-compose`.

## Known limitations / immediate work

1. Flutter scaffold is not present. `flutter create`, `flutter create --no-pub`, and `flutter doctor -v` all hung without output and were terminated.
2. Outbox publisher has unit coverage but no real Kafka integration test. Docker Desktop is not running (`docker info --format "{{.ServerVersion}}"` failed with `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine; ... The system cannot find the file specified.`), so Testcontainers cannot start.
3. JWT key rotation supports active plus previous public keys and has a documented workflow; automated multi-key end-to-end verification through all resource services still needs real deployment or contract coverage.
4. Flutter client is not implemented yet.
5. Tests use H2. Add PostgreSQL/Kafka Testcontainers after Docker Desktop is available.
6. Kafka DLT behavior is configured but not verified against a real broker because Docker/Testcontainers is unavailable.
7. Dockerfiles, production-oriented backend Compose, CI image publishing, and smoke-test scripts exist, but local `docker build`, `docker-compose up`, and staging smoke execution were not run because Docker engine is unavailable and no staging target is configured in this workspace.

## Continue-work protocol

Use this file as the source of truth for every future session. A new session should be able to continue by reading this file and running the prompt at the bottom.

### Git workflow for every task

1. Start from a clean worktree whenever possible: `git status --short --branch`.
2. Fetch remote refs: `git fetch origin`.
3. Work from `dev`. If local `dev` does not exist, create it from `origin/dev` when available; otherwise create it from `origin/main`.
4. Create a new feature branch for the task using a descriptive name, for example `feature/testcontainers-user-service` or `feature/kafka-dlq-retry`.
5. Do all code, docs, migrations, and tests on the feature branch.
6. Run the relevant module tests after each meaningful code slice.
7. Before committing, run:
   - `git diff --check`
   - the relevant module test command
   - `mvn test` when the change affects shared behavior or before merge
8. Stage and commit with a concise imperative message.
9. Push the feature branch: `git push -u origin <feature-branch>`.
10. Merge the feature branch into `dev` with a merge commit: `git switch dev`, then `git merge --no-ff <feature-branch>`.
11. Run `mvn test` on `dev` after the merge.
12. Push `dev`: `git push origin dev`.
13. Do not delete the local or remote feature branch after merge unless the user explicitly asks.
14. Update this `CONTINUE.md` before the final commit or in a follow-up commit in the same feature branch if the completed work changes the backlog, tests, blockers, or next prompt.

After every completed task:

1. Move the task from the active backlog into `Completed`.
2. Add exact verification evidence, including command, result, module count, and test count when available.
3. Record any blocker with the exact command/error and the next practical workaround.
4. Update `Exact next implementation order` so item 1 is the next task to execute.
5. Replace `Prompt for the next Codex session` with a precise prompt that starts from the current state.
6. Do not mark a task complete unless code, tests, docs/config, and migration implications are handled.

Backend-first continuation rule:

- Continue backend production-readiness work until the backend acceptance checklist is complete.
- Do not start Flutter implementation until backend P1-P5 and P7 backend packaging/deployment tasks are complete, or the user explicitly changes priority.
- When backend is complete and the project is ready to move to Flutter, report that clearly to the user before starting frontend work.
- If the session is nearly out of token/time before backend is complete, update this `CONTINUE.md` with exact completed work, test evidence, blockers, current branch/commit state, and the next precise backend task so the next session can resume with only `continue work`.

## Production-ready backlog

### P0 - Keep the baseline green

- [ ] Run `mvn test` at the start of each session.
- [ ] Run the smallest relevant module test after each code slice.
- [ ] Run `mvn test` before committing or handing off.
- [ ] Keep `docker-compose config --quiet` green after infra changes.

### P1 - Real integration coverage

- [ ] Start Docker Desktop or otherwise make a local Docker engine available.
- [ ] Add Testcontainers PostgreSQL coverage for Flyway migrations and JPA repository behavior in user, article, comment, interaction, follower, and notification services.
- [ ] Add Testcontainers Kafka coverage for outbox publishers and event consumers.
- [ ] Verify consumer idempotency with real Kafka records and committed offsets.
- [ ] Keep H2 tests only for fast controller/service feedback; do not rely on H2 as the only database confidence layer.

### P2 - Kafka reliability and operations

- [x] Add consumer retry/backoff configuration per service.
- [x] Add dead-letter topics for failed consumer records.
- [x] Add structured logs for event ID, event type, correlation ID, and consumer failure reason.
- [x] Add metrics for outbox pending/failed counts, publish latency, consumer success/failure counts, and notification fan-out size.
- [x] Document topic names, event ownership, retention assumptions, and replay behavior.

### P3 - Security hardening

- [x] Replace shared HS256 JWT secret with asymmetric signing and JWKS.
- [x] Add key rotation plan and config.
- [x] Add gateway/service authentication boundary documentation.
- [x] Add rate limits for auth, write operations, comments, follows, likes, and notification endpoints.
- [x] Add CORS profile separation for local/staging/production.
- [x] Review validation limits for title, content, comment body, tags, profile fields, pagination, and IDs.

### P4 - Observability and supportability

- [x] Add common structured JSON logging across services.
- [x] Propagate correlation ID through REST and Kafka consistently.
- [x] Expose production health/readiness/liveness endpoints.
- [x] Add Prometheus metrics endpoint exposure.
- [x] Add Prometheus dashboard notes.
- [x] Add runbook entries for failed outbox rows, stuck consumers, migration failures, and Kafka replay.

### P5 - API quality and contracts

- [x] Add OpenAPI specs or generated API docs for every service/gateway route.
- [x] Add contract tests for gateway routes and public API response shapes.
- [x] Normalize error response schema across services.
- [x] Add pagination/sorting conventions to API docs.
- [x] Add compatibility rules for event versions and REST response evolution.

### P6 - Frontend client

- [ ] Repair/reinstall Flutter SDK; verify `flutter doctor -v` exits normally.
- [ ] Scaffold Flutter app.
- [ ] Implement auth/register/login/logout/refresh/profile.
- [ ] Implement article feed, following feed, article detail, draft editor, publish/unpublish/delete.
- [ ] Implement comments/replies, likes, follows, notifications, unread state.
- [ ] Add frontend tests for auth state, API client, and critical screens.
- [ ] Add environment configuration for local/staging/prod API base URLs.

### P7 - Packaging, deployment, and CI/CD

- [x] Add Dockerfiles for every backend service.
- [x] Add production-oriented Compose or Kubernetes manifests.
- [x] Add CI pipeline for compile, tests, and docker build.
- [x] Add image publishing to CI.
- [x] Add migration deployment strategy and rollback notes.
- [x] Add secret/config management guidance.
- [x] Add staging smoke tests through the API Gateway.

### P8 - Production acceptance

- [x] Full `mvn test` green.
- [ ] PostgreSQL/Kafka Testcontainers green.
- [x] API contract tests green.
- [ ] Frontend critical flow tests green.
- [ ] Staging deployment smoke test green.
- [ ] Security review checklist complete.
- [ ] Runbook and continuation handoff complete.

## Exact next implementation order

1. Run `mvn test` and preserve the green baseline.
2. If Docker Desktop is available, add PostgreSQL Testcontainers coverage for `user-service`; if Docker is still unavailable, record the blocker and continue with source-only backend work.
3. Complete the production acceptance security review checklist and continuation handoff; run staging smoke tests when a staging Gateway URL exists.
4. Only after backend P1-P5, P7, and P8 backend acceptance are complete, report readiness to move to Flutter and ask whether to start frontend work.

## Prompt for the next Codex session

```text
Continue implementing the Social Media Blog Platform in the current workspace.

First read README.md, CONTINUE.md, docs/architecture.md, and docs/roadmap.md. Inspect the actual worktree; do not recreate completed code and do not discard existing changes. Run `mvn test` to establish the baseline.

Use the Git workflow in CONTINUE.md for every task: create a feature branch from dev, commit and push that branch, merge it into dev with `--no-ff`, push dev, and do not delete the feature branch unless explicitly asked.

Backend-first instruction: keep working on backend production readiness until backend P1-P5 plus backend packaging/deployment work are complete. Do not begin Flutter unless backend is complete or the user explicitly changes priority. If the session is nearly out of token/time, update CONTINUE.md with exact state and next backend task before stopping.

Continue toward production readiness in this exact order:
1. Run `mvn test` and preserve the green baseline.
2. Check whether Docker Desktop or another Docker engine is available. If available, add PostgreSQL Testcontainers coverage for `user-service`; if not available, record the exact blocker and continue with source-only backend hardening.
3. Complete the production acceptance security review checklist and continuation handoff; run staging smoke tests when a staging Gateway URL exists.
4. Keep updating CONTINUE.md after each completed slice. Do not start Flutter until backend P1-P5, P7, and P8 backend acceptance are complete, then report readiness and ask the user whether to start frontend work.

Rules:
- Java 21, Spring Boot 3.4.6, Spring Cloud 2024.0.1.
- Database per service; never access another service's tables.
- REST for immediate operations; Kafka events for cross-service side effects.
- Keep controllers thin, consumers idempotent, events versioned, and migrations explicit.
- Use `docker-compose` on this machine, not `docker compose`.
- After every meaningful slice, run relevant tests and fix failures.
- Continue autonomously until quota is nearly exhausted. Before stopping, update CONTINUE.md with completed work, exact test results, blockers, and replace this prompt with the next precise continuation prompt.
```
