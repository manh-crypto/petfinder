// ===== PFDB: lớp dữ liệu Firebase (Firestore) =====
// Nguồn dữ liệu thật nằm trên Firestore (gói Spark miễn phí). Mã cũ vẫn gọi loadPets()/savePets()... đồng bộ:
// PFDB giữ một bản sao trong bộ nhớ (cập nhật realtime bằng onSnapshot) và tự đẩy thay đổi lên Firestore khi savePets()... được gọi.
// QUYỀN TRUY CẬP được quyết định bởi firestore.rules trên máy chủ – kiểm tra phía trình duyệt chỉ để hiện giao diện cho đúng.
(function (w) {
  'use strict';
  const FB_VER = '10.14.1';
  const cfgOk = () => { const f = (w.PETFINDER_CONFIG || {}).firebase; return !!(f && ['apiKey', 'authDomain', 'projectId', 'appId'].every(k => f[k])); };
  const S = { pets: [], news: [], users: [], feedback: [], tx: [], me: null, isAdmin: false, adminChecked: false, adminIds: new Set(), error: '' };
  const snap = { pets: [], news: [], users: [], feedback: [], tx: [] };       // bản sao lần cuối máy chủ gửi về (để hoàn tác khi ghi lỗi)
  const base = { pets: new Map(), news: new Map(), users: new Map(), feedback: new Map(), tx: new Map() };   // id → JSON tài liệu đang có trên máy chủ (để so sánh khi ghi)
  let legacy = [], migrated = new Set(), db = null, auth = null, userUnsubs = [], pubUnsubs = [];
  const emit = (name) => { try { w.dispatchEvent(new CustomEvent(name || 'pf:data')); } catch (e) { } };

  // ---- ready: chờ trạng thái đăng nhập + lần tải đầu của dữ liệu công khai (tối đa 9 giây để trang không bị treo khi mất mạng)
  let resolveReady; const ready = new Promise(r => { resolveReady = r; });
  const pending = new Set(); let readyDone = false, authKnown = false;
  const finish = () => { if (!readyDone && authKnown && pending.size === 0) { readyDone = true; resolveReady(); } };
  const expect = k => { if (!readyDone) pending.add(k); };
  const got = k => { pending.delete(k); finish(); };
  setTimeout(() => { if (!readyDone) { readyDone = true; if (!S.error) S.error = 'timeout'; resolveReady(); } }, 9000);

  const clone = v => JSON.parse(JSON.stringify(v));
  const shallow = arr => arr.map(x => ({ ...x }));
  const clean = o => { const r = {}; Object.keys(o).forEach(k => { if (o[k] !== undefined) r[k] = o[k]; }); return r; };

  // ---- chuyển đổi bản ghi <-> tài liệu Firestore
  // Tài liệu công khai của tin KHÔNG chứa SĐT/Zalo/email: các trường đó nằm ở pet_contacts/{id} (chỉ người đã đăng nhập đọc từng tài liệu)
  const PET_PUBLIC_KEYS = ['id', 'name', 'type', 'breed', 'gender', 'date', 'area', 'location', 'desc', 'status', 'icon', 'imageData', 'lat', 'lng', 'ownerName', 'ownerUid', 'createdAt', 'flagged'];
  const petDoc = p => { const r = {}; for (const k of PET_PUBLIC_KEYS) if (p[k] !== undefined) r[k] = p[k]; r.ownerUid = String(p.ownerUid || ''); r.imageData = p.imageData || []; return clean(r); };
  const contactDoc = p => { const c = { phone: String(p.phone || ''), zalo: String(p.zalo || ''), email: String(p.ownerEmail || ''), ownerUid: String(p.ownerUid || '') }; return (c.phone || c.zalo || c.email) ? c : null; };
  const contactBase = new Map();                 // id → JSON liên hệ đã biết (để chỉ ghi khi đổi)
  const contactCache = new Map();                // id → Promise<{phone,zalo,email}|null>
  const userDoc = u => clean({ uid: u.uid, name: u.name, avatar: u.avatar || '👤', avatarPhoto: u.avatarPhoto || '', email: u.email, phone: u.phone || '', role: u.role === 'admin' ? 'admin' : 'user', banned: u.banned === true, area: u.area || '', bio: u.bio || '', provider: u.provider });
  const idOf = { pets: x => x.id, news: x => x.id, feedback: x => x.id, tx: x => x.id, users: x => x.uid };
  const toDoc = { pets: petDoc, news: n => clean({ ...n }), feedback: f => clean({ ...f, ownerUid: String(f.ownerUid || '') }), tx: t => clean({ ...t }), users: userDoc };
  const sanitize = {
    pets: d => w.PFSec.sanitizePet(d),
    news: d => w.PFSec.sanitizeNews(d), users: d => w.PFSec.sanitizeUser(d), feedback: d => d, tx: d => d
  };

  async function loadSdk() {
    const A = w.PetFinderSocialAuth; if (!A) throw new Error('Thiếu social-auth.js');
    auth = await A.initialize();
    db = w.firebase.firestore();
    return db;
  }

  function setSnap(col, list) {
    snap[col] = list; S[col] = shallow(list);
    base[col] = new Map(list.map(x => [idOf[col](x), JSON.stringify(toDoc[col](x))]));
  }
  // ---- lắng nghe dữ liệu
  function listen(key, query, onData) {
    expect(key);
    return query.onSnapshot(s => { onData(s); got(key); emit(); }, err => { console.warn('Firestore (' + key + '):', err && err.code); got(key); });
  }
  function attachPublic() {
    pubUnsubs.push(listen('pets', db.collection('pets').orderBy('createdAt', 'desc').limit(300), s => {
      legacy = s.docs.filter(d => { const x = d.data(); return x.phone || x.zalo || x.ownerEmail; }).map(d => { const x = d.data(); return { id: d.id, phone: x.phone || '', zalo: x.zalo || '', email: x.ownerEmail || '', ownerUid: x.ownerUid || '' }; });
      setSnap('pets', s.docs.map(d => { const x = sanitize.pets({ ...d.data(), id: d.id }); if (x) { x.phone = ''; x.zalo = ''; x.ownerEmail = ''; } return x; }).filter(Boolean));
      migrateLegacy();
    }));
    pubUnsubs.push(feedbackListener('pub', db.collection('feedback').where('public', '==', true)));
    pubUnsubs.push(listen('news', db.collection('news'), s => {
      setSnap('news', s.docs.map(d => sanitize.news({ ...d.data(), id: d.id })).filter(Boolean));
    }));
  }
  const fbParts = { pub: new Map(), mine: new Map(), all: new Map() };
  function rebuildFeedback() {
    const m = new Map(); ['pub', 'mine', 'all'].forEach(k => fbParts[k].forEach((v, id) => m.set(id, v)));
    setSnap('feedback', Array.from(m.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
  }
  function feedbackListener(part, query) {
    return listen('fb_' + part, query, s => { fbParts[part] = new Map(s.docs.map(d => [d.id, { ...d.data(), id: d.id }])); rebuildFeedback(); });
  }
  function detachUser() {
    userUnsubs.forEach(u => { try { u(); } catch (e) { } }); userUnsubs = [];
    S.me = null; S.isAdmin = false; S.adminChecked = false; S.adminIds = new Set(); setSnap('users', []); setSnap('tx', []);
    fbParts.mine = new Map(); fbParts.all = new Map(); rebuildFeedback();
  }
  const applyRoles = () => { S.users.forEach(u => { u.role = S.adminIds.has(u.uid) ? 'admin' : 'user'; }); if (S.me) S.me.role = S.isAdmin ? 'admin' : 'user'; };
  function attachUser(user) {
    const uid = user.uid; let adminAttached = false;
    userUnsubs.push(listen('me', db.collection('users').doc(uid), d => {
      if (!d.exists) { S.me = null; if (!S.isAdmin) setSnap('users', []); return; }
      const u = sanitize.users({ ...d.data(), uid });
      S.me = u ? { ...u, uid, role: S.isAdmin ? 'admin' : 'user' } : null;
      if (!S.isAdmin && S.me) setSnap('users', [{ ...S.me, role: 'user' }]);      // người dùng thường chỉ thấy hồ sơ của mình
    }));
    userUnsubs.push(listen('admin', db.collection('admins').doc(uid), d => {
      S.isAdmin = d.exists; S.adminChecked = true; applyRoles(); migrateLegacy();
      if (S.isAdmin && !adminAttached) {                 // chỉ admin mới đọc được toàn bộ người dùng / giao dịch / góp ý
        adminAttached = true;
        userUnsubs.push(listen('admins', db.collection('admins'), s => { S.adminIds = new Set(s.docs.map(x => x.id)); applyRoles(); }));
        userUnsubs.push(listen('users', db.collection('users'), s => { setSnap('users', s.docs.map(x => sanitize.users({ ...x.data(), uid: x.id })).filter(Boolean)); applyRoles(); }));
        userUnsubs.push(listen('tx', db.collection('tx'), s => setSnap('tx', s.docs.map(x => ({ ...x.data(), id: x.id })))));
        userUnsubs.push(feedbackListener('all', db.collection('feedback')));
      }
    }));
    userUnsubs.push(feedbackListener('mine', db.collection('feedback').where('ownerUid', '==', uid)));
  }


  // ---- liên hệ của tin: tải theo yêu cầu (không tải hàng loạt), có cache
  function getContact(id) {
    if (!db || !id) return Promise.resolve(null);
    if (!S.me) return Promise.resolve(null);                       // cần đăng nhập
    if (!contactCache.has(id)) {
      contactCache.set(id, db.collection('pet_contacts').doc(id).get().then(d => {
        if (!d.exists) return {};
        const x = d.data(); const c = { phone: x.phone || '', zalo: x.zalo || '', email: x.email || '' };
        contactBase.set(id, JSON.stringify({ ...c, ownerUid: x.ownerUid || '' }));
        return c;
      }).catch(err => { contactCache.delete(id); console.warn('pet_contacts:', err && err.code); return null; }));
    }
    return contactCache.get(id);
  }
  // ---- di trú: tin cũ còn SĐT/email trong tài liệu công khai → chuyển sang pet_contacts rồi xóa khỏi tài liệu công khai
  async function migrateLegacy() {
    if (!db || !S.me || !S.adminChecked) return;
    const mine = legacy.filter(x => !migrated.has(x.id) && (S.isAdmin || x.ownerUid === S.me.uid));
    if (!mine.length) return;
    mine.forEach(x => migrated.add(x.id));
    const del = w.firebase.firestore.FieldValue.delete();
    try {
      for (let i = 0; i < mine.length; i += 200) {
        const b = db.batch();
        mine.slice(i, i + 200).forEach(x => {
          b.set(db.collection('pet_contacts').doc(x.id), { phone: x.phone, zalo: x.zalo, email: x.email, ownerUid: x.ownerUid });
          b.update(db.collection('pets').doc(x.id), { phone: del, zalo: del, ownerEmail: del });
        });
        await b.commit();
      }
      console.info('Đã chuyển thông tin liên hệ của ' + mine.length + ' tin sang vùng riêng tư.');
    } catch (e) { console.warn('Di trú liên hệ lỗi:', e && e.code); mine.forEach(x => migrated.delete(x.id)); }
  }

  // ---- ghi: so sánh với bản cũ rồi gửi phần thay đổi lên Firestore
  const MAX_DOC = 950000;
  function write(col, nextArr, opts) {
    if (!db) { toast('Chưa kết nối được cơ sở dữ liệu.'); return false; }
    const ops = []; const nextIds = new Set();
    for (const raw of nextArr) {
      const id = idOf[col](raw); if (!id) continue;
      nextIds.add(id);
      const doc = toDoc[col](raw); const json = JSON.stringify(doc);
      if (col === 'pets') {
        const c = contactDoc(raw);
        if (c) { const cj = JSON.stringify(c); if (contactBase.get(id) !== cj) { ops.push({ type: 'contact', id, doc: c }); contactBase.set(id, cj); contactCache.set(id, Promise.resolve({ phone: c.phone, zalo: c.zalo, email: c.email })); } }
      }
      if (base[col].get(id) === json) continue;
      if (json.length > MAX_DOC) { toast('Dữ liệu quá lớn để lưu (thường do ảnh). Hãy bỏ bớt ảnh rồi thử lại.'); return false; }
      ops.push({ type: 'set', id, doc, json });
    }
    base[col].forEach((_, id) => { if (!nextIds.has(id)) { ops.push({ type: 'delete', id }); if (col === 'pets') { ops.push({ type: 'delContact', id }); contactBase.delete(id); contactCache.delete(id); } } });
    S[col] = nextArr; emit();                         // cập nhật giao diện ngay (optimistic)
    if (!ops.length) return opts && opts.wait ? Promise.resolve(true) : true;
    const roleOps = col === 'users' ? ops.filter(o => o.type === 'set' && (o.doc.role === 'admin') !== S.adminIds.has(o.id)).map(o => ({ id: o.id, admin: o.doc.role === 'admin' })) : [];
    const done = (async () => {
      for (let i = 0; i < ops.length; i += 400) {
        const b = db.batch();
        ops.slice(i, i + 400).forEach(o => {
          if (o.type === 'contact') return b.set(db.collection('pet_contacts').doc(o.id), o.doc);
          if (o.type === 'delContact') return b.delete(db.collection('pet_contacts').doc(o.id));
          const ref = db.collection(col).doc(o.id); o.type === 'set' ? b.set(ref, o.doc) : b.delete(ref);
        });
        await b.commit();
      }
      for (const r of roleOps) { const ref = db.collection('admins').doc(r.id); await (r.admin ? ref.set({ since: Date.now() }) : ref.delete()); }
    })().catch(err => {
      console.error('Firestore write failed:', err);
      S[col] = shallow(snap[col]); emit();            // hoàn tác thay đổi trên giao diện
      if (opts && opts.wait) throw err;               // chế độ chờ: để nơi gọi tự báo lỗi cụ thể
      toast(err && err.code === 'permission-denied' ? 'Bạn không có quyền thực hiện thao tác này (kiểm tra đã xác thực email chưa, hoặc luật Firestore đã được cập nhật chưa).' : 'Không lưu được lên máy chủ. Hãy kiểm tra mạng rồi thử lại.');
    });
    return opts && opts.wait ? done.then(() => true) : true;
  }
  function toast(m) { if (typeof w.showToast === 'function') w.showToast(m, 4500); else console.warn(m); }

  // ---- khởi tạo
  if (!cfgOk()) { S.error = 'no-config'; authKnown = true; finish(); }
  else loadSdk().then(() => {
    expect('auth');
    attachPublic();
    auth.onAuthStateChanged(user => {
      detachUser();
      if (isUnverified(user)) {                         // email/mật khẩu chưa xác thực: không coi là đã đăng nhập, đăng xuất ngay
        auth.signOut().catch(() => { }); user = null;
      }
      if (user) { attachUser(user); } else { emit('pf:auth'); }
      if (user && !PFDB.busy) {                         // tài khoản đã bị admin xóa: đăng xuất ngay (kể cả phiên còn lưu trên máy)
        db.collection('deleted_users').doc(user.uid).get().then(d => { if (d.exists && !PFDB.busy) { auth.signOut().catch(() => { }); toast('Tài khoản này đã bị quản trị viên xóa.'); } }).catch(() => { });
      }
      authKnown = true; got('auth'); emit('pf:auth');
    });
    // me/admin đổi (ví dụ vừa đăng ký xong) → báo cho giao diện
    w.addEventListener('pf:data', () => { const k = S.me ? S.me.uid + ':' + S.me.role + ':' + !!S.me.banned : ''; if (k !== PFDB._k) { PFDB._k = k; emit('pf:auth'); } });
  }).catch(e => { console.error('Firebase init failed:', e); S.error = String(e && e.message || e); authKnown = true; pending.clear(); finish(); });

  // Tài khoản email/mật khẩu chưa bấm liên kết xác thực email. 'busy' bật trong lúc đăng ký/đăng nhập để luồng đó tự xử lý.
  function isUnverified(u) {
    return !!(u && !u.emailVerified && !PFDB.busy && (u.providerData || []).some(p => p && p.providerId === 'password'));
  }
  const PFDB = {
    ready, busy: 0, state: S, _k: '',
    get ok() { return !!db && !S.error; }, get error() { return S.error; },
    auth: () => auth, db: () => db, fb: () => w.firebase,
    write, emit, getContact,
    markDeleted: (uid, email) => db.collection('deleted_users').doc(uid).set({ email: String(email || ''), at: Date.now() }),
    users: () => S.users,
    me: () => (S.me && !isUnverified(auth && auth.currentUser)) ? { ...S.me, role: S.isAdmin ? 'admin' : 'user' } : null,
    whenMe(ms) { return new Promise(res => { const t0 = Date.now(); const tick = () => { if (S.me && S.adminChecked) return res(PFDB.me()); if (Date.now() - t0 > (ms || 6000)) return res(null); setTimeout(tick, 80); }; tick(); }); },
    async upsertProfile(profile) {                    // tạo hồ sơ nếu chưa có (đăng ký / đăng nhập Google lần đầu)
      const ref = db.collection('users').doc(profile.uid); const d = await ref.get();
      if (d.exists) return d.data();
      const gone = db.collection('deleted_users').doc(profile.uid);
      if (profile.reviveDeleted) { try { await gone.delete(); } catch (e) { } }   // đăng ký lại một cách chủ động: xóa dấu "đã xóa"
      else { let g = null; try { g = await gone.get(); } catch (e) { } if (g && g.exists) { try { await auth.signOut(); } catch (e) { } const err = new Error('Tài khoản này đã bị quản trị viên xóa. Nếu muốn dùng lại, hãy bấm "Đăng ký" với email này.'); err.code = 'pf/deleted'; throw err; } }
      await ref.set(userDoc({ ...profile, role: 'user', banned: false })); return profile;
    }
  };
  w.PFDB = PFDB;
})(window);
