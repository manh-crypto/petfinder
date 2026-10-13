# Bảo mật PetFinder – đối chiếu OWASP Top 10 (2021)

> **Đọc trước:** PetFinder hiện là ứng dụng **chạy hoàn toàn ở trình duyệt** (dữ liệu nằm trong `localStorage` của từng máy, không có máy chủ).
> Vì vậy mọi kiểm tra quyền/xác thực ở đây là **lớp phòng thủ phía giao diện**: chúng chặn tấn công qua dữ liệu (XSS, dữ liệu bị sửa, tệp độc hại, dò mật khẩu…)
> và sai sót thao tác, nhưng **không thể thay thế kiểm soát phía máy chủ**. Người dùng có DevTools luôn sửa được dữ liệu trong chính trình duyệt của họ.
> Khi có backend (xem “Lộ trình”), toàn bộ quyền/xác thực phải được kiểm tra lại ở máy chủ.

## Bảng đối chiếu

| OWASP | Rủi ro đã tìm thấy trong dự án | Đã xử lý | Còn lại / cần làm |
|---|---|---|---|
| **A01 Kiểm soát truy cập** | Quyền admin chỉ dựa vào giao diện; hàm admin gọi được từ console; sửa/xóa tin của người khác bằng id (IDOR); thao tác theo chỉ số mảng | `requireAdmin()` ở mọi hàm quản trị (dashboard, dòng tiền, góp ý, người dùng, tin, tin tức); quyền (`role`) luôn đọc lại từ kho người dùng, sửa tay phiên vô hiệu; `canModifyPet()` (chủ tin hoặc admin) cho sửa/xóa; thao tác người dùng theo email; không thể tự xóa/khóa/hạ quyền, không xóa/khóa admin cuối cùng; trang admin hiện màn hình “không có quyền”; mọi vi phạm ghi nhật ký | Người dùng sửa được `localStorage` của **chính họ** (chỉ ảnh hưởng dữ liệu máy họ). Cần backend để thực thi thật |
| **A02 Lỗi mật mã** | Mật khẩu lưu **dạng văn bản**; phiên lưu cả mật khẩu; ảnh giữ EXIF/GPS | PBKDF2-HMAC-SHA256, **600.000 vòng**, salt 16 byte, so sánh hằng thời gian; di trú tự động mật khẩu cũ; nâng cấp băm yếu khi đăng nhập; phiên chỉ chứa “con trỏ” `{email, uid, iat, exp}`; ảnh được vẽ lại (xóa EXIF/GPS); yêu cầu HTTPS để băm | Băm nằm trong `localStorage` (đọc được nếu có XSS/truy cập máy). Backend nên dùng Argon2id/bcrypt |
| **A03 Injection (XSS…)** | XSS lưu trữ ở thẻ thú cưng, chi tiết, bản đồ, bảng admin, tên người dùng; **chèn mã JS qua thuộc tính `onclick`** (ô Zalo/email ở khung liên hệ); CSV injection | Escape đầu ra ở **mọi** template (`PFSec.esc`); dựng DOM bằng `textContent`/`createElement` ở chỗ nhạy cảm; **làm sạch dữ liệu khi đọc** (`sanitizePet/User/News`, giới hạn độ dài, enum, URL/ảnh an toàn: chặn `javascript:`, `data:text/html`, SVG); `data-*` thay cho chuỗi JS trong `onclick`; ô CSV có tiền tố `'`; CSP | CSP còn `'unsafe-inline'` cho script vì giao diện dùng `onclick=`. Muốn CSP chặn được XSS nội tuyến cần chuyển sang `addEventListener` rồi bỏ `'unsafe-inline'` |
| **A04 Thiết kế không an toàn** | Không giới hạn thử mật khẩu; đăng tin/gửi form không giới hạn; id đoán được (`pet_<giờ>`) | Khóa tạm sau 5 lần sai (30 giây → tối đa 15 phút, kể cả khi nhập đúng); chính sách mật khẩu (8 ký tự, chữ+số, chặn mật khẩu phổ biến/chứa email; admin ≥10, hoa+thường); chờ giữa các lần đăng tin/gửi liên hệ; honeypot; id ngẫu nhiên | Giới hạn tần suất thật phải đặt ở máy chủ/WAF |
| **A05 Cấu hình sai** | **Tài khoản admin mặc định `admin/123`**; không có CSP; trang đứng độc lập không chống nhúng khung; favicon 404… | Bỏ mật khẩu mặc định: lần đầu đăng nhập `admin` phải **tự đặt mật khẩu mạnh**, mật khẩu `123` cũ bị thu hồi; CSP + Referrer-Policy (thẻ meta); chống nhúng iframe bằng JS; `rel="noopener noreferrer"`; `autocomplete` đúng | GitHub Pages không đặt được header → dùng `_headers` (Netlify/Cloudflare Pages) để có `frame-ancestors`, HSTS |
| **A06 Thành phần lỗi thời** | Phụ thuộc CDN không ghim | Leaflet **1.9.4 ghim + SRI sha384** (đã đối chiếu với giá trị chính thức); Firebase SDK ghim phiên bản 10.14.1 | Kiểm tra định kỳ bản mới của Firebase SDK/Leaflet (không có `npm audit` vì không dùng npm) |
| **A07 Xác thực yếu** | Mật khẩu `admin/123`; **đăng nhập bằng thông tin bất kỳ tự tạo tài khoản**; chế độ “demo” cho phép nhập email `admin` để chiếm quyền; tài khoản mẫu có **mật khẩu ghi cứng trong mã nguồn**; thông báo lỗi lộ tài khoản có tồn tại; không đổi được mật khẩu; phiên không hết hạn | Mọi điều trên đã gỡ: không tự tạo tài khoản khi đăng nhập; bỏ chế độ demo; tài khoản mẫu **không có mật khẩu** và mật khẩu đã lộ bị thu hồi ở trình duyệt cũ; thông báo lỗi chung + băm giả (chống dò tài khoản); **đổi mật khẩu**; phiên hết hạn sau 4 giờ không hoạt động/24 giờ tối đa, đồng bộ giữa tab; đăng nhập Google **không bao giờ** liên kết vào tài khoản admin, không nhận `role` từ nhà cung cấp | Chưa có đặt lại mật khẩu qua email, MFA (cần backend) |
| **A08 Toàn vẹn dữ liệu/phần mềm** | Tin cậy dữ liệu `localStorage` (mảng chứa `null`, kiểu sai làm sập trang); không SRI | Mọi `load*()` ép kiểu/giới hạn/loại bản ghi hỏng, chặn prototype pollution; xử lý đầy bộ nhớ (`QuotaExceeded`); SRI cho Leaflet; không dùng `eval`/`document.write` | Firebase/Facebook SDK nạp động nên chưa có SRI |
| **A09 Ghi nhật ký & giám sát** | Không có nhật ký | `PFSec.log` ghi: đăng nhập thành/bại, khóa tạm, từ chối truy cập, đổi quyền, xóa dữ liệu, tải tệp bị từ chối, xuất CSV…; **Admin → 🛡️ Bảo mật** có nhật ký + kiểm tra cấu hình (HTTPS, CSP, mật khẩu admin, khóa AI lộ…) | Nhật ký chỉ nằm ở trình duyệt (xóa được) – cần ghi tập trung ở máy chủ |
| **A10 SSRF** | Không áp dụng cho phần giao diện | AI chạy local (Ollama), trình duyệt chỉ gọi localhost, không nhận URL từ người dùng; truy vấn địa chỉ được mã hóa bằng `URLSearchParams` | — |

## Việc tải ảnh
`PFSec.processImage`: kiểm tra **nội dung thật** (magic bytes JPG/PNG/GIF/WEBP – từ chối SVG/HTML đổi đuôi), tối đa 8 MB, giải mã và **vẽ lại** thành JPEG (xóa EXIF/vị trí GPS và mã nhúng), giới hạn kích thước đầu ra để không làm đầy `localStorage`.

## Khóa API
- **Firebase web `apiKey`** là định danh công khai theo thiết kế; bảo vệ bằng *Authorized domains* (và nên hạn chế khóa theo HTTP referrer trong Google Cloud Console).
- **Không dùng API AI đám mây**: trợ lý chạy local qua Ollama (`localhost:11434`), nội dung chat không gửi ra ngoài và không cần khóa API. Mã chỉ chấp nhận endpoint localhost.

## Lưu ý quan trọng về dữ liệu mẫu
`data/seed-pets.js` có tên, số điện thoại, email **trông như của người thật** (8 chủ tin, 16 số điện thoại). Hãy thay bằng dữ liệu giả hoặc xin phép trước khi để repo/trang ở chế độ công khai (GDPR/Luật bảo vệ dữ liệu cá nhân).

## Danh sách kiểm tra trước khi đưa lên mạng
1. Chạy qua **HTTPS** (GitHub Pages). Firebase → *Authorized domains* gồm domain thật.
2. Đăng nhập `admin`, **đặt mật khẩu mạnh**; kiểm tra Admin → 🛡️ Bảo mật không còn mục đỏ.
3. AI: dùng Ollama local (xem README); không đặt khóa API đám mây trong mã web.
4. Đặt web sau Cloudflare/Netlify và dùng `_headers` để có `frame-ancestors 'none'` và HSTS.
5. Thay dữ liệu mẫu chứa thông tin cá nhân.
6. Thay `CONTACT_INFO` trong `js/feedback.js` bằng thông tin liên hệ thật.

## Lộ trình để bảo mật “thật”
1. **Backend** (Firebase Auth + Firestore/Supabase hoặc Node/Express): lưu người dùng, tin, giao dịch; kiểm tra quyền và quyền sở hữu **ở máy chủ** (Security Rules/RLS).
2. Chuyển xác thực sang Firebase Auth (email/mật khẩu + đặt lại mật khẩu + xác minh email + MFA); bỏ băm ở trình duyệt.
3. Tải ảnh lên Storage với quy tắc giới hạn loại/kích thước; quét/tái mã hóa phía máy chủ.
4. Bỏ toàn bộ `onclick=` nội tuyến → `addEventListener`, rồi **bỏ `'unsafe-inline'`** khỏi CSP.
5. Nhật ký tập trung + cảnh báo; Dependabot/kiểm tra phiên bản thư viện định kỳ.
