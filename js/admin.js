// ===== Admin panel =====
// ========== ADMIN: OPEN / CLOSE PANEL ==========
function openAdminPanel() {
  if (!requireAdmin('mở bảng quản trị')) return;
  document.getElementById('adminOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  switchAdminView('overview');
}
function closeAdminPanel() {
  // Trang quản trị là trang riêng: đóng = quay về trang chủ
  if (window.location.pathname.replace(/\\/g, '/').endsWith('/admin.html')) { window.location.href = '../index.html'; return; }
  document.getElementById('adminOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
function switchAdminView(view) {
  if (!isAdmin()) { requireAdmin('xem khu vực quản trị: ' + view); return; }
  document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.admin-view').forEach(v => v.classList.toggle('active', v.id === 'adminView-' + view));
  if (view === 'overview') renderAdminOverview();
  else if (view === 'cashflow') { if (typeof renderCashflow === 'function') renderCashflow(); }
  else if (view === 'feedback') { if (typeof renderFeedbackAdmin === 'function') renderFeedbackAdmin(); }
  else if (view === 'security') { if (typeof renderSecurityAdmin === 'function') renderSecurityAdmin(); }
  else if (view === 'users') renderAdminUsers();
  else if (view === 'pets') renderAdminPets();
  else if (view === 'news') renderAdminNews();
}

// ========== ADMIN: OVERVIEW ==========
// Dashboard (KPI, dòng tiền, biểu đồ) nằm trong js/admin-dashboard.js
function renderAdminOverview() {
  if (typeof renderDashboardOverview === 'function') renderDashboardOverview();
}

function renderFlaggedTable() {
  const flagged = loadPets().filter(p => p.flagged);
  const body = document.getElementById('adminFlaggedBody');
  if (!body) return;
  if (flagged.length === 0) {
    body.innerHTML = '<tr class="admin-empty-row"><td colspan="5">✅ Không có tin đăng nào bị đánh dấu nghi vấn.</td></tr>';
    return;
  }
  const E = PFSec.esc;
  body.innerHTML = flagged.map(p => `
      <tr>
        <td>${E(p.icon)} ${E(p.name)}</td>
        <td>${E(p.ownerName || '')}<br><span style="color:var(--text-muted);font-size:0.78rem">${E(p.ownerEmail || '')}</span></td>
        <td>${E(p.area || p.location || '')}</td>
        <td><span class="pill pill-${E(p.status)}">${E(statusLabelMap[p.status] || p.status)}</span></td>
        <td>
          <div class="admin-action-btns" data-id="${E(p.id)}">
            <button class="abtn abtn-edit" onclick="openAdminEditPet(this.parentNode.dataset.id)">✏️ Sửa</button>
            <button class="abtn abtn-unflag" onclick="toggleFlagPet(this.parentNode.dataset.id)">✅ Bỏ cờ</button>
            <button class="abtn abtn-delete" onclick="adminDeletePet(this.parentNode.dataset.id)">🗑️ Xóa</button>
          </div>
        </td>
      </tr>
    `).join('');
}

// (escapeHtml dùng chung: xem js/security.js)

// ========== ADMIN: USER MANAGEMENT ==========
function renderAdminUsers() {
  const search = (document.getElementById('adminUserSearch').value || '').toLowerCase().trim();
  const roleFilter = document.getElementById('adminUserRoleFilter').value;
  const users = loadUsers();
  const pets = loadPets();
  const filtered = users.filter(u => {
    const matchSearch = !search || (u.name || '').toLowerCase().includes(search) || (u.email || '').toLowerCase().includes(search) || (u.phone || '').toLowerCase().includes(search);
    const matchRole = !roleFilter || (u.role || 'user') === roleFilter;
    return matchSearch && matchRole;
  });
  const body = document.getElementById('adminUsersBody');
  if (filtered.length === 0) {
    body.innerHTML = '<tr class="admin-empty-row"><td colspan="6">Không tìm thấy người dùng nào.</td></tr>';
    return;
  }
  const E = PFSec.esc;
  body.innerHTML = filtered.map(u => {
    const postCount = pets.filter(p => p.ownerEmail === u.email).length;
    const role = u.role || 'user';
    const isSelf = currentUser && u.email === currentUser.email;
    return `
      <tr>
        <td>${E(u.name)}${u.banned ? ' <span class="pill pill-flagged">Đã khóa</span>' : ''}</td>
        <td>${E(u.email)}</td>
        <td>${E(u.phone || '—')}</td>
        <td><span class="pill ${role === 'admin' ? 'pill-admin' : 'pill-user'}">${role === 'admin' ? 'Quản trị viên' : 'Người dùng'}</span></td>
        <td>${postCount}</td>
        <td>
          <div class="admin-action-btns" data-email="${E(u.email)}">
            ${role === 'admin'
              ? `<button class="abtn abtn-demote" onclick="setUserRole(this.parentNode.dataset.email,'user')" ${isSelf ? 'disabled title="Không thể tự hạ quyền"' : ''}>⬇️ Hạ quyền</button>`
              : `<button class="abtn abtn-promote" onclick="setUserRole(this.parentNode.dataset.email,'admin')">⬆️ Cấp quyền admin</button>`
            }
            ${u.banned
              ? `<button class="abtn abtn-unflag" onclick="toggleBanUser(this.parentNode.dataset.email)">✅ Mở khóa</button>`
              : `<button class="abtn abtn-flag" onclick="toggleBanUser(this.parentNode.dataset.email)" ${isSelf ? 'disabled' : ''}>⛔ Khóa TK</button>`
            }
            <button class="abtn abtn-delete" onclick="adminDeleteUser(this.parentNode.dataset.email)" ${isSelf ? 'disabled title="Không thể tự xóa"' : ''}>🗑️ Xóa</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setUserRole(email, role) {
  if (!requireAdmin('đổi vai trò người dùng')) return;
  if (role !== 'admin' && role !== 'user') return;
  const users = loadUsers();
  const u = users.find(x => x.email === email);
  if (!u) return;
  if (currentUser && u.email === currentUser.email && role !== 'admin') { showToast('⛔ Bạn không thể tự hạ quyền của chính mình'); return; }
  if (role === 'admin') {
    if (u.banned) { showToast('⛔ Hãy mở khóa tài khoản trước khi cấp quyền admin.'); return; }
    if (!confirm(`Cấp QUYỀN QUẢN TRỊ cho "${u.name}" (${u.email})? Người này sẽ xem và sửa được toàn bộ dữ liệu.`)) return;
  }
  u.role = role;
  saveUsers(users);
  PFSec.log('admin_role_change', `${u.email} → ${role}`);
  showToast(role === 'admin' ? `⬆️ Đã cấp quyền quản trị cho ${u.name}` : `⬇️ Đã hạ quyền ${u.name} xuống người dùng thường`);
  renderAdminUsers();
}

function toggleBanUser(email) {
  if (!requireAdmin('khóa/mở khóa tài khoản')) return;
  const users = loadUsers();
  const u = users.find(x => x.email === email);
  if (!u) return;
  if (currentUser && u.email === currentUser.email) { showToast('⛔ Bạn không thể tự khóa tài khoản của chính mình'); return; }
  if (u.role === 'admin' && !u.banned && users.filter(x => x.role === 'admin' && !x.banned).length <= 1) { showToast('⛔ Không thể khóa quản trị viên cuối cùng.'); return; }
  if (!u.banned && !confirm(`Khóa tài khoản "${u.name}" do nghi vấn lừa đảo / vi phạm?`)) return;
  u.banned = !u.banned;
  saveUsers(users);
  PFSec.log('admin_ban', `${u.email} ${u.banned ? 'bị khóa' : 'được mở khóa'}`);
  showToast(u.banned ? `⛔ Đã khóa tài khoản ${u.name}` : `✅ Đã mở khóa tài khoản ${u.name}`);
  renderAdminUsers();
  renderAdminOverview();
}

function adminDeleteUser(email) {
  if (!requireAdmin('xóa tài khoản')) return;
  const users = loadUsers();
  const idx = users.findIndex(x => x.email === email);
  if (idx === -1) return;
  const u = users[idx];
  if (currentUser && u.email === currentUser.email) { showToast('⛔ Bạn không thể tự xóa tài khoản của chính mình'); return; }
  if (u.role === 'admin' && users.filter(x => x.role === 'admin').length <= 1) { showToast('⛔ Không thể xóa quản trị viên cuối cùng.'); return; }
  if (!confirm(`Xóa hồ sơ "${u.name}" (${u.email}) khỏi cơ sở dữ liệu? Hành động này không thể hoàn tác.`)) return;
  users.splice(idx, 1);
  saveUsers(users);
  PFSec.log('admin_delete_user', u.email);
  showToast(`🗑️ Đã xóa hồ sơ ${u.name}. Để xóa hẳn tài khoản đăng nhập, hãy xóa trong Firebase Console → Authentication.`, 6000);
  renderAdminUsers();
  renderAdminOverview();
}

// ========== ADMIN: PET POST MANAGEMENT ==========
function renderAdminPets() {
  const search = (document.getElementById('adminPetSearch').value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('adminPetStatusFilter').value;
  const flagFilter = document.getElementById('adminPetFlagFilter').value;
  const pets = loadPets();
  const filtered = pets.filter(p => {
    const matchSearch = !search || (p.name || '').toLowerCase().includes(search) || (p.ownerName || '').toLowerCase().includes(search) || (p.ownerEmail || '').toLowerCase().includes(search);
    const matchStatus = !statusFilter || p.status === statusFilter;
    const matchFlag = !flagFilter || (flagFilter === 'flagged' ? !!p.flagged : !p.flagged);
    return matchSearch && matchStatus && matchFlag;
  });
  const body = document.getElementById('adminPetsBody');
  if (filtered.length === 0) {
    body.innerHTML = '<tr class="admin-empty-row"><td colspan="7">Không tìm thấy tin đăng nào.</td></tr>';
    return;
  }
  const E = PFSec.esc;
  body.innerHTML = filtered.map(p => `
    <tr>
      <td>${E(p.icon)} ${E(p.name)}${p.breed ? '<br><span style="color:var(--text-muted);font-size:0.78rem">' + E(p.breed) + '</span>' : ''}</td>
      <td>${E(p.ownerName || '—')}<br><span style="color:var(--text-muted);font-size:0.78rem">${E(p.ownerEmail || '')}</span></td>
      <td>${E(p.area || p.location || '—')}</td>
      <td><span class="pill pill-${E(p.status)}">${E(statusLabelMap[p.status] || p.status)}</span></td>
      <td>${E(p.date || '—')}</td>
      <td>${p.flagged ? '<span class="pill pill-flagged">⚠️ Nghi vấn</span>' : '<span class="pill pill-ok">Bình thường</span>'}</td>
      <td>
        <div class="admin-action-btns" data-id="${E(p.id)}">
          <button class="abtn abtn-edit" onclick="openAdminEditPet(this.parentNode.dataset.id)">✏️ Sửa</button>
          ${p.flagged
            ? `<button class="abtn abtn-unflag" onclick="toggleFlagPet(this.parentNode.dataset.id)">✅ Bỏ cờ</button>`
            : `<button class="abtn abtn-flag" onclick="toggleFlagPet(this.parentNode.dataset.id)">⚠️ Đánh dấu nghi vấn</button>`
          }
          <button class="abtn abtn-delete" onclick="adminDeletePet(this.parentNode.dataset.id)">🗑️ Xóa</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function toggleFlagPet(id) {
  if (!requireAdmin('đánh dấu tin nghi vấn')) return;
  const pets = loadPets();
  const p = pets.find(x => x.id === id);
  if (!p) return;
  p.flagged = !p.flagged;
  savePets(pets);
  PFSec.log('admin_flag_pet', `${p.id} ${p.flagged ? 'nghi vấn' : 'bỏ cờ'}`);
  showToast(p.flagged ? `⚠️ Đã đánh dấu tin "${p.name}" là nghi vấn` : `✅ Đã bỏ cờ tin "${p.name}"`);
  renderAdminPets();
  renderAdminOverview();
}

function adminDeletePet(id) {
  if (!requireAdmin('xóa tin đăng')) return;
  const pets = loadPets();
  const p = pets.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Xóa vĩnh viễn tin đăng "${p.name}"? Hành động này không thể hoàn tác.`)) return;
  savePets(pets.filter(x => x.id !== id));
  PFSec.log('admin_delete_pet', `${p.id} (${p.ownerEmail})`);
  const card = document.querySelector('.pet-card[data-id="' + CSS.escape(id) + '"]');
  if (card) card.remove();
  showToast(`🗑️ Đã xóa tin đăng "${p.name}"`);
  renderAdminPets();
  renderAdminOverview();
  if (typeof updateStats === 'function') updateStats();
  if (typeof renderMyPosts === 'function' && document.getElementById('myPostsPanel').classList.contains('open')) renderMyPosts();
  if (typeof renderAccountPosts === 'function' && document.getElementById('accountPanelPosts').classList.contains('active')) renderAccountPosts();
}

// (Sửa tin đăng: xem js/pet-edit.js – dùng chung cho trang admin và trang hồ sơ)

// ========== ADMIN: NEWS MANAGEMENT ==========
let adminEditingNewsId = null;
function addNewsItem() {
  if (!requireAdmin('đăng/sửa tin tức')) return;
  const item = PFSec.sanitizeNews({
    id: adminEditingNewsId || PFSec.newId('news'),
    title: document.getElementById('newsTitle').value,
    icon: document.getElementById('newsIcon').value || '📰',
    date: document.getElementById('newsDate').value,
    desc: document.getElementById('newsDesc').value, createdAt: Date.now()
  });
  if (!item || !item.desc) { showToast('⚠️ Vui lòng điền tiêu đề và nội dung tin tức'); return; }
  const news = loadNews();
  if (adminEditingNewsId) {
    const idx = news.findIndex(n => n.id === adminEditingNewsId);
    if (idx !== -1) news[idx] = { ...news[idx], title: item.title, icon: item.icon, date: item.date, desc: item.desc };
    adminEditingNewsId = null;
    document.getElementById('newsCancelEditBtn').style.display = 'none';
    showToast('💾 Đã cập nhật tin tức');
  } else {
    news.unshift(item);
    showToast('✅ Đã thêm tin tức mới');
  }
  saveNews(news);
  PFSec.log('admin_news', item.id);
  clearNewsForm();
  renderAdminNews();
  renderAdminOverview();
}
function clearNewsForm() {
  document.getElementById('newsTitle').value = '';
  document.getElementById('newsIcon').value = '';
  document.getElementById('newsDate').value = '';
  document.getElementById('newsDesc').value = '';
}
function editNewsItem(id) {
  const news = loadNews();
  const n = news.find(x => x.id === id);
  if (!n) return;
  adminEditingNewsId = id;
  document.getElementById('newsTitle').value = n.title || '';
  document.getElementById('newsIcon').value = n.icon || '';
  document.getElementById('newsDate').value = n.date || '';
  document.getElementById('newsDesc').value = n.desc || '';
  document.getElementById('newsCancelEditBtn').style.display = 'inline-block';
  document.getElementById('newsTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function cancelEditNews() {
  adminEditingNewsId = null;
  document.getElementById('newsCancelEditBtn').style.display = 'none';
  clearNewsForm();
}
function deleteNewsItem(id) {
  if (!requireAdmin('xóa tin tức')) return;
  if (!confirm('Xóa tin tức này?')) return;
  saveNews(loadNews().filter(n => n.id !== id));
  PFSec.log('admin_news_delete', id);
  showToast('🗑️ Đã xóa tin tức');
  renderAdminNews();
  renderAdminOverview();
}
function renderAdminNews() {
  const news = loadNews();
  const el = document.getElementById('adminNewsList');
  if (news.length === 0) {
    el.innerHTML = '<div class="empty-panel"><div>📰</div><p>Chưa có tin tức nào. Hãy thêm tin tức mới ở trên.</p></div>';
    return;
  }
  const E = PFSec.esc;
  el.innerHTML = news.map(n => `
    <div class="admin-news-item">
      <div class="news-icon">${E(n.icon)}</div>
      <div class="news-body">
        <div class="news-title">${E(n.title)}</div>
        <div class="news-meta">📅 ${E(n.date || '')}</div>
        <div class="news-desc">${E(n.desc)}</div>
      </div>
      <div class="admin-action-btns" data-id="${E(n.id)}">
        <button class="abtn abtn-edit" onclick="editNewsItem(this.parentNode.dataset.id)">✏️ Sửa</button>
        <button class="abtn abtn-delete" onclick="deleteNewsItem(this.parentNode.dataset.id)">🗑️ Xóa</button>
      </div>
    </div>
  `).join('');
}

