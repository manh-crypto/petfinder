// ===== Cấu hình dịch vụ bên ngoài của PetFinder =====
// File này được nạp trên mọi trang. Chỉ đặt ở đây những giá trị ĐƯỢC PHÉP công khai ở phía trình duyệt.
window.PETFINDER_CONFIG = Object.freeze({

  // --- Đăng nhập Google (Firebase Authentication) ---
  // Firebase web apiKey là mã định danh phía client, không phải khóa bí mật.
  // Nhớ thêm domain deploy (vd: <tên>.github.io) và localhost vào Firebase Console > Authentication > Settings > Authorized domains.
  firebase: Object.freeze({
    apiKey: 'AIzaSyAz82OmtUcAwTLfJLRCFfP9Ex3y3_MAC2s',
    authDomain: 'petfinder-17f38.firebaseapp.com',
    projectId: 'petfinder-17f38',
    storageBucket: 'petfinder-17f38.firebasestorage.app',
    messagingSenderId: '72075250503',
    appId: '1:72075250503:web:b285034cc0d039790ada62',
    measurementId: 'G-QCRJZD4NN0'
  }),

  // --- Tìm địa chỉ → tọa độ trên bản đồ (OpenStreetMap Nominatim, không cần khóa) ---
  geocoding: Object.freeze({
    endpoint: 'https://nominatim.openstreetmap.org/search',
    countryCode: 'vn',
    limit: 5
  }),

  // --- Trợ lý AI chạy LOCAL (Ollama) ---
  // Không dùng API đám mây: nội dung chat chỉ đi tới Ollama trên chính máy của bạn (localhost), không gửi ra ngoài.
  // Cài đặt: 1) cài Ollama (https://ollama.com)  2) chạy: ollama pull qwen2.5:3b
  //          3) cho phép trang web gọi Ollama: đặt biến môi trường OLLAMA_ORIGINS (vd: http://localhost:8123) rồi khởi động lại Ollama.
  // Ollama không chạy / không kết nối được = khung chat tự chuyển sang chế độ "trả lời nhanh" (bộ kiến thức có sẵn).
  // Đặt enabled:false để tắt hẳn AI.
  // Firebase App Check (chống lạm dụng API từ ngoài web): tạo khóa reCAPTCHA v3 trong Firebase Console → App Check, dán "site key" vào đây.
  // Để trống = chưa bật. Khi đã dán khóa, vào Console → App Check → Firestore → Enforce để chặn mọi truy cập không đến từ web của bạn.
  appCheck: Object.freeze({ siteKey: '' }),
  ai: Object.freeze({
    enabled: true,
    endpoint: 'http://localhost:11434/api/chat',          // địa chỉ Ollama (chỉ chấp nhận localhost / 127.0.0.1)
    model: 'qwen2.5:3b'                                   // đổi theo model bạn đã tải (vd: llama3.2:3b, gemma2:2b)
  }),

  // --- Cộng đồng Facebook ---
  community: Object.freeze({
    facebookGroup: 'https://www.facebook.com/share/g/1Db11cVRdx/'
  })
});
