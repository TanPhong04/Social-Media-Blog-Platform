# Backend security

## Authentication boundary

The API Gateway is the public HTTP edge. It owns CORS, correlation ID propagation, and Redis-backed request rate limits. It does not terminate authentication for backend services and does not rewrite JWT claims.

User Service is the token issuer. It exposes public auth endpoints under `/api/v1/auth/**` and the public JWKS endpoint at `/.well-known/jwks.json`.

Resource services remain independently protected. Article, comment, interaction, follower, notification, and user profile APIs validate JWT issuer and RS256 signatures in each service. Health probes under `/actuator/health/**` are public; Prometheus and other actuator endpoints are not public API routes and should stay behind infrastructure access controls.

Production deployments should route public traffic through the API Gateway only. Direct service ports should be private to the deployment network so gateway rate limits and CORS policy cannot be bypassed.

## JWT key rotation

JWTs are signed by User Service with the active RSA private key configured by `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, and `JWT_KEY_ID`.

Resource services should prefer `JWT_JWK_SET_URI` in staging and production so they can validate both active and overlapping public keys from User Service JWKS. Static `JWT_PUBLIC_KEY` verification is acceptable for local development or tightly controlled single-key deployments, but it cannot support overlapping key rotation.

Rotation workflow:

1. Generate a new RSA key pair and choose a new unique `JWT_KEY_ID`.
2. Add the old public key to User Service `JWT_VERIFICATION_KEYS` using `old-kid::public-key-pem`. Multiple entries are separated with `||`.
3. Deploy User Service with the new active private/public key and the old verification key entry. The JWKS endpoint will publish both keys and new access tokens will use the new `kid`.
4. Ensure resource services use `JWT_JWK_SET_URI` and have refreshed JWKS cache after User Service deploys.
5. Wait longer than the maximum access token lifetime plus operational clock skew.
6. Remove the old key from `JWT_VERIFICATION_KEYS` and deploy again.

Do not reuse `kid` values. Do not publish private key material through `JWT_VERIFICATION_KEYS`; only public keys belong there.

## Validation limits

Current request limits:

| Surface | Limit |
| --- | --- |
| Register email | Valid email, max 320 characters |
| Register password | 8 to 72 characters |
| Login email | Valid email, max 320 characters |
| Login password | Max 72 characters |
| Refresh token | Max 512 characters |
| Profile display name | Required, max 80 characters |
| Profile bio and avatar URL | Max 500 characters |
| Article title | Required, max 200 characters |
| Article summary | Max 500 characters |
| Article content | Required, max 50000 characters |
| Article tags | Max 10 tags, each required and max 50 characters |
| Comment content | Required, max 2000 characters |
| Pagination page | Must be greater than or equal to 0 |
| Pagination size | Must be greater than or equal to 1; service max is 50 for articles and 100 for comments, follows, and notifications |

Invalid request bodies return `VALIDATION_FAILED`. Invalid pagination returns `INVALID_PAGE` or `INVALID_PAGE_SIZE`.

The production acceptance security review checklist is maintained in `docs/security-review.md`.
