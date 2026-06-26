# Architecture

Each service owns its database. Synchronous user-facing operations use REST; cross-service side effects use Kafka domain events. Services must publish events through a transactional outbox, and consumers must deduplicate by event ID.

Planned services: user, article, comment, interaction, follower, notification, and API gateway.

Event envelope fields: `eventId`, `eventType`, `eventVersion`, `occurredAt`, `correlationId`, `actorId`, and `payload`.

Personalized article feed is fan-out-on-read. Article Service consumes `UserFollowed` and `UserUnfollowed` from `followers.events` into its own `follow_projection` table, deduplicates with `processed_events`, and serves `/api/v1/articles/following` from local article data plus that projection. This keeps service databases isolated; feed consistency is eventual and follows Kafka delivery latency.

Kafka consumers use fixed retry/backoff and publish exhausted records to a dead-letter topic named `<source-topic>.DLT`. Backend services expose actuator health/readiness/liveness and Prometheus scrape endpoints; only health probes are public without JWT.

User Service is the JWT issuer. It signs access tokens with RSA/RS256, includes a `kid`, validates the configured issuer, and exposes the public key set at `/.well-known/jwks.json`. Resource-server services validate the same issuer and verify tokens with either a configured `JWT_PUBLIC_KEY` or a configured `JWT_JWK_SET_URI`; local development falls back to a deterministic RSA key pair shared by code defaults and must be replaced by managed keys in production.

Backend services use Spring Boot ECS structured console logging. Kafka consumer retry and dead-letter paths log structured failure context with topic, partition, offset, event ID, event type, correlation ID, delivery attempt, and root-cause fields without logging the full event payload.
