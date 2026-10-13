// ===== Liên hệ chúng tôi: gửi yêu cầu / góp ý / báo lỗi / đánh giá + quản lý phía admin =====
// Dữ liệu lưu trên Firestore (collection feedback): admin xem tất cả, người gửi xem yêu cầu của mình, đánh giá công khai ai cũng xem.

// >>> Đổi thành thông tin liên hệ thật của nhóm <<<
const CONTACT_INFO = {
  email: 'petfinder254@gmail.com'
};

const FB_KEY = 'pf_feedback';
const FB_TYPES = {
  support:  { label: 'Cần hỗ trợ', icon: '🛠️', hint: 'Bạn gặp khó khi sử dụng và cần được hướng dẫn.' },
  feedback: { label: 'Góp ý',      icon: '💡', hint: 'Ý tưởng hoặc đề xuất để PetFinder tốt hơn.' },
  bug:      { label: 'Báo lỗi',    icon: '🐞', hint: 'Mô tả lỗi bạn gặp: trang nào, làm gì, thấy gì.' },
  review:   { label: 'Đánh giá',   icon: '⭐', hint: 'Cho chúng tôi biết trải nghiệm của bạn.' },
  partner:  { label: 'Hợp tác',    icon: '🤝', hint: 'Phòng khám, shelter, cửa hàng muốn đồng hành cùng PetFinder.' }
};
const FB_STATUS = { new: 'Mới', processing: 'Đang xử lý', done: 'Đã xử lý' };

function loadFeedback() { return PFDB.state.feedback; }
function saveFeedback(arr) { return PFDB.write('feedback', arr); }

function fbEsc(s) { return (typeof escapeHtml === 'function') ? escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function fbStars(n) { n = Math.max(0, Math.min(5, Math.round(n || 0))); return '★'.repeat(n) + '☆'.repeat(5 - n); }
function fbDate(ts) { const d = new Date(ts); return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); }
function fbTicket() { return 'PF-' + Date.now().toString(36).toUpperCase().slice(-5) + Math.floor(Math.random() * 90 + 10); }
function fbAvg(list) { const r = list.filter(f => f.rating > 0); return r.length ? r.reduce((s, f) => s + f.rating, 0) / r.length : 0; }

// ===================== TRANG LIÊN HỆ =====================
const contactState = { type: 'support', rating: 0 };

function initContactPage() {
  const root = document.getElementById('contactPage');
  if (!root) return;

  const ctMail = document.getElementById('ctInfoEmail');
  if (ctMail) { ctMail.textContent = CONTACT_INFO.email; ctMail.href = 'mailto:' + CONTACT_INFO.email; }

  document.getElementById('ctTypes').innerHTML = Object.keys(FB_TYPES).map(k =>
    `<button type="button" class="ct-type${k === contactState.type ? ' active' : ''}" data-type="${k}" onclick="setContactType('${k}')">${FB_TYPES[k].icon} ${FB_TYPES[k].label}</button>`).join('');
  document.getElementById('ctStars').innerHTML = [1, 2, 3, 4, 5].map(n =>
    `<button type="button" class="ct-star" data-n="${n}" aria-label="${n} sao" onclick="setContactRating(${n})">★</button>`).join('');
  setContactType(contactState.type);
  prefillContactForm();
  renderContactReviews();
  renderMyRequests();
}

function prefillContactForm() {
  const u = (typeof currentUser !== 'undefined') ? currentUser : null;
  const n = document.getElementById('ctName'), e = document.getElementById('ctEmail');
  if (u && n && !n.value) n.value = u.name || '';
  if (u && e && !e.value) e.value = (u.email && !/\.(local|demo)$/.test(u.email)) ? u.email : '';
}

function setContactType(k) {
  contactState.type = k;
  document.querySelectorAll('.ct-type').forEach(b => b.classList.toggle('active', b.dataset.type === k));
  document.getElementById('ctTypeHint').textContent = FB_TYPES[k].hint;
  const isReview = k === 'review';
  document.getElementById('ctRatingRow').style.display = isReview ? 'block' : 'none';
  document.getElementById('ctPublicRow').style.display = isReview ? 'flex' : 'none';
  document.getElementById('ctMessage').placeholder = isReview ? 'Bạn thấy PetFinder thế nào? Điều gì làm bạn hài lòng, điều gì cần cải thiện?' :
    k === 'bug' ? 'VD: Ở trang Bản đồ, khi bấm vào marker thì ...' : 'Nhập nội dung bạn muốn gửi cho chúng tôi...';
  if (!isReview) setContactRating(0);
}

function setContactRating(n) {
  contactState.rating = n;
  document.querySelectorAll('.ct-star').forEach(s => s.classList.toggle('on', Number(s.dataset.n) <= n));
  const lbl = ['', 'Rất tệ', 'Chưa tốt', 'Tạm được', 'Tốt', 'Tuyệt vời'][n] || '';
  const el = document.getElementById('ctStarLabel'); if (el) el.textContent = lbl;
}

function contactError(msg) { const e = document.getElementById('ctError'); e.textContent = msg; e.style.display = msg ? 'block' : 'none'; }

function submitContactForm() {
  contactError('');
  if (document.getElementById('ctWebsite').value) return; // honeypot chống bot
  const last = Number(sessionStorage.getItem('pf_fb_last') || 0);
  if (Date.now() - last < 15000) { contactError('⏳ Bạn vừa gửi yêu cầu. Vui lòng đợi vài giây rồi thử lại.'); return; }

  const name = document.getElementById('ctName').value.trim();
  const email = document.getElementById('ctEmail').value.trim();
  const message = document.getElementById('ctMessage').value.trim();
  const type = contactState.type, rating = type === 'review' ? contactState.rating : 0;
  if (name.length < 2) { contactError('Vui lòng nhập họ tên (ít nhất 2 ký tự).'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { contactError('Email chưa hợp lệ, chúng tôi cần email để phản hồi bạn.'); return; }
  if (type === 'review' && !rating) { contactError('Vui lòng chọn số sao đánh giá.'); return; }
  if (message.length < 10) { contactError('Nội dung quá ngắn, vui lòng mô tả chi tiết hơn (ít nhất 10 ký tự).'); return; }
  if (message.length > 2000) { contactError('Nội dung tối đa 2000 ký tự.'); return; }

  const u = (typeof currentUser !== 'undefined') ? currentUser : null;
  const entry = {
    id: fbTicket(), createdAt: Date.now(), name, email, type, rating, message,
    public: type === 'review' && document.getElementById('ctPublic').checked,
    status: 'new', reply: '', repliedAt: null, userEmail: u ? u.email : '', ownerUid: u ? u.uid : ''
  };
  const arr = loadFeedback(); arr.unshift(entry); saveFeedback(arr);
  sessionStorage.setItem('pf_fb_last', String(Date.now()));

  document.getElementById('ctFormWrap').style.display = 'none';
  const ok = document.getElementById('ctSuccess');
  ok.style.display = 'block';
  document.getElementById('ctTicket').textContent = entry.id;
  document.getElementById('ctSuccessText').textContent = type === 'review' ? 'Cảm ơn bạn đã đánh giá PetFinder!' : 'Chúng tôi đã nhận được yêu cầu của bạn.';
  renderContactReviews(); renderMyRequests();
}

function resetContactForm() {
  document.getElementById('ctSuccess').style.display = 'none';
  document.getElementById('ctFormWrap').style.display = 'block';
  document.getElementById('ctMessage').value = '';
  document.getElementById('ctPublic').checked = false;
  setContactRating(0); contactError('');
}

function renderContactReviews() {
  const box = document.getElementById('ctReviews'); if (!box) return;
  const pub = loadFeedback().filter(f => f.type === 'review' && f.public && f.rating > 0);
  const sum = document.getElementById('ctReviewSummary');
  if (!pub.length) {
    sum.innerHTML = '';
    box.innerHTML = '<div class="ct-empty">Chưa có đánh giá công khai nào. Hãy là người đầu tiên chia sẻ trải nghiệm của bạn! 🐾</div>';
    return;
  }
  const avg = fbAvg(pub);
  const dist = [5, 4, 3, 2, 1].map(n => ({ n, c: pub.filter(f => f.rating === n).length }));
  sum.innerHTML = `<div class="ct-avg"><div class="ct-avg-num">${avg.toFixed(1)}</div><div class="ct-avg-stars">${fbStars(avg)}</div><div class="ct-avg-count">${pub.length} đánh giá</div></div>
    <div class="ct-dist">${dist.map(d => `<div class="ct-dist-row"><span>${d.n}★</span><div class="ct-dist-bar"><i style="width:${d.c / pub.length * 100}%"></i></div><span>${d.c}</span></div>`).join('')}</div>`;
  box.innerHTML = pub.slice(0, 6).map(f => `<div class="ct-review"><div class="ct-review-head"><b>${fbEsc(f.name)}</b><span class="ct-rstars">${fbStars(f.rating)}</span></div><p>${fbEsc(f.message)}</p><small>${new Date(f.createdAt).toLocaleDateString('vi-VN')}</small></div>`).join('');
}

function renderMyRequests() {
  const box = document.getElementById('ctMine'); if (!box) return;
  const u = (typeof currentUser !== 'undefined') ? currentUser : null;
  if (!u) { box.innerHTML = '<div class="ct-empty">Đăng nhập để theo dõi trạng thái và phản hồi cho các yêu cầu bạn đã gửi.</div>'; return; }
  const mine = loadFeedback().filter(f => f.ownerUid === u.uid);
  if (!mine.length) { box.innerHTML = '<div class="ct-empty">Bạn chưa gửi yêu cầu nào.</div>'; return; }
  box.innerHTML = mine.map(f => `<div class="ct-mine-item">
      <div class="ct-mine-head"><span class="cat-chip">${FB_TYPES[f.type].icon} ${FB_TYPES[f.type].label}</span><b>${fbEsc(f.id)}</b><span class="ct-status st-${f.status}">${FB_STATUS[f.status]}</span><small>${fbDate(f.createdAt)}</small></div>
      <p>${fbEsc(f.message)}</p>
      ${f.reply ? `<div class="ct-reply"><b>Phản hồi từ PetFinder:</b><p>${fbEsc(f.reply)}</p></div>` : '<div class="ct-wait">Chúng tôi chưa phản hồi yêu cầu này.</div>'}
    </div>`).join('');
}

// ===================== ADMIN: GÓP Ý & LIÊN HỆ =====================
const fbAdmin = { type: '', status: '', q: '' };

function setFbAdmin(k, v) { fbAdmin[k] = v; renderFeedbackAdmin(); }
let fbSearchTimer = null;
function fbSearchInput(v) { clearTimeout(fbSearchTimer); fbSearchTimer = setTimeout(() => { fbAdmin.q = v; renderFeedbackAdmin(); const el = document.getElementById('fbSearch'); if (el) { el.focus(); el.setSelectionRange(v.length, v.length); } }, 250); }

function updateFeedbackBadge() {
  const n = loadFeedback().filter(f => f.status === 'new').length;
  document.querySelectorAll('.fb-nav-badge').forEach(b => { b.textContent = n; b.style.display = n ? 'inline-block' : 'none'; });
}

function renderFeedbackAdmin() {
  const root = document.getElementById('fbRoot'); if (!root) return;
  if (!isAdmin()) return;
  const all = loadFeedback();
  const list = all.filter(f => (!fbAdmin.type || f.type === fbAdmin.type) && (!fbAdmin.status || f.status === fbAdmin.status) &&
    (!fbAdmin.q || (f.message + ' ' + f.name + ' ' + f.email + ' ' + f.id).toLowerCase().includes(fbAdmin.q.toLowerCase())));
  const cnt = s => all.filter(f => f.status === s).length;
  const avg = fbAvg(all.filter(f => f.type === 'review'));
  const opt = (v, cur, l) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${l}</option>`;
  const kpi = (cls, icon, label, value, sub) => `<div class="kpi-card ${cls}"><div class="kpi-icon">${icon}</div><div class="kpi-body"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div><div class="kpi-sub"><span class="kpi-delta flat">${sub}</span></div></div></div>`;

  root.innerHTML = `
    <div class="kpi-grid">
      ${kpi('k-blue', '📨', 'Tổng yêu cầu', all.length, 'tất cả loại')}
      ${kpi('k-red', '🆕', 'Chưa xử lý', cnt('new'), 'cần phản hồi')}
      ${kpi('k-teal', '⚙️', 'Đang xử lý', cnt('processing'), 'đang theo dõi')}
      ${kpi('k-green', '✅', 'Đã xử lý', cnt('done'), 'hoàn tất')}
      ${kpi('k-orange', '⭐', 'Điểm đánh giá TB', avg ? avg.toFixed(1) + ' / 5' : '—', all.filter(f => f.type === 'review').length + ' lượt đánh giá')}
    </div>
    <div class="admin-toolbar">
      <select onchange="setFbAdmin('type', this.value)">${opt('', fbAdmin.type, 'Tất cả loại')}${Object.keys(FB_TYPES).map(k => opt(k, fbAdmin.type, FB_TYPES[k].icon + ' ' + FB_TYPES[k].label)).join('')}</select>
      <select onchange="setFbAdmin('status', this.value)">${opt('', fbAdmin.status, 'Mọi trạng thái')}${Object.keys(FB_STATUS).map(k => opt(k, fbAdmin.status, FB_STATUS[k])).join('')}</select>
      <input type="text" id="fbSearch" placeholder="Tìm theo nội dung, tên, email, mã..." value="${fbEsc(fbAdmin.q)}" oninput="fbSearchInput(this.value)"/>
    </div>
    <div id="fbList">${list.length ? list.map(fbAdminCard).join('') : `<div class="dash-card"><div class="chart-empty">${all.length ? 'Không có yêu cầu phù hợp bộ lọc.' : 'Chưa có yêu cầu nào. Người dùng gửi từ trang <b>Liên hệ</b> sẽ hiện ở đây.'}</div></div>`}</div>`;
  updateFeedbackBadge();
}

function fbAdminCard(f) {
  const t = FB_TYPES[f.type] || FB_TYPES.feedback;
  return `<div class="fb-card" id="fb-${f.id}">
    <div class="fb-card-head">
      <span class="cat-chip" style="--c:#F5823A">${t.icon} ${t.label}</span>
      <b>${fbEsc(f.id)}</b>
      ${f.rating ? `<span class="ct-rstars">${fbStars(f.rating)}</span>` : ''}
      ${f.type === 'review' ? `<span class="pill ${f.public ? 'pill-ok' : 'pill-flagged'}">${f.public ? 'Công khai' : 'Riêng tư'}</span>` : ''}
      <span class="fb-time">${fbDate(f.createdAt)}</span>
    </div>
    <div class="fb-from"><b>${fbEsc(f.name)}</b> · <a href="mailto:${fbEsc(f.email)}">${fbEsc(f.email)}</a></div>
    <p class="fb-msg">${fbEsc(f.message)}</p>
    <textarea class="fb-reply-box" id="fbReply-${f.id}" rows="2" placeholder="Nhập phản hồi cho người dùng (họ sẽ thấy khi đăng nhập ở trang Liên hệ)...">${fbEsc(f.reply)}</textarea>
    <div class="fb-actions">
      <select onchange="setFbStatus('${f.id}', this.value)">${Object.keys(FB_STATUS).map(k => `<option value="${k}" ${k === f.status ? 'selected' : ''}>${FB_STATUS[k]}</option>`).join('')}</select>
      <button class="abtn abtn-promote" onclick="saveFbReply('${f.id}')">Lưu phản hồi</button>
      ${f.type === 'review' ? `<button class="abtn abtn-edit" onclick="toggleFbPublic('${f.id}')">${f.public ? 'Ẩn đánh giá' : 'Hiện công khai'}</button>` : ''}
      <button class="abtn abtn-delete" onclick="deleteFeedback('${f.id}')">Xóa</button>
    </div>
  </div>`;
}

function setFbStatus(id, status) { if (!requireAdmin('đổi trạng thái góp ý')) return; const a = loadFeedback(); const f = a.find(x => x.id === id); if (!f) return; f.status = status; saveFeedback(a); renderFeedbackAdmin(); }
function saveFbReply(id) { if (!requireAdmin('phản hồi góp ý')) return;
  const a = loadFeedback(); const f = a.find(x => x.id === id); if (!f) return;
  const txt = document.getElementById('fbReply-' + id).value.trim();
  f.reply = txt; f.repliedAt = txt ? Date.now() : null;
  if (txt && f.status === 'new') f.status = 'processing';
  saveFeedback(a); if (typeof showToast === 'function') showToast('Đã lưu phản hồi'); renderFeedbackAdmin();
}
function toggleFbPublic(id) { if (!requireAdmin('ẩn/hiện đánh giá')) return; const a = loadFeedback(); const f = a.find(x => x.id === id); if (!f) return; f.public = !f.public; saveFeedback(a); renderFeedbackAdmin(); }
function deleteFeedback(id) { if (!requireAdmin('xóa góp ý')) return; if (!confirm('Xóa yêu cầu này?')) return; saveFeedback(loadFeedback().filter(f => f.id !== id)); renderFeedbackAdmin(); }

// ---------- khởi động ----------
window.addEventListener('load', () => { (typeof PFDB !== 'undefined' ? PFDB.ready : Promise.resolve()).then(() => setTimeout(() => { initContactPage(); updateFeedbackBadge(); }, 80)); });
