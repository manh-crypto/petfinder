// ===== Auth: Firebase Authentication =====
// Mật khẩu do Firebase quản lý (băm phía máy chủ Google); trang web không bao giờ lưu mật khẩu hay mã băm.
// Quyền admin do tài liệu admins/{uid} trên Firestore quyết định và được luật Firestore kiểm tra ở máy chủ (xem firestore.rules).

let currentUser = null;      // được gán sau khi Firebase xác định trạng thái đăng nhập (initApp gọi syncCurrentUser)
function syncCurrentUser() { currentUser = loadSession(); return currentUser; }

// Hiển thị avatar + tên ở thanh điều hướng bằng DOM API (không dùng innerHTML với dữ liệu người dùng)
function renderNavUser(user) {
  const av = document.getElementById('navAvatar'), nm = document.getElementById('navUsername');
  if (av) {
    av.textContent = '';
    const photo = PFSec.safeImageSrc(user.avatarPhoto);
    if (photo) { const img = document.createElement('img'); img.src = photo; img.alt = 'avatar'; img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%'; av.appendChild(img); }
    else av.textContent = user.avatar || '👤';
  }
  if (nm) {
    nm.textContent = user.name;
    if (user.role === 'admin') { const tag = document.createElement('span'); tag.className = 'admin-tag'; tag.textContent = 'ADMIN'; nm.appendChild(tag); }
  }
}

function openAuthModal(type) {
  document.getElementById(type + 'Modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function switchAuth(type) {
  closeModal(type === 'login' ? 'registerModal' : 'loginModal');
  setTimeout(() => openAuthModal(type), 120);
}
function togglePw(id, btn) {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁️' : '🙈';
}
function checkPwStrength(v) {
  const bar = document.getElementById('pwBar');
  const hint = document.getElementById('pwHint');
  let score = 0;
  if (v.length >= 8) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  const colors = ['#E24B4A','#F5823A','#EFC94C','#3DAB6E'];
  const labels = ['Rất yếu','Yếu','Trung bình','Mạnh'];
  bar.style.width = (score * 25) + '%';
  bar.style.background = colors[score - 1] || '#E2E8F0';
  hint.textContent = score > 0 ? 'Độ mạnh: ' + (labels[score - 1] || '') : 'Nhập mật khẩu để kiểm tra độ mạnh';
  hint.style.color = colors[score - 1] || 'var(--text-muted)';
}
// ========== SOCIAL LOGIN (Google qua Firebase Authentication) ==========
// Cấu hình nằm ở js/config.js (PETFINDER_CONFIG). Nút của nhà cung cấp chưa cấu hình sẽ tự ẩn.
function pfConfig() { return window.PETFINDER_CONFIG || {}; }
function isFirebaseConfigured() {
  const f = pfConfig().firebase;
  return !!(f && ['apiKey', 'authDomain', 'projectId', 'appId'].every(k => f[k]));
}

function getSocialAuthError(error) {
  const messages = {
    'auth/account-exists-with-different-credential': 'Email này đã được đăng ký bằng phương thức khác.',
    'auth/popup-blocked': 'Trình duyệt đã chặn cửa sổ đăng nhập. Hãy cho phép popup và thử lại.',
    'auth/popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập trước khi hoàn tất.',
    'auth/cancelled-popup-request': 'Yêu cầu đăng nhập trước đã bị hủy.',
    'auth/configuration-not-found': 'Firebase Authentication chưa được bật cho dự án này.',
    'auth/operation-not-allowed': 'Phương thức đăng nhập này chưa được bật trong Firebase Console.',
    'auth/unauthorized-domain': 'Tên miền này chưa được thêm vào Authorized domains của Firebase.',
    'auth/network-request-failed': 'Lỗi mạng. Vui lòng kiểm tra kết nối rồi thử lại.'
  };
  return messages[error && error.code] || (error && error.message) || 'Không thể đăng nhập. Vui lòng thử lại.';
}

// Tạo hồ sơ (nếu chưa có) trên Firestore rồi trả về hồ sơ. KHÔNG bao giờ nhận role từ nhà cung cấp: role luôn do admins/{uid} quyết định.
async function completeSocialLogin(input) {
  const t = PFSec.cleanText;
  const provider = input.provider === 'google' ? 'google' : '';
  const email = t(input.email, 120).toLowerCase();
  const uid = t(input.uid, 128);
  if (!provider || !uid || !PFSec.isEmail(email)) { PFSec.log('social_rejected', 'hồ sơ không hợp lệ', ''); throw new Error('Hồ sơ đăng nhập không hợp lệ (cần có email).'); }
  await PFDB.upsertProfile({ uid, provider, email, name: t(input.name, 80) || 'Người dùng', phone: '', avatar: '👤', avatarPhoto: PFSec.safeImageSrc(input.avatarPhoto) });
  const me = await PFDB.whenMe();
  if (!me) throw new Error('Không tải được hồ sơ tài khoản. Vui lòng thử lại.');
  if (me.banned) { await PFDB.auth().signOut(); PFSec.log('login_blocked', 'tài khoản bị khóa (social)', email); throw new Error('Tài khoản này đã bị quản trị viên khóa.'); }
  PFSec.log('social_login', provider, email);
  return me;
}

async function socialLogin(provider, button) {
  const p = String(provider || '').toLowerCase();
  const original = button ? button.innerHTML : '';
  if (button) { button.disabled = true; button.textContent = 'Đang kết nối...'; }
  try {
    if (!window.PetFinderSocialAuth || !isFirebaseConfigured()) throw new Error('Đăng nhập chưa được cấu hình. Hãy điền Firebase trong js/config.js.');
    if (p !== 'google') throw new Error('Nhà cung cấp đăng nhập không được hỗ trợ.');
    await PFDB.ready;
    const profile = await window.PetFinderSocialAuth.signIn(p);
    const user = await completeSocialLogin(profile);
    ['loginModal', 'registerModal'].forEach(id => { if (document.getElementById(id)) closeModal(id); });
    loginSuccess(user);
  } catch (error) {
    console.error('Social authentication failed:', error);
    showToast('' + getSocialAuthError(error), 5000);
  } finally {
    if (button) { button.disabled = false; button.innerHTML = original; }
  }
}

// Khởi động: ẩn nút của nhà cung cấp chưa cấu hình
function initSocialProviders() {
  document.querySelectorAll('.auth-social-btn[data-provider="Google"]').forEach(b => { b.style.display = isFirebaseConfigured() ? '' : 'none'; });
}
window.addEventListener('load', () => setTimeout(initSocialProviders, 30));

function showAuthError(id, msg) { const e = document.getElementById(id); e.textContent = msg; e.style.display = 'block'; }
function stripSecrets(u) { const { pw, pwHash, needsSetup, ...pub } = u; return pub; }

const AUTH_ERRORS = {
  'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.', 'auth/wrong-password': 'Email hoặc mật khẩu không đúng.',
  'auth/user-not-found': 'Email hoặc mật khẩu không đúng.', 'auth/invalid-email': 'Địa chỉ email không hợp lệ.',
  'auth/user-disabled': 'Tài khoản này đã bị vô hiệu hóa.', 'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng đợi một lúc rồi thử lại, hoặc dùng "Quên mật khẩu".',
  'auth/network-request-failed': 'Lỗi mạng. Vui lòng kiểm tra kết nối rồi thử lại.', 'auth/email-already-in-use': 'Email này đã được đăng ký.',
  'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự; nên dùng 8 ký tự gồm chữ và số).',
  'auth/operation-not-allowed': 'Chưa bật đăng nhập Email/Mật khẩu trong Firebase Console (Authentication → Sign-in method).'
};
const authErr = e => AUTH_ERRORS[e && e.code] || ('' + ((e && e.message) || 'Có lỗi xảy ra, vui lòng thử lại.'));
function dbReadyOrError(id) {
  if (PFDB.ok) return true;
  showAuthError(id, 'Chưa kết nối được máy chủ dữ liệu. Kiểm tra mạng và cấu hình Firebase (js/config.js) rồi tải lại trang.');
  return false;
}

let loginBusy = false;
async function doLogin() {
  if (loginBusy) return;
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pw = document.getElementById('loginPw').value;
  document.getElementById('loginError').style.display = 'none';
  if (!email || !pw) return showAuthError('loginError', 'Vui lòng điền đầy đủ thông tin.');
  if (!PFSec.isEmail(email)) return showAuthError('loginError', 'Vui lòng nhập địa chỉ email đã đăng ký.');
  if (!dbReadyOrError('loginError')) return;
  loginBusy = true;
  try {
    const cred = await PFDB.auth().signInWithEmailAndPassword(email, pw);
    if (!cred.user.emailVerified) {                // email/mật khẩu: bắt buộc xác thực email trước khi dùng tài khoản
      let sent = true;
      try { await cred.user.sendEmailVerification(); } catch (e) { sent = false; }
      await PFDB.auth().signOut();
      PFSec.log('login_blocked', 'email chưa xác thực', email);
      return showAuthError('loginError', 'Email này chưa được xác thực. ' + (sent ? 'Chúng tôi vừa gửi lại thư xác thực, hãy bấm vào liên kết trong thư (kiểm tra cả thư rác) rồi đăng nhập lại.' : 'Hãy kiểm tra hộp thư (kể cả thư rác) để bấm vào liên kết xác thực, hoặc thử lại sau ít phút.'));
    }
    let me = await PFDB.whenMe(2500);
    if (!me) {                                   // tài khoản có trong Firebase Auth nhưng chưa có hồ sơ → tạo hồ sơ cơ bản
      await PFDB.upsertProfile({ uid: cred.user.uid, email, name: cred.user.displayName || email.split('@')[0], avatar: '👤' });
      me = await PFDB.whenMe();
    }
    if (!me) { await PFDB.auth().signOut(); return showAuthError('loginError', 'Không tải được hồ sơ tài khoản. Vui lòng thử lại.'); }
    if (me.banned) { await PFDB.auth().signOut(); PFSec.log('login_blocked', 'tài khoản bị khóa', email); return showAuthError('loginError', 'Tài khoản này đã bị quản trị viên khóa do có dấu hiệu vi phạm.'); }
    PFSec.log('login_success', me.role === 'admin' ? 'quản trị viên' : '', email);
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('loginSuccess').style.display = 'block';
    setTimeout(() => { closeModal('loginModal'); loginSuccess(me); document.getElementById('loginForm').style.display = 'flex'; document.getElementById('loginSuccess').style.display = 'none'; }, 1400);
  } catch (e) {
    PFSec.log('login_failed', (e && e.code) || 'lỗi', email);
    showAuthError('loginError', authErr(e));
  } finally { loginBusy = false; }
}

// Quên mật khẩu: Firebase gửi email đặt lại mật khẩu
async function forgotPassword() {
  const email = (document.getElementById('loginEmail').value || '').trim().toLowerCase();
  if (!PFSec.isEmail(email)) return showToast('ℹ️ Hãy nhập email của bạn vào ô Email, rồi bấm lại "Quên mật khẩu?".', 5000);
  if (!PFDB.ok) return showToast('Chưa kết nối được máy chủ.', 4000);
  try { await PFDB.auth().sendPasswordResetEmail(email); } catch (e) { if (e && e.code !== 'auth/user-not-found') return showToast(authErr(e), 5000); }
  showToast('Nếu email này đã đăng ký, bạn sẽ nhận được thư hướng dẫn đặt lại mật khẩu (kiểm tra cả thư rác).', 7000);
}

let registerBusy = false;
async function doRegister() {
  if (registerBusy) return;
  const t = PFSec.cleanText;
  const ho = t(document.getElementById('regHo').value, 40), ten = t(document.getElementById('regTen').value, 40);
  const area = t((document.getElementById('regCity') || {}).value || '', 80), email = t(document.getElementById('regEmail').value, 120).toLowerCase(), phone = t(document.getElementById('regPhone').value, 40);
  const pw = document.getElementById('regPw').value, pw2 = document.getElementById('regPw2').value;
  document.getElementById('regError').style.display = 'none';
  const E = m => showAuthError('regError', m);
  if (!ho || !ten || !email || !pw || !pw2) return E('Vui lòng điền đầy đủ các trường bắt buộc (*).');
  if (!PFSec.isEmail(email)) return E('Địa chỉ email không hợp lệ.');
  if (PFSec.isDisposableEmail(email)) return E('Vui lòng dùng email thật (không dùng email tạm thời).');
  if (phone && !PFSec.isPhone(phone)) return E('Số điện thoại không hợp lệ.');
  const issues = PFSec.passwordIssues(pw, { email });
  if (issues.length) return E('' + issues[0]);
  if (pw !== pw2) return E('Mật khẩu xác nhận không khớp.');
  const gd = document.getElementById('regGuardian');
  if (gd && !gd.checked) return E('Vui lòng xác nhận độ tuổi: từ 13 tuổi trở lên, hoặc có cha mẹ/người giám hộ đồng ý và giám sát.');
  if (!dbReadyOrError('regError')) return;
  registerBusy = true;
  try {
    const name = t(ho + ' ' + ten, 80);
    let cred;
    try { cred = await PFDB.auth().createUserWithEmailAndPassword(email, pw); }
    catch (e) {
      if (!e || e.code !== 'auth/email-already-in-use') throw e;
      // Email đã có trong Firebase Auth. Nếu hồ sơ đã bị quản trị viên xóa và mật khẩu đúng thì khôi phục hồ sơ, thay vì báo lỗi khó hiểu.
      try { cred = await PFDB.auth().signInWithEmailAndPassword(email, pw); } catch (e2) { return E('Email này đã có tài khoản. Hãy bấm "Đăng nhập" (hoặc "Quên mật khẩu" nếu bạn đã quên mật khẩu cũ).'); }
      const existing = await PFDB.whenMe(2500);
      if (existing) { await PFDB.auth().signOut(); return E('Email này đã được đăng ký. Hãy bấm "Đăng nhập".'); }
    }
    await PFDB.upsertProfile({ uid: cred.user.uid, email, name, phone, area, avatar: '👤' });          // vai trò luôn là 'user' (luật Firestore bắt buộc)
    try { await cred.user.updateProfile({ displayName: name }); } catch (e) { }
    let sent = true;
    try { await cred.user.sendEmailVerification(); } catch (e) { sent = false; }
    await PFDB.auth().signOut();                                   // chưa cho dùng tài khoản cho tới khi email được xác thực
    PFSec.log('register', 'tài khoản mới, chờ xác thực email', email);
    const form = document.getElementById('registerForm'), ok = document.getElementById('registerSuccess');
    if (ok) { ok.innerHTML = ''; const h = document.createElement('h3'); h.textContent = 'Kiểm tra email của bạn'; const p = document.createElement('p'); p.textContent = sent ? ('Chúng tôi đã gửi thư xác thực tới ' + email + '. Hãy bấm vào liên kết trong thư (kiểm tra cả thư rác) rồi quay lại đăng nhập.') : 'Tài khoản đã tạo nhưng chưa gửi được thư xác thực. Hãy thử đăng nhập để nhận lại thư.'; ok.append(h, p); }
    if (form) form.style.display = 'none';
    if (ok) ok.style.display = 'block';
    setTimeout(() => { closeModal('registerModal'); if (form) form.style.display = 'flex'; if (ok) ok.style.display = 'none'; openAuthModal('login'); }, 6000);
  } catch (e) { E(authErr(e)); } finally { registerBusy = false; }
}
function loginSuccess(user) {
  user = stripSecrets(user);                                   // currentUser không bao giờ chứa mật khẩu/hash
  currentUser = user;
  document.getElementById('navAuth').style.display = 'none';
  document.getElementById('navUser').style.display = 'flex';
  renderNavUser(user);
  document.getElementById('navAdminBtn').style.display = user.role === 'admin' ? 'inline-block' : 'none';
  updateFavButtons();
  showToast('Chào mừng ' + user.name + '!');
}
function logout(reason) {
  const who = currentUser && currentUser.email;
  if (window.PetFinderSocialAuth) {
    window.PetFinderSocialAuth.signOut().catch(error => console.warn('Firebase sign-out failed:', error));
  }
  currentUser = null;
  PFSec.log('logout', typeof reason === 'string' ? 'hết phiên' : '', who || '');
  document.getElementById('navAuth').style.display = 'flex';
  document.getElementById('navUser').style.display = 'none';
  document.getElementById('navAdminBtn').style.display = 'none';
  const postsPanel = document.getElementById('myPostsPanel');
  if (postsPanel) postsPanel.classList.remove('open');
  if (typeof closeAdminPanel === 'function') closeAdminPanel();
  updateFavButtons();
  showToast(typeof reason === 'string' ? reason : 'Đã đăng xuất');
}

function checkAuthBeforePost(e) {
  e.preventDefault();
  if (!currentUser) { showToast('Vui lòng đăng nhập để đăng tin!'); openAuthModal('login'); return; }
  if (typeof submitPost !== 'function') { showToast('ℹ️ Vui lòng đăng tin từ trang "Thú cưng".'); return; }
  submitPost();
}
// Quyền luôn được đọc lại từ kho người dùng (không tin currentUser trong bộ nhớ)
function isAdmin() {
  const s = loadSession();
  return !!(s && s.role === 'admin');
}
// Chặn thao tác quản trị nếu không phải admin (phòng thủ nhiều lớp; kiểm soát thật phải ở máy chủ)
function requireAdmin(action) {
  if (isAdmin()) return true;
  PFSec.log('access_denied', action || 'thao tác quản trị');
  showToast('Bạn không có quyền thực hiện thao tác này.');
  return false;
}
// Chủ tin = người có uid trùng ownerUid của tin (luật Firestore kiểm tra y hệt ở máy chủ)
function isMyPet(pet) { return !!(currentUser && pet && pet.ownerUid && pet.ownerUid === currentUser.uid); }
// Chỉ chủ tin hoặc admin được sửa/xóa tin
function canModifyPet(pet) {
  if (!pet || !currentUser) return false;
  return isAdmin() || isMyPet(pet);
}

// Theo dõi trạng thái đăng nhập: tự đăng xuất khi bị khóa / đăng xuất ở tab khác; tải lại khi quyền thay đổi
(function authWatchdog() {
  PFDB.ready.then(() => {
    const m = PFDB.me(); if (m && m.banned && PFDB.auth()) PFDB.auth().signOut().catch(() => { });
    window.addEventListener('pf:auth', () => {
      const now = loadSession();
      if (!currentUser) return;
      if (!now) logout('⏱️ Phiên đăng nhập đã kết thúc hoặc tài khoản không còn hiệu lực. Vui lòng đăng nhập lại.');
      else if (now.role !== currentUser.role) window.location.reload();
    });
  });
})();

// ========== AUTH UI: bố cục rộng + cảnh thú cưng chạy nhảy ==========
const AUTH_SCENE_COPY = {
  loginModal:    { title: 'Chào mừng bạn trở lại! 🐾', text: 'Đăng nhập để đăng tin, theo dõi bản đồ và cùng cộng đồng đưa các bé về nhà.' },
  registerModal: { title: 'Gia nhập cộng đồng yêu thú cưng 🏡', text: 'Tạo tài khoản miễn phí để đăng tin thất lạc, tìm chủ mới cho bé và liên hệ người đăng tin.' }
};

function buildAuthScene(modalId) {
  const copy = AUTH_SCENE_COPY[modalId] || AUTH_SCENE_COPY.loginModal;
  const scene = document.createElement('div');
  scene.className = 'auth-scene';
  scene.setAttribute('aria-hidden', 'true');
  scene.innerHTML = `
    <div class="sun"></div>
    <div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>
    <div class="scene-copy">
      <h3>${copy.title}</h3>
      <p>${copy.text}</p>
      <div class="scene-chips"><span>Đăng tin nhanh</span><span>Xem trên bản đồ</span><span>Thú y 24/7</span></div>
    </div>
    <div class="scene-hills"></div>
    <div class="fence"></div>
    <div class="scene-ground"></div>
    <div class="paw-trail">🐾🐾🐾🐾🐾🐾🐾🐾🐾🐾🐾🐾</div>
    <div class="ball">🎾</div>
    <div class="scene-pets">
      <div class="sp rabbit"><span class="in"><span class="flip">🐇</span></span></div>
      <div class="sp cat"><span class="in"><span class="flip">🐈</span></span></div>
      <div class="sp dog"><span class="in"><span class="flip">🐕</span></span></div>
    </div>`;
  return scene;
}

function enhanceAuthModals() {
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    if (ov.id !== 'loginModal' && ov.id !== 'registerModal') return;
    const modal = ov.querySelector('.auth-modal');
    if (!modal || modal.classList.contains('auth-wide')) return;
    const main = document.createElement('div');
    main.className = 'auth-main';
    while (modal.firstChild) main.appendChild(modal.firstChild);
    modal.appendChild(buildAuthScene(ov.id));
    modal.appendChild(main);
    modal.classList.add('auth-wide');
    // nút đóng nằm trực tiếp trong modal để luôn ở góc phải
    const close = main.querySelector('.modal-close');
    if (close) modal.appendChild(close);
  });
}
enhanceAuthModals();
document.addEventListener('DOMContentLoaded', enhanceAuthModals);

// Trang login.html / register.html: tự mở hộp tương ứng
function autoOpenAuthPage() {
  const path = window.location.pathname.replace(/\\/g, '/');
  const which = path.endsWith('/login.html') ? 'login' : path.endsWith('/register.html') ? 'register' : '';
  if (!which || currentUser) return;
  document.body.classList.add('auth-page');
  openAuthModal(which);
}
window.addEventListener('load', () => PFDB.ready.then(() => { syncCurrentUser(); setTimeout(autoOpenAuthPage, 60); }));

// ===== Hiệu ứng nâng cấp cho đăng nhập / đăng ký =====
(function PFAuthFx() {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = id => document.getElementById(id);
  const authIds = ['loginModal', 'registerModal'];

  // 1) Chuyển qua lại: trượt ngang, đóng mượt
  const baseClose = window.closeModal;
  window.closeModal = function (id) {
    const el = $(id);
    if (!el || !authIds.includes(id) || !el.classList.contains('open') || reduce) return baseClose(id);
    el.classList.add('fx-closing');
    setTimeout(() => { el.classList.remove('fx-closing'); baseClose(id); }, 220);
  };
  window.switchAuth = function (type) {
    const from = $(type === 'login' ? 'registerModal' : 'loginModal'), to = $(type + 'Modal');
    if (!from || !to) return;
    const dir = type === 'register' ? 'left' : 'right';
    if (reduce || !from.classList.contains('open')) { baseClose(from.id); openAuthModal(type); return; }
    from.classList.add('fx-out-' + dir);
    setTimeout(() => {
      from.classList.remove('open', 'fx-out-' + dir);
      to.classList.add('fx-in-' + dir); openAuthModal(type);
      setTimeout(() => to.classList.remove('fx-in-' + dir), 560);
    }, 250);
  };

  // 2) Nút: vòng quay khi xử lý + gợn sóng; ô sai: viền đỏ
  const forms = { doLogin: ['loginModal', 'loginError'], doRegister: ['registerModal', 'regError'] };
  Object.keys(forms).forEach(fn => {
    const orig = window[fn]; if (typeof orig !== 'function') return;
    window[fn] = async function () {
      const [modal, errId] = forms[fn], root = $(modal), btn = root && root.querySelector('.auth-btn');
      if (btn) btn.classList.add('is-busy');
      root && root.querySelectorAll('.auth-input.invalid').forEach(i => i.classList.remove('invalid'));
      try { return await orig.apply(this, arguments); }
      finally {
        if (btn) btn.classList.remove('is-busy');
        const err = $(errId);
        if (root && err && err.style.display !== 'none' && err.textContent) {
          err.style.animation = 'none'; void err.offsetWidth; err.style.animation = '';
          root.querySelectorAll('.auth-form input.auth-input:not([type=checkbox])').forEach(i => { if (!i.value.trim() && !/\(không bắt buộc\)/.test((i.closest('.auth-field') || {}).textContent || '')) i.classList.add('invalid'); });
        }
      }
    };
  });
  document.addEventListener('input', e => { if (e.target.classList && e.target.classList.contains('invalid')) e.target.classList.remove('invalid'); });
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest && e.target.closest('.auth-wide .auth-btn'); if (!b || reduce) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), sp = document.createElement('span');
    sp.className = 'fx-ripple'; sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    b.appendChild(sp); setTimeout(() => sp.remove(), 650);
  });

  // 3) Thành công: tick vẽ nét + hoa giấy
  const CHECK = '<svg viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r="30"/><path d="M25 39l9 9 18-20"/></svg>';
  const EMOJI = ['🐾', '🐶', '🐱', '🧡', '✨', '🐰', '🦴'];
  function celebrate(box) {
    const icon = box.querySelector('.auth-success-icon');
    if (icon && box.id === 'loginSuccess') { icon.classList.add('fx-check'); icon.innerHTML = CHECK; }
    if (reduce) return;
    const host = box.closest('.auth-main') || box; host.style.position = 'relative';
    const c = document.createElement('div'); c.className = 'fx-confetti';
    for (let i = 0; i < 18; i++) {
      const el = document.createElement('i'), a = (i / 18) * Math.PI * 2 + Math.random() * .4, d = 90 + Math.random() * 110;
      el.textContent = EMOJI[i % EMOJI.length];
      el.style.cssText = `--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d - 40}px;--r:${(Math.random() - .5) * 360}deg;animation-delay:${Math.random() * .15}s`;
      c.appendChild(el);
    }
    host.appendChild(c); setTimeout(() => c.remove(), 1700);
  }
  ['loginSuccess', 'registerSuccess'].forEach(id => {
    const el = $(id); if (!el) return;
    new MutationObserver(() => { if (el.style.display === 'block' && !el.dataset.fx) { el.dataset.fx = '1'; celebrate(el); } else if (el.style.display !== 'block') delete el.dataset.fx; })
      .observe(el, { attributes: true, attributeFilter: ['style'] });
  });

  // 4) Cảnh bên phải nghiêng theo chuột (chỉ máy tính)
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', e => {
      const sc = e.target.closest && e.target.closest('.auth-scene'); if (!sc) return;
      const r = sc.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      const svg = sc.querySelector('.rn-scene'), cp = sc.querySelector('.scene-copy');
      if (svg) svg.style.transform = `translate(${-x * 14}px,${-y * 8}px) scale(1.04)`;
      if (cp) cp.style.transform = `translate(${x * 8}px,${y * 5}px)`;
    });
    document.addEventListener('pointerleave', () => document.querySelectorAll('.auth-scene .rn-scene, .auth-scene .scene-copy').forEach(n => n.style.transform = ''), true);
  }
})();
