# Social Media Blog Platform

Medium-like platform implemented as Java microservices and a Flutter client.

## Current modules

- `backend/user-service`: authentication and profiles
- `backend/article-service`: article draft/publish lifecycle and public feed
- `backend/comment-service`: article comments, replies, ownership, and soft deletion
- `backend/interaction-service`: idempotent likes for articles/comments and aggregate counts
- `backend/follower-service`: idempotent follow graph, pagination, and relationship events
- `backend/api-gateway`: public API entry point
- `frontend`: Flutter client (next milestone)

## Local development

Prerequisites: Java 21, Maven 3.9+, Docker Desktop.

```powershell
Copy-Item .env.example .env
docker-compose up -d
mvn clean test
mvn -pl backend/user-service spring-boot:run
mvn -pl backend/api-gateway spring-boot:run
```

Gateway listens on `8080`; backend services currently use ports `8081` through `8085`.

See `CONTINUE.md` for the exact implementation status and next task.
