// ===== Map + location priority system + Vet clinic finder =====
// ========== MAP ==========
const petMarkers = [
  { lat: 10.7802, lng: 106.7863, name: 'Bé mèo Anh lông dài (xám trắng)', type: 'Mèo Anh lông dài', status: 'lost', icon: '🐱', district: 'Phú Hữu, TP. Thủ Đức' },
  { lat: 10.8672, lng: 106.6335, name: 'Bé mèo lạc - Tô Ngọc Vân', type: 'Mèo (chưa rõ giống)', status: 'lost', icon: '🐱', district: 'Thới An, Quận 12' },
  { lat: 20.9503, lng: 105.7823, name: 'Mèo mướp vằn đen', type: 'Mèo mướp lông xù', status: 'lost', icon: '🐱', district: 'Ngọc Hồi, Thanh Trì, Hà Nội' },
  { lat: 10.8737, lng: 106.7132, name: 'Bi', type: 'Chó (bị tật ở chân)', status: 'lost', icon: '🐶', district: 'Bình Chiểu, TP. Thủ Đức' },
  { lat: 10.7965, lng: 106.6438, name: 'Bé mèo cam đang tạm giữ', type: 'Mèo cam', status: 'found', icon: '🐱', district: 'Bùi Thị Xuân, Tân Bình' },
  { lat: 10.7375, lng: 106.6469, name: 'Cún đi lạc (Poodle)', type: 'Chó Poodle', status: 'lost', icon: '🐶', district: 'Xóm Củi, Quận 8' },
  { lat: 16.0668, lng: 108.2395, name: 'Cún nhà Cô Nga', type: 'Chó nhỏ', status: 'lost', icon: '🐶', district: 'An Hải, Sơn Trà, Đà Nẵng' }
];
const statusColor = { lost: '#E24B4A', found: '#3DAB6E', adopt: '#F5823A' };
const statusLabel = { lost: 'Đang thất lạc', found: 'Đã tìm thấy', adopt: 'Chờ nhận nuôi' };
let leafletMap, mapSearchMarker, allLeafletMarkers = [], mapPoints = [];

function initMap() {
  const mapEl = document.getElementById('leafletMap');
  if (!mapEl || leafletMap) return;
  if (typeof L === 'undefined') {
    mapEl.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;padding:20px;text-align:center;color:#888;font-weight:700">Không tải được bản đồ. Vui lòng kiểm tra kết nối mạng rồi tải lại trang.</div>';
    return;
  }
  leafletMap = L.map('leafletMap', { zoomControl: true, scrollWheelZoom: true }).setView([10.7769, 106.7009], 12);
  setupBaseMap(leafletMap, mapEl);
  renderPetMarkers();
  addProvinceControl();
  applyMapFilters(false);
  // Đảm bảo Leaflet tính lại kích thước sau khi bố cục ổn định
  setTimeout(() => { if (leafletMap) { leafletMap.invalidateSize(); applyMapFilters(false); } }, 200);
}


// Vẽ lại toàn bộ điểm tin trên bản đồ từ dữ liệu hiện có (gọi lúc mở bản đồ và mỗi khi dữ liệu thay đổi)
function renderPetMarkers() {
  if (!leafletMap) return;
  allLeafletMarkers.forEach(m => leafletMap.removeLayer(m));
  allLeafletMarkers = [];
  // Tin do người dùng đăng (đã được chuyển địa chỉ → tọa độ khi đăng tin) cũng hiện trên bản đồ
  const savedMarkers = typeof loadPets === 'function'
    ? loadPets().map(pet => {
        let lat = Number(pet.lat), lng = Number(pet.lng);
        if (pet.lat == null || pet.lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
          // Tin cũ chưa có tọa độ (ví dụ đăng trước khi có chuyển địa chỉ): đặt tạm ở trung tâm tỉnh/thành, lệch nhẹ theo mã tin để không chồng lên nhau
          const i = typeof pfProvinceIndex === 'function' ? pfProvinceIndex(pet) : -1;
          if (i < 0 || typeof PF_PROVINCES === 'undefined') return null;
          let h = 0; String(pet.id || pet.name).split('').forEach(c => { h = (h * 31 + c.charCodeAt(0)) >>> 0; });
          lat = PF_PROVINCES[i][1] + ((h % 100) - 50) / 3500; lng = PF_PROVINCES[i][2] + (((h >> 7) % 100) - 50) / 3500;
        }
        return { ...pet, lat, lng, district: pet.location || pet.area, type: pet.breed || pet.type, icon: pet.icon || '🐾' };
      }).filter(Boolean)
    : [];
  mapPoints = [...petMarkers, ...savedMarkers];

  mapPoints.forEach(p => {
    const color = statusColor[p.status] || '#888';
    const icon = L.divIcon({
      html: `<div style="width:36px;height:36px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-size:1.1rem;cursor:pointer">${escapeHtml(p.icon)}</div>`,
      className: '', iconSize: [36,36], iconAnchor: [18,18]
    });
    const m = L.marker([p.lat, p.lng], { icon })
      .bindPopup(`<div style="font-family:'Nunito',sans-serif;min-width:160px;padding:4px">
        <div style="font-size:1.5rem;text-align:center;margin-bottom:6px">${escapeHtml(p.icon)}</div>
        <strong style="font-size:1rem">${escapeHtml(p.name)}</strong><br>
        <span style="font-size:0.82rem;color:#666">${escapeHtml(p.type)}</span><br>
        <span style="display:inline-block;margin:5px 0;padding:2px 8px;border-radius:10px;font-size:0.78rem;font-weight:700;background:${color}22;color:${color}">${escapeHtml(statusLabel[p.status] || '')}</span><br>
        <span style="font-size:0.82rem;color:#888">${escapeHtml(p.district)}</span>
      </div>`)
      .addTo(leafletMap);
    m._petStatus = p.status;
    m._province = pfProvinceIndex(p);
    m._latlng = [p.lat, p.lng];
    allLeafletMarkers.push(m);
  });
}

// Làm mới bản đồ khi có tin mới/đổi/xóa (dữ liệu Firestore về sau khi bản đồ đã mở), giữ nguyên vị trí đang xem
let mapRefreshTimer = 0;
function refreshMapData() {
  if (!leafletMap) return;
  renderPetMarkers();
  refreshProvinceControl();
  applyMapFilters(false, false);
}
window.addEventListener('pf:data', () => { clearTimeout(mapRefreshTimer); mapRefreshTimer = setTimeout(refreshMapData, 250); });

// ---------- Ảnh nền bản đồ: thử lần lượt nhiều nguồn, tự chuyển khi tải lỗi ----------
const BASEMAPS = [
  { name: 'OpenStreetMap', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', opts: { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' } },
  { name: 'Esri', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', opts: { maxZoom: 19, attribution: 'Tiles © Esri' } }
];

function setupBaseMap(map, mapEl) {
  let idx = -1, layer = null, errors = 0, loaded = 0, timer = null;
  const notice = document.createElement('div');
  notice.className = 'map-notice';
  notice.style.display = 'none';
  mapEl.parentNode.style.position = mapEl.parentNode.style.position || 'relative';
  mapEl.appendChild(notice);

  function useNext() {
    idx++;
    if (layer) map.removeLayer(layer);
    if (idx >= BASEMAPS.length) {
      notice.innerHTML = 'Không tải được ảnh nền bản đồ.<br><small>Hãy kiểm tra kết nối mạng và mở trang qua http(s):// (GitHub Pages) thay vì mở file trực tiếp.</small>';
      notice.style.display = 'block';
      return;
    }
    errors = 0; loaded = 0;
    const b = BASEMAPS[idx];
    layer = L.tileLayer(b.url, Object.assign({ crossOrigin: true }, b.opts));
    layer.on('tileload', () => { loaded++; notice.style.display = 'none'; clearTimeout(timer); });
    layer.on('tileerror', () => { errors++; if (loaded === 0 && errors >= 4) useNext(); });
    layer.addTo(map);
    // nếu 6 giây vẫn chưa có ô nào tải được → thử nguồn khác
    clearTimeout(timer);
    timer = setTimeout(() => { if (loaded === 0 && idx < BASEMAPS.length) useNext(); }, 6000);
  }
  useNext();
}

// ---------- Lọc theo tỉnh / thành phố (63 tỉnh thành + "Toàn quốc") và theo trạng thái ----------
let mapStatusFilter = 'all';
let mapProvinceFilter = -1;          // -1 = Toàn quốc, còn lại là chỉ số trong PF_PROVINCES

function applyMapFilters(animate, fit = true) {
  if (!leafletMap) return;
  const shown = [];
  allLeafletMarkers.forEach(m => {
    const ok = (mapStatusFilter === 'all' || m._petStatus === mapStatusFilter) && (mapProvinceFilter < 0 || m._province === mapProvinceFilter);
    if (ok) { m.addTo(leafletMap); shown.push(m._latlng); } else { leafletMap.removeLayer(m); }
  });
  const where = mapProvinceFilter < 0 ? '' : ' tại ' + PF_PROVINCES[mapProvinceFilter][0];
  const countEl = document.getElementById('mapCount');
  if (countEl) countEl.textContent = 'Đang hiển thị ' + shown.length + ' địa điểm' + where;
  if (!fit) return;
  const opt = { animate: !!animate, maxZoom: 14 };
  if (mapProvinceFilter >= 0 && !shown.length) leafletMap.setView([PF_PROVINCES[mapProvinceFilter][1], PF_PROVINCES[mapProvinceFilter][2]], 10, opt);
  else if (shown.length === 1) leafletMap.setView(shown[0], 14, opt);
  else if (shown.length) leafletMap.fitBounds(L.latLngBounds(shown).pad(0.25), opt);
}

let provinceCtl = null;
function refreshProvinceControl() {
  if (provinceCtl) { leafletMap.removeControl(provinceCtl); provinceCtl = null; }
  addProvinceControl();
}
function addProvinceControl() {
  const counts = {};
  allLeafletMarkers.forEach(m => { counts[m._province] = (counts[m._province] || 0) + 1; });
  const Ctl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function () {
      const div = L.DomUtil.create('div', 'map-region-ctl');
      const opts = ['<option value="-1">🇻🇳 Toàn quốc (63 tỉnh thành)</option>'].concat(PF_PROVINCES.map((p, i) =>
        `<option value="${i}">${escapeHtml(p[0])}${counts[i] ? ' (' + counts[i] + ')' : ''}</option>`));
      div.innerHTML = `<label class="map-province-label">Tỉnh / thành phố</label><select class="map-province-select" aria-label="Lọc theo tỉnh thành">${opts.join('')}</select>`;
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);
      div.querySelector('select').value = String(mapProvinceFilter);
      div.querySelector('select').addEventListener('change', e => { mapProvinceFilter = Number(e.target.value); applyMapFilters(true); });
      return div;
    }
  });
  provinceCtl = new Ctl();
  provinceCtl.addTo(leafletMap);
}

function setMapSearchState(message, isError = false) {
  const status = document.getElementById('mapSearchStatus');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function showMapSearchMarker(lat, lng, label) {
  if (!leafletMap) initMap();
  if (!leafletMap) return;
  if (mapSearchMarker) leafletMap.removeLayer(mapSearchMarker);
  mapSearchMarker = L.marker([lat, lng]).addTo(leafletMap).bindPopup(`<strong>${escapeHtml(label)}</strong>`).openPopup();
  leafletMap.setView([lat, lng], 16);
}

async function searchMapLocation() {
  const input = document.getElementById('mapSearchInput');
  const button = document.getElementById('mapSearchButton');
  const query = input ? input.value.trim() : '';
  if (query.length < 2) { setMapSearchState('Vui lòng nhập ít nhất 2 ký tự để tìm địa chỉ.', true); return; }
  if (!window.PetFinderGeocoding) { setMapSearchState('Dịch vụ tìm địa chỉ chưa sẵn sàng.', true); return; }
  if (button) button.disabled = true;
  setMapSearchState('Đang tìm địa chỉ...');
  try {
    const results = await window.PetFinderGeocoding.search(query);
    if (!results.length) { setMapSearchState('Không tìm thấy địa chỉ phù hợp.', true); return; }
    const location = results[0];
    showMapSearchMarker(location.lat, location.lng, location.displayName);
    setMapSearchState(`Đã tìm thấy: ${location.displayName}`);
  } catch (error) {
    if (error.name !== 'AbortError') { setMapSearchState('Không thể kết nối API tìm địa chỉ. Vui lòng thử lại.', true); console.error(error); }
  } finally {
    if (button) button.disabled = false;
  }
}

function useCurrentMapLocation() {
  if (!navigator.geolocation) { setMapSearchState('Trình duyệt không hỗ trợ định vị.', true); return; }
  setMapSearchState('Đang lấy vị trí hiện tại...');
  navigator.geolocation.getCurrentPosition(
    position => {
      const { latitude, longitude } = position.coords;
      showMapSearchMarker(latitude, longitude, 'Vị trí hiện tại của bạn');
      setMapSearchState('Đã định vị vị trí hiện tại của bạn.');
    },
    () => setMapSearchState('Không thể lấy vị trí. Hãy cho phép truy cập vị trí trong trình duyệt.', true),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

function mapFilter(btn, status) {
  document.querySelectorAll('.map-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  mapStatusFilter = status;
  applyMapFilters(true);
}

// (Các hàm khu vực người dùng: getUserArea, saveUserLocation, resortPetsByArea... nằm trong js/location.js)

// ========== VET CLINICS 24/7 ==========
const VET_CLINICS = [
  {
    id: 'vc1',
    name: 'HALLO VET – Thú Y Quận 7',
    shortName: 'Hallo Vet Q7',
    address: '354 Huỳnh Tấn Phát, Tân Thuận, Quận 7',
    phone: '+84 332 986 116',
    phoneDisplay: '0332 986 116',
    rating: 4.9,
    ratingCount: 62,
    hours: 'Mở 24 giờ / 7 ngày',
    tags: ['24h', 'emergency'],
    lat: 10.748181,
    lng: 106.728737,
    area: 'Quận 7',
    mapUrl: 'https://maps.google.com/?q=354+Hu%E1%BB%B3nh+T%E1%BA%A5n+Ph%C3%A1t+Qu%E1%BA%ADn+7+TPHCM'
  },
  {
    id: 'vc2',
    name: 'Bệnh Viện Thú Y PetHealth Phú Mỹ Hưng',
    shortName: 'PetHealth PMH',
    address: 'Khu đô thị Phú Mỹ Hưng, Nguyễn Văn Linh, Quận 7',
    phone: '+84 335 536 186',
    phoneDisplay: '0335 536 186',
    rating: 4.9,
    ratingCount: 197,
    hours: 'Mở 24 giờ / 7 ngày',
    tags: ['24h', 'emergency', 'hospital'],
    lat: 10.728208,
    lng: 106.709226,
    area: 'Quận 7',
    mapUrl: 'https://maps.google.com/?q=PetHealth+Ph%C3%BA+M%E1%BB%B9+H%C6%B0ng+Qu%E1%BA%ADn+7'
  },
  {
    id: 'vc3',
    name: 'Phòng Khám Thú Y Gold Care – Cấp Cứu 24/7',
    shortName: 'Gold Care Vet',
    address: '412 Trường Chinh, Đông Hưng Thuận, Quận 12',
    phone: '+84 354 720 778',
    phoneDisplay: '0354 720 778',
    rating: 5.0,
    ratingCount: 38,
    hours: 'Mở 24 giờ / 7 ngày',
    tags: ['24h', 'emergency'],
    lat: 10.834901,
    lng: 106.620593,
    area: 'Quận 12',
    mapUrl: 'https://maps.google.com/?q=412+Tr%C6%B0%E1%BB%9Dng+Chinh+Qu%E1%BA%ADn+12'
  },
  {
    id: 'vc4',
    name: 'Phòng Khám Thú Y Sacomvet CN2 – Cấp Cứu 24/7',
    shortName: 'Sacomvet CN2',
    address: '175 Lương Định Của, An Khánh, TP. Thủ Đức',
    phone: '+84 977 451 595',
    phoneDisplay: '0977 451 595',
    rating: 4.9,
    ratingCount: 28,
    hours: '8:00 – 20:00 (Cấp cứu 24/7)',
    tags: ['24h', 'emergency'],
    lat: 10.788194,
    lng: 106.734775,
    area: 'Thủ Đức',
    mapUrl: 'https://maps.google.com/?q=175+L%C6%B0%C6%A1ng+%C4%90%E1%BB%8Bnh+C%E1%BB%A7a+An+Kh%C3%A1nh+Th%E1%BB%A7+%C4%90%E1%BB%A9c'
  },
  {
    id: 'vc5',
    name: 'Phòng Khám Thú Y 24/7 PET CLINIC',
    shortName: 'PET CLINIC 24/7',
    address: '94 Đỗ Xuân Hợp, Phước Long A, TP. Thủ Đức',
    phone: '+84 901 826 359',
    phoneDisplay: '0901 826 359',
    rating: 4.7,
    ratingCount: 204,
    hours: '8:00 – 20:30',
    tags: ['emergency'],
    lat: 10.831432,
    lng: 106.767630,
    area: 'Thủ Đức',
    mapUrl: 'https://maps.google.com/?q=94+%C4%90%E1%BB%97+Xu%C3%A2n+H%E1%BB%A3p+Th%E1%BB%A7+%C4%90%E1%BB%A9c'
  },
  {
    id: 'vc6',
    name: 'Bệnh Viện Thú Y PetHealth Hồng Bàng',
    shortName: 'PetHealth Hồng Bàng',
    address: '637 Đường Hồng Bàng, Quận 6',
    phone: '+84 938 794 882',
    phoneDisplay: '0938 794 882',
    rating: 4.5,
    ratingCount: 575,
    hours: 'Mở 24 giờ / 7 ngày',
    tags: ['24h', 'hospital'],
    lat: 10.753439,
    lng: 106.648595,
    area: 'Quận 6',
    mapUrl: 'https://maps.google.com/?q=637+H%E1%BB%93ng+B%C3%A0ng+Qu%E1%BA%ADn+6'
  },
  {
    id: 'vc7',
    name: 'Pet Joy Veterinary Hospital – Lê Hồng Phong',
    shortName: 'Pet Joy Vet',
    address: '46C Lê Hồng Phong, Chợ Quán, Quận 5',
    phone: '+84 844 951 951',
    phoneDisplay: '0844 951 951',
    rating: 3.9,
    ratingCount: 35,
    hours: 'Mở 24 giờ / 7 ngày',
    tags: ['24h', 'hospital'],
    lat: 10.755302,
    lng: 106.678837,
    area: 'Quận 5',
    mapUrl: 'https://maps.google.com/?q=46C+L%C3%AA+H%E1%BB%93ng+Phong+Qu%E1%BA%ADn+5'
  },
  {
    id: 'vc8',
    name: 'Phòng Khám Thú Y Pet Hospital – Nguyễn Hữu Cảnh',
    shortName: 'Pet Hospital NHC',
    address: '135/28 Nguyễn Hữu Cảnh, Bình Thạnh',
    phone: '+84 385 696 637',
    phoneDisplay: '0385 696 637',
    rating: 4.7,
    ratingCount: 169,
    hours: 'Mở 24 giờ / 7 ngày',
    tags: ['24h', 'hospital'],
    lat: 10.796279,
    lng: 106.718439,
    area: 'Bình Thạnh',
    mapUrl: 'https://maps.google.com/?q=135+Nguy%E1%BB%85n+H%E1%BB%AFu+C%E1%BA%A3nh+B%C3%ACnh+Th%E1%BA%A1nh'
  },
  {
    id: 'vc9',
    name: 'Bệnh Viện Thú Y Pet Health Centre Phú Mỹ Hưng',
    shortName: 'Pet Health Centre PMH',
    address: 'Khu Mỹ Hoàng, Nguyễn Văn Linh, Tân Hưng, Quận 7',
    phone: '+84 899 588 808',
    phoneDisplay: '0899 588 808',
    rating: 4.7,
    ratingCount: 104,
    hours: 'Mở 24 giờ / 7 ngày',
    tags: ['24h', 'hospital'],
    lat: 10.728250,
    lng: 106.710015,
    area: 'Quận 7',
    mapUrl: 'https://maps.google.com/?q=Pet+Health+Centre+Phu+My+Hung'
  }
];

let vetFilterTag = 'all';
let userVetLat = null, userVetLng = null;

function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getStars(rating) {
  const full = Math.round(rating);
  return '⭐'.repeat(full);
}

// ----- Ảnh phòng khám -----
const VET_ASSET_BASE = (document.body && document.body.dataset.componentsBase ? '../' : '') + 'assets/vets/';
function vetImgUrl(p) { return VET_ASSET_BASE + p; }
function vetImages(c) {
  return (typeof VET_IMAGES !== 'undefined' && VET_IMAGES[c.id]) ? VET_IMAGES[c.id] : {};
}

function renderVetGrid() {
  const grid = document.getElementById('vetGrid');
  if (!grid) return;
  let clinics = [...VET_CLINICS];

  if (vetFilterTag !== 'all') {
    clinics = clinics.filter(c => c.tags.includes(vetFilterTag));
  }

  if (userVetLat !== null) {
    clinics.forEach(c => {
      c._dist = calcDistance(userVetLat, userVetLng, c.lat, c.lng);
    });
    clinics.sort((a, b) => a._dist - b._dist);
  }

  if (clinics.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);font-weight:700">Không tìm thấy phòng khám phù hợp 🏥</div>';
    return;
  }

  const nearestId = (userVetLat !== null && clinics.length > 0) ? clinics[0].id : null;

  grid.innerHTML = clinics.map((c, i) => {
    const isNearest = c.id === nearestId;
    const is24h = c.tags.includes('24h');
    const isEmergency = c.tags.includes('emergency');
    const isHospital = c.tags.includes('hospital');
    const img = vetImages(c);
    const distText = c._dist ? `<span class="vet-dist">${c._dist.toFixed(1)} km</span>` : '';
    const cover = img.cover
      ? `<img src="${vetImgUrl(img.cover)}" alt="${c.shortName}" loading="lazy" style="object-position:${img.coverPos || '50% 50%'}" onerror="this.remove()"/>`
      : '';
    const logo = img.logo
      ? `<img src="${vetImgUrl(img.logo)}" alt="Logo ${c.shortName}" onerror="this.replaceWith(document.createTextNode('🏥'))"/>`
      : '🏥';
    const photoCount = (img.gallery ? img.gallery.length : 0) + (img.doctors ? img.doctors.length : 0);
    return `
    <div class="vet-card ${isNearest ? 'nearest' : ''}" onclick="openVetModal('${c.id}')">
      <div class="vet-card-media">
        ${cover}
        <div class="vet-card-media-shade"></div>
        <div class="vet-card-media-badges">
          ${is24h ? '<span class="vet-badge vet-badge-24h">24/7</span>' : ''}
          ${isEmergency ? '<span class="vet-badge vet-badge-emergency">Cấp cứu</span>' : ''}
          ${isHospital ? '<span class="vet-badge vet-badge-hospital">Bệnh viện</span>' : ''}
        </div>
        ${photoCount ? `<span class="vet-photo-count">${photoCount}</span>` : ''}
        ${isNearest ? '<span class="vet-nearest-tag vet-nearest-float">GẦN NHẤT</span>' : ''}
      </div>
      <div class="vet-card-logo ${is24h ? 'open24' : ''}">${logo}</div>
      <div class="vet-card-body">
        <div class="vet-card-name">${c.name}</div>
        <div class="vet-card-area">${c.area}${c.hours ? ' · ' + c.hours : ''}</div>
        <div class="vet-card-address"><span>📍</span><span>${c.address}</span></div>
        <div class="vet-rating">
          <span class="vet-stars">${getStars(c.rating)}</span>
          <span class="vet-rating-num">${c.rating}</span>
          <span class="vet-rating-count">(${c.ratingCount} đánh giá)</span>
          ${distText}
        </div>
        <div class="vet-card-actions">
          <a class="vet-call-btn" href="tel:${c.phone}" onclick="event.stopPropagation()">${c.phoneDisplay}</a>
          <a class="vet-map-btn" href="${c.mapUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">Bản đồ</a>
        </div>
      </div>
    </div>`;
  }).join('');
}

function filterVets(btn, tag) {
  document.querySelectorAll('.vet-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  vetFilterTag = tag;
  renderVetGrid();
}

function findNearestVet() {
  if (!navigator.geolocation) {
    showToast('Trình duyệt không hỗ trợ định vị GPS 😢');
    return;
  }
  const btn = document.querySelector('.vet-location-btn');
  btn.textContent = '⏳ Đang xác định vị trí...';
  navigator.geolocation.getCurrentPosition(
    pos => {
      userVetLat = pos.coords.latitude;
      userVetLng = pos.coords.longitude;
      btn.textContent = 'Đã tìm vị trí';
      renderVetGrid();
      document.getElementById('vet-clinics').scrollIntoView({ behavior: 'smooth' });
      showToast('Đã sắp xếp theo khoảng cách gần nhất!');
      setTimeout(() => { btn.innerHTML = 'Tìm gần nhất'; }, 3000);
    },
    err => {
      btn.innerHTML = 'Tìm gần nhất';
      showToast('Không thể lấy vị trí – vui lòng cho phép truy cập GPS');
    }
  );
}

let vetCurrent = null;
let vetGalleryIdx = 0;
let vetLightbox = { list: [], idx: 0 };

function openVetModal(id) {
  const c = VET_CLINICS.find(v => v.id === id);
  if (!c) return;
  vetCurrent = c;
  const img = vetImages(c);
  document.getElementById('vetModalName').textContent = c.name;
  const tags = [];
  if (c.tags.includes('24h')) tags.push('<span class="vet-badge vet-badge-24h">Mở 24/7</span>');
  if (c.tags.includes('emergency')) tags.push('<span class="vet-badge vet-badge-emergency">Cấp cứu</span>');
  if (c.tags.includes('hospital')) tags.push('<span class="vet-badge vet-badge-hospital">Bệnh viện thú y</span>');
  document.getElementById('vetModalBadges').innerHTML = tags.join('');
  document.getElementById('vetModalAddress').textContent = c.address;
  document.getElementById('vetModalRating').textContent = `${getStars(c.rating)} ${c.rating} (${c.ratingCount} đánh giá)`;
  document.getElementById('vetModalHours').textContent = c.hours;
  document.getElementById('vetModalPhone').textContent = c.phoneDisplay;
  document.getElementById('vetModalCallBtn').href = 'tel:' + c.phone;
  document.getElementById('vetModalMapBtn').href = c.mapUrl;
  if (userVetLat !== null) {
    const dist = calcDistance(userVetLat, userVetLng, c.lat, c.lng);
    document.getElementById('vetModalDist').textContent = `${dist.toFixed(2)} km từ vị trí của bạn`;
    document.getElementById('vetModalDistRow').style.display = 'flex';
  } else {
    document.getElementById('vetModalDistRow').style.display = 'none';
  }

  // Logo
  const logoEl = document.getElementById('vetModalLogo');
  logoEl.innerHTML = img.logo ? `<img src="${vetImgUrl(img.logo)}" alt="Logo ${c.shortName}"/>` : '🏥';

  // Thư viện ảnh phòng khám
  const gallery = img.gallery || [];
  document.getElementById('vetGallery').style.display = gallery.length ? '' : 'none';
  document.getElementById('vetGalleryThumbs').innerHTML = gallery.map((p, i) =>
    `<button class="vet-thumb" onclick="setVetGallery(${i})" aria-label="Ảnh ${i + 1}"><img src="${vetImgUrl(p)}" alt="" loading="lazy"/></button>`
  ).join('');
  document.getElementById('vetGalleryNav').style.display = gallery.length > 1 ? '' : 'none';
  setVetGallery(0);

  // Bác sĩ
  const doctors = img.doctors || [];
  document.getElementById('vetDoctorsWrap').style.display = doctors.length ? '' : 'none';
  document.getElementById('vetDoctors').innerHTML = doctors.map((d, i) => `
    <figure class="vet-doctor" onclick="openVetLightbox('doctors', ${i})">
      <div class="vet-doctor-photo"><img src="${vetImgUrl(d.img)}" alt="${d.caption}" loading="lazy"/></div>
      <figcaption>${d.caption}</figcaption>
    </figure>`).join('');

  const modal = document.getElementById('vetModal');
  modal.classList.add('open');
  const box = modal.querySelector('.vet-modal');
  if (box) box.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function closeVetModal() {
  document.getElementById('vetModal').classList.remove('open');
  document.body.style.overflow = '';
  closeVetLightbox();
}

// ----- Thư viện ảnh trong modal -----
function setVetGallery(i) {
  const list = vetCurrent ? (vetImages(vetCurrent).gallery || []) : [];
  if (!list.length) return;
  vetGalleryIdx = (i + list.length) % list.length;
  const main = document.getElementById('vetGalleryMain');
  main.classList.add('swap');
  main.onload = () => main.classList.remove('swap');
  main.src = vetImgUrl(list[vetGalleryIdx]);
  main.alt = vetCurrent.name + ' – ảnh ' + (vetGalleryIdx + 1);
  document.getElementById('vetGalleryCount').textContent = `${vetGalleryIdx + 1} / ${list.length}`;
  document.querySelectorAll('#vetGalleryThumbs .vet-thumb').forEach((t, k) => t.classList.toggle('active', k === vetGalleryIdx));
  const active = document.querySelector('#vetGalleryThumbs .vet-thumb.active');
  if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}
function vetGalleryStep(d, ev) { if (ev) ev.stopPropagation(); setVetGallery(vetGalleryIdx + d); }

// ----- Lightbox phóng to ảnh -----
function openVetLightbox(type, i) {
  if (!vetCurrent) return;
  const img = vetImages(vetCurrent);
  const list = type === 'doctors'
    ? (img.doctors || []).map(d => ({ src: d.img, caption: d.caption }))
    : (img.gallery || []).map((p, k) => ({ src: p, caption: `${vetCurrent.name} – ảnh ${k + 1}` }));
  if (!list.length) return;
  vetLightbox = { list, idx: i };
  renderVetLightbox();
  document.getElementById('vetLightbox').classList.add('open');
}
function renderVetLightbox() {
  const it = vetLightbox.list[vetLightbox.idx];
  document.getElementById('vetLightboxImg').src = vetImgUrl(it.src);
  document.getElementById('vetLightboxCaption').textContent = it.caption;
  const multi = vetLightbox.list.length > 1;
  document.querySelectorAll('.vet-lightbox-nav').forEach(b => b.style.display = multi ? '' : 'none');
}
function vetLightboxStep(d, ev) {
  if (ev) ev.stopPropagation();
  const n = (vetLightbox.list || []).length;
  if (!n) return;
  vetLightbox.idx = (vetLightbox.idx + d + n) % n;
  renderVetLightbox();
}
function closeVetLightbox() {
  const lb = document.getElementById('vetLightbox');
  if (lb) lb.classList.remove('open');
}

document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('vetLightbox');
  const modal = document.getElementById('vetModal');
  if (lb && lb.classList.contains('open')) {
    if (e.key === 'Escape') closeVetLightbox();
    else if (e.key === 'ArrowRight') vetLightboxStep(1);
    else if (e.key === 'ArrowLeft') vetLightboxStep(-1);
  } else if (modal && modal.classList.contains('open')) {
    if (e.key === 'Escape') closeVetModal();
    else if (e.key === 'ArrowRight') vetGalleryStep(1);
    else if (e.key === 'ArrowLeft') vetGalleryStep(-1);
  }
});

// Init vet grid on load
window.addEventListener('load', () => {
  renderVetGrid();
});

