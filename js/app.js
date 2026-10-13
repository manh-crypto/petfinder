// ===== App entry point: component loader, shop ads filter, init wiring =====

// Component loader for pages that still use data-include.
// The supplied PetFinder pages have their components embedded so they also work when opened directly as file://.
async function loadComponents() {
  const slots = document.querySelectorAll('[data-include]');
  const base = document.body.dataset.componentsBase || 'components/';
  await Promise.all(Array.from(slots).map(async (slot) => {
    const name = slot.getAttribute('data-include');
    try {
      const res = await fetch(`${base}${name}.html`);
      slot.innerHTML = await res.text();
    } catch (e) {
      console.error('Could not load component:', name, e);
    }
  }));
}



// ===== VIEW SWITCHING =====
// Chọn mục nào thì chỉ hiện mục đó. Các mục "riêng" (Đăng tin, Cửa hàng) chỉ hiện khi
// được chọn qua #form / #shop-ads; còn lại trang hiện nội dung chính của trang đó.
const STANDALONE_VIEWS = ['form', 'shop-ads'];

function normalizePath(p) {
  p = (p || '').replace(/\\/g, '/');
  return p.endsWith('/') ? p + 'index.html' : p;
}

function getCurrentView() {
  const h = decodeURIComponent((window.location.hash || '').replace('#', ''));
  return STANDALONE_VIEWS.includes(h) ? h : 'home';
}

function renderView() {
  const view = getCurrentView();
  // Biểu mẫu đăng tin chỉ hoạt động ở trang có mã xử lý (pets.js): trang khác thì chuyển về trang chủ
  if (view === 'form' && typeof submitPost !== 'function') {
    const inPages = window.location.pathname.replace(/\\/g, '/').includes('/pages/');
    window.location.replace((inPages ? '../' : '') + 'index.html#form');
    return;
  }
  document.querySelectorAll('body > section').forEach(sec => {
    const isStandalone = STANDALONE_VIEWS.includes(sec.id);
    const show = isStandalone ? sec.id === view : view === 'home';
    sec.classList.toggle('view-hidden', !show);
  });
  setActiveNav();
}

// Chuyển view bằng code (vd: sau khi đăng tin xong quay về danh sách)
function showView(name) {
  const target = STANDALONE_VIEWS.includes(name) ? '#' + name : '';
  const url = window.location.pathname + window.location.search + target;
  try { history.pushState(null, '', url); } catch (e) { window.location.hash = target; }
  renderView();
  window.scrollTo({ top: 0 });
}

// Sau khi hiển thị view, cuộn tới mục con nếu hash trỏ vào một mục thường (vd #vet-clinics)
function scrollToHashTarget() {
  const id = decodeURIComponent((window.location.hash || '').replace('#', ''));
  if (!id || STANDALONE_VIEWS.includes(id)) { window.scrollTo({ top: 0 }); return; }
  const el = document.getElementById(id);
  if (el && !el.classList.contains('view-hidden')) el.scrollIntoView();
}

// Bấm link trỏ về chính trang hiện tại (Trang chủ / Đăng tin / Cửa hàng...) thì đổi view, không tải lại trang
function interceptSamePageLinks() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey) return;
    let url;
    try { url = new URL(a.getAttribute('href'), window.location.href); } catch (err) { return; }
    if (url.origin !== window.location.origin && url.protocol !== 'file:') return;
    if (normalizePath(url.pathname) !== normalizePath(window.location.pathname)) return;
    const id = decodeURIComponent((url.hash || '').replace('#', ''));
    if (id && !STANDALONE_VIEWS.includes(id)) return; // mục thường: để trình duyệt tự cuộn
    if (!id && a.getAttribute('href') === '#') return; // link giữ chỗ
    e.preventDefault();
    showView(id);
  });
}

window.addEventListener('hashchange', () => { renderView(); scrollToHashTarget(); });
window.addEventListener('popstate', () => { renderView(); scrollToHashTarget(); });

// Chuyển tới danh sách thú cưng: nếu trang này không có danh sách thì mở trang Thú cưng
function goToPetsList() {
  const el = document.querySelector('#pets');
  if (el) {
    showView('home');
    el.scrollIntoView({ behavior: 'smooth' });
  } else {
    const inPages = window.location.pathname.replace(/\\/g, '/').includes('/pages/');
    window.location.href = (inPages ? '' : 'pages/') + 'pets.html';
  }
}

function setActiveNav() {
  const links = document.querySelectorAll('.nav-links a');
  const path = window.location.pathname.replace(/\\/g, '/');
  const hash = window.location.hash;
  links.forEach(a => a.classList.remove('active'));
  links.forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.includes('pages/pets.html') && path.endsWith('/pages/pets.html')) a.classList.add('active');
    else if (href.includes('pages/map.html') && path.endsWith('/pages/map.html')) a.classList.add('active');
    else if (href.includes('pages/veterinary.html') && path.endsWith('/pages/veterinary.html')) a.classList.add('active');
    else if (href.includes('#form') && hash === '#form') a.classList.add('active');
    else if (href.includes('#shop-ads') && hash === '#shop-ads') a.classList.add('active');
    else if ((href === 'index.html' || href === '../index.html') && !path.includes('/pages/') && (!hash || !['#form', '#shop-ads'].includes(hash))) a.classList.add('active');
  });
}

function filterShopAds(cat, btn) {
  document.querySelectorAll('.shop-ads-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#shopAdsGrid .shop-ad-card').forEach(card => {
    card.style.display = (cat === 'all' || card.dataset.cat === cat) ? 'flex' : 'none';
  });
}

// Báo lỗi kết nối cơ sở dữ liệu (để người dùng/quản trị biết vì sao không có tin)
function showDbStatus() {
  if (typeof PFDB === 'undefined' || PFDB.ok) return;
  const msg = PFDB.error === 'no-config' ? 'Chưa cấu hình Firebase (js/config.js) nên chưa có dữ liệu.' : 'Chưa kết nối được máy chủ dữ liệu. Kiểm tra mạng rồi tải lại trang.';
  if (typeof showToast === 'function') showToast(msg, 7000);
}

// ===== INIT =====
async function initApp() {
  await loadComponents();
  renderView();
  // Chờ Firebase xác định đăng nhập và tải dữ liệu lần đầu (tối đa ~9 giây) rồi mới hiển thị dữ liệu
  if (typeof PFDB !== 'undefined') { await PFDB.ready; if (typeof syncCurrentUser === 'function') syncCurrentUser(); showDbStatus(); }
  scrollToHashTarget();
  setActiveNav();

  // Restore session
  if (typeof currentUser !== 'undefined' && currentUser) {
    const navAuth = document.getElementById('navAuth');
    const nu = document.getElementById('navUser');
    if (navAuth) navAuth.style.display = 'none';
    if (nu) {
      nu.style.display = 'flex';
      renderNavUser(currentUser);
      if (currentUser.role === 'admin') document.getElementById('navAdminBtn').style.display = 'inline-block';
    }
  }

  if (typeof addFavButtonsToExistingCards === 'function') addFavButtonsToExistingCards();
  if (typeof loadSavedPets === 'function') loadSavedPets();
  if (typeof applyPendingSearch === 'function') applyPendingSearch();
  if (typeof initMap === 'function' && document.getElementById('leafletMap')) {
    setTimeout(initMap, 200);
  }

  // Check if user has set a home location, for local-first sorting
  if (document.body.dataset.locationPrompt === 'true' && typeof getUserArea === 'function') {
    const savedArea = getUserArea();
    if (!savedArea) {
      setTimeout(() => {
        const lm = document.getElementById('locationModal');
        if (lm) { lm.classList.add('open'); document.body.style.overflow = 'hidden'; }
      }, 800);
    } else if (savedArea !== '__skipped__') {
      if (typeof showLocalBanner === 'function') showLocalBanner(savedArea);
      if (typeof resortPetsByArea === 'function') resortPetsByArea(savedArea);
    }
  }
}

interceptSamePageLinks();
renderView(); // áp dụng ngay khi script chạy để không bị nhá các mục khác
window.addEventListener('load', initApp);
