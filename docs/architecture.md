# Architecture

Each service owns its database. Synchronous user-facing operations use REST; cross-service side effects use Kafka domain events. Services must publish events through a transactional outbox, and consumers must deduplicate by event ID.

Planned services: user, article, comment, interaction, follower, notification, and API gateway.

Event envelope fields: `eventId`, `eventType`, `eventVersion`, `occurredAt`, `correlationId`, `actorId`, and `payload`.

Personalized article feed is fan-out-on-read. Article Service consumes `UserFollowed` and `UserUnfollowed` from `followers.events` into its own `follow_projection` table, deduplicates with `processed_events`, and serves `/api/v1/articles/following` from local article data plus that projection. This keeps service databases isolated; feed consistency is eventual and follows Kafka delivery latency.

Kafka consumers use fixed retry/backoff and publish exhausted records to a dead-letter topic named `<source-topic>.DLT`. Backend services expose actuator health/readiness/liveness and Prometheus scrape endpoints; only health probes are public without JWT.
