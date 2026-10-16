// ===== Danh sách tỉnh / thành phố Việt Nam (63 đơn vị hành chính + "Toàn quốc" = 64 lựa chọn lọc) =====
// Dùng cho: bộ lọc bản đồ, ô chọn "Khu vực" khi đăng tin và tìm kiếm.
// Muốn đổi sang danh sách khác (vd: 34 tỉnh sau sáp nhập 2025) chỉ cần sửa mảng PF_PROVINCES bên dưới.
// Mỗi mục: [tên hiển thị, vĩ độ, kinh độ (trung tâm tỉnh), các cách gọi khác (tùy chọn)]
var PF_PROVINCES = [
  ['Hà Nội', 21.0285, 105.8542, ['ha noi', 'hanoi']],
  ['TP. Hồ Chí Minh', 10.7769, 106.7009, ['ho chi minh', 'tp hcm', 'tphcm', 'hcm', 'sai gon', 'saigon', 'thu duc']],
  ['Đà Nẵng', 16.0544, 108.2022, ['da nang']],
  ['Hải Phòng', 20.8449, 106.6881, ['hai phong']],
  ['Cần Thơ', 10.0452, 105.7469, ['can tho']],
  ['An Giang', 10.3759, 105.4185], ['Bà Rịa - Vũng Tàu', 10.4114, 107.1362, ['ba ria', 'vung tau']],
  ['Bắc Giang', 21.2819, 106.1975], ['Bắc Kạn', 22.1470, 105.8348], ['Bạc Liêu', 9.2941, 105.7278],
  ['Bắc Ninh', 21.1861, 106.0763], ['Bến Tre', 10.2434, 106.3756], ['Bình Định', 13.7765, 109.2237, ['quy nhon']],
  ['Bình Dương', 10.9804, 106.6519, ['thu dau mot', 'di an', 'thuan an']], ['Bình Phước', 11.7512, 106.7235],
  ['Bình Thuận', 10.9289, 108.1021, ['phan thiet']], ['Cà Mau', 9.1769, 105.1524], ['Cao Bằng', 22.6657, 106.2522],
  ['Đắk Lắk', 12.6667, 108.0383, ['dak lak', 'buon ma thuot']], ['Đắk Nông', 12.0033, 107.6874, ['dak nong']],
  ['Điện Biên', 21.3860, 103.0230], ['Đồng Nai', 10.9574, 106.8427, ['bien hoa']], ['Đồng Tháp', 10.4938, 105.6882],
  ['Gia Lai', 13.9718, 108.0151, ['pleiku']], ['Hà Giang', 22.8233, 104.9836], ['Hà Nam', 20.5411, 105.9139],
  ['Hà Tĩnh', 18.3428, 105.9057], ['Hải Dương', 20.9373, 106.3146], ['Hậu Giang', 9.7845, 105.4701],
  ['Hòa Bình', 20.8133, 105.3383], ['Hưng Yên', 20.6464, 106.0511], ['Khánh Hòa', 12.2388, 109.1967, ['nha trang']],
  ['Kiên Giang', 10.0125, 105.0809, ['rach gia', 'phu quoc']], ['Kon Tum', 14.3545, 108.0076], ['Lai Châu', 22.3964, 103.4703],
  ['Lâm Đồng', 11.9404, 108.4583, ['da lat', 'dalat']], ['Lạng Sơn', 21.8537, 106.7615], ['Lào Cai', 22.4809, 103.9755, ['sa pa', 'sapa']],
  ['Long An', 10.5359, 106.4137], ['Nam Định', 20.4388, 106.1621], ['Nghệ An', 18.6796, 105.6813],
  ['Ninh Bình', 20.2506, 105.9745], ['Ninh Thuận', 11.5646, 108.9886, ['phan rang']], ['Phú Thọ', 21.3227, 105.4019, ['viet tri']],
  ['Phú Yên', 13.0882, 109.0929, ['tuy hoa']], ['Quảng Bình', 17.4689, 106.6223, ['dong hoi']], ['Quảng Nam', 15.5736, 108.4740, ['tam ky', 'hoi an']],
  ['Quảng Ngãi', 15.1205, 108.7923], ['Quảng Ninh', 20.9712, 107.0448, ['ha long']], ['Quảng Trị', 16.7943, 107.1944],
  ['Sóc Trăng', 9.6037, 105.9800], ['Sơn La', 21.3256, 103.9188], ['Tây Ninh', 11.3100, 106.0983],
  ['Thái Bình', 20.4463, 106.3366], ['Thái Nguyên', 21.5928, 105.8442], ['Thanh Hóa', 19.8067, 105.7852],
  ['Thừa Thiên Huế', 16.4637, 107.5909, ['hue']], ['Tiền Giang', 10.3600, 106.3600, ['my tho']], ['Trà Vinh', 9.9347, 106.3453],
  ['Tuyên Quang', 21.8233, 105.2181], ['Vĩnh Long', 10.2537, 105.9722], ['Vĩnh Phúc', 21.3089, 105.6049, ['vinh yen']], ['Yên Bái', 21.7168, 104.8986]
];

// Quận/huyện của TP.HCM (để nhận ra tin có địa chỉ chỉ ghi "Quận 7", "Gò Vấp"...)
var PF_HCM_DISTRICTS = ['quan 1', 'quan 2', 'quan 3', 'quan 4', 'quan 5', 'quan 6', 'quan 7', 'quan 8', 'quan 9', 'quan 10', 'quan 11', 'quan 12',
  'binh thanh', 'go vap', 'tan binh', 'tan phu', 'phu nhuan', 'binh tan', 'hoc mon', 'binh chanh', 'nha be', 'cu chi', 'can gio'];

function pfNorm(s) {
  return ' ' + String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
}
var PF_PROVINCE_KEYS = (function () {
  const out = [];
  PF_PROVINCES.forEach((p, i) => {
    [p[0]].concat(p[3] || []).forEach(n => { const k = pfNorm(n.replace(/^TP\.\s*/i, '')).trim(); if (k) out.push({ key: ' ' + k + ' ', idx: i }); });
  });
  return out.sort((a, b) => b.key.length - a.key.length);   // khớp tên dài trước (vd "ba ria vung tau" trước "ba ria")
})();

// Quận/huyện của các thành phố lớn khác (để nhận ra tin chỉ ghi "Cầu Giấy", "Hải Châu", "Ninh Kiều"...)
var PF_CITY_DISTRICTS = [
  [0, ['ba dinh', 'hoan kiem', 'hai ba trung', 'dong da', 'tay ho', 'cau giay', 'thanh xuan', 'hoang mai', 'long bien', 'nam tu liem', 'bac tu liem', 'ha dong', 'thanh tri', 'gia lam', 'dong anh', 'soc son', 'me linh', 'son tay', 'hoai duc', 'thanh oai', 'thach that', 'quoc oai', 'dan phuong', 'phuc tho', 'chuong my', 'my duc', 'ung hoa', 'thuong tin', 'phu xuyen', 'ba vi']],
  [2, ['hai chau', 'thanh khe', 'son tra', 'ngu hanh son', 'lien chieu', 'cam le', 'hoa vang']],
  [3, ['hong bang', 'ngo quyen', 'le chan', 'hai an', 'kien an', 'do son', 'duong kinh', 'thuy nguyen', 'an duong', 'an lao', 'kien thuy', 'tien lang', 'vinh bao', 'cat hai']],
  [4, ['ninh kieu', 'cai rang', 'binh thuy', 'o mon', 'thot not', 'phong dien', 'co do', 'vinh thanh', 'thoi lai']]
];
// Chuẩn hóa chuỗi ngày nay về mảng đã chuẩn hóa không dấu để so khớp nhanh
function pfHasWord(text, word) { return text.includes(' ' + word + ' '); }
function pfMatchProvinceName(text) {
  for (const k of PF_PROVINCE_KEYS) if (text.includes(k.key)) return k.idx;
  return -1;
}
function pfMatchDistrict(text) {
  if (PF_HCM_DISTRICTS.some(d => pfHasWord(text, d))) return 1;
  for (const [idx, list] of PF_CITY_DISTRICTS) if (list.some(d => pfHasWord(text, d))) return idx;
  return -1;
}
function pfNearestProvince(lat, lng) {
  lat = Number(lat); lng = Number(lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return -1;
  let best = -1, bd = Infinity;
  PF_PROVINCES.forEach((p, i) => { const d = (p[1] - lat) ** 2 + ((p[2] - lng) * Math.cos(lat * Math.PI / 180)) ** 2; if (d < bd) { bd = d; best = i; } });
  return best;
}
// Trả về chỉ số tỉnh trong PF_PROVINCES của một tin. Thứ tự tin cậy:
// 1) "Khu vực" người đăng chọn (tên tỉnh/thành, hoặc quận/huyện của thành phố lớn)  2) địa chỉ ghi trong "Địa điểm"
// 3) tên quận/huyện trong địa chỉ  4) tọa độ GPS/địa chỉ → tỉnh có trung tâm gần nhất
function pfProvinceIndex(pet) {
  const areaText = pfNorm(pet.area), locText = pfNorm([pet.district, pet.location].filter(Boolean).join(' , '));
  let i = pfMatchProvinceName(areaText); if (i >= 0) return i;
  i = pfMatchDistrict(areaText); if (i >= 0) return i;
  i = pfMatchProvinceName(locText); if (i >= 0) return i;
  i = pfMatchDistrict(locText); if (i >= 0) return i;
  return pfNearestProvince(pet.lat, pet.lng);
}
// Từ kết quả định vị ngược (Nominatim address) → { province index, tên quận/huyện nếu thuộc TP.HCM }
function pfFromAddress(addr) {
  addr = addr || {};
  const parts = [addr.state, addr.city, addr.province, addr.region].filter(Boolean).join(' , ');
  let i = pfMatchProvinceName(pfNorm(parts));
  const sub = [addr.city_district, addr.suburb, addr.district, addr.county, addr.town, addr.municipality, addr.quarter, addr.neighbourhood].filter(Boolean).join(' , ');
  if (i < 0) i = pfMatchDistrict(pfNorm(sub));
  return i;
}

// Thêm các tỉnh/thành còn thiếu vào ô chọn "Khu vực" (đăng tin #fArea, tìm kiếm #sArea)
function pfPopulateAreaSelects() {
  ['fArea', 'sArea', 'locSelect', 'regCity'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel || sel.dataset.pfProvinces) return;
    sel.dataset.pfProvinces = '1';
    const have = new Set(Array.from(sel.options).map(o => pfNorm(o.textContent)));
    const group = sel.id === 'regCity' ? document.createDocumentFragment() : document.createElement('optgroup');
    if (group.nodeType === 1) group.label = 'Tỉnh / thành phố';
    PF_PROVINCES.forEach(p => { if (!have.has(pfNorm(p[0]))) { const o = document.createElement('option'); o.textContent = p[0]; group.appendChild(o); } });
    if (group.childNodes.length) sel.appendChild(group);
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pfPopulateAreaSelects); else pfPopulateAreaSelects();


// ===== Bảng địa danh dùng khi dịch vụ bản đồ trực tuyến lỗi: quận/huyện các thành phố lớn + 63 tỉnh/thành =====
// Mỗi mục: [tên, vĩ độ, kinh độ, chỉ số tỉnh trong PF_PROVINCES, tên đầy đủ]
var PF_PLACES = (function () {
  const D = (prov, list) => list.map(x => [x[0], x[1], x[2], prov]);
  const rows = []
    .concat(D(1, [['Quận 1', 10.7769, 106.7009], ['Quận 2', 10.7870, 106.7510], ['Quận 3', 10.7843, 106.6844], ['Quận 4', 10.7578, 106.7013], ['Quận 5', 10.7540, 106.6634], ['Quận 6', 10.7480, 106.6352], ['Quận 7', 10.7340, 106.7220], ['Quận 8', 10.7240, 106.6280], ['Quận 9', 10.8430, 106.8290], ['Quận 10', 10.7730, 106.6670], ['Quận 11', 10.7630, 106.6500], ['Quận 12', 10.8672, 106.6414], ['Bình Thạnh', 10.8106, 106.7091], ['Gò Vấp', 10.8386, 106.6652], ['Tân Bình', 10.8014, 106.6526], ['Tân Phú', 10.7900, 106.6281], ['Phú Nhuận', 10.7991, 106.6802], ['Bình Tân', 10.7654, 106.6034], ['Thủ Đức', 10.8494, 106.7537], ['Hóc Môn', 10.8830, 106.5950], ['Bình Chánh', 10.6870, 106.5740], ['Nhà Bè', 10.6950, 106.7370], ['Củ Chi', 10.9730, 106.4930], ['Cần Giờ', 10.4110, 106.9540]]))
    .concat(D(0, [['Ba Đình', 21.0340, 105.8140], ['Hoàn Kiếm', 21.0285, 105.8522], ['Hai Bà Trưng', 21.0060, 105.8570], ['Đống Đa', 21.0180, 105.8270], ['Tây Hồ', 21.0700, 105.8230], ['Cầu Giấy', 21.0360, 105.7940], ['Thanh Xuân', 20.9930, 105.8120], ['Hoàng Mai', 20.9740, 105.8640], ['Long Biên', 21.0450, 105.8920], ['Nam Từ Liêm', 21.0120, 105.7650], ['Bắc Từ Liêm', 21.0750, 105.7600], ['Hà Đông', 20.9600, 105.7690], ['Thanh Trì', 20.9380, 105.8400], ['Gia Lâm', 21.0200, 105.9400], ['Đông Anh', 21.1380, 105.8480], ['Sóc Sơn', 21.2590, 105.8480], ['Sơn Tây', 21.1390, 105.5050]]))
    .concat(D(2, [['Hải Châu', 16.0610, 108.2200], ['Thanh Khê', 16.0680, 108.1900], ['Sơn Trà', 16.1000, 108.2500], ['Ngũ Hành Sơn', 16.0000, 108.2500], ['Liên Chiểu', 16.0900, 108.1500], ['Cẩm Lệ', 16.0150, 108.1900], ['Hòa Vang', 16.0200, 108.0800]]))
    .concat(D(3, [['Hồng Bàng', 20.8630, 106.6830], ['Ngô Quyền', 20.8550, 106.7070], ['Lê Chân', 20.8420, 106.6750], ['Hải An', 20.8280, 106.7540], ['Kiến An', 20.8100, 106.6300]]))
    .concat(D(4, [['Ninh Kiều', 10.0340, 105.7870], ['Cái Răng', 9.9990, 105.7690], ['Bình Thủy', 10.0750, 105.7430], ['Ô Môn', 10.1230, 105.6320]]));
  PF_PROVINCES.forEach((p, i) => rows.push([p[0], p[1], p[2], i]));
  return rows.map(r => ({ name: r[0], lat: r[1], lng: r[2], prov: r[3], norm: pfNorm(r[0]), isProv: false }))
    .map((r, i) => { r.isProv = i >= rows.length - PF_PROVINCES.length; r.full = r.isProv ? r.name : r.name + ', ' + PF_PROVINCES[r.prov][0]; return r; });
})();
function pfGazetteerSearch(query) {
  const q = pfNorm(query).trim(); if (q.length < 2) return [];
  const pad = ' ' + q + ' ';
  const hit = PF_PLACES.filter(p => p.norm.includes(pad) || (' ' + q + ' ').includes(p.norm) || p.norm.trim() === q);
  // tên dài khớp sát nhất lên trước; quận/huyện trước tỉnh
  return hit.sort((a, b) => (a.isProv - b.isProv) || (b.norm.length - a.norm.length)).slice(0, 5)
    .map(p => ({ lat: p.lat, lng: p.lng, displayName: p.full, type: p.isProv ? 'province' : 'district', approximate: true }));
}
function pfGazetteerNearest(lat, lng) {
  lat = Number(lat); lng = Number(lng); if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  let best = null, bd = Infinity;
  PF_PLACES.forEach(p => { const d = (p.lat - lat) ** 2 + ((p.lng - lng) * Math.cos(lat * Math.PI / 180)) ** 2; if (d < bd) { bd = d; best = p; } });
  return best;
}
