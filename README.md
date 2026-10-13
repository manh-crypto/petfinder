# PetFinder – Tìm kiếm thú cưng đi lạc

PetFinder là website cộng đồng giúp người nuôi thú cưng đăng tin tìm thú cưng thất lạc, và giúp người nhặt được hoặc có nhu cầu cho nhận nuôi kết nối với nhau. Website là trang tĩnh (HTML, CSS, JavaScript), dùng Firebase để đăng nhập Google và lưu dữ liệu, không cần máy chủ riêng.

Địa chỉ: https://petfinder-ebon.vercel.app
Liên hệ: petfinder254@gmail.com

## Chức năng

**Dành cho mọi người**

* **Trang chủ:** tin mới nhất, thống kê, tin tức và gợi ý cửa hàng.
* **Thú cưng:** danh sách tin theo ba nhóm: đang thất lạc, đã tìm thấy, chờ nhận nuôi. Tìm kiếm theo tên, loại, màu lông, khu vực.
* **Bản đồ:** xem vị trí các tin trên bản đồ, lọc theo tỉnh/thành phố, tìm địa chỉ, dùng "Vị trí của tôi", xem bệnh viện thú y gần bạn.
* **Cấp cứu 24/7:** danh sách phòng khám, bệnh viện thú y kèm thông tin liên hệ.
* **Cửa hàng:** các thương hiệu và cửa hàng thức ăn, đồ chơi, spa cho thú cưng.
* **Tin tức, Liên hệ, Góp ý:** gửi góp ý trực tiếp đến quản trị viên.
* **Trợ lý chat:** trả lời nhanh các câu hỏi về cách dùng web và chăm sóc thú cưng.

**Dành cho thành viên (đăng nhập Google)**

* Đăng tin thất lạc, nhặt được hoặc cho nhận nuôi, kèm ảnh, mô tả, vị trí, số điện thoại, Zalo.
* Loại thú cưng nhập tự do (chó, mèo, thỏ, hamster, bò sát, ...).
* Quản lý tin của tôi: sửa, xóa, đổi trạng thái khi đã tìm thấy.
* Lưu tin yêu thích và nhận thông báo tin gần khu vực của bạn.
* Cài đặt tài khoản: ảnh đại diện, tên, thông tin liên hệ.

**Dành cho quản trị viên**

* Bảng điều khiển, duyệt và xóa tin, quản lý người dùng, tin tức, góp ý.
* Cấp hoặc gỡ quyền quản trị cho người khác.
* Nạp dữ liệu mẫu để thử nghiệm.

## Hướng dẫn sử dụng

**Đăng tin**

1. Bấm **Đăng nhập** và chọn tài khoản Google.
2. Bấm **Đăng tin**, chọn loại tin (thất lạc, nhặt được, cho nhận nuôi).
3. Điền loại thú cưng, đặc điểm nhận dạng, ngày, khu vực, nơi thất lạc, thêm ảnh rõ mặt.
4. Điền số điện thoại hoặc Zalo, rồi bấm đăng. Tin xuất hiện ở mục Thú cưng và trên Bản đồ.

**Tìm thú cưng**

1. Vào **Thú cưng** để lọc theo trạng thái và tìm kiếm theo từ khóa.
2. Hoặc vào **Bản đồ**, chọn tỉnh/thành phố ở góc trên bên phải để chỉ xem tin trong khu vực.
3. Bấm vào một tin để xem chi tiết, rồi bấm **Liên hệ** để lấy số điện thoại, Zalo, email của người đăng.

**An toàn khi liên hệ:** hãy hỏi thêm đặc điểm nhận dạng để xác minh, hẹn gặp ở nơi công cộng và không chuyển tiền trước cho người lạ.

**Khi đã tìm thấy thú cưng:** vào **Tin của tôi**, mở tin và đổi trạng thái thành "Đã tìm thấy" hoặc xóa tin.

## Công nghệ

* HTML, CSS, JavaScript.
* Firebase Authentication (Google) và Firestore (lưu tin, hồ sơ, góp ý).
* Bản đồ Leaflet với nền OpenStreetMap, tìm địa chỉ bằng Nominatim.
* Triển khai trên Vercel (`vercel.json` đã cấu hình các header bảo mật).

## Cấu trúc thư mục

```
index.html        Trang chủ
pages/            Các trang: thú cưng, bản đồ, cấp cứu, tin tức, liên hệ, hồ sơ, quản trị, chính sách
components/       Thành phần dùng chung (menu, chân trang, hộp thoại)
css/              Giao diện
js/               Mã chạy trên trình duyệt (config.js là nơi cấu hình)
data/             Dữ liệu mẫu và ảnh
assets/           Logo, biểu tượng ứng dụng
firestore.rules   Luật bảo mật Firestore
```

## Cài đặt và triển khai

1. **Firebase:** tạo project, bật Authentication (Google) và Firestore. Điền thông tin vào `js/config.js`.
2. **Luật bảo mật:** Firestore Database, tab Rules, dán nội dung `firestore.rules` rồi Publish (bắt buộc, vì luật mới có bộ sưu tập `pet\_contacts`).
3. **Tên miền:** Authentication, Settings, Authorized domains, thêm tên miền Vercel và `localhost`.
4. **Quản trị viên đầu tiên:** trong Firestore tạo collection `admins`, Document ID là UID của tài khoản bạn (xem ở Authentication, Users), thêm một field bất kỳ. Đăng xuất rồi đăng nhập lại.
5. **Chạy thử trên máy:** chạy `python -m http.server 8000` trong thư mục dự án rồi mở http://localhost:8000. Không nên mở file trực tiếp vì đăng nhập Google cần địa chỉ http.
6. **Triển khai:** đưa mã lên GitHub và kết nối repository với Vercel, mỗi lần cập nhật Vercel sẽ tự triển khai lại.

## Trợ lý AI chạy trên máy (tùy chọn)

Trợ lý chat có thể dùng mô hình chạy cục bộ qua [Ollama](https://ollama.com), không gửi dữ liệu ra dịch vụ đám mây. Cài Ollama, chạy `ollama pull qwen2.5:3b`, đặt biến môi trường `OLLAMA\_ORIGINS` thành địa chỉ trang web rồi khởi động lại Ollama. Nếu không có Ollama, trợ lý tự chuyển sang trả lời nhanh theo mẫu.

## Bảo mật và quyền riêng tư

* Quyền quản trị do Firestore quyết định (`admins/{uid}`) và được kiểm tra ở phía máy chủ bằng luật Firestore.
* Số điện thoại, Zalo, email của tin được lưu riêng (`pet\_contacts`), chỉ người đã đăng nhập mới xem được khi bấm Liên hệ; tin công khai không chứa các thông tin này.
* Hãy chỉ ghi khu vực đủ để tìm kiếm, không ghi số nhà.
* Xem thêm `SECURITY.md`, trang Chính sách bảo mật và trang Xóa dữ liệu.

