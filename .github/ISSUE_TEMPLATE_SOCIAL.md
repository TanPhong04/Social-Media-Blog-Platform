## Description
Implement social interaction features including liking articles, writing comments, viewing user profiles, and managing followers.

## Tasks
- [ ] Implement `CommentSection.tsx` inside `ArticleDetail.tsx`.
- [ ] Connect comment forms to `POST /api/v1/comments` and display list (`GET /api/v1/comments/article/{id}`).
- [ ] Implement `LikeButton.tsx` (Heart animation) and connect to `PUT /api/v1/interactions/articles/{id}/like`.
- [ ] Create `Profile.tsx` page to display user info and their published articles.
- [ ] Add `FollowButton.tsx` to the Profile page (`PUT /api/v1/follows/{userId}`).

## Acceptance Criteria
- Users can like an article and the like counter increases.
- Users can post a comment and see it appear in the comment section.
- Users can view another author's profile and click Follow.

## References
- Backend Microservices: `comment-service`, `interaction-service`, `follower-service`
