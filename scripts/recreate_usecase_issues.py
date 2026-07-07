import os
import subprocess
import time

repo = "fudn-traltb-su26/b-i-t-p-nh-m-course-project-social-media-blog-platform"

# Close issues 4 to 18
print("Closing old issues...")
for i in range(4, 19):
    cmd = f'gh issue close {i} --repo {repo}'
    subprocess.run(cmd, shell=True)
    time.sleep(0.5)

usecases = [
    ("Use Case: Đăng ký và Đăng nhập (Authentication)", "## Mô tả Use Case\nNgười dùng có thể tạo tài khoản mới và đăng nhập vào hệ thống để sử dụng các chức năng yêu cầu xác thực.\n## Tasks\n- [ ] Thiết kế UI trang Đăng ký (Register)\n- [ ] Thiết kế UI trang Đăng nhập (Login)\n- [ ] Tích hợp API `POST /api/v1/auth/register` và `POST /api/v1/auth/login`\n- [ ] Lưu JWT Token và quản lý trạng thái đăng nhập toàn cục bằng `AuthContext`"),
    ("Use Case: Xem danh sách bài viết (News Feed)", "## Mô tả Use Case\nNgười dùng có thể xem danh sách các bài viết mới nhất trên trang chủ (Home Feed).\n## Tasks\n- [ ] Thiết kế UI Component `ArticleCard`\n- [ ] Tích hợp API `GET /api/v1/articles`\n- [ ] Hiển thị thông tin tác giả, tiêu đề, tóm tắt và số lượng tương tác"),
    ("Use Case: Đọc chi tiết bài viết (Article Details)", "## Mô tả Use Case\nNgười dùng có thể nhấp vào một bài viết để đọc nội dung chi tiết.\n## Tasks\n- [ ] Thiết kế UI trang `ArticleDetail`\n- [ ] Tích hợp API `GET /api/v1/articles/{id}`\n- [ ] Render nội dung Rich Text của bài viết"),
    ("Use Case: Viết và đăng bài mới (Create Article)", "## Mô tả Use Case\nNgười dùng đã đăng nhập có thể soạn thảo và xuất bản bài viết của riêng mình.\n## Tasks\n- [ ] Tích hợp thư viện Rich Text Editor (ví dụ: React Quill)\n- [ ] Thiết kế UI trang Viết bài (Editor)\n- [ ] Tích hợp API `POST /api/v1/articles`"),
    ("Use Case: Thả tim bài viết (Like Article)", "## Mô tả Use Case\nNgười dùng có thể thả tim (Like) bài viết mà mình yêu thích.\n## Tasks\n- [ ] Tạo UI Nút thả tim với hiệu ứng animation\n- [ ] Tích hợp API `PUT /api/v1/interactions/articles/{id}/like`\n- [ ] Cập nhật số lượng Like hiển thị (Optimistic Update)"),
    ("Use Case: Bình luận bài viết (Comment on Article)", "## Mô tả Use Case\nNgười dùng có thể xem danh sách bình luận và viết bình luận mới cho bài viết.\n## Tasks\n- [ ] Thiết kế UI Component `CommentSection`\n- [ ] Tích hợp API `GET /api/v1/comments/article/{id}` để lấy danh sách bình luận\n- [ ] Tích hợp API `POST /api/v1/comments` để gửi bình luận mới"),
    ("Use Case: Xem hồ sơ người dùng (User Profile)", "## Mô tả Use Case\nNgười dùng có thể xem hồ sơ cá nhân của mình hoặc của tác giả khác, bao gồm các bài viết họ đã đăng.\n## Tasks\n- [ ] Thiết kế UI trang `Profile`\n- [ ] Tích hợp API lấy thông tin User\n- [ ] Hiển thị danh sách bài viết của User đó"),
    ("Use Case: Theo dõi tác giả (Follow User)", "## Mô tả Use Case\nNgười dùng có thể nhấn Theo dõi (Follow) một tác giả khác để nhận thông báo.\n## Tasks\n- [ ] Tạo Nút Theo dõi (Follow Button) trên trang Profile\n- [ ] Tích hợp API `PUT /api/v1/follows/{userId}`\n- [ ] Hiển thị số lượng người theo dõi (Followers)")
]

print("Creating Use Case issues...")
for title, body in usecases:
    with open("temp_uc.md", "w", encoding="utf-8") as f:
        f.write(body)
    
    cmd = f'gh issue create --repo {repo} --title "{title}" --body-file temp_uc.md'
    subprocess.run(cmd, shell=True)
    time.sleep(1)

if os.path.exists("temp_uc.md"):
    os.remove("temp_uc.md")
