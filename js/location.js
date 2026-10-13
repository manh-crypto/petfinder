// User area preference and local-first pet ordering.
function getUserArea() {
  try { return localStorage.getItem('pf_user_area') || ''; } catch (error) { return ''; }
}

function setUserArea(area) {
  try { localStorage.setItem('pf_user_area', area); } catch (error) {}
}

function saveUserLocation() {
  const select = document.getElementById('locSelect');
  const area = select ? select.value : '';
  if (!area) { showToast('Vui lòng chọn khu vực của bạn'); return; }
  setUserArea(area);
  closeLocationModal();
  showLocalBanner(area);
  resortPetsByArea(area);
  showToast('Đã lưu khu vực: ' + area);
}

function closeLocationModal() {
  const modal = document.getElementById('locationModal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
}

function skipLocation() {
  setUserArea('__skipped__');
  closeLocationModal();
}

function resetLocation() {
  localStorage.removeItem('pf_user_area');
  const banner = document.getElementById('localBanner');
  const modal = document.getElementById('locationModal');
  if (banner) banner.classList.remove('show');
  if (modal) modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function showLocalBanner(area) {
  if (!area || area === '__skipped__') return;
  const banner = document.getElementById('localBanner');
  const areaText = document.getElementById('localBannerArea');
  const badge = document.getElementById('localBannerBadge');
  if (areaText) areaText.textContent = area;
  if (badge) badge.textContent = '' + area;
  if (banner) banner.classList.add('show');
}

function resortPetsByArea(area) {
  if (!area || area === '__skipped__') return;
  const grid = document.getElementById('petsGrid');
  if (!grid) return;

  const areaLower = area.toLowerCase();
  const cards = Array.from(grid.querySelectorAll('.pet-card'));
  const priority = cards.filter(card => card.dataset.status === 'lost' && (card.dataset.area || '').toLowerCase().includes(areaLower));
  const rest = cards.filter(card => !priority.includes(card));

  priority.forEach(card => {
    card.classList.add('card-new-ring');
    grid.appendChild(card);
  });
  rest.forEach(card => grid.appendChild(card));
}
