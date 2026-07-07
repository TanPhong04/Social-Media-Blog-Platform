## Description
Implement the Authentication flow (Login and Registration) for the ReactJS Frontend, including global state management and routing security.

## Tasks
- [ ] Create `AuthContext.tsx` for global state (`isAuthenticated`, `user`).
- [ ] Implement `src/pages/Login.tsx` with email and password fields.
- [ ] Implement `src/pages/Register.tsx` with email, password, and display name.
- [ ] Connect forms to API (`POST /api/v1/auth/login` and `POST /api/v1/auth/register`).
- [ ] Store `accessToken` securely (e.g., in LocalStorage) upon successful login.
- [ ] Create `ProtectedRoute.tsx` to secure private routes.

## Acceptance Criteria
- Users can successfully log in and register.
- Unauthorized users are redirected to the Login page when accessing private routes.
- The UI matches the dark theme (`#121212` background, `#6C5CE7` primary color).

## References
- Backend Microservice: `user-service`
- Route Prefix: `/api/v1/auth`
