// ===== Admin: bảng theo dõi bảo mật (nhật ký sự kiện + kiểm tra cấu hình) =====
const SEC_EVENT_LABELS = {
  login_success: ['✅', 'Đăng nhập thành công', 'ok'], login_failed: ['⚠️', 'Đăng nhập sai', 'warn'], login_locked: ['⛔', 'Bị khóa tạm do sai nhiều lần', 'bad'],
  login_blocked: ['⛔', 'Tài khoản bị khóa cố đăng nhập', 'bad'], logout: ['👋', 'Đăng xuất', 'info'], register: ['🆕', 'Đăng ký tài khoản', 'info'],
  social_login: ['🔗', 'Đăng nhập mạng xã hội', 'info'], social_rejected: ['🚫', 'Từ chối đăng nhập mạng xã hội', 'bad'],
  access_denied: ['🚫', 'Bị chặn truy cập trái phép', 'bad'], session_expired: ['⏱️', 'Phiên hết hạn', 'info'], session_rejected: ['🚫', 'Phiên không hợp lệ', 'warn'],
  admin_password_set: ['🔐', 'Thiết lập mật khẩu quản trị', 'info'], admin_default_password_revoked: ['🔐', 'Thu hồi mật khẩu admin mặc định', 'warn'],
  passwords_migrated: ['🔄', 'Di trú mật khẩu sang băm', 'info'], password_changed: ['🔑', 'Đổi mật khẩu', 'info'], password_change_failed: ['⚠️', 'Đổi mật khẩu thất bại', 'warn'],
  upload_rejected: ['🖼️', 'Từ chối tệp tải lên', 'warn'], storage_error: ['💾', 'Lỗi lưu dữ liệu', 'warn'], csv_export: ['⬇️', 'Xuất CSV', 'info'], framed: ['🪟', 'Trang bị nhúng khung', 'bad'],
  admin_role_change: ['👑', 'Đổi vai trò', 'info'], admin_ban: ['⛔', 'Khóa/mở khóa tài khoản', 'info'], admin_delete_user: ['🗑️', 'Xóa tài khoản', 'info'],
  admin_flag_pet: ['⚠️', 'Đánh dấu tin', 'info'], admin_delete_pet: ['🗑️', 'Xóa tin đăng', 'info'], admin_news: ['📰', 'Tin tức', 'info'], admin_news_delete: ['📰', 'Xóa tin tức', 'info'],
  pet_posted: ['📢', 'Đăng tin', 'info'], pet_edited: ['✏️', 'Sửa tin', 'info'], pet_deleted: ['🗑️', 'Xóa tin của mình', 'info']
};
const secState = { type: '', q: '' };
function setSecFilter(k, v) { secState[k] = v; renderSecurityAdmin(); }
let secSearchTimer = null;
function secSearchInput(v) { clearTimeout(secSearchTimer); secSearchTimer = setTimeout(() => { secState.q = v; renderSecurityAdmin(); const el = document.getElementById('secSearch'); if (el) { el.focus(); el.setSelectionRange(v.length, v.length); } }, 250); }

function secStorageKB() { let n = 0; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); n += (k.length + (localStorage.getItem(k) || '').length) * 2; } } catch (e) { } return Math.round(n / 1024); }

function securityChecks() {
  const users = loadUsers(), admins = users.filter(u => u.role === 'admin');
  const cfg = window.PETFINDER_CONFIG || {};
  const hasCsp = !!document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  const log = PFSec.getLog(), day = Date.now() - 864e5;
  const kb = secStorageKB();
  return [
    { ok: window.isSecureContext && location.protocol !== 'file:', title: 'Kết nối an toàn (HTTPS/localhost)', detail: location.protocol + '//' + location.host, fix: 'Chạy trang qua https:// (GitHub Pages) để băm mật khẩu và đăng nhập Google hoạt động an toàn.' },
    { ok: hasCsp, title: 'Content-Security-Policy đang bật', detail: hasCsp ? 'Có (thẻ meta). Script nội tuyến vẫn được phép vì ứng dụng dùng onclick.' : 'Không tìm thấy', fix: 'Thêm thẻ meta CSP (xem SECURITY.md).' },
    { ok: admins.length > 0, title: 'Có ít nhất một quản trị viên', detail: admins.length + ' quản trị viên (quyền do Firestore admins/{uid} quyết định)', fix: 'Tạo tài liệu admins/{uid} trong Firebase Console cho tài khoản của bạn (xem README).' },
    { ok: PFDB.ok, title: 'Cơ sở dữ liệu Firestore đang kết nối', detail: PFDB.ok ? 'Đang hoạt động · mật khẩu do Firebase Auth quản lý (không lưu trong DB)' : 'Chưa kết nối (' + PFDB.error + ')', fix: 'Kiểm tra cấu hình Firebase trong js/config.js, bật Firestore và đăng nhập Email/Password.' },
    { ok: !(cfg.ai && cfg.ai.endpoint) || /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(cfg.ai.endpoint), title: 'AI chạy local, không gửi dữ liệu ra ngoài', detail: cfg.ai && cfg.ai.enabled !== false && cfg.ai.endpoint ? 'Ollama: ' + cfg.ai.endpoint : 'AI đang tắt (trả lời nhanh)', fix: 'Chỉ dùng endpoint localhost (Ollama); không dán khóa API đám mây vào mã web.' },
    { ok: !!(cfg.firebase && cfg.firebase.apiKey), title: 'Đăng nhập Google (Firebase) đã cấu hình', detail: cfg.firebase ? cfg.firebase.projectId : '—', fix: 'Điền cấu hình Firebase và thêm Authorized domains.' },
    { ok: kb < 4000, title: 'Dung lượng localStorage (chỉ còn dữ liệu riêng của trình duyệt)', detail: kb + ' KB / ~5000 KB', fix: 'Xóa dữ liệu trang trong trình duyệt nếu quá đầy.' },
    { ok: log.filter(x => x.type === 'login_failed' && x.t > day).length < 10, title: 'Số lần đăng nhập sai trong 24 giờ', detail: log.filter(x => x.type === 'login_failed' && x.t > day).length + ' lần', fix: 'Nhiều lần sai bất thường có thể là dò mật khẩu.' }
  ];
}

function renderSecurityAdmin() {
  const root = document.getElementById('secRoot'); if (!root) return;
  if (!isAdmin()) return;
  const E = PFSec.esc;
  const checks = securityChecks();
  const log = PFSec.getLog();
  const day = Date.now() - 864e5;
  const filtered = log.filter(x => (!secState.type || x.type === secState.type) && (!secState.q || (x.actor + ' ' + x.detail + ' ' + x.type).toLowerCase().includes(secState.q.toLowerCase())));
  const bad24 = log.filter(x => x.t > day && SEC_EVENT_LABELS[x.type] && SEC_EVENT_LABELS[x.type][2] === 'bad').length;
  const failed24 = log.filter(x => x.t > day && x.type === 'login_failed').length;
  const passed = checks.filter(c => c.ok).length;
  const kpi = (cls, icon, label, value, sub) => `<div class="kpi-card ${cls}"><div class="kpi-icon">${icon}</div><div class="kpi-body"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div><div class="kpi-sub"><span class="kpi-delta flat">${sub}</span></div></div></div>`;
  const types = Object.keys(SEC_EVENT_LABELS);
  root.innerHTML = `
    <div class="kpi-grid">
      ${kpi(passed === checks.length ? 'k-green' : 'k-orange', '🛡️', 'Kiểm tra cấu hình', passed + ' / ' + checks.length, 'mục đạt yêu cầu')}
      ${kpi(bad24 ? 'k-red' : 'k-green', '🚨', 'Sự kiện đáng ngờ 24h', bad24, 'bị chặn / từ chối')}
      ${kpi(failed24 > 5 ? 'k-red' : 'k-teal', '🔑', 'Đăng nhập sai 24h', failed24, 'lần sai mật khẩu')}
      ${kpi('k-blue', '📜', 'Sự kiện đã ghi', log.length, 'tối đa 300 gần nhất')}
    </div>
    <div class="dash-card" style="margin-bottom:18px"><div class="dash-card-head"><h4>Kiểm tra cấu hình bảo mật</h4></div>
      ${checks.map(c => `<div class="sec-check ${c.ok ? 'ok' : 'bad'}"><span class="sec-ic">${c.ok ? '✅' : '⚠️'}</span><div><b>${E(c.title)}</b><small>${E(c.detail)}</small>${c.ok ? '' : `<em>${E(c.fix)}</em>`}</div></div>`).join('')}
    </div>
    <div class="admin-toolbar">
      <select onchange="setSecFilter('type', this.value)"><option value="">Mọi loại sự kiện</option>${types.map(k => `<option value="${k}" ${secState.type === k ? 'selected' : ''}>${SEC_EVENT_LABELS[k][0]} ${E(SEC_EVENT_LABELS[k][1])}</option>`).join('')}</select>
      <input type="text" id="secSearch" placeholder="Tìm theo tài khoản, nội dung..." value="${E(secState.q)}" oninput="secSearchInput(this.value)"/>
      <button class="abtn abtn-edit" onclick="exportSecurityLog()">Xuất CSV</button>
      <button class="abtn abtn-delete" onclick="clearSecurityLog()">Xóa nhật ký</button>
    </div>
    <div class="dash-card"><div class="dash-card-head"><h4>Nhật ký sự kiện <span class="count-pill">${filtered.length}</span></h4></div>
      <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Thời gian</th><th>Sự kiện</th><th>Tài khoản</th><th>Chi tiết</th></tr></thead><tbody>
      ${filtered.length ? filtered.slice(0, 200).map(x => { const m = SEC_EVENT_LABELS[x.type] || ['•', x.type, 'info']; return `<tr><td style="white-space:nowrap">${E(new Date(x.t).toLocaleString('vi-VN'))}</td><td><span class="pill sec-${m[2]}">${m[0]} ${E(m[1])}</span></td><td>${E(x.actor || '—')}</td><td>${E(x.detail)}</td></tr>`; }).join('') : '<tr class="admin-empty-row"><td colspan="4">Chưa có sự kiện nào.</td></tr>'}
      </tbody></table></div></div>`;
}
function exportSecurityLog() {
  if (!requireAdmin('xuất nhật ký bảo mật')) return;
  const rows = PFSec.getLog();
  const csv = '\ufeff' + ['Thời gian,Sự kiện,Tài khoản,Chi tiết'].concat(rows.map(x => [new Date(x.t).toISOString(), x.type, x.actor, x.detail].map(PFSec.csvCell).join(','))).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'petfinder-security-log.csv';
  document.body.appendChild(a); a.click(); a.remove();
}
function clearSecurityLog() {
  if (!requireAdmin('xóa nhật ký bảo mật')) return;
  if (!confirm('Xóa toàn bộ nhật ký bảo mật?')) return;
  PFSec.clearLog(); PFSec.log('log_cleared', 'nhật ký bị xóa bởi quản trị viên'); renderSecurityAdmin();
}
