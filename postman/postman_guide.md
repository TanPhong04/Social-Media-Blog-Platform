# Hướng dẫn chạy thử nghiệm API bằng Postman

Tài liệu này hướng dẫn thứ tự chạy thử nghiệm các API của dự án **Social Media Blog Platform** bằng Postman để tự động hóa việc truyền tải dữ liệu (Token, ID) mà không cần phải sao chép thủ công.

---

## 1. Chuẩn bị ban đầu
1. Mở Postman.
2. Nhấp nút **Import** ở góc trên cùng bên trái.
3. Kéo và thả 2 file sau:
   - `SocialBlog_Collection.json`
   - `SocialBlog_Environment.json`
4. Chọn Import.
5. Tại góc trên bên phải màn hình Postman, thay đổi Environment đang chọn thành **SocialBlog Local Environment**.

---

## 2. Thứ tự chạy thử nghiệm các API (Auto-Flow)

Để cơ chế tự động điền (Token, ID) hoạt động tốt nhất, hãy chạy các API theo đúng thứ tự sau:

### Bước 1: Khởi tạo tài khoản và Đăng nhập (Authentication)
1. **Authentication** > **Send OTP**  
   - API này sẽ gửi mã OTP qua Email của bạn (hoặc được in ra màn hình Log của dịch vụ `user-service`). Mở Log backend ra để lấy mã OTP này.
2. **Authentication** > **Register**  
   - Nhập Email, Password, Display Name và điền mã OTP bạn lấy được ở bước trên để tạo tài khoản mới.
3. **Authentication** > **Login (Email/Password)**  
   - Điền thông tin đăng nhập của bạn và nhấn **Send**.
   - **Tác vụ tự động**: Script sẽ lấy chuỗi `accessToken` và `refreshToken` nhận về để ghi đè vào các biến `access_token` và `refresh_token` trong Environment của Postman.

### Bước 2: Thiết lập thông tin User hiện tại
4. **Users** > **Get My Profile**  
   - Lấy thông tin cá nhân của tài khoản đang đăng nhập.
   - **Tác vụ tự động**: Script lấy UUID của bạn và lưu vào biến `user_id` trong Environment. Biến này dùng để test API Chat, Follow...

### Bước 3: Đăng bài viết (Tạo ID bài viết)
5. **Articles** > **Create Article**  
   - Nhập nội dung bài viết và nhấn **Send**.
   - **Tác vụ tự động**: Script lấy ID bài viết vừa tạo lưu vào biến `article_id` trong Environment.
   - *Lưu ý*: Bạn cũng có thể dùng API **Articles** > **Get Feed** thay thế, hệ thống sẽ chộp ID của bài viết đầu tiên trên Newfeed làm `article_id`.

### Bước 4: Tương tác (Like, Comment, Livestream)
6. **Interactions (Likes)** > **Like Article**  
   - Nhấn **Send** để thực hiện hành động thích bài viết đã tạo ở Bước 3.
7. **Comments** > **Create Comment**  
   - Nhập bình luận cho bài viết của bạn.
   - **Tác vụ tự động**: Script lấy ID bình luận lưu vào `comment_id` trong Environment.
8. **Comments** > **Reply to Comment**  
   - Trả lời lại bình luận vừa viết (API này tự động dùng `article_id` và `comment_id` có sẵn).
9. **Livestream** > **Create Livestream**  
   - Bắt đầu tạo một phòng live.
   - **Tác vụ tự động**: Lưu `article_id` của phòng live vào Environment để có thể test API **End Livestream** mà không cần copy paste thủ công.

---

## 3. Các Biến được lưu tự động trong Postman Environment
- `base_url`: Địa chỉ API Gateway (mặc định là `http://localhost:8080/api/v1`).
- `access_token`: JWT Token của user hiện tại (tự động cập nhật sau khi Login/Register).
- `refresh_token`: Refresh Token của user (tự động cập nhật sau khi Login/Register).
- `user_id`: UUID của tài khoản hiện tại (tự động cập nhật sau khi gọi Get My Profile).
- `article_id`: UUID của bài viết đang được tương tác (tự động cập nhật sau khi Create Article/Get Feed).
- `comment_id`: UUID của bình luận đang được tương tác (tự động cập nhật sau khi Create Comment).
- `notification_id`: UUID của thông báo cụ thể.
