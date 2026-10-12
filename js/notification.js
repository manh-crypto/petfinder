// ===== Notifications: new lost-pet alert popup =====
// ========== ALERT POPUP ==========
let alertTargetId = null;
function showAlertPopup(pet) {
  const area = getUserArea();
  if (!area || area === '__skipped__') return;
  if (pet.status !== 'lost') return;
  const petArea = (pet.area + ' ' + pet.location).toLowerCase();
  const userArea = area.toLowerCase();
  // Check area match (flexible: if user area contains district name or vice-versa)
  const match = petArea.includes(userArea) || userArea.includes(petArea.split(',')[0]) || userArea === 'tp. hồ chí minh (tất cả)';
  if (!match) return;

  alertTargetId = pet.id;
  // Set content
  const imgEl = document.getElementById('alertImg');
  imgEl.textContent = '';
  const photo = PFSec.safeImageSrc(pet.imageData && pet.imageData[0]);
  if (photo) {
    const im = document.createElement('img');
    im.src = photo; im.alt = pet.name; im.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:10px';
    imgEl.appendChild(im);
  } else {
    imgEl.textContent = pet.icon || '🐾';
  }
  document.getElementById('alertName').textContent = '🐾 ' + pet.name + ' – ' + (pet.breed || pet.type);
  document.getElementById('alertMeta').textContent = '📍 ' + (pet.location || pet.area) + ' · ' + pet.date;
  document.getElementById('alertArea').textContent = '📍 ' + (pet.area || '');
  const popup = document.getElementById('alertPopup');
  popup.classList.add('show');
  // Auto-hide after 12s
  setTimeout(() => popup.classList.remove('show'), 12000);
}
function closeAlertPopup() {
  document.getElementById('alertPopup').classList.remove('show');
}
function scrollToPetAndClose() {
  closeAlertPopup();
  if (alertTargetId) {
    const card = document.querySelector('.pet-card[data-id="' + CSS.escape(alertTargetId) + '"]');
    if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); card.style.outline = '3px solid var(--red)'; setTimeout(() => card.style.outline = '', 2000); }
  }
}

