// ===== Generic Utilities =====
// Nhãn trạng thái tin đăng (dùng ở thẻ thú cưng, Tin của tôi, Admin)
var statusLabelMap = { lost: 'Đang thất lạc', found: 'Đã tìm thấy', adopt: 'Chờ nhận nuôi' };
// Biểu tượng theo loại thú cưng (loại thú nhập tự do; không khớp từ khóa nào thì dùng 🐾)
var PET_ICON_RULES = [
  ['bò sát', '🦎'], ['chó', '🐶'], ['cún', '🐶'], ['dog', '🐶'], ['mèo', '🐱'], ['cat', '🐱'], ['thỏ', '🐰'], ['rabbit', '🐰'],
  ['hamster', '🐹'], ['chuột', '🐹'], ['sóc', '🐿️'], ['nhím', '🦔'], ['cáo', '🦊'], ['vẹt', '🦜'], ['chim', '🐦'], ['bồ câu', '🕊️'],
  ['cá', '🐟'], ['rùa', '🐢'], ['rắn', '🐍'], ['thằn lằn', '🦎'], ['tắc kè', '🦎'], ['kỳ nhông', '🦎'], ['ếch', '🐸'], ['nhện', '🕷️'],
  ['gà', '🐔'], ['vịt', '🦆'], ['ngan', '🦆'], ['ngỗng', '🪿'], ['heo', '🐷'], ['lợn', '🐷'], ['dê', '🐐'], ['cừu', '🐑'], ['bò', '🐮'],
  ['ngựa', '🐴'], ['chồn', '🦦'], ['khỉ', '🐒'], ['gấu', '🐻'], ['lười', '🦥']
];
function petIcon(type) {
  const t = String(type || '').toLowerCase().trim();
  for (let i = 0; i < PET_ICON_RULES.length; i++) {
    const k = PET_ICON_RULES[i][0];
    if (t === k || t.startsWith(k + ' ') || t.includes(' ' + k)) return PET_ICON_RULES[i][1];
  }
  return '🐾';
}
var typeIconMap = { 'chó': '🐶', 'mèo': '🐱', 'thỏ': '🐰', 'khác': '🐾' };   // giữ lại cho mã cũ

// ========== TOAST ==========
function showToast(msg, duration = 2800) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
function closeOnBackdrop(e, id) {
  if (e.target.id === id) closeModal(id);
}
function escapeHtml(str) { return PFSec.esc(str); }

function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getStars(rating) {
  const full = Math.round(rating);
  return '⭐'.repeat(full);
}

