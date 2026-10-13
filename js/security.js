// ===== PetFinder security core =====
// Nạp ĐẦU TIÊN trên mọi trang. Ứng dụng này chạy hoàn toàn ở trình duyệt (localStorage), nên các biện pháp ở đây là
// "phòng thủ nhiều lớp" chống tấn công qua dữ liệu (XSS, dữ liệu bị sửa, tải tệp độc hại, dò mật khẩu...).
// Chúng KHÔNG thay thế được kiểm soát truy cập phía máy chủ – xem SECURITY.md.
(function (w) {
  'use strict';
  const PFSec = {};

  // ------------------------------------------------------------------ chuỗi / HTML
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
  PFSec.esc = s => String(s == null ? '' : s).replace(/[&<>"'`]/g, c => ESC[c]);
  // bỏ ký tự điều khiển, giới hạn độ dài (không đụng tới < > – việc đó do esc() lúc hiển thị)
  PFSec.cleanText = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g, '').trim().slice(0, max || 500);
  PFSec.safeId = s => /^[A-Za-z0-9_-]{1,64}$/.test(String(s == null ? '' : s)) ? String(s) : '';
  PFSec.newId = prefix => (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  PFSec.isEmail = s => /^[^\s@<>"'`]{1,64}@[^\s@<>"'`]{1,255}\.[^\s@<>"'`]{2,}$/.test(String(s || ''));
  PFSec.isPhone = s => /^[0-9+().\-\s/]{8,40}$/.test(String(s || ''));
  // chống CSV/Excel formula injection: ô bắt đầu bằng = + - @ sẽ được thêm dấu '
  PFSec.csvCell = v => { let s = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };

  // ------------------------------------------------------------------ URL / ảnh
  PFSec.safeUrl = (u, opts) => {
    try {
      const x = new URL(String(u == null ? '' : u).trim(), w.location.href);
      if (x.protocol === 'https:' || (x.protocol === 'http:' && !(opts && opts.httpsOnly))) return x.href;
    } catch (e) { /* ignore */ }
    return '';
  };
  const DATA_IMG = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+=*$/;
  const LOCAL_IMG = /^(?:\.\.?\/)*assets\/[\w./-]+\.(?:png|jpe?g|webp|gif|svg)$/i;
  const MAX_DATA_URL = 3 * 1024 * 1024;
  PFSec.safeImageSrc = u => {
    u = String(u == null ? '' : u).trim();
    if (!u) return '';
    if (u.startsWith('data:')) return (u.length <= MAX_DATA_URL * 2 && DATA_IMG.test(u)) ? u : '';
    if (LOCAL_IMG.test(u) && !u.includes('..\\')) return u;
    return PFSec.safeUrl(u);
  };

  // ------------------------------------------------------------------ làm sạch dữ liệu đọc từ localStorage (không tin dữ liệu lưu trữ)
  const PET_STATUS = ['lost', 'found', 'adopt'];
  const finite = (n, lo, hi) => { n = Number(n); return Number.isFinite(n) && n >= lo && n <= hi ? n : undefined; };
  PFSec.sanitizePet = p => {
    if (!p || typeof p !== 'object') return null;
    const t = PFSec.cleanText;
    const out = {
      id: PFSec.safeId(p.id) || PFSec.newId('pet'),
      name: t(p.name, 80), type: t(p.type, 30), breed: t(p.breed, 60), gender: t(p.gender, 20),
      status: PET_STATUS.includes(p.status) ? p.status : 'lost',
      icon: t(p.icon, 8) || '🐾', area: t(p.area, 80), location: t(p.location, 200), date: t(p.date, 32),
      desc: String(p.desc == null ? '' : p.desc).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, 1500),
      phone: t(p.phone, 40), zalo: t(p.zalo, 200),
      imageData: (Array.isArray(p.imageData) ? p.imageData : []).slice(0, 5).map(PFSec.safeImageSrc).filter(Boolean),
      ownerEmail: t(p.ownerEmail, 120), ownerName: t(p.ownerName, 80), ownerUid: t(p.ownerUid, 128),
      createdAt: finite(p.createdAt, 0, 8.64e15) || 0, flagged: p.flagged === true
    };
    const lat = finite(p.lat, -90, 90), lng = finite(p.lng, -180, 180);
    if (lat !== undefined && lng !== undefined) { out.lat = lat; out.lng = lng; }
    if (!out.name) return null;
    return out;
  };
  const PW_RECORD = r => (r && typeof r === 'object' && r.algo === 'PBKDF2-SHA256' && Number.isInteger(r.iter) && r.iter >= 10000 && r.iter <= 1000000 &&
    /^[A-Za-z0-9+/=]{8,64}$/.test(r.salt || '') && /^[A-Za-z0-9+/=]{16,128}$/.test(r.hash || '')) ? { algo: r.algo, iter: r.iter, salt: r.salt, hash: r.hash } : null;
  PFSec.sanitizeUser = u => {
    if (!u || typeof u !== 'object') return null;
    const t = PFSec.cleanText;
    const out = {
      name: t(u.name, 80) || 'Người dùng', avatar: t(u.avatar, 8) || '👤', avatarPhoto: PFSec.safeImageSrc(u.avatarPhoto),
      email: t(u.email, 120), phone: t(u.phone, 40), role: u.role === 'admin' ? 'admin' : 'user', banned: u.banned === true,
      area: t(u.area, 80), bio: t(u.bio, 300), uid: t(u.uid, 128), provider: ['google', 'facebook'].includes(u.provider) ? u.provider : (t(u.provider, 20) ? undefined : undefined)
    };
    if (!out.provider) delete out.provider;
    const rec = PW_RECORD(u.pwHash); if (rec) out.pwHash = rec;
    if (typeof u.pw === 'string' && u.pw) out.pw = u.pw.slice(0, 200);       // mật khẩu cũ dạng văn bản – chỉ để di trú, sẽ bị xóa ngay khi băm xong
    if (u.needsSetup === true) out.needsSetup = true;
    if (!out.email) return null;
    return out;
  };
  PFSec.sanitizeNews = n => {
    if (!n || typeof n !== 'object') return null;
    const t = PFSec.cleanText;
    const out = { id: PFSec.safeId(n.id) || PFSec.newId('news'), title: t(n.title, 160), icon: t(n.icon, 8) || '📰', date: t(n.date, 32), desc: String(n.desc == null ? '' : n.desc).slice(0, 4000).trim(), createdAt: finite(n.createdAt, 0, 8.64e15) || 0 };
    return out.title ? out : null;
  };

  // ------------------------------------------------------------------ localStorage an toàn
  PFSec.readJSON = (key, fallback) => { try { const v = JSON.parse(w.localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; } };
  PFSec.writeJSON = (key, value) => {
    try { w.localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) {
      PFSec.log('storage_error', key + ': ' + (e && e.name));
      if (typeof w.showToast === 'function') w.showToast('Không lưu được dữ liệu (bộ nhớ trình duyệt đã đầy). Hãy xóa bớt ảnh hoặc tin cũ.');
      return false;
    }
  };

  // ------------------------------------------------------------------ nhật ký bảo mật (A09)
  const LOG_KEY = 'pf_seclog', LOG_MAX = 300;
  PFSec.log = (type, detail, who) => {
    try {
      const arr = PFSec.readJSON(LOG_KEY, []);
      let actor = who;
      if (actor === undefined) { try { const s = PFSec.readJSON('pf_session', null); actor = s && s.email || ''; } catch (e) { actor = ''; } }
      arr.unshift({ t: Date.now(), type: PFSec.cleanText(type, 40), actor: PFSec.cleanText(actor, 120), detail: PFSec.cleanText(detail, 200) });
      w.localStorage.setItem(LOG_KEY, JSON.stringify(arr.slice(0, LOG_MAX)));
    } catch (e) { /* không để lỗi ghi log làm hỏng ứng dụng */ }
  };
  PFSec.getLog = () => PFSec.readJSON(LOG_KEY, []).filter(x => x && typeof x === 'object');
  PFSec.clearLog = () => { try { w.localStorage.removeItem(LOG_KEY); } catch (e) { } };

  // ------------------------------------------------------------------ mật khẩu: PBKDF2 + salt (A02/A07)
  const PBKDF2_ITER = 600000;                                  // khuyến nghị OWASP cho PBKDF2-HMAC-SHA256 (2023)
  PFSec.iterations = PBKDF2_ITER;
  const b64 = buf => btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  PFSec.cryptoOk = () => !!(w.crypto && w.crypto.subtle && w.crypto.getRandomValues);
  async function derive(password, saltBytes, iter) {
    const key = await w.crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    return w.crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: iter }, key, 256);
  }
  PFSec.hashPassword = async password => {
    if (!PFSec.cryptoOk()) throw new Error('Trình duyệt không hỗ trợ băm mật khẩu an toàn. Hãy mở trang qua https:// hoặc localhost.');
    const salt = w.crypto.getRandomValues(new Uint8Array(16));
    return { algo: 'PBKDF2-SHA256', iter: PBKDF2_ITER, salt: b64(salt), hash: b64(await derive(password, salt, PBKDF2_ITER)) };
  };
  const timingSafeEqual = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
  PFSec.verifyPassword = async (password, rec) => {
    rec = PW_RECORD(rec); if (!rec || !PFSec.cryptoOk()) return false;
    return timingSafeEqual(b64(await derive(password, unb64(rec.salt), rec.iter)), rec.hash);
  };
  // băm giả để thời gian phản hồi không tiết lộ tài khoản có tồn tại hay không
  let DUMMY = null;
  PFSec.fakeVerify = async password => { if (!PFSec.cryptoOk()) return; DUMMY = DUMMY || await PFSec.hashPassword('dummy-password-for-timing'); await PFSec.verifyPassword(password, DUMMY); };

  const COMMON = ['12345678', '123456789', '1234567890', 'password', 'password1', 'qwerty123', 'qwertyuiop', 'iloveyou', '11111111', '00000000', 'abc12345', 'matkhau123', 'admin123', 'admin1234', 'petfinder', 'petfinder123', 'letmein123'];
  // trả về mảng lỗi (rỗng = hợp lệ). level 'admin' yêu cầu chặt hơn
  PFSec.passwordIssues = (pw, ctx) => {
    pw = String(pw || ''); const issues = []; const admin = ctx && ctx.level === 'admin';
    const min = admin ? 10 : 8;
    if (pw.length < min) issues.push(`Mật khẩu phải có ít nhất ${min} ký tự.`);
    if (pw.length > 128) issues.push('Mật khẩu tối đa 128 ký tự.');
    if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) issues.push('Mật khẩu cần có cả chữ và số.');
    if (admin && !(/[a-z]/.test(pw) && /[A-Z]/.test(pw))) issues.push('Mật khẩu quản trị cần có cả chữ hoa và chữ thường.');
    if (COMMON.includes(pw.toLowerCase()) || /^(.)\1+$/.test(pw)) issues.push('Mật khẩu quá phổ biến, hãy chọn mật khẩu khác.');
    const local = String(ctx && ctx.email || '').split('@')[0].toLowerCase();
    if (local.length >= 4 && pw.toLowerCase().includes(local)) issues.push('Mật khẩu không nên chứa email của bạn.');
    return issues;
  };

  // ------------------------------------------------------------------ chống dò mật khẩu (A07)
  // Giới hạn tần suất kiểu cửa sổ trượt (sliding window): tối đa `max` lần trong `windowMs`. Độ phức tạp O(max) mỗi lần gọi.
  // Chỉ là lớp giảm lạm dụng ở trình duyệt; giới hạn thật cần App Check / máy chủ.
  // Liên kết liên hệ tùy chọn: Zalo hoặc Facebook (hoặc số điện thoại dùng cho Zalo). Trả về {ok, kind:'zalo'|'facebook'|'', url}
  const SOCIAL = { zalo: ['zalo.me'], facebook: ['facebook.com', 'fb.com', 'fb.me', 'm.me', 'messenger.com'] };
  PFSec.parseSocialLink = raw => {
    const v = String(raw == null ? '' : raw).trim();
    if (!v) return { ok: true, kind: '', url: '' };
    if (/^[0-9+().\-\s]{8,20}$/.test(v)) { const d = v.replace(/\D/g, ''); return d.length >= 8 && d.length <= 13 ? { ok: true, kind: 'zalo', url: 'https://zalo.me/' + d } : { ok: false, kind: '', url: '' }; }
    let u; try { u = new URL(/^[a-z]+:/i.test(v) ? v : 'https://' + v); } catch (e) { return { ok: false, kind: '', url: '' }; }
    if (u.protocol !== 'https:' || u.username || u.password) return { ok: false, kind: '', url: '' };
    const host = u.hostname.toLowerCase().replace(/^(www|m|web|mbasic)\./, '');
    for (const kind of Object.keys(SOCIAL)) if (SOCIAL[kind].some(h => host === h || host.endsWith('.' + h))) return { ok: true, kind, url: u.href.slice(0, 200) };
    return { ok: false, kind: '', url: '' };
  };
  const DISPOSABLE = new Set(['mailinator.com', 'guerrillamail.com', 'guerrillamail.net', '10minutemail.com', '10minutemail.net', 'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'yopmail.com', 'trashmail.com', 'getnada.com', 'sharklasers.com', 'dispostable.com', 'maildrop.cc', 'throwawaymail.com', 'fakeinbox.com', 'mailnesia.com', 'mohmal.com', 'emailondeck.com', 'tempail.com', 'burnermail.io', 'mintemail.com', 'spamgourmet.com', 'moakt.com']);
  PFSec.isDisposableEmail = e => DISPOSABLE.has(String(e || '').toLowerCase().split('@').pop());
  PFSec.rateLimit = (key, max, windowMs) => {
    const k = 'pf_rl_' + key, now = Date.now();
    let hits = PFSec.readJSON(k, []); hits = (Array.isArray(hits) ? hits : []).filter(x => Number.isFinite(x) && now - x < windowMs);
    if (hits.length >= max) { try { w.localStorage.setItem(k, JSON.stringify(hits)); } catch (e) { } return { ok: false, retryMs: windowMs - (now - hits[0]) }; }
    hits.push(now); try { w.localStorage.setItem(k, JSON.stringify(hits)); } catch (e) { }
    return { ok: true, retryMs: 0 };
  };
  const TH_KEY = 'pf_throttle', MAX_FAILS = 5;
  const thKey = id => PFSec.cleanText(String(id || '').toLowerCase(), 120);
  PFSec.throttle = {
    check(id) { const rec = PFSec.readJSON(TH_KEY, {})[thKey(id)]; const left = rec && rec.lockUntil ? rec.lockUntil - Date.now() : 0; return { locked: left > 0, remainingMs: Math.max(0, left) }; },
    fail(id) {
      const all = PFSec.readJSON(TH_KEY, {}); const k = thKey(id); const now = Date.now();
      const rec = all[k] && now - (all[k].last || 0) < 3600000 ? all[k] : { fails: 0 };
      rec.fails++; rec.last = now;
      if (rec.fails >= MAX_FAILS) rec.lockUntil = now + Math.min(15 * 60000, 30000 * Math.pow(2, rec.fails - MAX_FAILS));  // 30s, 1m, 2m ... tối đa 15 phút
      all[k] = rec;
      const keys = Object.keys(all); if (keys.length > 200) delete all[keys[0]];
      try { w.localStorage.setItem(TH_KEY, JSON.stringify(all)); } catch (e) { }
      return rec;
    },
    reset(id) { const all = PFSec.readJSON(TH_KEY, {}); delete all[thKey(id)]; try { w.localStorage.setItem(TH_KEY, JSON.stringify(all)); } catch (e) { } }
  };

  // ------------------------------------------------------------------ ảnh tải lên: kiểm tra loại thật + vẽ lại (xóa EXIF/GPS, mã độc nhúng)
  const MAGIC = [
    { type: 'image/jpeg', test: b => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF },
    { type: 'image/png', test: b => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 },
    { type: 'image/gif', test: b => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 },
    { type: 'image/webp', test: b => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 }
  ];
  const MAX_FILE = 8 * 1024 * 1024;
  PFSec.processImage = async (file, opts) => {
    opts = opts || {}; const maxDim = opts.maxDim || 1280, quality = opts.quality || 0.82, maxOut = opts.maxOutBytes || 900 * 1024;
    const fail = reason => { PFSec.log('upload_rejected', (file && file.name ? PFSec.cleanText(file.name, 60) : 'file') + ': ' + reason); throw new Error(reason); };
    if (!file || typeof file.size !== 'number') fail('Tệp không hợp lệ.');
    if (file.size > MAX_FILE) fail('Ảnh quá lớn (tối đa 8 MB).');
    if (file.size === 0) fail('Tệp rỗng.');
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (!MAGIC.some(m => m.test(head))) fail('Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF.');   // kiểm tra nội dung thật, không tin đuôi tệp/MIME (cũng loại SVG)
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Không đọc được ảnh.')); i.src = url; });
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const cw = Math.max(1, Math.round(img.naturalWidth * scale)), ch = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, ch); ctx.drawImage(img, 0, 0, cw, ch);
      let q = quality, out = canvas.toDataURL('image/jpeg', q);
      while (out.length * 0.75 > maxOut && q > 0.4) { q -= 0.1; out = canvas.toDataURL('image/jpeg', q); }
      if (!PFSec.safeImageSrc(out)) fail('Không xử lý được ảnh.');
      return out;
    } finally { URL.revokeObjectURL(url); }
  };

  // ------------------------------------------------------------------ chống nhúng trang vào iframe (clickjacking, lớp bổ trợ vì GitHub Pages không đặt được X-Frame-Options)
  try {
    if (w.top !== w.self) {
      PFSec.log('framed', 'page loaded inside a frame', '');
      document.documentElement.innerHTML = '<body style="font-family:sans-serif;padding:40px"><h2>Trang này không được hiển thị trong khung nhúng.</h2><p><a href="' + PFSec.esc(w.location.href) + '" target="_top" rel="noopener">Mở PetFinder ở tab riêng</a></p></body>';
    }
  } catch (e) { /* cross-origin top → coi như đang bị nhúng */ document.documentElement.innerHTML = ''; }

  w.PFSec = Object.freeze(PFSec);
  w.escapeHtml = PFSec.esc;           // một bản duy nhất cho toàn bộ ứng dụng
})(window);
