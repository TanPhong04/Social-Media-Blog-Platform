# Architecture

Each service owns its database. Synchronous user-facing operations use REST; cross-service side effects use Kafka domain events. Services must publish events through a transactional outbox, and consumers must deduplicate by event ID.

Planned services: user, article, comment, interaction, follower, notification, and API gateway.

Event envelope fields: `eventId`, `eventType`, `eventVersion`, `occurredAt`, `correlationId`, `actorId`, and `payload`.

