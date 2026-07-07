# 🗺️ Master Plan: Triển Khai 100% Hệ Sinh Thái Web ReactJS

Dựa trên cấu trúc của 6 Microservices ở Backend (`user`, `article`, `comment`, `interaction`, `follower`, `notification`), dưới đây là bản thiết kế cực kỳ chi tiết đến từng file code và từng endpoint API cần gọi để ứng dụng Web hoàn hảo 100%.

---

## 🛡️ GIAI ĐOẠN 1: HỆ THỐNG XÁC THỰC (AUTHENTICATION)
*(Nền tảng quan trọng nhất, mọi thành viên đều dùng chung nền tảng này)*

### 1. Quản lý trạng thái (State Management)
- **Tạo file `src/contexts/AuthContext.tsx`**: 
  - Khởi tạo Context lưu trữ biến `isAuthenticated` (true/false) và `user` (thông tin người dùng hiện tại).
  - Viết các hàm logic: `login()`, `register()`, `logout()` bọc bên trong Context để dùng chung cho toàn App.

### 2. Các trang (Pages)
- **`src/pages/Login.tsx`**:
  - Giao diện Form đăng nhập phong cách tối giản, có validation (báo lỗi nếu để trống hoặc sai định dạng email).
  - Khi submit, gọi `POST /api/v1/auth/login`. Thành công sẽ lấy `accessToken` lưu vào LocalStorage và cập nhật AuthContext.
- **`src/pages/Register.tsx`**:
  - Form điền Email, Password, và Display Name.
  - Khi submit, gọi `POST /api/v1/auth/register`.

### 3. Phân quyền truy cập (Routing Security)
- **`src/components/ProtectedRoute.tsx`**:
  - Một Component bọc ngoài các trang kín (như trang tạo bài viết, sửa profile).
  - Logic: Nếu AuthContext báo `isAuthenticated == false`, ngay lập tức đá (redirect) người dùng về trang `/login`.

---

## 📰 GIAI ĐOẠN 2: HỆ THỐNG BÀI VIẾT (ARTICLE MANAGEMENT)
*(Trải nghiệm cốt lõi của một trang Blog)*

### 1. API Services
- **Tạo `src/api/articleApi.ts`**: Chứa các hàm `fetchArticles(page, size)`, `fetchArticleBySlug(slug)`, `createArticle(data)`.

### 2. Các thành phần giao diện (UI Components)
- **`src/components/ArticleCard.tsx`**: Thẻ hiển thị tóm tắt bài viết (Title, Tác giả, Ngày đăng, Nút tim giả định). Tái sử dụng ở trang Chủ và trang Profile.
- **`src/components/SkeletonCard.tsx`**: Hiệu ứng nhấp nháy xám xám mờ mờ khi đang chờ tải dữ liệu API.

### 3. Các trang (Pages)
- **`src/pages/Home.tsx`**:
  - Khi trang vừa load (dùng `useEffect`), gọi API `GET /api/v1/articles` để lấy danh sách.
  - Map dữ liệu trả về thành các `ArticleCard`.
  - (Nâng cao): Thêm nút "Load more" (Tải thêm bài viết).
- **`src/pages/ArticleDetail.tsx`**:
  - Lấy `slug` hoặc `id` từ thanh URL (ví dụ `/article/huong-dan-react`).
  - Gọi API `GET /api/v1/articles/{slug}` để đổ nội dung bài viết ra toàn màn hình.
- **`src/pages/Editor.tsx` (Trang viết bài)**:
  - Cài đặt thư viện `react-quill` để có khung soạn thảo văn bản giống Word (in đậm, in nghiêng, chèn ảnh).
  - Bấm nút "Publish" sẽ gọi `POST /api/v1/articles`.

---

## 💬 GIAI ĐOẠN 3: TƯƠNG TÁC MẠNG XÃ HỘI (SOCIAL GRAPH)
*(Tạo sự gắn kết giữa các User)*

### 1. Bình luận & Tương tác
- **`src/components/CommentSection.tsx`**:
  - Đặt dưới cùng của `ArticleDetail.tsx`.
  - Nửa trên: Form nhập chữ và nút "Gửi" (`POST /api/v1/comments`).
  - Nửa dưới: Danh sách các bình luận hiện tại (`GET /api/v1/comments/article/{id}`).
- **`src/components/LikeButton.tsx`**:
  - Nút bấm thông minh. Khi bấm vào sẽ có animation nảy lên.
  - Gọi API ngầm `PUT /api/v1/interactions/articles/{id}/like`. Nếu thành công thì số đếm tim cộng thêm 1.

### 2. Hồ sơ cá nhân (Profile)
- **`src/pages/Profile.tsx`**:
  - Header: Hiện Avatar, Tên, Số lượng Người theo dõi / Đang theo dõi.
  - Body: Danh sách các bài viết do người này đăng.
- **`src/components/FollowButton.tsx`**:
  - Nếu đang ở trang Profile của người khác, hiển thị nút "Follow". Bấm vào gọi `PUT /api/v1/follows/{userId}`.

### 3. Chuông thông báo
- **`src/components/NotificationDropdown.tsx`**:
  - Tích hợp vào góc phải của `Navbar.tsx`.
  - Có chấm đỏ nếu có thông báo mới. Bấm vào xổ xuống danh sách "Ai đó vừa bình luận bài của bạn" (`GET /api/v1/notifications`).

---

## 🎨 GIAI ĐOẠN 4: CHUỐT LẠI GIAO DIỆN (POLISHING)
*(Sự khác biệt giữa bài tập lớn và dự án thực tế)*
1. **Thông báo Toast (Pop-up báo thành công/thất bại):** 
   - Cài thư viện `react-hot-toast`. 
   - Ví dụ: Bấm đăng nhập sai mật khẩu sẽ hiện popup màu đỏ "Sai tài khoản". Bấm đăng bài thành công hiện popup xanh "Đăng bài thành công".
2. **Responsive:** 
   - Đảm bảo xem trên điện thoại, thanh Sidebar sẽ biến thành menu Hamburger (nút 3 gạch).
3. **Xử lý Error State:** 
   - Nếu gọi API thất bại do sập mạng, hiện giao diện hình minh họa "Rất tiếc, có lỗi xảy ra".

---
*(Kế hoạch này được ánh xạ trực tiếp từ 3 Issues trên Github Classroom của nhóm bạn)*
