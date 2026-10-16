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
  // Thử địa chỉ đầy đủ, rồi chỉ khu vực; nếu dịch vụ tìm địa chỉ lỗi thì dùng tâm tỉnh/thành để tin vẫn hiện trên bản đồ
  const tries = [[location, area], [area]].map(a => a.filter(Boolean).join(', ')).filter((v, i, arr) => v && arr.indexOf(v) === i);
  if (window.PetFinderGeocoding) {
    for (const q of tries) {
      try {
        const results = await window.PetFinderGeocoding.search([q, 'Việt Nam'].join(', '));
        if (results[0]) return { lat: results[0].lat, lng: results[0].lng };
      } catch (error) { console.warn('Could not geocode pet location:', error); }
    }
  }
  if (typeof pfProvinceIndex === 'function' && typeof PF_PROVINCES !== 'undefined') {
    const i = pfProvinceIndex({ area, location });
    if (i >= 0) return { lat: PF_PROVINCES[i][1], lng: PF_PROVINCES[i][2] };
  }
  return {};
}

async function submitPost() {
  const status = document.getElementById('activeFormType').value;
  const type = PFSec.cleanText(document.getElementById('fType').value, 30);
  // Tin nhặt được / cho nhận nuôi không cần tên thú cưng và ngày thất lạc: tự đặt tên theo loại, ngày = hôm nay
  const lostOnly = status === 'lost';
  const name = lostOnly ? document.getElementById('fName').value.trim() : (type ? type + (status === 'found' ? ' nhặt được' : ' cần nhận nuôi') : '');
  if (!lostOnly) { const d = new Date(); document.getElementById('fDate').value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  const breed = document.getElementById('fBreed').value.trim();
  const gender = document.getElementById('fGender').value;
  const date = document.getElementById('fDate').value;
  const area = document.getElementById('fArea').value;
  const location = document.getElementById('fLocation').value.trim();
  const desc = document.getElementById('fDesc').value.trim();
  const phone = document.getElementById('fPhone').value.trim();
  const zalo = document.getElementById('fZalo').value.trim();
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
  const coordinates = pendingCoords ? { lat: pendingCoords.lat, lng: pendingCoords.lng } : await geocodePetLocation(location, area);
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
  // Chờ máy chủ xác nhận rồi mới báo thành công (trước đây báo thành công ngay, nếu máy chủ từ chối thì tin biến mất âm thầm)
  if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Đang đăng tin...'; }
  try { await savePets(pets, { wait: true }); }
  catch (e) {
    if (submitButton) { submitButton.disabled = false; submitButton.textContent = originalButtonText; }
    const code = e && e.code;
    console.error('Đăng tin thất bại:', code, e && e.message);
    return fail(code === 'permission-denied'
      ? 'Máy chủ từ chối lưu tin (permission-denied). Hãy kiểm tra: đã bấm liên kết xác thực email chưa (tài khoản email/mật khẩu), tài khoản có bị khóa không, và luật Firestore đã được dán + Publish bản mới nhất chưa. Nếu vừa xác thực email, hãy đăng xuất rồi đăng nhập lại.'
      : 'Không lưu được tin lên máy chủ (' + (code || 'lỗi mạng') + '). Hãy kiểm tra mạng rồi thử lại.');
  }
  if (submitButton) { submitButton.disabled = false; submitButton.textContent = originalButtonText; }
  try { sessionStorage.setItem('pf_focus_pet', pet.id); } catch (e) { }
  if (typeof refreshMapData === 'function') refreshMapData();

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
  pendingCoords = null; { const gs = document.getElementById('fGeoStatus'); if (gs) gs.textContent = ''; }
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
  // Dữ liệu tìm kiếm dựng sẵn một lần (không dấu, tách theo trường để chấm điểm)
  card.dataset.fName = pet.name; card.dataset.fKind = [pet.type, pet.breed, pet.gender].filter(Boolean).join(' ');
  card.dataset.fPlace = [pet.area, pet.location].filter(Boolean).join(' '); card.dataset.fDesc = pet.desc || '';
  card.dataset.prov = typeof pfProvinceIndex === 'function' ? String(pfProvinceIndex(pet)) : '-1';
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
}

// ========== SEARCH ==========
// Đọc bộ lọc từ biểu mẫu tìm kiếm (có thể thiếu trên một số trang)
// ===== TÌM KIẾM =====
// - Chuẩn hóa không dấu (kể cả đ), tách từ khóa; MỌI từ khóa phải khớp (AND).
// - Một từ khóa khớp một từ trong tin khi trùng hẳn, hoặc (từ ≥ 3 ký tự) là TIỀN TỐ của từ đó → "ha" không còn khớp "thạnh" hay "nội" không khớp "ngoại".
// - Chấm điểm theo trường: tên (5) > loài/giống (3) > khu vực/địa chỉ (2) > mô tả (1); kết quả xếp theo điểm.
// - Khu vực: tỉnh/thành phố được so theo TỈNH suy ra từ địa chỉ/tọa độ (pfProvinceIndex), quận/huyện so theo nguyên cụm → chọn "Hà Nội" không ra tin ở Quận 12.
const foldText = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
const wordsOf = s => foldText(s).split(/[^a-z0-9]+/).filter(Boolean);
const tokenize = wordsOf;
let _pfOrderSeq = 0;
function cardIx(card) {
  if (card._ix) return card._ix;
  const d = card.dataset;
  const field = (txt, w) => ({ w, words: wordsOf(txt) });
  const place = d.fPlace || d.area || '';
  const norm = typeof pfNorm === 'function' ? pfNorm : (s => ' ' + foldText(s).replace(/[^a-z0-9]+/g, ' ').trim() + ' ');
  const prov = d.prov !== undefined ? Number(d.prov) : (typeof pfProvinceIndex === 'function' ? pfProvinceIndex({ area: place }) : -1);
  card._ix = {
    name: field(d.fName || d.name || '', 5), kind: field(d.fKind || d.type || '', 3), place: field(place, 2), desc: field(d.fDesc || card.textContent || '', 1),
    placeNorm: norm(place), prov
  };
  if (card._order === undefined) card._order = _pfOrderSeq++;
  return card._ix;
}
function fieldScore(f, tok) {
  let best = 0;
  for (const w of f.words) {
    if (w === tok) return f.w + 0.5;
    if (tok.length >= 3 && w.startsWith(tok)) best = f.w;
  }
  return best;
}
function tokenScore(ix, tok) { return Math.max(fieldScore(ix.name, tok), fieldScore(ix.kind, tok), fieldScore(ix.place, tok), fieldScore(ix.desc, tok)); }
function areaMatches(ix, value) {
  const hasProv = typeof pfProvinceIndex === 'function', norm = typeof pfNorm === 'function' ? pfNorm : (s => ' ' + foldText(s).replace(/[^a-z0-9]+/g, ' ').trim() + ' ');
  const q = norm(value).trim();
  if (!q || q === 'toan quoc') return true;
  const key = ' ' + q + ' ';
  if (typeof PF_HCM_DISTRICTS !== 'undefined' && PF_HCM_DISTRICTS.some(d => key.includes(' ' + d + ' '))) return ix.placeNorm.includes(key);   // quận/huyện: khớp nguyên cụm
  if (hasProv) { const idx = pfProvinceIndex({ area: value }); if (idx >= 0) return ix.prov === idx; }                                          // tỉnh/thành: so theo tỉnh
  return ix.placeNorm.includes(key);
}
function cardMatchesArea(card, value) { return areaMatches(cardIx(card), value); }

function readSearchForm() {
  const val = id => { const el = document.getElementById(id); return el ? el.value : ''; };
  return { keyword: PFSec.cleanText(val('sKeyword'), 80), type: val('sType'), area: val('sArea'), status: val('sStatus') };
}
function doSearch(params) {
  const q = (params && typeof params === 'object' && !(params instanceof Event)) ? params : readSearchForm();
  // Trang này không có danh sách thú cưng (vd: trang chủ) → chuyển sang trang Thú cưng kèm bộ lọc
  const grid = document.getElementById('petsGrid');
  if (!grid) {
    try { sessionStorage.setItem('pf_pending_search', JSON.stringify(q)); } catch (e) { }
    window.location.href = (window.location.pathname.replace(/\\/g, '/').includes('/pages/') ? '' : 'pages/') + 'pets.html';
    return;
  }
  const keyword = q.keyword || '', type = q.type || '', area = q.area || '', status = ['lost', 'found', 'adopt'].includes(q.status) ? q.status : '';
  const kw = wordsOf(keyword), tp = wordsOf(type);
  const cards = Array.from(grid.querySelectorAll('.pet-card'));
  const hits = [];
  cards.forEach(card => {
    const ix = cardIx(card);
    let score = 0, ok = true;
    for (const tok of kw) { const s = tokenScore(ix, tok); if (!s) { ok = false; break; } score += s; }
    if (ok) for (const tok of tp) { if (!Math.max(fieldScore(ix.kind, tok), fieldScore(ix.name, tok))) { ok = false; break; } }
    if (ok && !areaMatches(ix, area)) ok = false;
    if (ok && status && card.dataset.status !== status) ok = false;
    card.style.display = ok ? '' : 'none';
    if (ok) hits.push({ card, score });
  });
  // Xếp theo mức phù hợp khi có từ khóa; không có từ khóa thì giữ thứ tự gốc
  if (kw.length) hits.sort((a, b) => b.score - a.score || a.card._order - b.card._order);
  else hits.sort((a, b) => a.card._order - b.card._order);
  const frag = document.createDocumentFragment();
  hits.forEach(h => frag.appendChild(h.card));
  grid.insertBefore(frag, grid.firstChild);
  const banner = document.getElementById('searchBanner');
  const bannerText = document.getElementById('searchBannerText');
  if (keyword || type || area || status) {
    const where = area && !/^toan quoc$/.test(foldText(area).trim()) ? ' tại ' + area : '';
    if (banner) banner.style.display = 'flex';
    if (bannerText) bannerText.textContent = hits.length ? `Tìm thấy ${hits.length} / ${cards.length} tin phù hợp${where}` : `Không có tin phù hợp${where}. Hãy thử bỏ bớt bộ lọc hoặc đổi từ khóa.`;
  } else if (banner) banner.style.display = 'none';
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
    doSearch({ keyword: PFSec.cleanText(q.keyword, 80), type: PFSec.cleanText(q.type, 30), area: PFSec.cleanText(q.area, 80), status: q.status });
  } catch (e) { /* bỏ qua dữ liệu hỏng */ }
}
function clearSearch() {
  ['sKeyword', 'sType', 'sArea', 'sStatus'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  doSearch({ keyword: '', type: '', area: '', status: '' });
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
  {
    let descEl = document.getElementById('modalDesc');
    if (!descEl && desc) {
      descEl = document.createElement('div');
      descEl.id = 'modalDesc';
      descEl.className = 'modal-detail';
      document.querySelector('.modal-pet-info > div:not(.modal-pet-img)').appendChild(descEl);
    }
    if (descEl) {
      descEl.textContent = '';
      if (desc) { const lbl = document.createElement('strong'); lbl.textContent = 'Đặc điểm:'; const v = document.createElement('span'); v.textContent = desc; descEl.append(lbl, v); }
      descEl.style.display = desc ? '' : 'none';
    }
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
  applyFormTypeFields(type);
}
// Chỉ tin thất lạc mới cần tên thú cưng và ngày thất lạc
function applyFormTypeFields(type) {
  const lost = type === 'lost';
  ['grpName', 'grpDate'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = lost ? '' : 'none'; });
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


// ========== "VỊ TRÍ CỦA TÔI" KHI ĐĂNG TIN ==========
// Lấy GPS → định vị ngược ra địa chỉ → tự điền "Địa điểm" và "Khu vực"; tọa độ GPS được dùng trực tiếp (không cần tìm lại địa chỉ).
let pendingCoords = null;          // { lat, lng } lấy từ GPS, bị hủy khi người dùng tự sửa ô "Địa điểm"

function pfSetFormArea(idx, addr) {
  const sel = document.getElementById('fArea'); if (!sel || idx < 0) return false;
  const norm = t => (typeof pfNorm === 'function' ? pfNorm(t) : String(t)).trim();
  const opts = Array.from(sel.options);
  const pick = txt => opts.find(o => o.value && norm(o.textContent) === norm(txt));
  let o = null;
  if (idx === 1) {   // TP.HCM: ưu tiên quận/huyện nếu có trong danh sách, không thì chọn thành phố
    const subs = [addr.city_district, addr.suburb, addr.district, addr.county, addr.town, addr.quarter].filter(Boolean);
    for (const t of subs) { const n = norm(t).replace(/^(quan|huyen|thanh pho|tp)\\s+/, ''); o = opts.find(x => x.value && (norm(x.textContent) === norm(t) || norm(x.textContent).replace(/^quan\\s+/, '') === n)); if (o) break; }
    o = o || pick('TP. Hồ Chí Minh');
  } else o = pick(PF_PROVINCES[idx][0]);
  if (!o) return false;
  sel.value = o.value || o.textContent; sel.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

function useMyLocationForPost(btn) {
  const status = document.getElementById('fGeoStatus');
  const say = (m, bad) => { if (status) { status.textContent = m; status.style.color = bad ? 'var(--red)' : 'var(--green)'; } };
  if (!navigator.geolocation) return say('Trình duyệt không hỗ trợ định vị. Hãy nhập địa điểm thủ công.', true);
  btn.disabled = true; btn.classList.add('is-busy'); say('Đang lấy vị trí của bạn...');
  navigator.geolocation.getCurrentPosition(async pos => {
    const lat = Math.round(pos.coords.latitude * 1e4) / 1e4, lng = Math.round(pos.coords.longitude * 1e4) / 1e4;   // làm tròn ~11 m
    pendingCoords = { lat, lng };
    let text = '', idx = -1, addr = {};
    try {
      const r = await window.PetFinderGeocoding.reverse(lat, lng); addr = r.address || {};
      const street = [addr.house_number, addr.road].filter(Boolean).join(' ');
      const area = [addr.quarter || addr.neighbourhood, addr.suburb, addr.city_district || addr.district || addr.county, addr.city || addr.state].filter((v, i, a) => v && a.indexOf(v) === i);
      text = [street].concat(area).filter(Boolean).join(', ') || (r.displayName || '').split(',').slice(0, 4).join(',').trim();
      if (r.approximate && text) text = 'Gần ' + text;      // chỉ biết quận/huyện gần nhất (dịch vụ địa chỉ lỗi): ghi rõ là khu vực gần đúng
      idx = typeof pfFromAddress === 'function' ? pfFromAddress(addr) : -1;
    } catch (e) { console.warn('Không định vị ngược được:', e); }
    if (idx < 0 && typeof pfNearestProvince === 'function') idx = pfNearestProvince(lat, lng);
    const loc = document.getElementById('fLocation');
    if (!text && typeof pfGazetteerNearest === 'function') { const n = pfGazetteerNearest(lat, lng); if (n) text = 'Gần ' + n.full; }
    if (loc) { loc.value = text || 'Vị trí hiện tại của tôi'; loc.dataset.gps = loc.value; }
    const okArea = pfSetFormArea(idx, addr);
    say('✔ Đã lấy vị trí của bạn' + (okArea ? ' và chọn khu vực' : '') + (pos.coords.accuracy ? ' (sai số khoảng ' + Math.round(pos.coords.accuracy) + ' m)' : '') + '. Bạn vẫn có thể sửa lại địa điểm.');
    btn.disabled = false; btn.classList.remove('is-busy');
  }, err => {
    pendingCoords = null; btn.disabled = false; btn.classList.remove('is-busy');
    say(err && err.code === 1 ? 'Bạn đã từ chối quyền vị trí. Hãy cho phép truy cập vị trí cho trang web trong trình duyệt hoặc nhập địa điểm thủ công.' : 'Không lấy được vị trí. Hãy thử lại hoặc nhập địa điểm thủ công.', true);
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
}

function initPostGeoButton() {
  const input = document.getElementById('fLocation');
  if (!input || document.getElementById('fGeoBtn')) return;
  const group = input.closest('.form-group') || input.parentNode;
  const box = document.createElement('div');
  box.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin-top:6px';
  box.innerHTML = '<button type="button" id="fGeoBtn" class="geo-btn" style="padding:7px 14px;border:1.5px solid var(--orange);background:var(--orange-pale);color:var(--orange-dark);border-radius:20px;font-weight:800;font-size:.84rem;cursor:pointer;font-family:inherit">📍 Dùng vị trí của tôi</button><span id="fGeoStatus" style="font-size:.8rem;font-weight:700"></span>';
  group.appendChild(box);
  box.querySelector('button').addEventListener('click', e => useMyLocationForPost(e.currentTarget));
  // Tự sửa địa điểm → bỏ tọa độ GPS cũ (sẽ tìm lại theo địa chỉ mới)
  input.addEventListener('input', () => { if (pendingCoords && input.value !== input.dataset.gps) { pendingCoords = null; const s = document.getElementById('fGeoStatus'); if (s) s.textContent = ''; } });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPostGeoButton); else initPostGeoButton();
