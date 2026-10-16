// Tìm địa chỉ / định vị ngược. Thử lần lượt: OpenStreetMap Nominatim → Photon (komoot) → bảng địa danh có sẵn trong web (js/provinces.js),
// nên khi một dịch vụ bị lỗi, bị chặn hoặc quá tải thì chức năng vẫn chạy được.
(function createGeocodingService(global) {
  let lastRequestAt = 0;
  const cache = new Map();
  const cfg = () => (global.PETFINDER_CONFIG && global.PETFINDER_CONFIG.geocoding) || {};

  async function getJson(url, ms) {
    const waitMs = Math.max(0, 1000 - (Date.now() - lastRequestAt));
    if (waitMs) await new Promise(r => setTimeout(r, waitMs));
    lastRequestAt = Date.now();
    const controller = new AbortController(); const t = setTimeout(() => controller.abort(), ms || 8000);
    try {
      const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } finally { clearTimeout(t); }
  }

  // ---- nhà cung cấp 1: Nominatim
  async function nominatimSearch(q) {
    const endpoint = cfg().endpoint || 'https://nominatim.openstreetmap.org/search';
    const params = new URLSearchParams({ q, format: 'jsonv2', addressdetails: '1', 'accept-language': 'vi', countrycodes: cfg().countryCode || 'vn', limit: String(cfg().limit || 5) });
    const data = await getJson(endpoint + '?' + params);
    return data.map(i => ({ lat: Number(i.lat), lng: Number(i.lon), displayName: i.display_name, type: i.type, boundingBox: i.boundingbox })).filter(i => Number.isFinite(i.lat) && Number.isFinite(i.lng));
  }
  async function nominatimReverse(lat, lng) {
    const endpoint = (cfg().endpoint || 'https://nominatim.openstreetmap.org/search').replace(/\/search$/, '/reverse');
    const d = await getJson(endpoint + '?' + new URLSearchParams({ lat, lon: lng, format: 'jsonv2', addressdetails: '1', zoom: '18', 'accept-language': 'vi' }));
    if (!d || d.error) throw new Error('no result');
    return { displayName: d.display_name || '', address: d.address || {} };
  }
  // ---- nhà cung cấp 2: Photon
  const photonAddr = p => ({ house_number: p.housenumber, road: p.street || p.name, suburb: p.locality, city_district: p.district, county: p.county, city: p.city, state: p.state });
  async function photonSearch(q) {
    const d = await getJson('https://photon.komoot.io/api/?' + new URLSearchParams({ q, limit: '5', bbox: '102.1,8.4,109.6,23.4' }));
    return (d.features || []).filter(f => !f.properties.countrycode || f.properties.countrycode === 'VN').map(f => {
      const p = f.properties, a = photonAddr(p);
      return { lat: Number(f.geometry.coordinates[1]), lng: Number(f.geometry.coordinates[0]), displayName: [p.name, p.street, p.district, p.city, p.state].filter((v, i, arr) => v && arr.indexOf(v) === i).join(', '), type: p.osm_value, address: a };
    }).filter(i => Number.isFinite(i.lat) && Number.isFinite(i.lng));
  }
  async function photonReverse(lat, lng) {
    const d = await getJson('https://photon.komoot.io/reverse?' + new URLSearchParams({ lat, lon: lng }));
    const f = (d.features || [])[0]; if (!f) throw new Error('no result');
    const p = f.properties; return { displayName: [p.name, p.street, p.district, p.city, p.state].filter(Boolean).join(', '), address: photonAddr(p) };
  }

  async function search(query) {
    const value = String(query || '').trim();
    if (value.length < 2) return [];
    const key = value.toLocaleLowerCase('vi');
    if (cache.has(key)) return cache.get(key);
    let results = [];
    for (const fn of [nominatimSearch, photonSearch]) {
      try { results = await fn([value, /vi[eệ]t nam/i.test(value) ? '' : 'Việt Nam'].filter(Boolean).join(', ')); } catch (e) { console.warn('Tìm địa chỉ lỗi:', e && e.message); }
      if (results.length) break;
    }
    if (!results.length && typeof pfGazetteerSearch === 'function') results = pfGazetteerSearch(value);   // dự phòng offline: quận/huyện, tỉnh/thành
    if (results.length) cache.set(key, results);
    return results;
  }

  // Tọa độ → địa chỉ. Luôn trả về một tên địa điểm đọc được (không bao giờ chỉ là kinh độ, vĩ độ).
  async function reverse(lat, lng) {
    lat = Number(lat); lng = Number(lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Tọa độ không hợp lệ.');
    for (const fn of [nominatimReverse, photonReverse]) {
      try { const r = await fn(lat, lng); if (r && (r.displayName || Object.keys(r.address).length)) return r; } catch (e) { console.warn('Định vị ngược lỗi:', e && e.message); }
    }
    const near = typeof pfGazetteerNearest === 'function' ? pfGazetteerNearest(lat, lng) : null;
    if (!near) return { displayName: '', address: {}, approximate: true };
    const prov = PF_PROVINCES[near.prov][0];
    return { displayName: near.full, approximate: true, address: near.isProv ? { state: prov } : { city_district: near.name, state: prov } };
  }

  global.PetFinderGeocoding = { search, reverse };
})(window);
