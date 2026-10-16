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
