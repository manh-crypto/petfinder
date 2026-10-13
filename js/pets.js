// ===== Pets: post form, search, filters, pet detail/lightbox =====
// ========== IMAGE PREVIEW ==========
let pendingImageData = [];
async function previewImages(input) {
  const container = document.getElementById('fImagePreview');
  container.innerHTML = '';
  pendingImageData = [];
  const files = Array.from(input.files || []).slice(0, 5);
  let ok = 0;
  for (const file of files) {
    try {
      const data = await PFSec.processImage(file, { maxDim: 960, quality: 0.72, maxOutBytes: 120 * 1024 });   // kiểm tra loại thật, thu nhỏ, xóa EXIF/GPS
      pendingImageData.push(data);
      const img = document.createElement('img');
      img.src = data; img.alt = 'Ảnh xem trước'; img.className = 'img-preview-item';
      container.appendChild(img); ok++;
    } catch (e) { showToast('' + (file.name ? PFSec.cleanText(file.name, 40) + ': ' : '') + e.message); }
  }
  if (ok) showToast('Đã tải ' + ok + ' ảnh thành công!');
  input.value = '';
}

async function geocodePetLocation(location, area) {
  if (!window.PetFinderGeocoding || (!location && !area)) return {};
  try {
    const results = await window.PetFinderGeocoding.search([location, area, 'Việt Nam'].filter(Boolean).join(', '));
    return results[0] ? { lat: results[0].lat, lng: results[0].lng } : {};
  } catch (error) {
    console.warn('Could not geocode pet location:', error);
    return {};
  }
}

async function submitPost() {
  const name = document.getElementById('fName').value.trim();
  const type = PFSec.cleanText(document.getElementById('fType').value, 30);
  const breed = document.getElementById('fBreed').value.trim();
  const gender = document.getElementById('fGender').value;
  const date = document.getElementById('fDate').value;
  const area = document.getElementById('fArea').value;
  const location = document.getElementById('fLocation').value.trim();
  const desc = document.getElementById('fDesc').value.trim();
  const phone = document.getElementById('fPhone').value.trim();
  const zalo = document.getElementById('fZalo').value.trim();
  const status = document.getElementById('activeFormType').value;
  const err = document.getElementById('formError');
  err.style.display = 'none';

  if (!name || !type || !date || !area || !phone) {
    err.textContent = 'Vui lòng điền đầy đủ các trường bắt buộc (*)';
    err.style.display = 'block';
    return;
  }
  const fail = m => { err.textContent = m; err.style.display = 'block'; };
  if (!currentUser) { openAuthModal('login'); return; }
  if (!PFSec.isPhone(phone)) return fail('Số điện thoại không hợp lệ.');
  const social = PFSec.parseSocialLink(zalo);
  if (!social.ok) return fail('Liên kết liên hệ chỉ nhận đường dẫn Zalo (zalo.me) hoặc Facebook (facebook.com, fb.com, m.me), hoặc để trống.');
  if (Number.isNaN(new Date(date).getTime())) return fail('Ngày không hợp lệ.');
  const lastPost = Number(sessionStorage.getItem('pf_last_post') || 0);
  if (Date.now() - lastPost < 15000) return fail('⏳ Bạn đăng tin quá nhanh. Vui lòng đợi vài giây rồi thử lại.');
  const rl = PFSec.rateLimit('post:' + currentUser.uid, 5, 10 * 60 * 1000);
  if (!rl.ok) return fail('Bạn đăng quá nhiều tin trong thời gian ngắn. Vui lòng thử lại sau ' + Math.ceil(rl.retryMs / 60000) + ' phút.');
  const submitButton = document.querySelector('#form .submit-btn');
  const originalButtonText = submitButton ? submitButton.textContent : '';
  if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Đang xác định vị trí...'; }
  const coordinates = await geocodePetLocation(location, area);
  if (submitButton) { submitButton.disabled = false; submitButton.textContent = originalButtonText; }
  const icon = petIcon(type);
  const displayDate = new Date(date).toLocaleDateString('vi-VN');
  const id = PFSec.newId('pet');
  const imageData = pendingImageData.filter(Boolean);
  const rawPet = { id, name, type, breed, gender, date: displayDate, area, location, desc, phone, zalo: social.url, status, icon, imageData, ...coordinates, ownerEmail: currentUser.email, ownerUid: currentUser.uid, ownerName: currentUser.name, createdAt: Date.now() };
  const pet = PFSec.sanitizePet(rawPet);                           // chuẩn hóa/giới hạn mọi trường trước khi lưu
  if (!pet) return fail('Dữ liệu tin đăng không hợp lệ.');
  sessionStorage.setItem('pf_last_post', String(Date.now()));
  PFSec.log('pet_posted', pet.status + ': ' + pet.name, currentUser.email);

  const pets = loadPets();
  pets.unshift(pet);
  savePets(pets);

  // Add card to DOM immediately
  addPetCardToGrid(pet, true);
  // Mark the newly added card as NEW
  const newCard = document.querySelector('.pet-card[data-id="' + CSS.escape(pet.id) + '"]');
  if (newCard && pet.status === 'lost') {
    newCard.classList.add('card-new-ring');
    // Add priority bar at top of card
    const bar = document.createElement('div');
    bar.className = 'priority-bar';
    newCard.insertBefore(bar, newCard.firstChild);
    // Add NEW badge next to the status badge
    const statusBadge = newCard.querySelector('.pet-badge');
    if (statusBadge) {
      const newBadge = document.createElement('span');
      newBadge.className = 'badge-new';
      newBadge.textContent = 'MỚI';
      statusBadge.insertAdjacentElement('afterend', newBadge);
    }
    // Remove NEW styling after 5 minutes
    setTimeout(() => {
      newCard.classList.remove('card-new-ring');
      const nb = newCard.querySelector('.badge-new');
      if (nb) nb.remove();
      const pb = newCard.querySelector('.priority-bar');
      if (pb) pb.remove();
    }, 300000);
  }
  // Re-sort to keep local lost pets at top
  const userArea = getUserArea();
  if (userArea && userArea !== '__skipped__') resortPetsByArea(userArea);
  updateStats();
  resetForm();
  // Show alert popup if matches user area
  showAlertPopup(pet);
  showToast('Đăng tin thành công! Cộng đồng đã nhận được.');
  goToPetsList();
}
function resetForm() {
  ['fName','fBreed','fLocation','fDesc','fPhone','fZalo'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  ['fType','fGender','fArea','fDate'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  document.getElementById('fImagePreview').innerHTML = '';
  document.getElementById('formError').style.display = 'none';
}

function addPetCardToGrid(pet, prepend = false) {
  const grid = document.getElementById('petsGrid');
  if (!grid) return; // trang hiện tại không có danh sách thú cưng
  const favs = loadFavs();
  const isFav = favs.includes(pet.id);
  const badgeClass = pet.status === 'lost' ? 'badge-lost' : pet.status === 'found' ? 'badge-found' : 'badge-adopt';
  const badgeLabel = pet.status === 'lost' ? '🔴 Đang thất lạc' : pet.status === 'found' ? '🟢 Đã tìm thấy' : '🟡 Chờ nhận nuôi';
  const btnStyle = pet.status === 'found' ? 'style="background:var(--green)"' : pet.status === 'adopt' ? 'style="background:var(--orange-dark)"' : '';
  const btnLabel = pet.status === 'found' ? 'Liên hệ' : pet.status === 'adopt' ? 'Nhận nuôi' : 'Liên hệ ngay';
  const isOwner = isMyPet(pet);
  const card = document.createElement('div');
  card.className = 'pet-card';
  card.dataset.status = pet.status;
  card.dataset.id = pet.id;
  card.dataset.name = pet.name.toLowerCase();
  card.dataset.area = (pet.area + ' ' + pet.location).toLowerCase();
  card.dataset.type = pet.type.toLowerCase();
  card.dataset.hay = foldText([pet.name, pet.type, pet.breed, pet.gender, pet.area, pet.location, pet.desc].join(' '));
  const E = PFSec.esc;
  const photo = PFSec.safeImageSrc(pet.imageData && pet.imageData[0]);
  const statusColor = pet.status === 'lost' ? 'var(--red)' : pet.status === 'found' ? 'var(--green)' : 'var(--orange)';
  card.innerHTML = `
    <button class="fav-btn${isFav ? ' active' : ''}" data-id="${E(pet.id)}" onclick="toggleFav(this.dataset.id,this,event)" title="Lưu yêu thích">${isFav ? '❤️' : '🤍'}</button>
    <div class="pet-img" style="background:var(--orange-pale);position:relative">${photo ? `<img src="${E(photo)}" alt="${E(pet.name)}" style="width:100%;height:100%;object-fit:cover"/>` : E(pet.icon)}</div>
    <div class="pet-info">
      <span class="pet-badge ${badgeClass}">${badgeLabel}</span>${isOwner ? '<span class="my-post-badge">Của tôi</span>' : ''}
      <div class="pet-name">${E(pet.name)}</div>
      <div class="pet-meta">${E(pet.icon)} ${E(pet.breed || pet.type)}${pet.gender ? ' · ' + E(pet.gender) : ''}</div>
      <div class="pet-meta">${E(pet.location || pet.area)}</div>
      <div class="pet-date"><span>${E(pet.date)}</span><span style="color:${statusColor};font-weight:700">${E(statusLabelMap[pet.status] || '')}</span></div>
      <button class="contact-btn" ${btnStyle}>${btnLabel}</button>
    </div>`;
  const openDetail = () => openPetModal(pet.name, `${pet.breed || pet.type}${pet.gender?', '+pet.gender:''}`, pet.location || pet.area, pet.phone, pet.date, pet.icon, pet.desc, pet.zalo, pet.imageData, pet);
  card.addEventListener('click', (e) => {
    if (e.target.classList.contains('fav-btn')) return;
    openDetail();
    // Bấm "Liên hệ" trên thẻ → chuyển thẳng sang thông tin liên lạc của người đăng tin
    if (e.target.classList.contains('contact-btn')) showPetContact();
  });
  if (prepend) grid.insertBefore(card, grid.firstChild);
  else grid.appendChild(card);
}

// ========== LOAD SAVED PETS ON PAGE LOAD ==========
function loadSavedPets() {
  const pets = loadPets();
  pets.forEach(pet => addPetCardToGrid(pet, false));
  updateFavButtons();
  updateStats();
}

// ========== STATS ==========
function updateStats() {
  const pets = loadPets();
  const lost = pets.filter(p => p.status === 'lost').length;
  const found = pets.filter(p => p.status === 'found').length;
  const adopt = pets.filter(p => p.status === 'adopt').length;
  // Update stat cards (add to base numbers)
  const statNums = document.querySelectorAll('.stat-num');
  if (statNums[0]) statNums[0].textContent = 126 + lost;
  if (statNums[1]) statNums[1].textContent = 97 + found;
  if (statNums[2]) statNums[2].textContent = 20 + adopt;
  if (statNums[3]) statNums[3].textContent = (200 + pets.length) + '+';
}

// ========== SEARCH ==========
// Đọc bộ lọc từ biểu mẫu tìm kiếm (có thể thiếu trên một số trang)
// ===== Tìm kiếm: chuẩn hóa không dấu + tách từ khóa, mọi từ phải khớp (AND), dựng "kho chữ" một lần cho mỗi thẻ =====
const foldText = s => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
const tokenize = s => foldText(s).split(/[^a-z0-9]+/).filter(Boolean);
function cardHaystack(card) {
  if (card._hay === undefined) card._hay = card.dataset.hay ? card.dataset.hay : foldText(card.textContent);
  return card._hay;
}
function readSearchForm() {
  const val = id => { const el = document.getElementById(id); return el ? el.value : ''; };
  return { keyword: PFSec.cleanText(val('sKeyword'), 80).toLowerCase(), type: val('sType').toLowerCase(), area: val('sArea').toLowerCase(), status: val('sStatus') };
}
function doSearch(params) {
  const q = (params && typeof params === 'object' && !(params instanceof Event)) ? params : readSearchForm();
  // Trang này không có danh sách thú cưng (vd: trang chủ) → chuyển sang trang Thú cưng kèm bộ lọc
  if (!document.getElementById('petsGrid')) {
    try { sessionStorage.setItem('pf_pending_search', JSON.stringify(q)); } catch (e) { }
    window.location.href = (window.location.pathname.replace(/\\/g, '/').includes('/pages/') ? '' : 'pages/') + 'pets.html';
    return;
  }
  const keyword = q.keyword || '', type = q.type || '', area = q.area || '', status = ['lost', 'found', 'adopt'].includes(q.status) ? q.status : '';
  const kwTokens = tokenize(keyword), typeTokens = tokenize(type), areaTokens = tokenize(area);
  let count = 0, total = 0;
  const cards = document.querySelectorAll('.pet-card');
  cards.forEach(card => {
    total++;
    const hay = cardHaystack(card);
    const ok = kwTokens.every(w => hay.includes(w)) && typeTokens.every(w => hay.includes(w)) && areaTokens.every(w => hay.includes(w)) && (!status || card.dataset.status === status);
    card.style.display = ok ? 'block' : 'none';
    if (ok) count++;
  });
  const banner = document.getElementById('searchBanner');
  const bannerText = document.getElementById('searchBannerText');
  if (keyword || type || area || status) {
    if (banner) banner.style.display = 'flex';
    if (bannerText) bannerText.textContent = `Tìm thấy ${count} / ${total} tin phù hợp`;
  } else {
    if (banner) banner.style.display = 'none';
    document.querySelectorAll('.pet-card').forEach(c => c.style.display = 'block');
  }
  const petsSection = document.querySelector('#pets');
  if (petsSection) petsSection.scrollIntoView({ behavior: 'smooth' });
}
// Áp dụng bộ lọc được chuyển từ trang chủ (sau khi danh sách thẻ đã được tạo)
function applyPendingSearch() {
  let raw = null;
  try { raw = sessionStorage.getItem('pf_pending_search'); sessionStorage.removeItem('pf_pending_search'); } catch (e) { }
  if (!raw || !document.getElementById('petsGrid')) return;
  try {
    const q = JSON.parse(raw);
    doSearch({ keyword: PFSec.cleanText(q.keyword, 80).toLowerCase(), type: PFSec.cleanText(q.type, 30).toLowerCase(), area: PFSec.cleanText(q.area, 80).toLowerCase(), status: q.status });
  } catch (e) { /* bỏ qua dữ liệu hỏng */ }
}
function clearSearch() {
  ['sKeyword', 'sType', 'sArea', 'sStatus'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.querySelectorAll('.pet-card').forEach(c => c.style.display = 'block');
  const banner = document.getElementById('searchBanner');
  if (banner) banner.style.display = 'none';
}

// ========== PET MODAL ==========
// ========== IMAGE LIGHTBOX ==========
let currentGalleryImages = [];
let currentLightboxIndex = 0;
function openLightbox(index) {
  if (!currentGalleryImages.length) return;
  currentLightboxIndex = index;
  renderLightbox();
  document.getElementById('lightboxOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function renderLightbox() {
  const img = document.getElementById('lightboxImg');
  img.src = currentGalleryImages[currentLightboxIndex];
  const counter = document.getElementById('lightboxCounter');
  const nav = document.querySelectorAll('.lightbox-nav');
  if (currentGalleryImages.length > 1) {
    counter.textContent = (currentLightboxIndex + 1) + ' / ' + currentGalleryImages.length;
    counter.style.display = 'block';
    nav.forEach(b => b.style.display = 'flex');
  } else {
    counter.style.display = 'none';
    nav.forEach(b => b.style.display = 'none');
  }
}
function lightboxNav(dir, e) {
  if (e) e.stopPropagation();
  currentLightboxIndex = (currentLightboxIndex + dir + currentGalleryImages.length) % currentGalleryImages.length;
  renderLightbox();
}
function closeLightbox() {
  document.getElementById('lightboxOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
function closeOnLightboxBackdrop(e) {
  if (e.target.id === 'lightboxOverlay') closeLightbox();
}
document.addEventListener('keydown', e => {
  if (!document.getElementById('lightboxOverlay').classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') lightboxNav(1);
  if (e.key === 'ArrowLeft') lightboxNav(-1);
});

function openPetModal(name, breed, area, phone, date, icon, desc, zalo, imageData, pet) {
  currentModalPet = pet || { name, phone, zalo, area, date, icon };
  backToPetDetail();
  document.getElementById('modalTitle').textContent = '' + name;
  document.getElementById('modalBreed').textContent = breed;
  document.getElementById('modalArea').textContent = area;
  document.getElementById('modalDate').textContent = date;
  document.getElementById('modalPhone').textContent = phone || '—';
  // Image: show real photo if available, else emoji
  const imgBox = document.getElementById('modalIcon');
  const galleryBox = document.getElementById('modalGallery');
  const galleryHint = document.getElementById('modalGalleryHint');
  const photos = (imageData || []).map(PFSec.safeImageSrc).filter(Boolean);
  currentGalleryImages = photos;
  if (photos[0]) {
    imgBox.textContent = '';
    const big = document.createElement('img');
    big.src = photos[0]; big.alt = name; big.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:10px;cursor:pointer';
    big.addEventListener('click', () => openLightbox(0));
    imgBox.appendChild(big);
  } else {
    imgBox.textContent = icon;
  }
  if (photos.length > 1) {
    galleryBox.style.display = 'grid';
    galleryHint.style.display = 'block';
    galleryBox.textContent = '';
    photos.forEach((src, i) => {
      const im = document.createElement('img');
      im.src = src; im.alt = name + ' - ảnh ' + (i + 1);
      im.addEventListener('click', () => openLightbox(i));
      galleryBox.appendChild(im);
    });
  } else {
    galleryBox.style.display = 'none';
    galleryHint.style.display = 'none';
    galleryBox.innerHTML = '';
  }
  if (desc) {
    let descEl = document.getElementById('modalDesc');
    if (!descEl) {
      descEl = document.createElement('div');
      descEl.id = 'modalDesc';
      descEl.className = 'modal-detail';
      descEl.style.marginTop = '8px';
      document.querySelector('.modal-pet-info').after(descEl);
    }
    descEl.textContent = '';
    if (desc) { const lbl = document.createElement('strong'); lbl.textContent = 'Đặc điểm:'; descEl.append(lbl, ' ' + desc); }
    descEl.style.display = desc ? 'block' : 'none';
  }
  // Store phone + zalo for contact buttons
  const callBtn = document.getElementById('modalCall');
  callBtn.href = '#';
  callBtn.dataset.phone = phone || '';
  const zaloBtn = document.getElementById('modalZalo');
  zaloBtn.href = '#';
  zaloBtn.dataset.zalo = zalo || '';
  zaloBtn.dataset.phone = phone || '';
  // Reset phone display
  document.getElementById('modalPhoneDisplay').style.display = 'none';
  document.getElementById('modalZaloInfo').style.display = 'none';
  document.getElementById('petModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
// ========== CONTACT PANE (thông tin liên lạc người đăng tin) ==========
let currentModalPet = null;

function showPhoneNumber(e) { if (e) e.preventDefault(); showPetContact(); }
function showZaloLink(e) { if (e) e.preventDefault(); showPetContact(); }

// Tách nhiều số điện thoại trong một chuỗi ("0985.273.985 / 0326.447.508") thành từng số riêng
function splitPhones(phone) {
  return (phone || '').split(/[\/,;|]| hoặc /i).map(x => x.trim()).filter(x => x.replace(/\D/g, '').length >= 8);
}

function getZaloUrl(zalo, phone) {
  if (zalo && /^https?:/i.test(zalo)) return PFSec.safeUrl(zalo);
  const first = splitPhones(phone)[0] || '';
  const v = (zalo || first).replace(/[^\d]/g, '');
  return v ? 'https://zalo.me/' + v : '';
}

async function showPetContact() {
  const basePet = currentModalPet || {};
  const modal = document.querySelector('#petModal .modal');
  if (!modal) return;
  // Thông tin liên hệ không nằm trong dữ liệu công khai: chỉ người đã đăng nhập mới tải được (từng tin một)
  if (typeof currentUser === 'undefined' || !currentUser) {
    if (typeof showToast === 'function') showToast('Vui lòng đăng nhập để xem thông tin liên hệ của người đăng tin.');
    if (typeof openAuthModal === 'function') openAuthModal('login');
    return;
  }
  let c = null;
  try { c = (basePet.phone || basePet.zalo || basePet.ownerEmail) ? { phone: basePet.phone, zalo: basePet.zalo, email: basePet.ownerEmail } : await PFDB.getContact(basePet.id); } catch (e) { c = null; }
  if (c === null) { if (typeof showToast === 'function') showToast('Không tải được thông tin liên hệ. Hãy thử lại sau.'); return; }
  const pet = { ...basePet, phone: c.phone || '', zalo: c.zalo || '', ownerEmail: c.email || '' };
  const owner = {};
  const ownerName = pet.ownerName || owner.name || 'Người đăng tin';
  const phone = pet.phone || owner.phone || '';
  const email = (pet.ownerEmail && !/\.(local|demo)$/.test(pet.ownerEmail)) ? pet.ownerEmail : '';
  const sl = PFSec.parseSocialLink(pet.zalo);
  const socialUrl = sl.ok && sl.url ? sl.url : PFSec.safeUrl(pet.zalo || '', { httpsOnly: true });
  const socialLabel = sl.kind === 'facebook' ? 'Facebook' : sl.kind === 'zalo' ? 'Zalo' : 'Liên kết liên hệ';
  const initials = ownerName.trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase();
  const ownerPhoto = PFSec.safeImageSrc(owner.avatarPhoto);
  const avatar = ownerPhoto
    ? `<img src="${escapeHtml(ownerPhoto)}" alt="avatar"/>`
    : `<span>${escapeHtml(initials || '🐾')}</span>`;
  const statusTxt = { lost: 'đang tìm thú cưng thất lạc', found: 'đang giữ thú cưng nhặt được', adopt: 'đang tìm người nhận nuôi' }[pet.status] || 'đã đăng tin';

  let pane = document.getElementById('petContactPane');
  if (!pane) { pane = document.createElement('div'); pane.id = 'petContactPane'; modal.appendChild(pane); }
  pane.innerHTML = `
    <button class="contact-back" type="button" onclick="backToPetDetail()">← Quay lại chi tiết</button>
    <div class="contact-head">
      <div class="contact-avatar">${avatar}</div>
      <div>
        <div class="contact-label">Người đăng tin</div>
        <div class="contact-name">${escapeHtml(ownerName)}</div>
        <div class="contact-sub">${statusTxt}</div>
      </div>
    </div>
    <div class="contact-pet">
      <span class="contact-pet-icon">${escapeHtml(pet.icon || '🐾')}</span>
      <div><strong>${escapeHtml(pet.name || '')}</strong><br><small>${escapeHtml(pet.location || pet.area || '—')} · ${escapeHtml(pet.date || '—')}</small></div>
    </div>
    <div class="contact-list">
      <div class="contact-row">
        <div class="cv"><small>Số điện thoại</small><b>${escapeHtml(phone || 'Chưa cung cấp')}</b></div>
        ${phone ? `<button type="button" class="contact-copy" data-copy="${escapeHtml(phone)}" onclick="copyContactValue(this.dataset.copy, this)">Sao chép</button>` : ''}
      </div>
      ${socialUrl ? `<div class="contact-row"><div class="cv"><small>${escapeHtml(socialLabel)}</small><b>${escapeHtml(socialUrl.replace(/^https?:\/\//, ''))}</b></div><a class="contact-copy" href="${escapeHtml(socialUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit">Mở</a><button type="button" class="contact-copy" data-copy="${escapeHtml(socialUrl)}" onclick="copyContactValue(this.dataset.copy, this)">Sao chép</button></div>` : ''}
      ${email ? `<div class="contact-row"><div class="cv"><small>Email</small><b>${escapeHtml(email)}</b></div><button type="button" class="contact-copy" data-copy="${escapeHtml(email)}" onclick="copyContactValue(this.dataset.copy, this)">Sao chép</button></div>` : ''}
    </div>
    <div class="contact-tip">ℹ️ Đây chỉ là thông tin liên lạc của người đăng tin. Hãy tự liên hệ, hỏi thêm đặc điểm nhận dạng để xác minh, hẹn gặp ở nơi công cộng và không chuyển tiền trước cho người lạ.</div>`;

  modal.classList.add('show-contact');
}

function backToPetDetail() {
  const modal = document.querySelector('#petModal .modal');
  if (modal) modal.classList.remove('show-contact');
}

function copyContactValue(val, btn) {
  const done = () => { const t = btn.textContent; btn.textContent = 'Đã chép'; setTimeout(() => btn.textContent = t, 1500); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(val).then(done, done);
  else { const ta = document.createElement('textarea'); ta.value = val; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); done(); }
}

// ========== FILTERS ==========
let currentFilter = 'all';
function filterPets(btn, status) {
  currentFilter = status;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.pet-card').forEach(card => {
    card.style.display = (status === 'all' || card.dataset.status === status) ? 'block' : 'none';
  });
}
function switchFormTab(btn, type) {
  document.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('activeFormType').value = type;
}

// ========== ADD FAV BUTTONS TO EXISTING CARDS ==========
function addFavButtonsToExistingCards() {
  const favs = loadFavs();
  document.querySelectorAll('.pet-card').forEach((card, i) => {
    if (card.querySelector('.fav-btn')) return; // already has one
    const petId = 'static_' + i;
    card.dataset.id = petId;
    // Set data attributes from existing content
    const nameEl = card.querySelector('.pet-name');
    const metaEls = card.querySelectorAll('.pet-meta');
    if (nameEl) card.dataset.name = nameEl.textContent.trim().toLowerCase();
    if (metaEls[0]) card.dataset.type = metaEls[0].textContent.trim().toLowerCase();
    if (metaEls[1]) card.dataset.area = metaEls[1].textContent.trim().toLowerCase();
    const isFav = favs.includes(petId);
    const btn = document.createElement('button');
    btn.className = 'fav-btn' + (isFav ? ' active' : '');
    btn.dataset.id = petId;
    btn.textContent = isFav ? '❤️' : '🤍';
    btn.title = 'Lưu yêu thích';
    btn.addEventListener('click', (e) => toggleFav(petId, btn, e));
    card.insertBefore(btn, card.firstChild);
  });
}

