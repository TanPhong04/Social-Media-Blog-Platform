# 🚀 Hướng Dẫn Làm Việc Nhóm Môn Microservices (Github Classroom)

Giáo viên yêu cầu một quy trình làm việc chuẩn doanh nghiệp (Agile/Scrum) trên Github: Có Issue, Nhánh Feature, Pull Request, Merge chuẩn và Commit message chuẩn. 
Dưới đây là quy trình siêu đơn giản đã được chuẩn hóa cho nhóm chúng ta.

*(Lưu ý: Trong thời gian làm đồ án môn học, chúng ta TẠM QUÊN repo cá nhân đi và CHỈ làm việc duy nhất trên repo Classroom để tránh nhầm lẫn).*

---

## 👥 1. Phân chia nhiệm vụ cho các thành viên
Trưởng nhóm hãy vào **Github Classroom -> tab Issues -> New Issue** và tạo các Issues cần thiết, sau đó Assign (giao việc) cho từng người (ví dụ: `feat: Làm trang Đăng nhập`, `feat: Làm API Đăng ký`...).

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

Mỗi khi một thành viên bắt đầu làm việc, chỉ cần tuân thủ 5 bước cực kỳ đơn giản sau:

### BƯỚC 1: Lấy code mới nhất về và tạo nhánh làm việc
Luôn đứng từ nhánh `dev` để kéo code mới nhất từ **Classroom** về, sau đó tạo nhánh tính năng của riêng bạn (vd: auth, article, comment).
```bash
git checkout dev
git pull classroom dev
git checkout -b feature/ten-tinh-nang-cua-ban
```

### BƯỚC 2: Viết code và Commit
Bạn cứ code ReactJS hay Backend bình thường. Khi xong việc thì gõ:
```bash
git add .
git commit -m "feat: hoan thanh giao dien dang nhap"
```

### BƯỚC 3: Đẩy code lên Github Classroom
```bash
git push classroom feature/ten-tinh-nang-cua-ban
```

### BƯỚC 4: Tạo Pull Request (PR) để nộp bài
1. Mở trang Github Classroom trên trình duyệt.
2. Bạn sẽ thấy nút màu xanh báo nhánh feature của bạn vừa được push lên. Bấm **"Compare & pull request"**.
3. Điền tiêu đề PR (ví dụ: `feat: Hoàn thành trang Đăng Nhập (Closes #1)`). Việc ghi `Closes #1` sẽ tự động đóng Issue số 1 khi PR được merge.
4. Bấm **Create pull request**.
5. Nhờ một thành viên khác trong nhóm vào xem code và bấm nút **"Merge pull request"**. 
**(⚠️ TUYỆT ĐỐI KHÔNG tích vào ô "Delete branch" sau khi merge để giữ lại lịch sử minh chứng cho thầy cô chấm).**

### BƯỚC 5: Cập nhật lại máy cá nhân để code tiếp
Sau khi PR của bạn (hoặc của bạn khác) đã được merge trên Github Classroom, bạn cần cập nhật lại nhánh `dev` trên máy mình:
```bash
git checkout dev
git pull classroom dev
```

🎉 **XONG!** Lịch sử Git của nhóm sẽ cực kỳ chuẩn mực, xanh mượt và đúng 100% yêu cầu của thầy cô. Mọi người cứ lặp lại 5 bước này cho đến khi kết thúc môn học nhé!
