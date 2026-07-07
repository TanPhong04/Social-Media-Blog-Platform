## Description
Implement the core content features: the Home Feed (displaying articles) and the Article Editor (for creating new articles).

## Tasks
- [ ] Extract the UI from `Home.tsx` into a reusable `ArticleCard.tsx` component.
- [ ] Update `Home.tsx` to fetch the real list of articles (`GET /api/v1/articles`).
- [ ] Implement `ArticleDetail.tsx` to view full article content by slug or ID (`GET /api/v1/articles/{id}`).
- [ ] Create `Editor.tsx` using a rich text library (e.g., `react-quill` or `tiptap`) to write articles.
- [ ] Connect Editor to the creation API (`POST /api/v1/articles`).

## Acceptance Criteria
- The Home page displays a real list of articles fetched from the backend.
- Users can click on an article to read the full content.
- Logged-in users can write and publish a new article successfully.

## References
- Backend Microservice: `article-service`
- Route Prefix: `/api/v1/articles`
