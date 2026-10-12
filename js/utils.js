// ===== Generic Utilities =====
// Nhãn trạng thái tin đăng (dùng ở thẻ thú cưng, Tin của tôi, Admin)
var statusLabelMap = { lost: 'Đang thất lạc', found: 'Đã tìm thấy', adopt: 'Chờ nhận nuôi' };
// Biểu tượng theo loại thú cưng (dùng khi đăng tin)
var typeIconMap = { 'chó': '🐶', 'mèo': '🐱', 'thỏ': '🐰', 'khác': '🐾' };

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

