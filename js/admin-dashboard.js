// ===== Admin dashboard: KPI, dòng tiền (thu/chi), biểu đồ, giao dịch =====
// Dữ liệu giao dịch lưu trên Firestore (collection tx, chỉ admin). Bảng giá lấy theo mô hình kinh doanh Week 7.


const REVENUE_STREAMS = {
  boost:   { label: 'Urgent Boost',    icon: '🚀', color: '#F5823A', price: 19000,  unit: '72 giờ' },
  alert:   { label: 'Area Alert',      icon: '📣', color: '#1FB8A6', price: 29000,  unit: '7 ngày' },
  starter: { label: 'Partner Starter', icon: '🏪', color: '#7DC57A', price: 149000, unit: 'tháng' },
  pro:     { label: 'Partner Pro',     icon: '🏥', color: '#7C5CDB', price: 299000, unit: 'tháng' }
};
// Cơ cấu ngân sách pilot theo kế hoạch (Step 8)
const COST_BUCKETS = {
  tech:  { label: 'Product & Tech',     color: '#F5A33A', plan: 35 },
  gtm:   { label: 'Community & GTM',    color: '#1FB8A6', plan: 30 },
  ops:   { label: 'Trust & Operations', color: '#7DC57A', plan: 25 },
  admin: { label: 'Admin & Tools',      color: '#2C2415', plan: 10 }
};
const TX_STATUS = { paid: 'Đã thanh toán', pending: 'Chờ thanh toán', refunded: 'Đã hoàn tiền' };

// ---------- helpers ----------
function pad2(n) { return String(n).padStart(2, '0'); }
function ymd(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function parseYmd(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmtVND(n) { return Math.round(n).toLocaleString('vi-VN') + ' ₫'; }
function fmtShort(n) {
  const a = Math.abs(n), sign = n < 0 ? '-' : '';
  if (a >= 1e9) return sign + (a / 1e9).toFixed(1).replace('.0', '') + ' tỷ';
  if (a >= 1e6) return sign + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace('.0', '') + ' tr';
  if (a >= 1e3) return sign + Math.round(a / 1e3) + 'k';
  return sign + Math.round(a);
}
function dmy(s) { const [y, m, d] = s.split('-'); return d + '/' + m + '/' + y; }
function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

// ---------- dữ liệu ----------
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function generateDemoTransactions() {
  const rnd = mulberry32(2026);
  const list = [];
  const partners = ['Phòng khám Thú y Happy Pet', 'Shelter Mái Ấm Bốn Chân', 'PetShop Cún Con', 'Rescue Thủ Đức', 'Bệnh viện Thú y Sài Gòn', 'Pet Spa Bông Xù', 'Cửa hàng Mèo Mun', 'Trại cứu hộ Hy Vọng'];
  const areas = ['Thủ Đức', 'Quận 12', 'Bình Thạnh', 'Gò Vấp', 'Tân Bình', 'Quận 8', 'Quận 7'];
  const days = 150, today = new Date();
  let id = 0, pi = 0;
  const push = (date, type, category, desc, amount, status) => list.push({ id: 'tx_demo_' + (++id), date: ymd(date), type, category, desc, amount, status: status || 'paid', demo: true });
  const pickStatus = (daysAgo) => { const r = rnd(); if (daysAgo <= 4 && r < 0.3) return 'pending'; if (r < 0.03) return 'refunded'; return 'paid'; };

  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const progress = (days - i) / days;
    const nBoost = Math.floor(rnd() * (1.5 + progress * 4.5));
    for (let k = 0; k < nBoost; k++) push(d, 'in', 'boost', 'Đẩy tin thất lạc khu vực ' + areas[Math.floor(rnd() * areas.length)], REVENUE_STREAMS.boost.price, pickStatus(i));
    if (rnd() < 0.2 + 0.4 * progress) {
      const nA = rnd() < 0.3 ? 2 : 1;
      for (let k = 0; k < nA; k++) push(d, 'in', 'alert', 'Cảnh báo khu vực ' + areas[Math.floor(rnd() * areas.length)] + ' (7 ngày)', REVENUE_STREAMS.alert.price, pickStatus(i));
    }
    if (d.getDate() === 5) {
      const nS = 1 + Math.floor(progress * 4), nP = Math.floor(progress * 3);
      for (let k = 0; k < nS; k++) push(d, 'in', 'starter', 'Gói Partner Starter – ' + partners[pi++ % partners.length], REVENUE_STREAMS.starter.price);
      for (let k = 0; k < nP; k++) push(d, 'in', 'pro', 'Gói Partner Pro – ' + partners[pi++ % partners.length], REVENUE_STREAMS.pro.price);
    }
    // chi phí
    if (d.getDate() === 1) { push(d, 'out', 'tech', 'Hosting & database', 350000); push(d, 'out', 'tech', 'Map/Storage API', 120000 + Math.round(progress * 120000)); }
    if (d.getDate() === 3) push(d, 'out', 'admin', 'Domain, email, công cụ thiết kế/dev', 120000);
    if (d.getDate() === 15) push(d, 'out', 'tech', 'Email/SMS/push cảnh báo', 60000 + Math.round(progress * 140000));
    if (d.getDay() === 1) push(d, 'out', 'gtm', 'Seeding nhóm cộng đồng & nội dung social', 120000 + Math.round(rnd() * 80000));
    if (d.getDay() === 5) push(d, 'out', 'ops', 'Kiểm duyệt, xử lý report & hỗ trợ', 80000 + Math.round(rnd() * 40000));
  }
  return list;
}

// Giao dịch lưu trên Firestore (collection tx, chỉ admin đọc/ghi). Khi chưa có giao dịch nào, hiển thị dữ liệu mẫu tạo trong bộ nhớ (chưa lưu).
let memDemoTx = null;
function loadTx() {
  const real = cleanTx(PFDB.state.tx);
  if (real.length || PFDB.state.tx.length || localStorage.getItem('pf_tx_demo_off') === '1') return real;
  if (!memDemoTx) memDemoTx = cleanTx(generateDemoTransactions());
  return memDemoTx.slice();
}
// Dữ liệu giao dịch đọc từ máy chủ vẫn được kiểm tra: ép kiểu, giới hạn, loại bản ghi sai
function cleanTx(arr) {
  const types = ['in', 'out'], statuses = ['paid', 'pending', 'refunded'];
  const cats = Object.assign({}, REVENUE_STREAMS, COST_BUCKETS);
  return (Array.isArray(arr) ? arr : []).map(t => {
    if (!t || typeof t !== 'object') return null;
    const amount = Math.round(Number(t.amount));
    if (!types.includes(t.type) || !cats[t.category] || !statuses.includes(t.status) || !(amount > 0) || amount > 1e12 || !/^\d{4}-\d{2}-\d{2}$/.test(String(t.date))) return null;
    return { id: PFSec.safeId(t.id) || PFSec.newId('tx'), date: t.date, type: t.type, category: t.category, desc: PFSec.cleanText(t.desc, 200), amount, status: t.status, demo: t.demo === true };
  }).filter(Boolean);
}
function saveTx(arr) { if (!isAdmin()) return false; return PFDB.write('tx', arr); }

function rangeBounds(key) {
  const today = new Date(), to = ymd(today);
  if (key === 'month') return { from: ymd(new Date(today.getFullYear(), today.getMonth(), 1)), to };
  if (key === '7d') return { from: ymd(addDays(today, -6)), to };
  if (key === '30d') return { from: ymd(addDays(today, -29)), to };
  if (key === '90d') return { from: ymd(addDays(today, -89)), to };
  if (key === '6m') return { from: ymd(new Date(today.getFullYear(), today.getMonth() - 5, 1)), to };
  return { from: '0000-00-00', to: '9999-99-99' };
}
const inR = (t, r) => t.date >= r.from && t.date <= r.to;
const sumPaid = (list, type) => list.filter(t => t.type === type && t.status === 'paid').reduce((s, t) => s + t.amount, 0);

function monthRanges() {
  const now = new Date();
  const cur = { from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: ymd(now) };
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  // so sánh cùng kỳ: tới đúng ngày hiện tại của tháng trước
  const sameDay = new Date(prevStart.getFullYear(), prevStart.getMonth(), Math.min(now.getDate(), prevEnd.getDate()));
  return { cur, prev: { from: ymd(prevStart), to: ymd(sameDay) } };
}

// chia nhóm theo ngày / tuần / tháng để vẽ biểu đồ
function bucketKey(d, g) {
  if (g === 'month') return d.getFullYear() + '-' + pad2(d.getMonth() + 1);
  if (g === 'week') { const x = new Date(d); const wd = (x.getDay() + 6) % 7; return ymd(addDays(x, -wd)); }
  return ymd(d);
}
function bucketLabel(key, g) {
  if (g === 'month') { const [y, m] = key.split('-'); return 'T' + Number(m) + '/' + y.slice(2); }
  const [y, m, d] = key.split('-'); return d + '/' + m;
}
function buildSeries(list, g, from, to) {
  const map = new Map();
  for (let d = parseYmd(from); ymd(d) <= to; d = addDays(d, 1)) {
    const k = bucketKey(d, g);
    if (!map.has(k)) map.set(k, { key: k, label: bucketLabel(k, g), inc: 0, out: 0 });
  }
  list.forEach(t => {
    if (t.status !== 'paid' || t.date < from || t.date > to) return;
    const b = map.get(bucketKey(parseYmd(t.date), g));
    if (!b) return;
    if (t.type === 'in') b.inc += t.amount; else b.out += t.amount;
  });
  return Array.from(map.values()).map(b => ({ ...b, net: b.inc - b.out }));
}

// ---------- biểu đồ SVG ----------
function renderCashChart(el, series, opts) {
  opts = opts || {};
  const W = 760, H = 290, L = 56, R = 16, T = 16, B = 34;
  const iw = W - L - R, ih = H - T - B;
  if (!series.length) { el.innerHTML = '<div class="chart-empty">Chưa có dữ liệu</div>'; return; }
  const rawMax = Math.max(1, ...series.map(s => Math.max(s.inc, s.out, s.net)));
  const rawMin = Math.min(0, ...series.map(s => s.net));
  const step = niceMax((rawMax - rawMin) / 5) / (((rawMax - rawMin) / 5) / niceMax((rawMax - rawMin) / 5) < 0.5 ? 2 : 1);
  const maxV = Math.ceil(rawMax / step) * step;
  const minV = rawMin < 0 ? Math.floor(rawMin / step) * step : 0;
  const ticks = Math.round((maxV - minV) / step);
  const y = v => T + ih - ((v - minV) / (maxV - minV)) * ih;
  const slot = iw / series.length;
  const bw = Math.max(2, Math.min(22, slot * 0.36));
  let g = '';
  for (let i = 0; i <= ticks; i++) {
    const v = minV + step * i;
    g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="gl"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" class="ax">${fmtShort(v)}</text>`;
  }
  if (minV < 0) g += `<line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" class="zero"/>`;
  const every = Math.ceil(series.length / 10);
  series.forEach((s, i) => {
    const cx = L + slot * i + slot / 2;
    g += `<rect class="bar-in" x="${cx - bw - 1}" y="${y(s.inc)}" width="${bw}" height="${Math.max(0, y(0) - y(s.inc))}" rx="3"/>`;
    g += `<rect class="bar-out" x="${cx + 1}" y="${y(s.out)}" width="${bw}" height="${Math.max(0, y(0) - y(s.out))}" rx="3"/>`;
    if (i % every === 0) g += `<text x="${cx}" y="${H - 12}" text-anchor="middle" class="ax">${s.label}</text>`;
  });
  const pts = series.map((s, i) => `${L + slot * i + slot / 2},${y(s.net)}`).join(' ');
  g += `<polyline points="${pts}" class="net-line"/>`;
  series.forEach((s, i) => { g += `<circle cx="${L + slot * i + slot / 2}" cy="${y(s.net)}" r="${series.length > 40 ? 0 : 3.2}" class="net-dot"/>`; });
  g += `<rect class="hover-slot" x="0" y="${T}" width="${slot}" height="${ih}" style="display:none"/>`;

  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="cash-svg" preserveAspectRatio="xMidYMid meet">${g}</svg><div class="chart-tip" style="display:none"></div>
    <div class="chart-legend"><span><i class="lg lg-in"></i>Thu</span><span><i class="lg lg-out"></i>Chi</span><span><i class="lg lg-net"></i>Dòng tiền ròng</span></div>`;
  const svg = el.querySelector('svg'), tip = el.querySelector('.chart-tip'), hs = el.querySelector('.hover-slot');
  svg.addEventListener('mousemove', e => {
    const r = svg.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * W;
    const i = Math.floor((x - L) / slot);
    if (i < 0 || i >= series.length) { tip.style.display = 'none'; hs.style.display = 'none'; return; }
    const s = series[i];
    hs.setAttribute('x', L + slot * i); hs.style.display = '';
    tip.innerHTML = `<b>${s.label}</b><div class="t-in">Thu: ${fmtVND(s.inc)}</div><div class="t-out">Chi: ${fmtVND(s.out)}</div><div class="t-net">Ròng: ${s.net < 0 ? '-' : ''}${fmtVND(Math.abs(s.net))}</div>`;
    tip.style.display = 'block';
    const wrap = el.getBoundingClientRect();
    let left = e.clientX - wrap.left + 14;
    if (left + 170 > wrap.width) left = e.clientX - wrap.left - 180;
    tip.style.left = left + 'px'; tip.style.top = '14px';
  });
  svg.addEventListener('mouseleave', () => { tip.style.display = 'none'; hs.style.display = 'none'; });
}

function renderDonut(el, items, centerTitle) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total <= 0) { el.innerHTML = '<div class="chart-empty">Chưa có dữ liệu</div>'; return; }
  const r = 62, C = 2 * Math.PI * r;
  let acc = 0, segs = '';
  items.forEach(it => {
    if (it.value <= 0) return;
    const len = it.value / total * C;
    segs += `<circle r="${r}" cx="90" cy="90" fill="none" stroke="${it.color}" stroke-width="26" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-acc}" transform="rotate(-90 90 90)"><title>${escapeHtml(it.label)}: ${it.fmt ? it.fmt(it.value) : it.value}</title></circle>`;
    acc += len;
  });
  const legend = items.map(it => `<div class="dl-row"><i style="background:${it.color}"></i><span class="dl-name">${it.icon ? it.icon + ' ' : ''}${escapeHtml(it.label)}</span><b>${it.fmt ? it.fmt(it.value) : it.value}</b><em>${Math.round(it.value / total * 100)}%</em></div>`).join('');
  el.innerHTML = `<div class="donut-box"><svg viewBox="0 0 180 180" class="donut-svg"><circle r="${r}" cx="90" cy="90" fill="none" stroke="#f3e6dc" stroke-width="26"/>${segs}
    <text x="90" y="86" text-anchor="middle" class="dn-big">${centerTitle.big}</text><text x="90" y="104" text-anchor="middle" class="dn-sm">${centerTitle.small}</text></svg></div><div class="donut-legend">${legend}</div>`;
}

function renderHBars(el, items, fmt) {
  const max = Math.max(1, ...items.map(i => i.value));
  if (!items.length) { el.innerHTML = '<div class="chart-empty">Chưa có dữ liệu</div>'; return; }
  el.innerHTML = items.map(i => `<div class="hb-row"><span class="hb-name">${escapeHtml(i.label)}</span><div class="hb-track"><div class="hb-fill" style="width:${i.value / max * 100}%;background:${i.color || 'var(--orange)'}"></div>${i.plan != null ? `<div class="hb-plan" style="left:${Math.min(100, i.plan / max * 100)}%" title="Kế hoạch ${i.plan}%"></div>` : ''}</div><b>${fmt ? fmt(i.value) : i.value}</b></div>`).join('');
}

function deltaBadge(cur, prev, invert) {
  if (!prev && !cur) return '<span class="kpi-delta flat">— không đổi</span>';
  if (!prev) return '<span class="kpi-delta up">▲ mới phát sinh</span>';
  const pct = (cur - prev) / Math.abs(prev) * 100;
  if (Math.abs(pct) < 0.5) return '<span class="kpi-delta flat">— không đổi</span>';
  const good = invert ? pct < 0 : pct > 0;
  return `<span class="kpi-delta ${good ? 'up' : 'down'}">${pct > 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(0)}% so tháng trước</span>`;
}

// ---------- banner dữ liệu mẫu ----------
function demoBannerHtml(tx) {
  if (!tx.some(t => t.demo)) return '';
  return `<div class="demo-banner"><span>Đang hiển thị <b>dữ liệu giao dịch mẫu</b> để minh họa dashboard (hệ thống chưa tích hợp cổng thanh toán). Bạn có thể ghi nhận giao dịch thật ở mục <a onclick="switchAdminView('cashflow')">Dòng tiền</a>.</span><button class="abtn abtn-delete" onclick="clearDemoTx()">Xóa dữ liệu mẫu</button></div>`;
}
function clearDemoTx() {
  if (!requireAdmin('xóa dữ liệu mẫu')) return;
  if (!confirm('Xóa toàn bộ giao dịch mẫu? Giao dịch bạn tự ghi nhận sẽ được giữ lại.')) return;
  try { localStorage.setItem('pf_tx_demo_off', '1'); } catch (e) { }
  saveTx(loadTx().filter(t => !t.demo));
  refreshDashboards();
}
function restoreDemoTx() {
  if (!requireAdmin('tạo lại dữ liệu mẫu')) return;
  if (!confirm('Tạo lại dữ liệu mẫu? Dữ liệu mẫu cũ sẽ được thay thế, giao dịch tự ghi nhận được giữ lại.')) return;
  try { localStorage.removeItem('pf_tx_demo_off'); } catch (e) { }
  saveTx(loadTx().filter(t => !t.demo).concat(generateDemoTransactions()));
  refreshDashboards();
}
function seedSampleData() {
  if (!requireAdmin('nạp dữ liệu mẫu')) return;
  if (!window.PFSeed) return showToast('Không tìm thấy dữ liệu mẫu.');
  if (!confirm('Đưa ' + PFSeed.count + ' tin thú cưng mẫu lên cơ sở dữ liệu? (Tin đã có sẽ không bị tạo trùng.)')) return;
  const n = PFSeed.run();
  showToast(n ? 'Đã nạp ' + n + ' tin mẫu.' : 'ℹ️ Không có tin mẫu nào mới để nạp.');
  refreshDashboards();
}
function refreshDashboards() {
  const active = document.querySelector('.admin-view.active');
  if (active && active.id === 'adminView-cashflow') renderCashflow(); else renderDashboardOverview();
}

// ===================== OVERVIEW =====================
let dashRange = '30d';
function setDashRange(r) { dashRange = r; renderDashboardOverview(); }

function renderDashboardOverview() {
  const root = document.getElementById('dashRoot');
  if (!root) return;
  if (!isAdmin()) return;
  const tx = loadTx(), users = loadUsers(), pets = loadPets();
  const { cur, prev } = monthRanges();
  const curTx = tx.filter(t => inR(t, cur)), prevTx = tx.filter(t => inR(t, prev));
  const rev = sumPaid(curTx, 'in'), revP = sumPaid(prevTx, 'in');
  const cost = sumPaid(curTx, 'out'), costP = sumPaid(prevTx, 'out');
  const net = rev - cost, netP = revP - costP;
  const pending = tx.filter(t => t.type === 'in' && t.status === 'pending').reduce((s, t) => s + t.amount, 0);
  const flagged = pets.filter(p => p.flagged).length;
  const banned = users.filter(u => u.banned).length;
  const payingTx = curTx.filter(t => t.type === 'in' && t.status === 'paid');
  const aov = payingTx.length ? rev / payingTx.length : 0;

  const hour = new Date().getHours();
  const hello = hour < 11 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const name = (typeof currentUser !== 'undefined' && currentUser && currentUser.name) || 'Quản trị viên';

  // chart range
  const rb = rangeBounds(dashRange);
  const gran = dashRange === '6m' ? 'month' : dashRange === '90d' ? 'week' : 'day';
  const series = buildSeries(tx, gran, rb.from, rb.to);
  const rangeTxs = tx.filter(t => inR(t, rb));
  const rangeIn = sumPaid(rangeTxs, 'in'), rangeOut = sumPaid(rangeTxs, 'out');

  const kpi = (cls, icon, label, value, sub) => `<div class="kpi-card ${cls}"><div class="kpi-icon">${icon}</div><div class="kpi-body"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div><div class="kpi-sub">${sub}</div></div></div>`;

  root.innerHTML = `
    ${demoBannerHtml(tx)}
    <div class="dash-hello"><div><h3>${hello}, ${escapeHtml(name)} 👋</h3><p>Tổng quan hoạt động &amp; dòng tiền PetFinder – tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="abtn abtn-edit" onclick="seedSampleData()" title="Đưa các tin thú cưng mẫu lên cơ sở dữ liệu (không tạo trùng)">Nạp dữ liệu mẫu</button><button class="abtn abtn-edit" onclick="renderDashboardOverview()">Làm mới</button></div></div>

    <div class="kpi-grid kpi-grid-6">
      ${kpi('k-orange', '💰', 'Doanh thu tháng này', fmtVND(rev), deltaBadge(rev, revP))}
      ${kpi(net >= 0 ? 'k-green' : 'k-red', '📈', 'Dòng tiền ròng', (net < 0 ? '-' : '') + fmtVND(Math.abs(net)), deltaBadge(net, netP))}
      ${kpi('k-red', '🧾', 'Chi phí tháng này', fmtVND(cost), deltaBadge(cost, costP, true))}
      ${kpi('k-teal', '⏳', 'Chờ thanh toán', fmtVND(pending), `<span class="kpi-delta flat">${tx.filter(t => t.type === 'in' && t.status === 'pending').length} giao dịch chưa thu</span>`)}
      ${kpi('k-purple', '🧮', 'Giá trị TB / giao dịch', fmtVND(aov), `<span class="kpi-delta flat">${payingTx.length} giao dịch thu trong tháng</span>`)}
      ${kpi('k-blue', '👥', 'Người dùng', users.length, `<span class="kpi-delta ${banned ? 'down' : 'flat'}">${banned} tài khoản bị khóa</span>`)}
    </div>

    <div class="dash-row">
      <div class="dash-card wide">
        <div class="dash-card-head"><h4>Dòng tiền thu – chi</h4>
          <div class="range-toggle">${[['30d', '30 ngày'], ['90d', '90 ngày'], ['6m', '6 tháng']].map(([k, l]) => `<button class="${dashRange === k ? 'active' : ''}" onclick="setDashRange('${k}')">${l}</button>`).join('')}</div></div>
        <div class="mini-sums"><span>Thu <b class="c-in">${fmtVND(rangeIn)}</b></span><span>Chi <b class="c-out">${fmtVND(rangeOut)}</b></span><span>Ròng <b class="${rangeIn - rangeOut >= 0 ? 'c-in' : 'c-out'}">${rangeIn - rangeOut < 0 ? '-' : ''}${fmtVND(Math.abs(rangeIn - rangeOut))}</b></span></div>
        <div class="chart-wrap" id="dashCashChart"></div>
      </div>
      <div class="dash-card">
        <div class="dash-card-head"><h4>Cơ cấu doanh thu</h4><span class="muted-sm">${dashRange === '6m' ? '6 tháng' : dashRange === '90d' ? '90 ngày' : '30 ngày'}</span></div>
        <div id="dashStreams"></div>
      </div>
    </div>

    <div class="dash-row three">
      <div class="dash-card"><div class="dash-card-head"><h4>Tin đăng theo trạng thái</h4></div><div id="dashPetStatus"></div></div>
      <div class="dash-card"><div class="dash-card-head"><h4>Khu vực nhiều tin nhất</h4></div><div id="dashAreas"></div></div>
      <div class="dash-card"><div class="dash-card-head"><h4>Giao dịch gần đây</h4><a class="link-sm" onclick="switchAdminView('cashflow')">Xem tất cả →</a></div><div id="dashRecent"></div></div>
    </div>

    <div class="dash-card flag-card">
      <div class="dash-card-head"><h4>Tin đăng bị đánh dấu nghi vấn <span class="count-pill">${flagged}</span></h4></div>
      <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Tên thú cưng</th><th>Người đăng</th><th>Khu vực</th><th>Trạng thái</th><th>Hành động</th></tr></thead><tbody id="adminFlaggedBody"></tbody></table></div>
    </div>`;

  renderCashChart(document.getElementById('dashCashChart'), series);

  const byStream = Object.keys(REVENUE_STREAMS).map(k => ({
    label: REVENUE_STREAMS[k].label, icon: REVENUE_STREAMS[k].icon, color: REVENUE_STREAMS[k].color,
    value: rangeTxs.filter(t => t.type === 'in' && t.status === 'paid' && t.category === k).reduce((s, t) => s + t.amount, 0), fmt: fmtShort
  }));
  renderDonut(document.getElementById('dashStreams'), byStream, { big: fmtShort(rangeIn), small: 'tổng thu' });

  const statusItems = [
    { label: 'Đang thất lạc', value: pets.filter(p => p.status === 'lost').length, color: '#E24B4A' },
    { label: 'Đã tìm thấy', value: pets.filter(p => p.status === 'found').length, color: '#3DAB6E' },
    { label: 'Chờ nhận nuôi', value: pets.filter(p => p.status === 'adopt').length, color: '#F5823A' }
  ];
  renderDonut(document.getElementById('dashPetStatus'), statusItems, { big: pets.length, small: 'tin đăng' });

  const areaCount = {};
  pets.forEach(p => { const a = (p.area || 'Khác').trim(); areaCount[a] = (areaCount[a] || 0) + 1; });
  const topAreas = Object.entries(areaCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value, color: '#F5823A' }));
  renderHBars(document.getElementById('dashAreas'), topAreas);

  const recent = tx.slice().sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id))).slice(0, 7);
  document.getElementById('dashRecent').innerHTML = recent.length ? recent.map(t => txMiniRow(t)).join('') : '<div class="chart-empty">Chưa có giao dịch</div>';

  if (typeof renderFlaggedTable === 'function') renderFlaggedTable();
}

function txCategoryMeta(t) {
  if (t.type === 'in') { const s = REVENUE_STREAMS[t.category]; return s ? { label: s.label, icon: s.icon, color: s.color } : { label: t.category, icon: '💵', color: '#F5823A' }; }
  const c = COST_BUCKETS[t.category]; return c ? { label: c.label, icon: '🧾', color: c.color } : { label: t.category, icon: '🧾', color: '#888' };
}
function txMiniRow(t) {
  const m = txCategoryMeta(t);
  return `<div class="tx-mini"><span class="tx-ic" style="background:${m.color}22;color:${m.color}">${m.icon}</span><div class="tx-mid"><b>${escapeHtml(t.desc)}</b><small>${dmy(t.date)} · ${m.label}${t.status !== 'paid' ? ' · ' + TX_STATUS[t.status] : ''}</small></div><span class="tx-amt ${t.type === 'in' ? 'c-in' : 'c-out'}${t.status === 'refunded' ? ' strike' : ''}">${t.type === 'in' ? '+' : '-'}${fmtShort(t.amount)}</span></div>`;
}

// ===================== CASH FLOW VIEW =====================
const cf = { range: '30d', type: '', category: '', status: '', q: '' };

function setCf(key, val) { cf[key] = val; renderCashflow(); }

function renderCashflow() {
  const root = document.getElementById('cashRoot');
  if (!root) return;
  if (!isAdmin()) return;
  const tx = loadTx();
  const rb = rangeBounds(cf.range);
  const inRange = tx.filter(t => inR(t, rb));
  const filtered = inRange.filter(t =>
    (!cf.type || t.type === cf.type) && (!cf.category || t.category === cf.category) && (!cf.status || t.status === cf.status) &&
    (!cf.q || (t.desc || '').toLowerCase().includes(cf.q.toLowerCase())));

  const totIn = sumPaid(inRange, 'in'), totOut = sumPaid(inRange, 'out'), net = totIn - totOut;
  const pend = inRange.filter(t => t.type === 'in' && t.status === 'pending').reduce((s, t) => s + t.amount, 0);
  const refund = inRange.filter(t => t.type === 'in' && t.status === 'refunded').reduce((s, t) => s + t.amount, 0);
  const margin = totIn > 0 ? net / totIn * 100 : 0;

  const days = Math.max(1, Math.round((parseYmd(rb.to === '9999-99-99' ? ymd(new Date()) : rb.to) - parseYmd(rb.from === '0000-00-00' ? (tx.map(t => t.date).sort()[0] || ymd(new Date())) : rb.from)) / 864e5) + 1);

  const sum = (cls, icon, label, value, sub) => `<div class="kpi-card ${cls}"><div class="kpi-icon">${icon}</div><div class="kpi-body"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div><div class="kpi-sub">${sub}</div></div></div>`;
  const opt = (v, cur, l) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${l}</option>`;
  const catOpts = '<option value="">Tất cả hạng mục</option>' +
    '<optgroup label="Thu">' + Object.keys(REVENUE_STREAMS).map(k => opt(k, cf.category, REVENUE_STREAMS[k].label)).join('') + '</optgroup>' +
    '<optgroup label="Chi">' + Object.keys(COST_BUCKETS).map(k => opt(k, cf.category, COST_BUCKETS[k].label)).join('') + '</optgroup>';

  root.innerHTML = `
    ${demoBannerHtml(tx)}
    <div class="admin-toolbar cf-toolbar">
      <select onchange="setCf('range', this.value)">${[['7d', '7 ngày qua'], ['month', 'Tháng này'], ['30d', '30 ngày qua'], ['90d', '90 ngày qua'], ['6m', '6 tháng qua'], ['all', 'Tất cả']].map(([v, l]) => opt(v, cf.range, l)).join('')}</select>
      <select onchange="setCf('type', this.value)">${opt('', cf.type, 'Thu & Chi')}${opt('in', cf.type, 'Chỉ khoản thu')}${opt('out', cf.type, 'Chỉ khoản chi')}</select>
      <select onchange="setCf('category', this.value)">${catOpts}</select>
      <select onchange="setCf('status', this.value)">${opt('', cf.status, 'Mọi trạng thái')}${Object.keys(TX_STATUS).map(k => opt(k, cf.status, TX_STATUS[k])).join('')}</select>
      <input type="text" id="cfSearch" placeholder="Tìm mô tả giao dịch..." value="${escapeHtml(cf.q)}" oninput="cfSearchInput(this.value)"/>
      <button class="abtn abtn-promote cf-btn" onclick="toggleTxForm()">Ghi nhận giao dịch</button>
      <button class="abtn abtn-edit cf-btn" onclick="exportTxCsv()">Xuất CSV</button>
      <button class="abtn abtn-flag cf-btn" onclick="restoreDemoTx()">Dữ liệu mẫu</button>
    </div>

    <div class="tx-form" id="txForm" style="display:none">
      <div class="tx-form-title">Ghi nhận giao dịch mới</div>
      <div class="tx-form-grid">
        <label>Loại<select id="txType" onchange="txFormTypeChange()"><option value="in">Khoản thu</option><option value="out">Khoản chi</option></select></label>
        <label>Hạng mục<select id="txCategory" onchange="txFormCategoryChange()"></select></label>
        <label>Số lượng<input type="number" id="txQty" min="1" value="1" oninput="txFormCategoryChange(true)"/></label>
        <label>Số tiền (₫)<input type="number" id="txAmount" min="0" step="1000"/></label>
        <label>Ngày<input type="date" id="txDate" value="${ymd(new Date())}"/></label>
        <label>Trạng thái<select id="txStatus">${Object.keys(TX_STATUS).map(k => `<option value="${k}">${TX_STATUS[k]}</option>`).join('')}</select></label>
        <label class="full">Mô tả<input type="text" id="txDesc" placeholder="VD: Boost tin 'Bé Bi' – Bình Chiểu"/></label>
      </div>
      <div id="txFormError" class="tx-form-error" style="display:none"></div>
      <div class="tx-form-actions"><button class="abtn abtn-promote cf-btn" onclick="saveTxFromForm()">Lưu giao dịch</button><button class="abtn abtn-edit cf-btn" onclick="toggleTxForm(false)">Hủy</button></div>
    </div>

    <div class="kpi-grid">
      ${sum('k-green', '⬆️', 'Tổng thu', fmtVND(totIn), `<span class="kpi-delta flat">TB ${fmtVND(totIn / days)}/ngày</span>`)}
      ${sum('k-red', '⬇️', 'Tổng chi', fmtVND(totOut), `<span class="kpi-delta flat">TB ${fmtVND(totOut / days)}/ngày</span>`)}
      ${sum(net >= 0 ? 'k-orange' : 'k-red', '⚖️', 'Dòng tiền ròng', (net < 0 ? '-' : '') + fmtVND(Math.abs(net)), `<span class="kpi-delta ${net >= 0 ? 'up' : 'down'}">Biên ${margin.toFixed(0)}%</span>`)}
      ${sum('k-teal', '⏳', 'Chờ thu', fmtVND(pend), '<span class="kpi-delta flat">chưa tính vào dòng tiền</span>')}
      ${sum('k-purple', '↩️', 'Đã hoàn tiền', fmtVND(refund), '<span class="kpi-delta flat">không tính vào doanh thu</span>')}
    </div>

    <div class="dash-row">
      <div class="dash-card wide"><div class="dash-card-head"><h4>Thu – chi theo kỳ</h4><span class="muted-sm">${cf.range === '6m' || cf.range === 'all' ? 'theo tháng' : cf.range === '90d' ? 'theo tuần' : 'theo ngày'}</span></div><div class="chart-wrap" id="cfChart"></div></div>
      <div class="dash-card"><div class="dash-card-head"><h4>Chi phí thực tế vs kế hoạch</h4></div><div id="cfCost"></div><p class="muted-sm" style="margin-top:8px">Vạch đen = tỷ trọng kế hoạch (Product 35% · GTM 30% · Trust/Ops 25% · Admin 10%).</p></div>
    </div>

    <div class="dash-card">
      <div class="dash-card-head"><h4>Danh sách giao dịch <span class="count-pill">${filtered.length}</span></h4></div>
      <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Ngày</th><th>Loại</th><th>Hạng mục</th><th>Mô tả</th><th style="text-align:right">Số tiền</th><th>Trạng thái</th><th>Hành động</th></tr></thead><tbody id="cfBody"></tbody></table></div>
    </div>`;

  // chart
  const gran = (cf.range === '6m' || cf.range === 'all') ? 'month' : cf.range === '90d' ? 'week' : 'day';
  let from = rb.from, to = rb.to;
  if (cf.range === 'all') { from = tx.map(t => t.date).sort()[0] || ymd(new Date()); to = ymd(new Date()); }
  renderCashChart(document.getElementById('cfChart'), buildSeries(tx.filter(t => (!cf.category || t.category === cf.category)), gran, from, to));

  // chi phí vs kế hoạch
  const costTotal = totOut || 1;
  const costItems = Object.keys(COST_BUCKETS).map(k => {
    const v = inRange.filter(t => t.type === 'out' && t.status === 'paid' && t.category === k).reduce((s, t) => s + t.amount, 0);
    return { label: COST_BUCKETS[k].label, value: v / costTotal * 100, plan: COST_BUCKETS[k].plan, color: COST_BUCKETS[k].color, raw: v };
  });
  renderHBars(document.getElementById('cfCost'), costItems.map(i => ({ ...i, value: i.value })), v => v.toFixed(0) + '%');
  document.querySelectorAll('#cfCost .hb-track').forEach(tr => { tr.style.setProperty('--max', '100'); });

  // table
  const body = document.getElementById('cfBody');
  const rows = filtered.slice().sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)));
  if (!rows.length) { body.innerHTML = '<tr class="admin-empty-row"><td colspan="7">Không có giao dịch phù hợp bộ lọc.</td></tr>'; return; }
  const limit = 150;
  body.innerHTML = rows.slice(0, limit).map(t => {
    const m = txCategoryMeta(t);
    return `<tr>
      <td>${dmy(t.date)}</td>
      <td><span class="pill ${t.type === 'in' ? 'pill-ok' : 'pill-flagged'}">${t.type === 'in' ? 'Thu' : 'Chi'}</span></td>
      <td><span class="cat-chip" style="--c:${m.color}">${m.icon} ${m.label}</span></td>
      <td>${escapeHtml(t.desc)}${t.demo ? ' <span class="demo-tag">mẫu</span>' : ''}</td>
      <td style="text-align:right;white-space:nowrap" class="tx-amt ${t.type === 'in' ? 'c-in' : 'c-out'}${t.status === 'refunded' ? ' strike' : ''}">${t.type === 'in' ? '+' : '-'}${fmtVND(t.amount)}</td>
      <td><span class="pill st-${t.status}">${TX_STATUS[t.status]}</span></td>
      <td><div class="admin-action-btns">
        ${t.status === 'pending' ? `<button class="abtn abtn-unflag" onclick="setTxStatus('${t.id}','paid')">Đã thu</button>` : ''}
        ${t.type === 'in' && t.status === 'paid' ? `<button class="abtn abtn-flag" onclick="setTxStatus('${t.id}','refunded')">↩️ Hoàn</button>` : ''}
        <button class="abtn abtn-delete" onclick="deleteTx('${t.id}')">🗑️</button>
      </div></td></tr>`;
  }).join('') + (rows.length > limit ? `<tr class="admin-empty-row"><td colspan="7">Đang hiển thị ${limit}/${rows.length} giao dịch mới nhất — hãy thu hẹp bộ lọc hoặc xuất CSV để xem đủ.</td></tr>` : '');
}

let cfSearchTimer = null;
function cfSearchInput(v) {
  clearTimeout(cfSearchTimer);
  cfSearchTimer = setTimeout(() => { cf.q = v; renderCashflow(); const el = document.getElementById('cfSearch'); if (el) { el.focus(); el.setSelectionRange(v.length, v.length); } }, 250);
}

// ---------- form ghi nhận ----------
function toggleTxForm(force) {
  const f = document.getElementById('txForm');
  const show = typeof force === 'boolean' ? force : f.style.display === 'none';
  f.style.display = show ? 'block' : 'none';
  if (show) { document.getElementById('txType').value = 'in'; txFormTypeChange(); document.getElementById('txDate').value = ymd(new Date()); document.getElementById('txDesc').value = ''; document.getElementById('txFormError').style.display = 'none'; }
}
function txFormTypeChange() {
  const type = document.getElementById('txType').value;
  const src = type === 'in' ? REVENUE_STREAMS : COST_BUCKETS;
  document.getElementById('txCategory').innerHTML = Object.keys(src).map(k => `<option value="${k}">${src[k].label}</option>`).join('');
  document.getElementById('txStatus').value = 'paid';
  txFormCategoryChange();
}
function txFormCategoryChange(fromQty) {
  const type = document.getElementById('txType').value, cat = document.getElementById('txCategory').value;
  const amt = document.getElementById('txAmount');
  if (type === 'in' && REVENUE_STREAMS[cat]) {
    const qty = Math.max(1, Number(document.getElementById('txQty').value) || 1);
    amt.value = REVENUE_STREAMS[cat].price * qty;
  } else if (!fromQty) { amt.value = ''; }
}
function saveTxFromForm() {
  if (!requireAdmin('ghi nhận giao dịch')) return;
  const err = document.getElementById('txFormError');
  const type = document.getElementById('txType').value;
  const category = document.getElementById('txCategory').value;
  const amount = Math.round(Number(document.getElementById('txAmount').value));
  const date = document.getElementById('txDate').value;
  const status = document.getElementById('txStatus').value;
  let desc = document.getElementById('txDesc').value.trim();
  const qty = Math.max(1, Number(document.getElementById('txQty').value) || 1);
  if (!amount || amount <= 0) { err.textContent = 'Vui lòng nhập số tiền hợp lệ.'; err.style.display = 'block'; return; }
  if (!date) { err.textContent = 'Vui lòng chọn ngày giao dịch.'; err.style.display = 'block'; return; }
  if (!desc) desc = (type === 'in' ? REVENUE_STREAMS[category] : COST_BUCKETS[category]).label + (type === 'in' && qty > 1 ? ' ×' + qty : '');
  const arr = loadTx();
  arr.push({ id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000), date, type, category, desc, amount, status });
  saveTx(arr);
  showToast('Đã ghi nhận giao dịch');
  renderCashflow();
}
function setTxStatus(id, status) {
  if (!requireAdmin('đổi trạng thái giao dịch')) return;
  const arr = loadTx(); const t = arr.find(x => x.id === id); if (!t) return;
  t.status = status; saveTx(arr); renderCashflow();
}
function deleteTx(id) {
  if (!requireAdmin('xóa giao dịch')) return;
  if (!confirm('Xóa giao dịch này?')) return;
  saveTx(loadTx().filter(t => t.id !== id)); renderCashflow();
}
function exportTxCsv() {
  if (!requireAdmin('xuất CSV dòng tiền')) return;
  const rb = rangeBounds(cf.range);
  const rows = loadTx().filter(t => inR(t, rb)).sort((a, b) => a.date.localeCompare(b.date));
  const csv = '\ufeff' + ['Ngày,Loại,Hạng mục,Mô tả,Số tiền (VND),Trạng thái'].concat(rows.map(t => [t.date, t.type === 'in' ? 'Thu' : 'Chi', txCategoryMeta(t).label, t.desc, t.amount, TX_STATUS[t.status]].map(PFSec.csvCell).join(','))).join('\n');
  PFSec.log('csv_export', rows.length + ' giao dịch');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'petfinder-dong-tien-' + ymd(new Date()) + '.csv';
  document.body.appendChild(a); a.click(); a.remove();
}
