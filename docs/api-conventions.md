# API conventions

Public REST APIs are served through the API Gateway and documented in `docs/openapi/social-blog-api.yaml`.

## Error responses

Every backend service returns the same JSON error envelope for controller-level application errors, validation failures, malformed request bodies, and invalid path/query parameter types:

```json
{
  "timestamp": "2026-06-27T06:00:00Z",
  "status": 400,
  "code": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "path": "/api/v1/articles",
  "fields": {
    "content": "must not be blank"
  }
}
```

- `timestamp`: server-side error time as an ISO-8601 instant.
- `status`: HTTP status code.
- `code`: stable machine-readable error code. Clients should branch on this field, not on `message`.
- `message`: human-readable summary. It may be refined without a breaking API change.
- `path`: request path that produced the error.
- `fields`: field or parameter-level details. It is present for every error and is an empty object when no field detail exists.

Common platform codes:

- `VALIDATION_FAILED`: request body passed JSON parsing but failed bean validation.
- `MALFORMED_JSON`: request body could not be parsed as JSON.
- `INVALID_REQUEST_PARAMETER`: path variable or query parameter could not be converted to the required type.
- `INVALID_PAGE`: `page` was less than `0`.
- `INVALID_PAGE_SIZE`: `size` was less than `1`.

Domain-specific codes remain service-owned, for example `ARTICLE_NOT_FOUND`, `TARGET_NOT_AVAILABLE`, or `USER_NOT_AVAILABLE`.

## Pagination and sorting

List endpoints use Spring page envelopes with `content`, `number`, `size`, `totalElements`, `totalPages`, `first`, and `last`.

- `page` is zero-based and defaults to `0`.
- `size` defaults to each endpoint's documented value and must be at least `1`.
- Services cap oversized `size` values server-side instead of returning unbounded pages. Article feeds cap at `50`; comment, follower, and notification lists cap at `100`.
- The public API does not currently accept a `sort` query parameter. Each endpoint has a fixed sort order:
  - Article public and following feeds: `publishedAt` descending.
  - Current user's article list: `updatedAt` descending.
  - Article comments: `createdAt` ascending.
  - Followers and following lists: `createdAt` descending.
  - Notifications: `createdAt` descending.

Adding public sorting later must be documented as an explicit contract change and covered by gateway/API contract tests.

## REST compatibility

REST response evolution follows additive compatibility by default:

- Adding optional response fields is compatible.
- Removing fields, changing field types, renaming fields, or changing enum values is breaking.
- New required request fields are breaking unless a default or backward-compatible fallback is provided.
- Error `code` values are stable once documented or consumed by a client. New codes may be added for new failure modes.
- Pagination envelope field names and zero-based page numbering are stable public contracts.

## Event compatibility

Kafka events include `eventVersion` in the common envelope. Producers may add optional payload fields within the same version. Removing fields, changing types, or changing event meaning requires a new `eventVersion` and consumers that can handle both versions during rollout.
