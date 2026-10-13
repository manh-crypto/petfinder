// ===== Sửa tin đăng thú cưng (dùng chung: trang admin + trang hồ sơ người dùng) =====
// Hộp thoại được tạo bằng JS nếu trang chưa có, để nút "Sửa" hoạt động ở mọi trang có danh sách tin của tôi.
let adminEditingPetId = null;

function ensureEditOverlay() {
  if (document.getElementById('adminEditPetOverlay')) return;
  const ov = document.createElement('div');
  ov.className = 'admin-overlay'; ov.id = 'adminEditPetOverlay';
  ov.innerHTML = `<div class="admin-panel" style="max-width:560px">
    <div class="admin-header"><h2>Sửa tin đăng thú cưng</h2><button class="admin-close" type="button" aria-label="Đóng" onclick="closeAdminEditPet()">✕</button></div>
    <div class="admin-content"><form class="admin-edit-form" onsubmit="return saveAdminEditPet(event)">
      <label>Tên thú cưng<input type="text" id="editPetName" required maxlength="80"/></label>
      <label>Loài / Giống<input type="text" id="editPetBreed" maxlength="60"/></label>
      <label>Trạng thái<select id="editPetStatus"><option value="lost">Đang thất lạc</option><option value="found">Đã tìm thấy</option><option value="adopt">Chờ nhận nuôi</option></select></label>
      <label>Khu vực<input type="text" id="editPetArea" maxlength="80"/></label>
      <label>Địa điểm cụ thể<input type="text" id="editPetLocation" maxlength="200"/></label>
      <label>Số điện thoại liên hệ<input type="text" id="editPetPhone" maxlength="40"/></label>
      <label>Link Zalo hoặc Facebook (không bắt buộc)<input type="text" id="editPetZalo" maxlength="200" placeholder="https://zalo.me/... hoặc https://facebook.com/..."/></label>
      <label>Mô tả<textarea id="editPetDesc" maxlength="1500"></textarea></label>
      <div class="admin-edit-actions"><button type="submit" class="btn-primary">Lưu thay đổi</button><button type="button" class="btn-outline" onclick="closeAdminEditPet()">Hủy</button></div>
    </form></div></div>`;
  document.body.appendChild(ov);
}

let editingContact = {};
async function openAdminEditPet(id) {
  const pets = loadPets();
  const p = pets.find(x => x.id === id);
  if (!p) return;
  if (!canModifyPet(p)) { PFSec.log('access_denied', 'sửa tin của người khác: ' + PFSec.cleanText(id, 40)); showToast('Bạn chỉ có thể sửa tin do chính mình đăng.'); return; }
  ensureEditOverlay();
  adminEditingPetId = id;
  document.getElementById('editPetName').value = p.name || '';
  document.getElementById('editPetBreed').value = p.breed || '';
  document.getElementById('editPetStatus').value = p.status || 'lost';
  document.getElementById('editPetArea').value = p.area || '';
  document.getElementById('editPetLocation').value = p.location || '';
  editingContact = (p.phone || p.zalo || p.ownerEmail) ? { phone: p.phone, zalo: p.zalo, email: p.ownerEmail } : ((await PFDB.getContact(id)) || {});
  document.getElementById('editPetPhone').value = editingContact.phone || '';
  document.getElementById('editPetZalo').value = editingContact.zalo || '';
  document.getElementById('editPetDesc').value = p.desc || '';
  document.getElementById('adminEditPetOverlay').classList.add('open');
}

function closeAdminEditPet() {
  document.getElementById('adminEditPetOverlay').classList.remove('open');
  adminEditingPetId = null;
}

function saveAdminEditPet(event) {
  event.preventDefault();
  if (!adminEditingPetId) return false;
  const pets = loadPets();
  const idx = pets.findIndex(x => x.id === adminEditingPetId);
  if (idx === -1) return false;
  if (!canModifyPet(pets[idx])) { PFSec.log('access_denied', 'lưu tin của người khác: ' + pets[idx].id); showToast('Bạn chỉ có thể sửa tin do chính mình đăng.'); return false; }
  const phone = document.getElementById('editPetPhone').value.trim();
  if (phone && !PFSec.isPhone(phone)) { showToast('Số điện thoại không hợp lệ.'); return false; }
  const social = PFSec.parseSocialLink(document.getElementById('editPetZalo').value);
  if (!social.ok) { showToast('Liên kết chỉ nhận Zalo (zalo.me) hoặc Facebook, hoặc để trống.'); return false; }
  const edited = PFSec.sanitizePet({
    ...pets[idx],
    name: document.getElementById('editPetName').value.trim() || pets[idx].name,
    breed: document.getElementById('editPetBreed').value.trim(),
    status: document.getElementById('editPetStatus').value,          // sanitizePet ép về lost/found/adopt
    area: document.getElementById('editPetArea').value.trim(),
    location: document.getElementById('editPetLocation').value.trim(),
    phone, zalo: social.url, ownerEmail: editingContact.email || '', desc: document.getElementById('editPetDesc').value.trim()
  });
  if (!edited) { showToast('Dữ liệu không hợp lệ.'); return false; }
  pets[idx] = edited;
  savePets(pets);
  PFSec.log('pet_edited', edited.id);

  // Re-render the card in the live grid (chỉ có trên trang có danh sách thú cưng)
  if (typeof addPetCardToGrid === 'function') {
    const oldCard = document.querySelector('.pet-card[data-id="' + CSS.escape(edited.id) + '"]');
    if (oldCard) oldCard.remove();
    addPetCardToGrid(edited, true);
  }
  closeAdminEditPet();
  showToast(`Đã lưu thay đổi cho tin "${edited.name}"`);
  if (isAdmin() && typeof renderAdminPets === 'function') { renderAdminPets(); if (typeof renderAdminOverview === 'function') renderAdminOverview(); }
  if (typeof updateStats === 'function') updateStats();
  if (typeof renderAccountPosts === 'function' && document.getElementById('accountPanelPosts') && document.getElementById('accountPanelPosts').classList.contains('active')) renderAccountPosts();
  return false;
}
