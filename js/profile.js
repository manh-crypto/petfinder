// ===== Profile: My Posts panel + Account settings =====
// ========== MY POSTS PANEL ==========
function openMyPosts() {
  renderMyPosts();
  document.getElementById('myPostsPanel').classList.add('open');
}
function closeMyPosts() {
  document.getElementById('myPostsPanel').classList.remove('open');
}
function renderMyPosts() {
  if (!currentUser) return;
  const pets = loadPets().filter(isMyPet);
  const el = document.getElementById('myPostsList');
  if (pets.length === 0) {
    el.innerHTML = '<div class="empty-panel"><div>📭</div><p>Bạn chưa đăng tin nào.<br>Hãy đăng tin để cộng đồng cùng giúp!</p></div>';
    return;
  }
  el.innerHTML = pets.map(p => `
    <div class="mini-card">
      <div class="mini-icon">${PFSec.esc(p.icon)}</div>
      <div class="mini-info">
        <div class="mini-name">${PFSec.esc(p.name)}</div>
        <div class="mini-meta">${PFSec.esc(p.location || p.area)} · ${PFSec.esc(statusLabelMap[p.status] || '')}</div>
        <div class="mini-meta">${PFSec.esc(p.date)}</div>
      </div>
      ${p.status === 'lost' ? `<button class="mini-poster" data-id="${PFSec.esc(p.id)}" onclick="openPosterEditor(this.dataset.id)">Tạo poster</button>` : ''}
      <button class="mini-delete" data-id="${PFSec.esc(p.id)}" onclick="deleteMyPost(this.dataset.id)">Xóa</button>
    </div>
  `).join('');
}
function deleteMyPost(id) {
  if (!currentUser) { openAuthModal('login'); return; }
  const target = loadPets().find(p => p.id === id);
  if (!canModifyPet(target)) { PFSec.log('access_denied', 'xóa tin của người khác: ' + PFSec.cleanText(id, 40)); showToast('Bạn chỉ có thể xóa tin do chính mình đăng.'); return; }
  if (!confirm('Bạn có chắc muốn xóa tin này không?')) return;
  savePets(loadPets().filter(p => p.id !== id));
  PFSec.log('pet_deleted', target.name, currentUser.email);
  const card = document.querySelector('.pet-card[data-id="' + CSS.escape(id) + '"]');
  if (card) card.remove();
  renderMyPosts();
  if (typeof updateStats === 'function') updateStats();
  showToast('Đã xóa tin');
}

// ========== ACCOUNT SETTINGS ==========
let pendingAvatarData = null;
function openAccountSettings() {
  if (!currentUser) { showToast('Vui lòng đăng nhập để vào cài đặt!'); openAuthModal('login'); return; }
  pendingAvatarData = null;
  document.getElementById('accName').value = currentUser.name || '';
  document.getElementById('accPhone').value = currentUser.phone || '';
  document.getElementById('accArea').value = currentUser.area || '';
  document.getElementById('accBio').value = currentUser.bio || '';
  document.getElementById('accountError').style.display = 'none';
  renderAccountAvatarPreview(currentUser.avatarPhoto, currentUser.avatar);
  document.getElementById('accHeroName').textContent = currentUser.name || '';
  document.getElementById('accHeroEmail').textContent = currentUser.email || '';
  document.getElementById('accPostCount').textContent = loadPets().filter(isMyPet).length;
  ensurePasswordSection();
  document.getElementById('emojiPickerRow').style.display = 'none';
  switchAccountTab('info');
  document.getElementById('accountModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function switchAccountTab(tab) {
  document.getElementById('accTabInfo').classList.toggle('active', tab === 'info');
  document.getElementById('accTabPosts').classList.toggle('active', tab === 'posts');
  document.getElementById('accountPanelInfo').classList.toggle('active', tab === 'info');
  document.getElementById('accountPanelPosts').classList.toggle('active', tab === 'posts');
  if (tab === 'posts') renderAccountPosts();
}
function renderAccountAvatarPreview(photo, emoji) {
  const box = document.getElementById('accAvatarPreview');
  box.textContent = '';
  const safe = PFSec.safeImageSrc(photo);
  if (safe) { const img = document.createElement('img'); img.src = safe; img.alt = 'avatar'; box.appendChild(img); }
  else box.textContent = emoji || '👤';
}
function toggleEmojiPicker() {
  const row = document.getElementById('emojiPickerRow');
  row.style.display = row.style.display === 'none' ? 'flex' : 'none';
}
function setEmojiAvatar(emoji) {
  pendingAvatarData = { type: 'emoji', value: emoji };
  renderAccountAvatarPreview(null, emoji);
}
async function handleAvatarUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  try {
    const data = await PFSec.processImage(file, { maxDim: 320, quality: 0.85, maxOutBytes: 90 * 1024 });   // kiểm tra loại thật, thu nhỏ, xóa EXIF
    pendingAvatarData = { type: 'photo', value: data };
    renderAccountAvatarPreview(data, null);
    showToast('Đã chọn ảnh đại diện mới!');
  } catch (e) {
    showToast('' + e.message);
  } finally { input.value = ''; }
}
function saveAccountSettings(event) {
  event.preventDefault();
  if (!currentUser) return false;
  const t = PFSec.cleanText;
  const name = t(document.getElementById('accName').value, 80);
  const err = document.getElementById('accountError');
  const fail = m => { err.textContent = m; err.style.display = 'block'; return false; };
  if (!name) return fail('Vui lòng nhập họ tên.');
  const phone = t(document.getElementById('accPhone').value, 40);
  if (phone && !PFSec.isPhone(phone)) return fail('Số điện thoại không hợp lệ.');
  err.style.display = 'none';
  const area = t(document.getElementById('accArea').value, 80);
  const bio = t(document.getElementById('accBio').value, 300);

  // chỉ cập nhật các trường được phép trên bản ghi của CHÍNH người dùng này (không trộn nguyên đối tượng phiên)
  const users = loadUsers();
  const idx = users.findIndex(u => u.uid === currentUser.uid);
  if (idx === -1) return fail('Không tìm thấy tài khoản.');
  const rec = users[idx];
  rec.name = name; rec.phone = phone; rec.area = area; rec.bio = bio;
  if (pendingAvatarData) {
    if (pendingAvatarData.type === 'photo') rec.avatarPhoto = PFSec.safeImageSrc(pendingAvatarData.value);
    else { rec.avatarPhoto = ''; rec.avatar = t(pendingAvatarData.value, 8) || '👤'; }
  }
  if (!saveUsers(users)) return false;
  currentUser = stripSecrets(rec);
  renderNavUser(currentUser);

  // đồng bộ tên người đăng trên các tin của chính mình
  const pets = loadPets();
  let changed = false;
  pets.forEach(p => { if (isMyPet(p) && p.ownerName !== currentUser.name) { p.ownerName = currentUser.name; changed = true; } });
  if (changed) savePets(pets);

  pendingAvatarData = null;
  showToast('Đã lưu thông tin tài khoản!');
  closeModal('accountModal');
  return false;
}
function renderAccountPosts() {
  if (!currentUser) return;
  const pets = loadPets().filter(isMyPet);
  const el = document.getElementById('accountPostsList');
  if (pets.length === 0) {
    el.innerHTML = '<div class="empty-panel"><div>📭</div><p>Bạn chưa đăng tin nào.<br>Hãy đăng tin để cộng đồng cùng giúp!</p></div>';
    return;
  }
  el.innerHTML = pets.map(p => {
    const photo = PFSec.safeImageSrc(p.imageData && p.imageData[0]);
    return `
    <div class="mini-card">
      <div class="mini-icon">${photo ? `<img src="${PFSec.esc(photo)}" alt="${PFSec.esc(p.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:8px"/>` : PFSec.esc(p.icon)}</div>
      <div class="mini-info">
        <div class="mini-name">${PFSec.esc(p.name)}</div>
        <div class="mini-meta">${PFSec.esc(p.location || p.area)} · ${PFSec.esc(statusLabelMap[p.status] || '')}</div>
        <div class="mini-meta">${PFSec.esc(p.date)}</div>
      </div>
      <div class="mini-card-actions">
        ${p.status === 'lost' ? `<button class="mini-poster" data-id="${PFSec.esc(p.id)}" onclick="openPosterEditor(this.dataset.id)">Tạo poster</button>` : ''}
        <button class="mini-edit" data-id="${PFSec.esc(p.id)}" onclick="openAdminEditPet(this.dataset.id)">Sửa</button>
        <button class="mini-delete" data-id="${PFSec.esc(p.id)}" onclick="deleteAccountPost(this.dataset.id)">Xóa</button>
      </div>
    </div>`;
  }).join('');
}
function deleteAccountPost(id) {
  if (!currentUser) { openAuthModal('login'); return; }
  const target = loadPets().find(p => p.id === id);
  if (!canModifyPet(target)) { PFSec.log('access_denied', 'xóa tin của người khác: ' + PFSec.cleanText(id, 40)); showToast('Bạn chỉ có thể xóa tin do chính mình đăng.'); return; }
  if (!confirm('Bạn có chắc muốn xóa tin này không?')) return;
  savePets(loadPets().filter(p => p.id !== id));
  PFSec.log('pet_deleted', target.name, currentUser.email);
  const card = document.querySelector('.pet-card[data-id="' + CSS.escape(id) + '"]');
  if (card) card.remove();
  renderAccountPosts();
  if (typeof updateStats === 'function') updateStats();
  showToast('Đã xóa tin');
}



// ========== ĐỔI MẬT KHẨU ==========
function ensurePasswordSection() {
  const host = document.getElementById('accountPanelInfo');
  if (!host || !currentUser) return;
  let sec = document.getElementById('accPwSection');
  const fu = PFDB.auth() && PFDB.auth().currentUser;
  const hasPw = !!(fu && fu.providerData.some(p => p.providerId === 'password'));
  if (!hasPw) { if (sec) sec.remove(); return; }   // tài khoản Google/Facebook không có mật khẩu
  if (sec) return;
  sec = document.createElement('div');
  sec.id = 'accPwSection';
  sec.className = 'acc-card';
  sec.innerHTML = `<div class="acc-card-title">Đổi mật khẩu</div>
    <div class="auth-field"><label for="accPwOld">Mật khẩu hiện tại</label><input class="auth-input" id="accPwOld" type="password" autocomplete="current-password" maxlength="128"/></div>
    <div class="auth-field"><label for="accPwNew">Mật khẩu mới</label><input class="auth-input" id="accPwNew" type="password" autocomplete="new-password" maxlength="128"/></div>
    <div class="auth-field"><label for="accPwNew2">Nhập lại mật khẩu mới</label><input class="auth-input" id="accPwNew2" type="password" autocomplete="new-password" maxlength="128"/></div>
    <div id="accPwMsg" style="display:none;padding:9px 12px;border-radius:var(--radius-sm);font-weight:700;font-size:.84rem;margin:8px 0"></div>
    <button type="button" class="auth-btn" id="accPwBtn">Cập nhật mật khẩu</button>`;
  host.appendChild(sec);
  sec.querySelector('#accPwBtn').addEventListener('click', changePassword);
}
async function changePassword() {
  const msg = document.getElementById('accPwMsg');
  const say = (m, good) => { msg.textContent = m; msg.style.display = 'block'; msg.style.background = good ? 'var(--green-light)' : 'var(--red-light)'; msg.style.color = good ? 'var(--green)' : 'var(--red)'; };
  if (!currentUser) return;
  const oldPw = document.getElementById('accPwOld').value, newPw = document.getElementById('accPwNew').value, newPw2 = document.getElementById('accPwNew2').value;
  if (!oldPw || !newPw || !newPw2) return say('Vui lòng điền đủ các ô.');
  const key = 'pwchange:' + currentUser.email, th = PFSec.throttle.check(key);
  if (th.locked) return say(`Quá nhiều lần thử sai. Thử lại sau ${Math.ceil(th.remainingMs / 1000)} giây.`);
  const issues = PFSec.passwordIssues(newPw, { email: currentUser.email, level: currentUser.role === 'admin' ? 'admin' : 'user' });
  if (issues.length) return say('' + issues[0]);
  if (newPw !== newPw2) return say('Mật khẩu xác nhận không khớp.');
  if (newPw === oldPw) return say('Mật khẩu mới phải khác mật khẩu hiện tại.');
  try {
    const fu = PFDB.auth().currentUser;
    if (!fu || !fu.email) return say('Không tìm thấy tài khoản.');
    try { await fu.reauthenticateWithCredential(PFDB.fb().auth.EmailAuthProvider.credential(fu.email, oldPw)); }
    catch (e) {
      if (e && (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential')) { PFSec.throttle.fail(key); PFSec.log('password_change_failed', 'sai mật khẩu hiện tại', fu.email); return say('Mật khẩu hiện tại không đúng.'); }
      throw e;
    }
    PFSec.throttle.reset(key);
    await fu.updatePassword(newPw);
    PFSec.log('password_changed', '', fu.email);
    ['accPwOld', 'accPwNew', 'accPwNew2'].forEach(id => { document.getElementById(id).value = ''; });
    say('Đã đổi mật khẩu.', true);
  } catch (e) { say('' + e.message); }
}
