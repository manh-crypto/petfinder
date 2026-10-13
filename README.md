# PetFinder – bản sửa điều hướng

Bản này giữ nguyên phần Cấp cứu 24/7 và toàn bộ hình ảnh bệnh viện.

Điều hướng navbar đã được sửa để các mục hoạt động khi mở trực tiếp bằng file://:
- Trang chủ → index.html
- Thú cưng → pages/pets.html
- Bản đồ → pages/map.html
- Đăng tin → index.html#form
- Cấp cứu 24/7 → pages/veterinary.html
- Cửa hàng → index.html#shop-ads
- Tin của tôi → pages/profile.html#posts
- Cài đặt → pages/profile.html#settings
- Quản trị → pages/admin.html

Không cần chạy server để các liên kết trên hoạt động.


## Cập nhật (đợt 5) – hợp nhất với petfinder(2)

**Đã ghép từ petfinder(2):** Firebase Auth (đăng nhập Google), tìm địa chỉ → tọa độ (Nominatim), tìm địa chỉ/“Vị trí của tôi” trên bản đồ, tin đã đăng hiện trên bản đồ, `js/location.js`, hộp chọn khu vực chỉ hiện ở trang chủ/Thú cưng/Bản đồ.

**Cấu hình tập trung ở `js/config.js`:** Firebase (đăng nhập Google), geocoding, trợ lý **AI local (Ollama)** và link nhóm Facebook cộng đồng.

### Việc cần làm trước khi đưa lên mạng
1. Firebase Console → Authentication → Settings → **Authorized domains**: thêm domain GitHub Pages và `localhost`. Bật nhà cung cấp Google.
2. Trợ lý AI **chạy local** (không dùng API đám mây): cài [Ollama](https://ollama.com), chạy `ollama pull qwen2.5:3b`, đặt biến môi trường `OLLAMA_ORIGINS` = domain/trang web của bạn (vd `http://localhost:8123`) rồi khởi động lại Ollama. Cấu hình ở `ai` trong `js/config.js`. Không có Ollama thì chat tự chuyển sang chế độ trả lời nhanh. Lưu ý: AI chạy trên máy của *người đang mở web*, nên khi deploy công khai mỗi người dùng cần có Ollama riêng, nếu không sẽ thấy chế độ trả lời nhanh.
3. **Đổi tài khoản quản trị mặc định** (`admin` / `123` được tạo sẵn trong `js/auth.js`, mật khẩu đang lưu dạng chữ thường trong localStorage).
4. Đổi email/điện thoại thật trong `CONTACT_INFO` (`js/feedback.js`).

### Thay đổi về bảo mật
- Bỏ chế độ đăng nhập “demo” (từng cho phép nhập email bất kỳ, kể cả `admin`, để vào tài khoản); đăng nhập bằng mật khẩu với tài khoản chưa tồn tại bị từ chối.
- Đăng nhập Google **không bao giờ** liên kết vào tài khoản quản trị và không cấp quyền admin; tài khoản bị khóa không đăng nhập được.
- Nội dung tin đăng hiển thị trong popup bản đồ đã được escape.

### Lỗi có sẵn đã sửa
- Đăng tin bị văng lỗi vì thiếu `typeIconMap` và (trên trang Thú cưng) thiếu `getUserArea` → thêm `typeIconMap` vào `utils.js`, tách hàm khu vực ra `location.js`.
- Thanh điều hướng thu gọn đúng ở mọi độ rộng với menu 7 mục.

### Khung liên hệ người đăng tin
Bấm “Liên hệ” chỉ **hiển thị** tên, số điện thoại, Zalo, email của người đăng (kèm nút Sao chép). Trang không có liên kết gọi/nhắn/gửi mail.


## Cập nhật (đợt 6) – rà soát lỗi & tăng cường bảo mật (OWASP Top 10)

Xem **`SECURITY.md`** (bảng đối chiếu OWASP, phần còn lại cần backend, danh sách kiểm tra trước khi triển khai) và `_headers` (header HTTP cho Netlify/Cloudflare Pages).

- Lõi bảo mật dùng chung `js/security.js` (nạp đầu tiên): escape, làm sạch dữ liệu, URL/ảnh an toàn, băm mật khẩu PBKDF2, chống dò mật khẩu, nhật ký, xử lý ảnh tải lên, chống nhúng khung.
- **Lần đầu đăng nhập `admin` bạn phải tự đặt mật khẩu mạnh** (không còn `admin/123`). Có chức năng **đổi mật khẩu** ở Tài khoản (trang hồ sơ).
- Admin → **🛡️ Bảo mật**: nhật ký sự kiện + kiểm tra cấu hình.
- Lỗi chức năng đã sửa: ô tìm kiếm ở trang chủ (chuyển sang trang Thú cưng kèm bộ lọc), nút “Sửa” tin ở trang hồ sơ (thiếu mã/hộp thoại), thao tác admin trên trang không nạp `pets.js`, lướt ảnh thú y, liên kết `#form` ở trang không có mã đăng tin, `submitPost`/`updateStats` thiếu bảo vệ, favicon 404.
- Phiên cũ (đăng nhập từ trước) sẽ bị đăng xuất một lần vì định dạng phiên đã đổi.


## Cập nhật (đợt 7) – nền sinh động
- `css/background.css` (nạp ở mọi trang): nền tông cam–trắng nhẹ gồm các đốm sáng trôi chậm và hoa văn dấu chân bay lên, thuần CSS (không ảnh ngoài, không ảnh hưởng CSP). Tự tắt khi hệ điều hành bật “giảm chuyển động”.
- Các khối trước đây nền trắng/cam đặc (tìm kiếm, thống kê, cách hoạt động, câu chuyện, bản đồ, cửa hàng…) được làm trong mờ để thấy nền. Muốn đổi màu/tốc độ: sửa các giá trị `rgba(...)` và `animation` trong file này.


## Cơ sở dữ liệu: Firebase Firestore (miễn phí – gói Spark)

Dữ liệu (tin thú cưng, tin tức, hồ sơ người dùng, góp ý, giao dịch) lưu trên **Firestore**; đăng nhập qua **Firebase Authentication**. Mật khẩu do Google quản lý, web không lưu mật khẩu. Quyền truy cập do `firestore.rules` quyết định trên máy chủ. Yêu thích và khu vực vẫn lưu riêng trong trình duyệt.

Cài đặt một lần trong [Firebase Console](https://console.firebase.google.com) (dự án khai báo ở `js/config.js`):
1. **Build → Firestore Database → Create database** (chọn vị trí gần Việt Nam, vd `asia-southeast1`).
2. **Rules**: dán toàn bộ nội dung `firestore.rules` → **Publish**.
3. **Authentication → Sign-in method**: bật **Email/Password** và **Google**; **Settings → Authorized domains**: thêm domain Vercel và `localhost`.
4. **Tạo admin đầu tiên**: đăng ký một tài khoản trên web, copy **UID** của nó (Authentication → Users), rồi trong Firestore tạo collection `admins` với **Document ID = UID đó** (nội dung tùy ý, vd `{ "ok": true }`). Sau đó admin mới cấp/gỡ quyền được trong trang quản trị.

Lưu ý: gói Spark giới hạn khoảng 50.000 lượt đọc và 20.000 lượt ghi mỗi ngày, 1 GiB lưu trữ. Ảnh được nén và lưu trực tiếp trong tài liệu (tối đa 5 ảnh/tin) vì Cloud Storage không còn miễn phí.
