# Bảo mật PetFinder

Tài liệu này mô tả kiến trúc bảo mật hiện tại, đối chiếu OWASP Top 10 (2021), những gì đã xử lý và những rủi ro còn lại.
Tệp này **không được triển khai lên web công khai** (đã loại bằng `.vercelignore`); chỉ nằm trong kho mã.

## Kiến trúc

- Web tĩnh (HTML/CSS/JS) triển khai trên Vercel, **không có mã máy chủ riêng**.
- Backend: Firebase Authentication (Google, và Email/Mật khẩu có xác thực email) và Cloud Firestore. Mọi quyền truy cập được **máy chủ Firestore** kiểm tra bằng `firestore.rules`; kiểm tra ở trình duyệt chỉ để hiển thị giao diện đúng.
- Quyền quản trị: tài liệu `admins/{uid}`. Vai trò không bao giờ được nhận từ nhà cung cấp đăng nhập hay từ dữ liệu người dùng gửi lên.

## Bảo vệ dữ liệu cá nhân (PII)

| Dữ liệu | Nơi lưu | Ai đọc được |
|---|---|---|
| Mô tả tin (tên thú cưng, loài, khu vực, mô tả, ảnh, tên hiển thị của chủ tin) | `pets/{id}` | Mọi người (trang công khai theo thiết kế) |
| **Số điện thoại, Zalo, email liên hệ của tin** | `pet_contacts/{id}` (tách riêng) | Chỉ người **đã đăng nhập** và không bị khóa, đọc **từng tài liệu theo id**; chỉ admin được liệt kê cả bộ sưu tập |
| Hồ sơ người dùng (email, điện thoại, khu vực) | `users/{uid}` | Chính chủ và admin |
| Góp ý, liên hệ | `feedback/{id}` | Admin, chủ yêu cầu; đánh giá công khai ai cũng xem |
| Sổ giao dịch | `tx/{id}` | Chỉ admin |

Các biện pháp:
1. **Tách liên hệ khỏi tài liệu công khai.** Tài liệu `pets` bị luật Firestore giới hạn bằng danh sách trường cho phép (`petShape`), nên không thể chứa `phone`, `zalo`, `ownerEmail`. Truy vấn ẩn danh qua REST API chỉ thấy mô tả tin.
2. **Tải liên hệ theo yêu cầu.** Trình duyệt chỉ gọi `PFDB.getContact(id)` khi người dùng đã đăng nhập bấm "Liên hệ"; không tải hàng loạt, có cache.
3. **Tự di trú tin cũ.** Tin được đăng trước đây còn SĐT/email trong tài liệu công khai sẽ được chủ tin (hoặc admin) khi đăng nhập tự chuyển sang `pet_contacts` và xóa khỏi tài liệu công khai (`migrateLegacy` trong `js/db.js`).
4. **Email chủ tin không còn công khai.** Trang admin tra email theo `ownerUid` trong danh sách người dùng (chỉ admin đọc được).
5. **Dữ liệu mẫu là dữ liệu giả.** `data/seed-pets.js` chỉ chứa tên, SĐT (`09000000xx`), email (`@example.com`) giả, không kèm ảnh. Bản cũ từng chứa thông tin trông như của người thật: nếu kho mã từng ở chế độ công khai, hãy coi các thông tin đó đã lộ và cân nhắc xóa lịch sử Git.
6. **Ảnh tĩnh nằm trong kho mã, không nhúng base64 vào trang** (ảnh cửa hàng ở `assets/shop/`, ảnh phòng khám đã nén), giúp CSP, bộ nhớ đệm và rà soát hoạt động tốt hơn.
7. **Tệp nội bộ không lên web.** `SECURITY.md`, `README.md`, `firestore.rules` bị loại khỏi bản triển khai bằng `.vercelignore`.

Giới hạn còn lại: một tài khoản Google bất kỳ vẫn có thể lấy liên hệ của từng tin nếu viết script. Việc này giờ cần đăng nhập, để lại dấu vết theo tài khoản và có thể khóa tài khoản; bật **App Check** (bên dưới) để chặn script ngoài web. Người đăng tin nên chỉ ghi khu vực đủ để tìm kiếm, không ghi số nhà.

## Tính năng tạo poster

- Poster được **vẽ hoàn toàn trên trình duyệt** (canvas) và xuất PNG/PDF bằng mã tự viết, không gửi dữ liệu đến máy chủ nào và không thêm thư viện hoặc tên miền mới vào CSP.
- Mọi nội dung nhập (tên, địa điểm, số điện thoại...) chỉ được **vẽ lên canvas** và được làm sạch, giới hạn độ dài; không đưa vào HTML, nên không có đường XSS mới.
- Chỉ **chủ tin** (hoặc admin) mở được hộp tạo poster, và chỉ cho tin thất lạc.
- Poster **không có mã QR** để tránh bị nhầm với liên kết lừa đảo. Số điện thoại in lên poster là lựa chọn của chủ tin (có công tắc tắt và cảnh báo hiển thị công khai); số này **không được lưu** lại ở đâu và **không** nằm trong nội dung chia sẻ kèm theo.
- Tệp tạo ra chỉ tồn tại trong bộ nhớ trình duyệt; nút **Xóa poster** và việc đóng hộp thoại sẽ giải phóng chúng.
- Giới hạn còn lại: poster đã tải về hoặc đăng lên mạng xã hội nằm ngoài tầm kiểm soát của web. Người dùng nên cân nhắc trước khi để số điện thoại.

## Đối chiếu OWASP Top 10 (2021)

| Mục | Hiện trạng | Đã làm | Còn lại |
|---|---|---|---|
| **A01 Kiểm soát truy cập** | Lộ PII ở `pets` công khai | Tách `pet_contacts`; luật `petShape`; chỉ chủ tin/admin ghi, sửa, xóa; `users`, `admins`, `feedback`, `tx` từ chối ẩn danh; người dùng thường không thể tự cấp quyền admin | Chống thu thập hàng loạt cần App Check |
| **A02 Lộ dữ liệu nhạy cảm** | SĐT/email công khai; dữ liệu mẫu giống người thật | Như trên; dữ liệu mẫu thay bằng dữ liệu giả; ảnh tải lên được vẽ lại để xóa EXIF/GPS | Ảnh lưu trực tiếp trong tài liệu (chưa dùng Storage) |
| **A03 Injection / XSS** | Dữ liệu người dùng render nhiều nơi | Escape đầu ra (`PFSec.esc`), `textContent`, làm sạch khi đọc (`sanitizePet/User/News`), kiểm tra URL/ảnh, giới hạn độ dài và danh sách trường ở luật Firestore | CSP còn `'unsafe-inline'` (xem A05) |
| **A04 Thiết kế không an toàn** | Chỉ có giới hạn ở trình duyệt | Chặn email dùng một lần khi đăng ký; giới hạn cửa sổ trượt `PFSec.rateLimit` (5 tin/10 phút/tài khoản), chờ giữa các lần đăng, honeypot, khóa tạm khi sai mật khẩu; luật Firestore giới hạn kích thước và số ảnh | Giới hạn phía trình duyệt bypass được: bật **App Check** |
| **A05 Cấu hình sai** | CSP, localhost Ollama | Header bảo mật (HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP, CORP `same-site`); mọi trang đều có thẻ CSP dự phòng cho nơi không đặt được header; bộ nhớ đệm ngắn cho `assets/`, luôn kiểm tra lại với `css/`, `js/`, `data/`; luật Firestore mặc định từ chối; tệp nội bộ không triển khai | Xem "Rủi ro đã chấp nhận" |
| **A06 Thành phần lỗi thời** | CDN; ảnh tĩnh | Leaflet 1.9.4 ghim + SRI; Firebase SDK ghim 10.14.1 | Theo dõi bản vá định kỳ; SDK nạp động chưa có SRI |
| **A07 Xác thực** | Google và Email/Mật khẩu | Tài khoản email/mật khẩu **phải xác thực email** mới dùng được (kiểm tra cả ở luật Firestore bằng `email_verified`); mật khẩu do Firebase băm; không nhận `role` từ nhà cung cấp; tài khoản bị khóa tự đăng xuất; số điện thoại khi đăng ký là tùy chọn | MFA do chính tài khoản Google đảm nhiệm; chưa có MFA cho email/mật khẩu |
| **A08 Toàn vẹn dữ liệu** | Dữ liệu từ Firestore | Làm sạch/ép kiểu mọi bản ghi khi đọc; luật chỉ nhận đúng trường và kiểu | — |
| **A09 Ghi nhật ký** | Nhật ký ở trình duyệt | `PFSec.log` cho thao tác nhạy cảm | Nhật ký tập trung cần máy chủ (Cloud Logging) |
| **A10 SSRF** | Không có truy vấn phía máy chủ từ dữ liệu người dùng | Không áp dụng | — |

## Rủi ro đã chấp nhận (và cách giảm thiểu)

- **`script-src 'unsafe-inline'`**: giao diện còn dùng thuộc tính `onclick=` nên CSP chưa chặn được XSS nội tuyến. Bù lại, mọi dữ liệu người dùng đều được escape và làm sạch khi đọc. Hướng xử lý: chuyển sang `addEventListener`, sau đó dùng nonce/hash và bỏ `'unsafe-inline'`.
- **`connect-src` cho phép `http://localhost:11434`**: để trợ lý AI chạy cục bộ bằng Ollama. Mã chỉ chấp nhận endpoint localhost/127.0.0.1 và hiển thị câu trả lời bằng `textContent`. Nếu không dùng AI, đặt `ai.enabled=false` trong `js/config.js` **và** xóa hai mục `localhost` khỏi CSP (`vercel.json`, `_headers`, thẻ meta).
- **Firebase `apiKey`/`appId`** trong `js/config.js` là định danh công khai theo thiết kế. Bảo vệ bằng: *Authorized domains*, hạn chế khóa theo HTTP referrer trong Google Cloud Console và App Check.

## Việc nên làm ngay sau khi triển khai

0. **Bật Email/Password** ở Firebase Authentication → Sign-in method, kiểm tra mẫu thư xác thực email (Templates) và thêm tên miền Vercel vào Authorized domains.
1. **Publish luật mới:** Firestore → Rules → dán `firestore.rules` → Publish. Không có bước này, dữ liệu liên hệ vẫn đang ở trạng thái cũ.
2. **Chạy di trú:** đăng nhập bằng tài khoản admin một lần; tin cũ tự được chuyển liên hệ sang `pet_contacts`. Chủ tin khác sẽ chuyển tin của mình khi họ đăng nhập.
3. **Bật App Check:** Firebase Console → App Check → đăng ký web app với reCAPTCHA v3, dán *site key* vào `appCheck.siteKey` trong `js/config.js`, kiểm tra web chạy bình thường, rồi bấm **Enforce** cho Firestore và Authentication.
4. **Hạn chế API key:** Google Cloud Console → APIs & Services → Credentials → khóa trình duyệt → *HTTP referrers* chỉ gồm tên miền Vercel của bạn.
5. **Kiểm tra truy vấn ẩn danh** (không đăng nhập) tới `pet_contacts`, `users`, `feedback`, `tx` phải trả `PERMISSION_DENIED`, và tài liệu `pets` không còn trường `phone`, `zalo`, `ownerEmail`.
6. **Đặt thông tin liên hệ của chính website** (`CONTACT_INFO` trong `js/feedback.js`) là hộp thư dành riêng cho dự án, không dùng thư cá nhân.

## Liên kết ngoài

Mọi liên kết mở tab mới (Facebook, TikTok, cửa hàng) đều có `rel="noopener noreferrer"`. Liên kết liên hệ do người dùng nhập chỉ nhận Zalo hoặc Facebook (`PFSec.parseSocialLink`), không nhận địa chỉ khác.

## Kiểm thử XSS nên chạy

Đăng thử tin có tên/mô tả là `<img src=x onerror=alert(1)>` và `"><script>alert(1)</script>`: nội dung phải hiện nguyên văn dưới dạng chữ, không chạy mã.

## Báo lỗi bảo mật

Gửi mô tả và cách tái hiện đến petfinder254@gmail.com. Vui lòng không công khai lỗi trước khi được xử lý.
