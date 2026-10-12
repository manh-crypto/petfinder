// ===== Favorites =====
// ========== FAVORITE ==========
function toggleFav(petId, btn, event) {
  event.stopPropagation();
  if (!currentUser) { showToast('⚠️ Đăng nhập để lưu yêu thích'); openAuthModal('login'); return; }
  let favs = loadFavs();
  if (favs.includes(petId)) {
    favs = favs.filter(f => f !== petId);
    btn.textContent = '🤍';
    btn.classList.remove('active');
    showToast('💔 Đã bỏ yêu thích');
  } else {
    favs.push(petId);
    btn.textContent = '❤️';
    btn.classList.add('active');
    showToast('❤️ Đã lưu vào yêu thích!');
  }
  saveFavs(favs);
}
function updateFavButtons() {
  const favs = loadFavs();
  document.querySelectorAll('.fav-btn').forEach(btn => {
    const id = btn.dataset.id;
    if (favs.includes(id)) { btn.textContent = '❤️'; btn.classList.add('active'); }
    else { btn.textContent = '🤍'; btn.classList.remove('active'); }
  });
}

