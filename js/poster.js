/* Tạo poster tìm thú cưng thất lạc: vẽ bằng canvas ngay trên trình duyệt, không gửi dữ liệu đi đâu.
   Luồng: mở hộp chỉnh poster -> xem trước trực tiếp -> "Tạo poster" -> Tải PNG / Tải PDF / Chia sẻ / Xóa poster. */
(function () {
  'use strict';

  const SITE = 'petfinder-ebon.vercel.app';
  const SITE_URL = 'https://' + SITE;
  const COLORS = { red: '#C0392B', orange: '#F5823A', teal: '#2F7F78', blue: '#4a5d86' };
  const COLOR_NAMES = { red: 'Đỏ', orange: 'Cam', teal: 'Xanh ngọc', blue: 'Xanh dương' };
  const SIZES = {
    a4: { w: 794, h: 1123, final: 1240, live: 620, pdf: [595.28, 841.89], label: 'A4 (in)' },
    square: { w: 1080, h: 1080, final: 1080, live: 640, pdf: [595.28, 595.28], label: 'Vuông (Facebook, Zalo)' }
  };
  const clean = (v, n) => (window.PFSec && PFSec.cleanText ? PFSec.cleanText(v, n) : String(v || '').trim().slice(0, n));

  let ui = null;            // các phần tử của hộp thoại
  let photoImg = null;      // ảnh thú cưng (Image) hoặc null
  let pet = null;
  let result = null;        // { png: Blob, pngUrl, pdf: Blob|null, pdfUrl, name }
  let renderTimer = 0;

  /* ---------- Hàm vẽ ---------- */
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function wrap(ctx, text, maxW, maxLines) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = []; let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {
      lines.length = maxLines;
      let last = lines[maxLines - 1];
      while (last.length > 1 && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1);
      lines[maxLines - 1] = last.replace(/[\s,.;]+$/, '') + '…';
    }
    return lines;
  }
  function fitFont(ctx, text, weight, family, size, minSize, maxW) {
    let s = size;
    while (s > minSize) { ctx.font = weight + ' ' + s + 'px ' + family; if (ctx.measureText(text).width <= maxW) break; s -= 2; }
    ctx.font = weight + ' ' + s + 'px ' + family;
    return s;
  }
  function drawCover(ctx, img, x, y, w, h) {
    const r = Math.max(w / img.width, h / img.height);
    const dw = img.width * r, dh = img.height * r;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }
  function drawLogo(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 120, s / 120);
    ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineCap = 'round';
    ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(52, 52, 38, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(80, 80); ctx.lineTo(108, 108); ctx.stroke();
    const oval = (cx, cy, rx, ry) => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
    oval(52, 60, 13, 10); oval(35, 45, 5, 7); oval(46, 36, 5, 7); oval(58, 36, 5, 7); oval(69, 45, 5, 7);
    ctx.restore();
  }
  function shadowBox(ctx, x, y, w, h, r, fill) {
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.16)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    ctx.fillStyle = fill; rr(ctx, x, y, w, h, r); ctx.fill(); ctx.restore();
  }
  function drawPhoto(ctx, img, icon, x, y, w, h) {
    shadowBox(ctx, x - 6, y - 6, w + 12, h + 12, 28, '#fff');
    ctx.save(); rr(ctx, x, y, w, h, 24); ctx.clip();
    ctx.fillStyle = '#FFE3C2'; ctx.fillRect(x, y, w, h);
    if (img) drawCover(ctx, img, x, y, w, h);
    else { ctx.font = Math.min(w, h) * 0.5 + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2C2415'; ctx.fillText(icon || '🐾', x + w / 2, y + h / 2); }
    ctx.restore();
  }
  function drawInfo(ctx, rows, x, y, w, lh, labelSize, valueSize) {
    const HEAD = '"Nunito", "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    for (const r of rows) {
      if (!r.value) continue;
      ctx.font = '800 ' + labelSize + 'px ' + HEAD; ctx.fillStyle = '#6B5744';
      y += labelSize + 2; ctx.fillText(r.label, x, y);
      ctx.font = '700 ' + valueSize + 'px ' + HEAD; ctx.fillStyle = '#2C2415';
      for (const line of wrap(ctx, r.value, w, r.lines)) { y += lh; ctx.fillText(line, x, y); }
      y += 14;
    }
    return y;
  }
  function drawContact(ctx, d, x, y, w, h) {
    const HEAD = '"Baloo 2", "Nunito", "Segoe UI", Arial, sans-serif', BODY = '"Nunito", "Segoe UI", Arial, sans-serif';
    shadowBox(ctx, x, y, w, h, 20, '#fff');
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; const px = x + 24, mw = w - 48;
    ctx.fillStyle = '#6B5744'; fitFont(ctx, 'Nếu thấy ' + d.shortName + ', xin liên hệ', '800', BODY, 22, 14, mw);
    ctx.fillText('Nếu thấy ' + d.shortName + ', xin liên hệ', px, y + 38);
    ctx.fillStyle = '#2C2415'; fitFont(ctx, d.contact, '800', HEAD, 38, 22, mw); ctx.fillText(d.contact, px, y + 84);
    if (d.showPhone && d.phone) { ctx.fillStyle = '#C0392B'; fitFont(ctx, d.phone, '800', HEAD, 54, 28, mw); ctx.fillText(d.phone, px, y + 142); }
    else { ctx.fillStyle = '#C95010'; fitFont(ctx, SITE, '800', BODY, 28, 16, mw); ctx.fillText(SITE, px, y + 126); }
  }
  function drawFooter(ctx, d, W, y, h) {
    const HEAD = '"Baloo 2", "Nunito", "Segoe UI", Arial, sans-serif', BODY = '"Nunito", "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#F5823A'; ctx.fillRect(0, y, W, h);
    drawLogo(ctx, 40, y + (h - 46) / 2, 46);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = '800 ' + Math.round(h * 0.36) + 'px ' + HEAD;
    ctx.fillText('PetFinder', 96, y + h / 2 + 2);
    if (d.showWeb) { ctx.textAlign = 'right'; ctx.font = '700 ' + Math.round(h * 0.27) + 'px ' + BODY; ctx.fillText(SITE, W - 40, y + h / 2 + 2); }
    ctx.textBaseline = 'alphabetic';
  }
  function boxHeight(d) { return d.showPhone && d.phone ? 170 : 150; }

  function drawPoster(canvas, d, img, outW) {
    const S = SIZES[d.size] || SIZES.a4, k = outW / S.w;
    canvas.width = Math.round(S.w * k); canvas.height = Math.round(S.h * k);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0);
    const HEAD = '"Baloo 2", "Nunito", "Segoe UI", Arial, sans-serif', BODY = '"Nunito", "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#FFF3E6'; ctx.fillRect(0, 0, S.w, S.h);
    const accent = COLORS[d.color] || COLORS.red;
    const rows = [
      { label: 'Đặc điểm', value: d.desc, lines: d.size === 'a4' ? 2 : 4 },
      { label: 'Địa điểm lần cuối xuất hiện', value: d.place, lines: d.size === 'a4' ? 2 : 3 },
      { label: 'Thời gian mất tích', value: d.time, lines: 1 }
    ];
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    if (d.size === 'a4') {
      ctx.fillStyle = accent; ctx.fillRect(0, 0, S.w, 137);
      ctx.fillStyle = '#fff'; ctx.font = '800 88px ' + HEAD; ctx.fillText('THẤT LẠC', S.w / 2, 102);
      drawPhoto(ctx, img, d.icon, 54, 162, 686, 260);
      ctx.textAlign = 'left'; ctx.fillStyle = '#C95010'; fitFont(ctx, d.name.toUpperCase(), '800', HEAD, 70, 34, 686);
      ctx.fillText(d.name.toUpperCase(), 54, 506);
      ctx.fillStyle = '#6B5744'; ctx.font = '700 26px ' + BODY;
      const sub = wrap(ctx, d.line, 686, 1)[0] || ''; ctx.fillText(sub, 54, 544);
      drawInfo(ctx, rows, 54, 556, 686, 29, 19, 24);
      const bh = boxHeight(d);
      drawContact(ctx, d, 54, S.h - 76 - 24 - bh, 686, bh);
      drawFooter(ctx, d, S.w, S.h - 76, 76);
    } else {
      ctx.fillStyle = accent; ctx.fillRect(0, 0, S.w, 127);
      ctx.fillStyle = '#fff'; ctx.font = '800 76px ' + HEAD; ctx.fillText('THẤT LẠC', S.w / 2, 92);
      drawPhoto(ctx, img, d.icon, 50, 166, 480, 450);
      drawContact(ctx, d, 44, 650, 492, boxHeight(d));
      ctx.textAlign = 'left'; ctx.fillStyle = '#C95010'; fitFont(ctx, d.name.toUpperCase(), '800', HEAD, 100, 44, 466);
      ctx.fillText(d.name.toUpperCase(), 570, 262);
      ctx.fillStyle = '#6B5744'; ctx.font = '700 26px ' + BODY;
      let y = 300; for (const l of wrap(ctx, d.line, 466, 2)) { ctx.fillText(l, 570, y); y += 32; }
      drawInfo(ctx, rows, 570, y + 6, 466, 31, 20, 25);
      drawFooter(ctx, d, S.w, S.h - 66, 66);
    }
  }

  /* ---------- Ảnh, phông ---------- */
  function loadPhoto(src) {
    return new Promise(resolve => {
      if (!src) return resolve(null);
      const im = new Image();
      if (!/^data:|^blob:/.test(src)) im.crossOrigin = 'anonymous';
      im.onload = () => resolve(im);
      im.onerror = () => resolve(null);
      im.src = src;
    });
  }
  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('800 40px "Baloo 2"'), document.fonts.load('700 24px "Nunito"'), document.fonts.load('800 24px "Nunito"')
    ]).catch(() => {});
  }

  /* ---------- PDF (không cần thư viện): một trang chứa ảnh JPEG ---------- */
  function makePdf(jpeg, iw, ih, pw, ph) {
    const enc = new TextEncoder(), parts = [], offs = []; let len = 0;
    const push = x => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
    const obj = (n, body) => { offs[n] = len; push(n + ' 0 obj\n' + body + '\nendobj\n'); };
    push('%PDF-1.4\n');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pw + ' ' + ph + '] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>');
    const content = 'q ' + pw + ' 0 0 ' + ph + ' 0 0 cm /Im0 Do Q';
    obj(4, '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream');
    offs[5] = len;
    push('5 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + iw + ' /Height ' + ih + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.length + ' >>\nstream\n');
    push(jpeg); push('\nendstream\nendobj\n');
    const xref = len; let x = 'xref\n0 6\n0000000000 65535 f \n';
    for (let i = 1; i <= 5; i++) x += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
    push(x + 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF');
    return new Blob(parts, { type: 'application/pdf' });
  }
  const toBlob = (canvas, type, q) => new Promise(res => canvas.toBlob(res, type, q));

  /* ---------- Giao diện ---------- */
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function build() {
    if (ui) return ui;
    const ov = el('div', 'pz-overlay'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Tạo poster tìm thú cưng');
    ov.innerHTML = `
<div class="pz-box">
  <button type="button" class="pz-close" aria-label="Đóng">&times;</button>
  <div class="pz-edit">
    <div class="pz-form">
      <h2>Chỉnh poster</h2>
      <p class="pz-sub">Xem trước bên cạnh thay đổi ngay khi bạn sửa.</p>
      <label>Tên thú cưng<input id="pzName" maxlength="40" autocomplete="off"></label>
      <label>Giống, tuổi, giới tính<input id="pzLine" maxlength="70" autocomplete="off"></label>
      <label>Đặc điểm nhận dạng<textarea id="pzDesc" rows="2" maxlength="160"></textarea></label>
      <label>Địa điểm lần cuối xuất hiện<input id="pzPlace" maxlength="110" autocomplete="off"></label>
      <label>Thời gian mất tích<input id="pzTime" maxlength="60" autocomplete="off" placeholder="VD: 12/10/2026, khoảng 7 giờ sáng"></label>
      <div class="pz-two">
        <label>Cách gọi<select id="pzSal"><option>Anh</option><option>Chị</option></select></label>
        <label>Tên người liên hệ (chỉ tên, không họ)<input id="pzCName" maxlength="20" autocomplete="off"></label>
      </div>
      <label>Số điện thoại<input id="pzPhone" type="tel" maxlength="20" autocomplete="off" inputmode="tel"></label>
      <label class="pz-check"><input id="pzShowPhone" type="checkbox" checked> Hiện số điện thoại trên poster</label>
      <p class="pz-warn" id="pzWarn">Số điện thoại sẽ hiển thị công khai trên poster. Chỉ nhập số bạn sẵn sàng cho người lạ gọi.</p>
      <label class="pz-check"><input id="pzShowWeb" type="checkbox" checked> Hiện địa chỉ web PetFinder</label>
      <div class="pz-group"><span>Khổ giấy</span><div class="pz-seg" id="pzSizes"></div></div>
      <div class="pz-group"><span>Màu dải tiêu đề</span><div class="pz-sw" id="pzColors"></div></div>
      <div class="pz-err" id="pzErr" role="alert" hidden></div>
      <button type="button" class="pz-create" id="pzCreate">Tạo poster</button>
    </div>
    <div class="pz-preview"><div class="pz-lab">Xem trước trực tiếp</div><canvas id="pzCanvas" aria-label="Xem trước poster"></canvas></div>
  </div>
  <div class="pz-result" hidden>
    <h2>Poster của bạn đã sẵn sàng</h2>
    <img id="pzImg" alt="Poster đã tạo">
    <div class="pz-actions">
      <button type="button" id="pzPng">Tải PNG</button>
      <button type="button" id="pzPdf">Tải PDF</button>
      <button type="button" id="pzShare">Chia sẻ</button>
    </div>
    <p class="pz-hint" id="pzHint" hidden>Bạn đang mở web trong ứng dụng khác (Zalo, Facebook...), có thể không tải được. Hãy mở bằng Chrome hoặc Safari rồi thử lại.</p>
    <div class="pz-actions pz-second">
      <button type="button" id="pzBack">Chỉnh sửa</button>
      <button type="button" id="pzDelete" class="pz-danger">Xóa poster</button>
    </div>
  </div>
</div>`;
    document.body.appendChild(ov);
    const $ = id => ov.querySelector('#' + id);
    ui = { ov, $, edit: ov.querySelector('.pz-edit'), res: ov.querySelector('.pz-result') };

    Object.keys(SIZES).forEach((k, i) => {
      const b = el('button'); b.type = 'button'; b.dataset.size = k; b.textContent = SIZES[k].label; if (!i) b.classList.add('on');
      b.addEventListener('click', () => { ui.size = k; [...$('pzSizes').children].forEach(c => c.classList.toggle('on', c === b)); schedule(); });
      $('pzSizes').appendChild(b);
    });
    ui.size = 'a4';
    Object.keys(COLORS).forEach((k, i) => {
      const b = el('button'); b.type = 'button'; b.dataset.color = k; b.style.background = COLORS[k]; b.setAttribute('aria-label', COLOR_NAMES[k]); b.title = COLOR_NAMES[k]; if (!i) b.classList.add('on');
      b.addEventListener('click', () => { ui.color = k; [...$('pzColors').children].forEach(c => c.classList.toggle('on', c === b)); schedule(); });
      $('pzColors').appendChild(b);
    });
    ui.color = 'red';

    ov.querySelectorAll('input,textarea,select').forEach(i => i.addEventListener('input', () => { $('pzWarn').hidden = !$('pzShowPhone').checked; schedule(); }));
    ov.querySelector('.pz-close').addEventListener('click', close);
    ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && ov.classList.contains('open')) close(); });
    $('pzCreate').addEventListener('click', create);
    $('pzBack').addEventListener('click', () => { showEdit(); });
    $('pzDelete').addEventListener('click', removePoster);
    $('pzPng').addEventListener('click', () => download(result && result.pngUrl, fileName('png')));
    $('pzPdf').addEventListener('click', downloadPdf);
    $('pzShare').addEventListener('click', share);
    return ui;
  }

  function readData() {
    const v = id => ui.$(id).value;
    const name = clean(v('pzName'), 40) || 'Thú cưng';
    const contact = (v('pzSal') + ' ' + clean(v('pzCName'), 20)).trim();
    return {
      size: ui.size, color: ui.color, icon: pet && pet.icon, name, shortName: name,
      line: clean(v('pzLine'), 70), desc: clean(v('pzDesc'), 160), place: clean(v('pzPlace'), 110), time: clean(v('pzTime'), 60),
      contact, phone: clean(v('pzPhone'), 20), showPhone: ui.$('pzShowPhone').checked, showWeb: ui.$('pzShowWeb').checked
    };
  }
  function schedule() { clearTimeout(renderTimer); renderTimer = setTimeout(renderLive, 90); }
  function renderLive() {
    if (!ui || !ui.ov.classList.contains('open')) return;
    drawPoster(ui.$('pzCanvas'), readData(), photoImg, SIZES[ui.size].live);
  }
  function showEdit() { ui.res.hidden = true; ui.edit.hidden = false; renderLive(); }
  function showResult() { ui.edit.hidden = true; ui.res.hidden = false; ui.$('pzHint').hidden = !/FBAN|FBAV|Zalo|Instagram|Line\//i.test(navigator.userAgent); }
  function fileName(ext) { return 'poster-' + (clean(readData().name, 40).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'thu-cung') + '.' + ext; }

  function fail(msg) { const e = ui.$('pzErr'); e.textContent = msg; e.hidden = false; }
  function clearResult() {
    if (result) { URL.revokeObjectURL(result.pngUrl); if (result.pdfUrl) URL.revokeObjectURL(result.pdfUrl); }
    result = null; if (ui) ui.$('pzImg').removeAttribute('src');
  }

  async function create() {
    ui.$('pzErr').hidden = true;
    const d = readData();
    if (!clean(ui.$('pzName').value, 40)) return fail('Vui lòng nhập tên thú cưng.');
    if (!clean(ui.$('pzCName').value, 20)) return fail('Vui lòng nhập tên người liên hệ.');
    if (d.showPhone && !(window.PFSec && PFSec.isPhone ? PFSec.isPhone(d.phone) : /^[0-9 +().-]{8,20}$/.test(d.phone))) return fail('Số điện thoại không hợp lệ. Hãy nhập số hợp lệ hoặc tắt "Hiện số điện thoại".');
    const btn = ui.$('pzCreate'); btn.disabled = true; btn.textContent = 'Đang tạo...';
    try {
      await fontsReady();
      const c = document.createElement('canvas');
      drawPoster(c, d, photoImg, SIZES[d.size].final);
      const png = await toBlob(c, 'image/png');
      if (!png) throw new Error('canvas');
      clearResult();
      result = { png, pngUrl: URL.createObjectURL(png), pdf: null, pdfUrl: '', canvas: c, size: d.size };
      ui.$('pzImg').src = result.pngUrl;
      showResult();
    } catch (e) {
      fail('Không tạo được poster. Hãy thử lại hoặc dùng ảnh khác.');
    } finally { btn.disabled = false; btn.textContent = 'Tạo poster'; }
  }

  function download(url, name) {
    if (!url) return;
    const a = document.createElement('a'); a.href = url; a.download = name; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
  }
  async function downloadPdf() {
    if (!result) return;
    try {
      if (!result.pdf) {
        const jpg = await toBlob(result.canvas, 'image/jpeg', 0.92);
        const bytes = new Uint8Array(await jpg.arrayBuffer());
        const pg = SIZES[result.size].pdf;
        result.pdf = makePdf(bytes, result.canvas.width, result.canvas.height, pg[0], pg[1]);
        result.pdfUrl = URL.createObjectURL(result.pdf);
      }
      download(result.pdfUrl, fileName('pdf'));
    } catch (e) { toast('Không tạo được PDF. Hãy tải PNG rồi in ảnh.'); }
  }
  async function share() {
    if (!result) return;
    const file = new File([result.png], fileName('png'), { type: 'image/png' });
    const title = 'Tìm thú cưng thất lạc: ' + readData().name;
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ title, text: 'Xin giúp tìm thú cưng thất lạc. ' + SITE_URL, files: [file] }); }
      else if (navigator.share) { await navigator.share({ title, text: 'Xin giúp tìm thú cưng thất lạc.', url: SITE_URL }); toast('Hãy tải poster về rồi đính kèm khi đăng.'); }
      else { download(result.pngUrl, fileName('png')); toast('Đã tải poster. Hãy đăng ảnh này lên Facebook, Zalo hoặc Messenger.'); }
    } catch (e) { /* người dùng đóng hộp chia sẻ */ }
  }
  function removePoster() {
    clearResult(); toast('Đã xóa poster.'); showEdit();
  }
  function toast(m) { if (typeof showToast === 'function') showToast(m); }

  function close() {
    if (!ui) return;
    ui.ov.classList.remove('open'); document.body.classList.remove('pz-lock');
    clearResult(); photoImg = null; pet = null;
  }

  function givenName(full) { const p = String(full || '').trim().split(/\s+/).filter(Boolean); return p.length ? p[p.length - 1] : ''; }
  function uniq(list) { const seen = new Set(); return list.filter(x => { const k = String(x || '').trim().toLowerCase(); if (!k || seen.has(k)) return false; seen.add(k); return true; }); }

  async function openPosterEditor(idOrPet) {
    const p = typeof idOrPet === 'string' ? (typeof loadPets === 'function' ? loadPets().find(x => x.id === idOrPet) : null) : idOrPet;
    if (!p || p.status !== 'lost') { toast('Chỉ tạo poster cho tin thú cưng thất lạc.'); return; }
    const me = typeof currentUser !== 'undefined' ? currentUser : null;
    if (!me) { if (typeof openAuthModal === 'function') openAuthModal('login'); return; }
    const mine = (typeof canModifyPet === 'function') ? canModifyPet(p) : (typeof isMyPet === 'function' && isMyPet(p));
    if (!mine) { toast('Bạn chỉ tạo được poster cho tin do chính mình đăng.'); return; }
    build(); pet = p; clearResult();
    const $ = ui.$;
    $('pzName').value = p.name || '';
    $('pzLine').value = [p.type, p.breed, p.gender && String(p.gender).toLowerCase()].filter(Boolean).join(', ');
    $('pzDesc').value = clean(p.desc, 160);
    const nz = x => String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/(quan|huyen|thanh pho|tp\.?|thi xa|phuong|xa)\s+/g, '').trim();
    $('pzPlace').value = (p.location && p.area && nz(p.location).includes(nz(p.area)) ? [p.location] : uniq([p.location, p.area])).join(', ');
    $('pzTime').value = p.date || '';
    $('pzCName').value = givenName(me.name);
    $('pzPhone').value = p.phone || '';
    $('pzSal').value = 'Anh';
    $('pzShowPhone').checked = true; $('pzShowWeb').checked = true; $('pzWarn').hidden = false; $('pzErr').hidden = true;
    ui.ov.classList.add('open'); document.body.classList.add('pz-lock');
    ui.res.hidden = true; ui.edit.hidden = false;
    await fontsReady();
    photoImg = await loadPhoto(window.PFSec && PFSec.safeImageSrc ? PFSec.safeImageSrc(p.imageData && p.imageData[0]) : (p.imageData && p.imageData[0]));
    renderLive();
    $('pzName').focus({ preventScroll: true });
  }
  window.openPosterEditor = openPosterEditor;

  /* ---------- Nút trong cửa sổ chi tiết tin (chỉ hiện cho chủ tin thất lạc) ---------- */
  function syncModalButton() {
    const row = document.querySelector('#petModal .modal-contact-row');
    if (!row) return;
    let b = document.getElementById('pzOpenBtn');
    if (!b) {
      b = el('button', 'pz-open-btn'); b.type = 'button'; b.id = 'pzOpenBtn'; b.textContent = 'Tạo poster';
      b.addEventListener('click', () => { const p = typeof currentModalPet !== 'undefined' ? currentModalPet : null; if (p) openPosterEditor(p); });
      row.parentNode.insertBefore(b, row.nextSibling);
    }
    const p = typeof currentModalPet !== 'undefined' ? currentModalPet : null;
    const ok = p && p.status === 'lost' && typeof isMyPet === 'function' && isMyPet(p);
    b.style.display = ok ? '' : 'none';
  }
  if (typeof window.openPetModal === 'function') {
    const orig = window.openPetModal;
    window.openPetModal = function () { const r = orig.apply(this, arguments); try { syncModalButton(); } catch (e) { /* bỏ qua */ } return r; };
  }
})();
