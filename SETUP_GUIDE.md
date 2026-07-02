# Social Media Blog Platform - Setup & Deployment Guide

Welcome to the **Social Media Blog Platform**! This guide will help you understand the architecture, set up the project locally for development, and deploy it to a production environment.

---

## 1. System Architecture

This project is built using a modern **Microservices Architecture** with a **Flutter** cross-platform frontend.

### Backend (Spring Boot 3 + Java 21)
- **API Gateway (`api-gateway`)**: Entry point for all client requests, handles routing.
- **User Service (`user-service`)**: Manages authentication, JWTs, and user profiles.
- **Article Service (`article-service`)**: Manages articles and drafts.
- **Comment Service (`comment-service`)**: Manages comments on articles.
- **Interaction Service (`interaction-service`)**: Manages likes on articles and comments.
- **Follower Service (`follower-service`)**: Manages user relationships (following/followers).
- **Notification Service (`notification-service`)**: Handles system notifications.

### Infrastructure
- **PostgreSQL**: Relational database (each microservice has its own isolated logical DB).
- **Apache Kafka**: Event bus for asynchronous communication (e.g., triggering notifications when someone likes a post).
- **Redis**: Caching layer.
- **MinIO**: S3-compatible object storage (prepared for future media uploads).

### Frontend (Flutter)
- Cross-platform application (Web, Android, iOS) using `go_router` for navigation and `provider` for state management. Features infinite scrolling, authentication, interactions, and a draft editor.

---

## 2. Prerequisites

Ensure you have the following installed on your machine:
- **Java 21** (Temurin/Adoptium recommended)
- **Maven**
- **Docker & Docker Compose**
- **Flutter SDK** (Channel Stable)

---

## 3. Local Development Setup (Dev Mode)

To run the platform locally for development, follow these steps:

### Step 1: Start Infrastructure
We need to start the databases, Kafka, and Redis.
```bash
docker-compose up -d
```

### Step 2: Run Backend Microservices
Open separate terminal windows and run each service using the Maven wrapper. 
*(Tip: In IDEs like IntelliJ or VS Code, you can run all Spring Boot Application classes simultaneously).*

```bash
./mvnw -pl backend/api-gateway spring-boot:run
./mvnw -pl backend/user-service spring-boot:run
./mvnw -pl backend/article-service spring-boot:run
./mvnw -pl backend/comment-service spring-boot:run
./mvnw -pl backend/interaction-service spring-boot:run
./mvnw -pl backend/follower-service spring-boot:run
./mvnw -pl backend/notification-service spring-boot:run
```

All services will connect to `localhost:5432` for the database and `localhost:9092` for Kafka. The API Gateway runs on `http://localhost:8080`.

### Step 3: Run Frontend
Open a new terminal and navigate to the `frontend` folder.

```bash
cd frontend
flutter pub get
flutter run -d chrome # Or select your Android emulator
```
By default, the Flutter app is configured to connect to `http://localhost:8080/api/v1`.

---

## 4. Production Deployment

For production, we package the microservices into Docker images and run them together in an isolated network using `docker-compose.prod.yml`.

### Step 1: Compile Backend JARs
You must build the backend artifacts first before building the Docker images.
```bash
./mvnw clean package -DskipTests
```

### Step 2: Start the Production Environment
Run the production compose file. This will build the Docker images for all microservices and spin them up along with PostgreSQL, Kafka, and Redis.

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

*Note: In production, the API Gateway is exposed on port `8080`. Frontend applications should point to this URL.*

### Step 3: Build Frontend Release
To build the frontend for production, run:

**Web:**
```bash
cd frontend
flutter build web --release --dart-define=ENV=prod --dart-define=API_BASE_URL=https://your-production-api.com/v1
```

**Android:**
```bash
flutter build apk --release --dart-define=ENV=prod --dart-define=API_BASE_URL=https://your-production-api.com/v1
```

---

## 5. CI/CD (GitHub Actions)

This repository is equipped with GitHub Actions workflows in `.github/workflows/`:
- **`backend-ci.yml`**: Runs automatically on pushes to `dev`/`main`. It builds the Maven project, builds Docker images, and pushes them to GitHub Container Registry (GHCR).
- **`frontend-ci.yml`**: Runs automatically on pushes to `dev`/`main`. It runs Flutter tests and builds Web and Android APK artifacts, which are attached to the workflow run.

---

## 6. Future Enhancements
If you wish to expand the platform in the future, consider implementing:
1. **Media Uploads:** Connect MinIO to an `image-service` to handle avatars and article covers.
2. **Real-time Notifications:** Add WebSockets (e.g., Spring WebSocket or SSE) to the API Gateway to push notifications instantly to the Flutter app.
3. **Analytics Dashboard:** Build an admin portal to track user engagement.
