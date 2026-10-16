# PetFinder – Tìm kiếm thú cưng đi lạc

PetFinder là website cộng đồng giúp người nuôi thú cưng đăng tin tìm thú cưng thất lạc, đồng thời giúp người nhặt được hoặc có nhu cầu cho nhận nuôi kết nối với nhau. Website là trang tĩnh (HTML, CSS, JavaScript), dùng Firebase để đăng nhập và lưu dữ liệu, không cần máy chủ riêng. Giao diện dùng tốt trên điện thoại.

Địa chỉ: https://petfinder-ebon.vercel.app
Liên hệ: petfinder254@gmail.com
Cộng đồng: [Facebook](https://www.facebook.com/share/g/1Db11cVRdx/) · [TikTok](https://www.tiktok.com/@petfinder_thucung)

## Chức năng

**Dành cho mọi người**
- **Trang chủ:** tìm kiếm nhanh theo loại thú, khu vực, từ khóa; tin mới nhất; cách hoạt động; gợi ý cửa hàng.
- **Thú cưng:** danh sách tin theo ba nhóm: đang thất lạc, đã tìm thấy, chờ nhận nuôi. Tìm kiếm theo tên, loại, đặc điểm, khu vực; chọn Hà Nội thì chỉ ra tin ở Hà Nội.
- **Bản đồ:** xem vị trí các tin trên bản đồ, lọc theo 63 tỉnh/thành phố, tìm địa chỉ, dùng "Vị trí của tôi", xem phòng khám thú y gần bạn.
- **Cấp cứu 24/7:** danh sách phòng khám, bệnh viện thú y kèm ảnh và thông tin liên hệ.
- **Cửa hàng:** các thương hiệu và cửa hàng thức ăn, đồ chơi, spa cho thú cưng.
- **Tin tức, Liên hệ, Góp ý:** gửi góp ý trực tiếp đến quản trị viên.
- **Trợ lý chat:** trả lời nhanh các câu hỏi về cách dùng web và chăm sóc thú cưng.

**Dành cho thành viên**
- Đăng nhập bằng Google, hoặc đăng ký bằng email và mật khẩu (phải bấm liên kết xác thực trong email mới đăng nhập được; tài khoản chưa xác thực bị tự đăng xuất; số điện thoại khi đăng ký là tùy chọn).
- Đăng tin thất lạc, nhặt được hoặc cho nhận nuôi, kèm ảnh, mô tả, vị trí, số điện thoại, và liên kết Zalo hoặc Facebook (không bắt buộc). Tin nhặt được và cho nhận nuôi không cần nhập tên thú cưng hay ngày thất lạc.
- **Poster khẩn cấp:** tạo poster cho tin thất lạc của chính bạn, xem trước và chỉnh nội dung, rồi tải PNG, tải PDF, chia sẻ hoặc xóa poster.
- Quản lý tin của tôi: sửa, xóa, đổi trạng thái khi đã tìm thấy.
- Lưu tin yêu thích và nhận thông báo tin gần khu vực của bạn.
- Cài đặt tài khoản: ảnh đại diện, tên, thông tin liên hệ.

**Dành cho quản trị viên**
- Bảng điều khiển, quản lý người dùng, tin tức, góp ý.
- **Không duyệt tin trước khi đăng:** vì tính khẩn cấp của tin tìm thú cưng, tin xuất hiện ngay khi đăng. Quản trị viên chỉ kiểm tra sau: sửa, đánh dấu nghi vấn hoặc xóa tin vi phạm.
- Khi xóa người dùng, quản trị viên được hỏi có xóa luôn các tin của người đó không. Xóa người dùng sẽ đánh dấu tài khoản (collection `deleted_users`) để chặn đăng nhập; người đó chỉ dùng lại được khi chủ động bấm "Đăng ký" với email cũ. Muốn xóa hẳn tài khoản đăng nhập thì xóa trong Firebase Console, mục Authentication.
- Cấp hoặc gỡ quyền quản trị cho người khác.
- Nạp dữ liệu mẫu để thử nghiệm.

## Hướng dẫn sử dụng

**Đăng tin**
1. Bấm **Đăng nhập** (Google) hoặc **Đăng ký** (email, mật khẩu, xác thực qua email).
2. Bấm **Đăng tin**, chọn loại tin: thất lạc, nhặt được hoặc cho nhận nuôi.
3. Điền loại thú cưng, đặc điểm nhận dạng, khu vực, nơi thất lạc hoặc nơi nhặt được, thêm ảnh rõ mặt. Tin thất lạc cần thêm tên thú cưng và ngày thất lạc.
4. Điền số điện thoại (và Zalo hoặc Facebook nếu muốn), rồi bấm đăng. Tin xuất hiện ở mục Thú cưng và trên Bản đồ.

**Tạo poster cho tin thất lạc**
1. Mở tin của bạn rồi bấm **Tạo poster**, hoặc bấm **Tạo poster** ở danh sách "Tin của tôi" trong hồ sơ.
2. Sửa tên, đặc điểm, địa điểm lần cuối xuất hiện, thời gian mất tích, tên người liên hệ (chỉ tên, ví dụ "Anh Minh"), số điện thoại. Chọn khổ A4 hoặc vuông, màu dải tiêu đề. Có thể tắt hiển thị số điện thoại và địa chỉ web.
3. Bấm **Tạo poster**, rồi **Tải PNG**, **Tải PDF** hoặc **Chia sẻ** (trên điện thoại sẽ mở hộp chia sẻ để gửi qua Zalo, Messenger, Facebook). Bấm **Xóa poster** nếu muốn bỏ và tạo lại.
4. Nếu mở web trong Zalo hoặc Facebook mà không tải được, hãy mở bằng Chrome hoặc Safari. Muốn in, tải PDF rồi in ở nhà hoặc mang ra tiệm.

Lưu ý: số điện thoại in trên poster sẽ hiển thị công khai, chỉ nhập số bạn sẵn sàng cho người lạ gọi.

**Tìm thú cưng**
1. Vào **Thú cưng** để lọc theo trạng thái và tìm kiếm theo từ khóa.
2. Hoặc vào **Bản đồ**, chọn tỉnh/thành phố ở góc trên bên phải để chỉ xem tin trong khu vực.
3. Bấm vào một tin để xem chi tiết, rồi bấm **Liên hệ** để lấy số điện thoại, Zalo, email của người đăng (cần đăng nhập).

**An toàn khi liên hệ:** hãy hỏi thêm đặc điểm nhận dạng để xác minh, hẹn gặp ở nơi công cộng và không chuyển tiền trước cho người lạ.

**Khi đã tìm thấy thú cưng:** vào **Tin của tôi**, mở tin và đổi trạng thái thành "Đã tìm thấy" hoặc xóa tin.

## Công nghệ

- HTML, CSS, JavaScript thuần, không cần build.
- Firebase Authentication (Google, Email/Mật khẩu có xác thực email) và Firestore (lưu tin, hồ sơ, góp ý).
- Bản đồ Leaflet với nền OpenStreetMap (dự phòng Esri), tìm địa chỉ bằng Nominatim.
- Poster vẽ bằng canvas trên trình duyệt, xuất PNG và PDF không cần thư viện ngoài.
- Triển khai trên Vercel (`vercel.json` cấu hình header bảo mật và bộ nhớ đệm).

## Cấu trúc thư mục

```
index.html        Trang chủ
pages/            Các trang: thú cưng, bản đồ, cấp cứu, tin tức, liên hệ, hồ sơ, quản trị, chính sách
components/       Thành phần dùng chung (menu, chân trang, hộp thoại)
css/              Giao diện (responsive.css xử lý màn hình nhỏ, poster.css cho hộp tạo poster)
js/               Mã chạy trên trình duyệt (config.js là nơi cấu hình, poster.js tạo poster)
data/             Dữ liệu mẫu và danh sách ảnh phòng khám
assets/           Logo, biểu tượng ứng dụng, ảnh cửa hàng (shop), ảnh phòng khám (vets)
firestore.rules   Luật bảo mật Firestore
```

## Cài đặt và triển khai

1. **Firebase:** tạo project, bật Authentication (Google và Email/Password) và Firestore. Điền thông tin vào `js/config.js`.
2. **Luật bảo mật:** Firestore Database, tab Rules, dán nội dung `firestore.rules` rồi Publish (bắt buộc).
3. **Tên miền:** Authentication, Settings, Authorized domains, thêm tên miền Vercel và `localhost`.
4. **Quản trị viên đầu tiên:** trong Firestore tạo collection `admins`, Document ID là UID của tài khoản bạn (xem ở Authentication, Users), thêm một field bất kỳ. Đăng xuất rồi đăng nhập lại.
5. **Chạy thử trên máy:** chạy `python -m http.server 8000` trong thư mục dự án rồi mở http://localhost:8000. Không nên mở file trực tiếp vì đăng nhập Google cần địa chỉ http.
6. **Triển khai:** đưa **toàn bộ** thư mục (kể cả `css/`, `js/`, `assets/`) lên GitHub và kết nối repository với Vercel, mỗi lần cập nhật Vercel sẽ tự triển khai lại. Khi đổi tên hoặc xóa ảnh, nhớ xóa file cũ trên GitHub.

## Trợ lý AI chạy trên máy (tùy chọn)

Trợ lý chat có thể dùng mô hình chạy cục bộ qua [Ollama](https://ollama.com), không gửi dữ liệu ra dịch vụ đám mây. Cài Ollama, chạy `ollama pull qwen2.5:3b`, đặt biến môi trường `OLLAMA_ORIGINS` thành địa chỉ trang web rồi khởi động lại Ollama. Nếu không có Ollama, trợ lý tự chuyển sang trả lời nhanh theo mẫu.

## Bảo mật và quyền riêng tư

- **Trẻ em:** khi đăng ký phải xác nhận từ đủ 13 tuổi, hoặc có cha mẹ/người giám hộ đồng ý và giám sát. Chính sách bảo mật nêu rõ điều này.
- Quyền quản trị do Firestore quyết định (`admins/{uid}`) và được kiểm tra ở phía máy chủ bằng luật Firestore.
- Số điện thoại, Zalo, email của tin được lưu riêng (`pet_contacts`), chỉ người đã đăng nhập và đã xác thực email mới xem được khi bấm Liên hệ; tin công khai không chứa các thông tin này.
- Poster được tạo ngay trên máy bạn, không lưu và không gửi đi đâu. Thông tin in trên poster do bạn tự chọn.
- Hãy chỉ ghi khu vực đủ để tìm kiếm, không ghi số nhà.
- Xem thêm `SECURITY.md`, trang Chính sách bảo mật và trang Xóa dữ liệu.
