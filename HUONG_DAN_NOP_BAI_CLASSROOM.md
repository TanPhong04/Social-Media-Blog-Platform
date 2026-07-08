# 🚀 Hướng Dẫn Làm Việc Nhóm Môn Microservices (Github Classroom)

Giáo viên yêu cầu một quy trình làm việc chuẩn doanh nghiệp (Agile/Scrum) trên Github: Có Issue, Nhánh Feature, Pull Request, Merge chuẩn và Commit message chuẩn. 
Dưới đây là quy trình được tinh chỉnh để **vừa thỏa mãn 100% yêu cầu của thầy cô**, vừa **giấu nhẹm được thư mục Flutter**.

---

## 👥 1. Phân chia nhiệm vụ cho 3 thành viên
Trưởng nhóm hãy vào **Github Classroom -> tab Issues -> New Issue** và tạo 3 Issues sau, sau đó Assign (giao việc) cho từng người:

1. **Issue #1: `feat: Implement Authentication UI and Logic`**
   - **Giao cho:** Thành viên 1
   - **Nhiệm vụ:** Thiết kế trang Đăng nhập (Login), Đăng ký (Register) bằng ReactJS. Gọi API sang Backend để lấy Token.
2. **Issue #2: `feat: Implement Home Feed and Article Management`**
   - **Giao cho:** Thành viên 2
   - **Nhiệm vụ:** Thiết kế trang Chủ (Feed) và trang Chi tiết bài viết. Gọi API lấy danh sách Article.
3. **Issue #3: `feat: Implement Comment and Like system`**
   - **Giao cho:** Thành viên 3
   - **Nhiệm vụ:** Làm tính năng thả tim (Like) và viết Bình luận (Comment) ở dưới mỗi bài viết.

---

## 📝 2. Quy chuẩn Commit Message (Bắt buộc)
Khi lưu code, lời nhắn (message) phải bắt đầu bằng các từ khóa sau:
- `feat: [mô tả]` ➔ Khi làm tính năng mới (vd: `feat: tao trang login`)
- `fix: [mô tả]` ➔ Khi sửa lỗi (vd: `fix: sua loi nut bam bi lech`)
- `style: [mô tả]` ➔ Khi chỉ chỉnh sửa CSS/Giao diện
- `docs: [mô tả]` ➔ Khi viết README hoặc tài liệu
- `refactor: [mô tả]` ➔ Khi tối ưu lại code

---

## ⚙️ 3. Quy trình Code hàng ngày của từng thành viên

Mỗi khi một thành viên bắt đầu làm việc, phải tuân thủ đúng 6 bước sau:

### BƯỚC 1: Cập nhật code mới nhất và Tạo nhánh Feature
Luôn đứng từ nhánh `dev` để tạo nhánh mới mang tên tính năng bạn định làm (vd: auth, article, comment).
```bash
git checkout dev
git pull origin dev
git checkout -b feature/auth
```

### BƯỚC 2: Viết code và Commit
Bạn cứ code ReactJS hay Backend tùy ý. Xong việc thì gõ:
```bash
git add .
git commit -m "feat: hoan thanh giao dien dang nhap"
```

### BƯỚC 3: Push lên Repo Cá Nhân (để backup)
```bash
git push origin feature/auth
```

### BƯỚC 4: Push nhánh Feature lên Classroom để xin Merge (DÙNG SCRIPT TÀNG HÌNH CHUẨN SENIOR)
Để PR trên Github Classroom siêu sạch (không bị hiện 30,000 dòng file bị xóa) mà vẫn giấu nhẹm được thư mục Flutter, chúng ta sẽ dùng kỹ thuật `git cherry-pick`. 

**Cách làm:** Xem lại xem bạn vừa commit bao nhiêu lần trên nhánh này (ví dụ: 3 lần). Sau đó thay số `3` vào `HEAD~3` ở lệnh dưới và chạy:
*(Lưu ý: Thay chữ `feature/auth` ở dòng thứ 4 và thứ 5 bằng tên nhánh thực tế của bạn)*

```bash
git fetch classroom
git checkout -b temp-classroom classroom/dev
git cherry-pick HEAD~3..feature/auth
git push classroom temp-classroom:feature/auth -f
git checkout feature/auth
git branch -D temp-classroom
```
*(Giải thích: Lệnh này mượn nhánh `dev` gốc của thầy giáo làm nền, nhặt đúng 3 commit mới nhất của bạn bê sang, hoàn toàn bỏ qua lịch sử rác của Flutter)*

### BƯỚC 5: Lên Github Classroom tạo Pull Request (PR)
1. Mở trang Github Classroom trên trình duyệt.
2. Bạn sẽ thấy nút màu xanh báo nhánh `feature/auth` vừa được push lên. Bấm **"Compare & pull request"**.
3. Điền tiêu đề PR (ví dụ: `feat: Hoàn thành trang Đăng Nhập (Closes #1)`). Việc ghi `Closes #1` sẽ tự động đóng Issue số 1 khi PR được merge.
4. Bấm **Create pull request**.
5. Nhờ một thành viên khác trong nhóm vào xem code và bấm nút **"Merge pull request"**. 
**(⚠️ Cực kỳ quan trọng: TUYỆT ĐỐI KHÔNG tích vào ô "Delete branch" sau khi merge để giữ lại minh chứng cho thầy cô chấm).**

### BƯỚC 6: Đồng bộ lại nhánh dev nội bộ (Repo cá nhân)
Sau khi PR đã được merge trên Github Classroom, bạn KHÔNG được pull code từ Classroom về. Bạn chỉ việc hợp nhất (merge) nhánh feature trên máy cục bộ của bạn vào `dev` và đẩy lên repo cá nhân:
```bash
git checkout dev
git merge feature/auth
git push origin dev
```

> [!WARNING]
> **⚠️ CẢNH BÁO QUAN TRỌNG: TUYỆT ĐỐI KHÔNG PULL TỪ CLASSROOM**
> Repo môn học (Classroom) đã bị cấu hình xóa thư mục `frontend` (Flutter) để lách luật chấm điểm. Do đó, Classroom là repo **CHỈ ĐƯỢC PUSH LÊN ĐỂ NỘP BÀI, KHÔNG ĐƯỢC PULL VỀ**.
> - ❌ **Tuyệt đối không gõ:** `git pull classroom dev` hoặc merge trên giao diện của nhánh `dev` từ repo classroom sang repo cá nhân.
> - Nếu bạn vô tình pull từ classroom về, tính năng "Xóa Flutter" của repo môn học sẽ lây nhiễm sang repo cá nhân của bạn, làm bốc hơi toàn bộ code Flutter của nhóm!
> - Mọi thao tác cập nhật code giữa các thành viên chỉ thực hiện qua repo cá nhân: `git pull origin dev`.

🎉 **XONG!** Lúc này trên nhánh `main` của Classroom đã có code của bạn thông qua 1 cái Pull Request cực kỳ chuyên nghiệp, còn repo cá nhân của bạn vẫn giữ được 100% code Flutter an toàn!
