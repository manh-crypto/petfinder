// ===== API / Storage Layer: Firestore (js/db.js) + localStorage cho dữ liệu riêng của trình duyệt (yêu thích, khu vực) =====
// Dữ liệu từ Firestore được làm sạch khi nhận về (PFSec.sanitize*). Cần PFSec (js/security.js) và PFDB (js/db.js) nạp trước khi gọi.

// ========== PETS (Firestore) ==========
// Dữ liệu thật nằm trên Firestore (xem js/db.js). loadPets() đọc bản sao trong bộ nhớ, savePets() tự đẩy phần thay đổi lên máy chủ.
function loadPets() { return PFDB.state.pets; }
function savePets(arr, opts) { return PFDB.write('pets', arr, opts); }

// ========== FAVORITES ==========
function loadFavs() {
  const raw = PFSec.readJSON('pf_favs', []);
  return (Array.isArray(raw) ? raw : []).map(PFSec.safeId).filter(Boolean);
}
function saveFavs(arr) { return PFSec.writeJSON('pf_favs', arr); }

// ========== USERS (Firestore) ==========
// Admin thấy mọi người dùng; người dùng thường chỉ thấy hồ sơ của chính mình (do luật Firestore quy định).
function loadUsers() { return PFDB.state.users; }
function saveUsers(arr) { return PFDB.write('users', arr); }

// ========== SESSION ==========
// Phiên do Firebase Authentication quản lý (tự lưu, tự làm mới, mật khẩu không bao giờ nằm trong trình duyệt hay cơ sở dữ liệu).
function loadSession() {
  const me = PFDB.me();
  if (!me || me.banned) return null;
  return me;
}
function saveSession() { /* Firebase Auth tự lưu phiên */ }
function touchSession() { /* Firebase Auth tự gia hạn phiên */ }

// ========== ADMIN: NEWS (Firestore) ==========
function loadNews() { return PFDB.state.news; }
function saveNews(arr) { return PFDB.write('news', arr); }
