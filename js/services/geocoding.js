// Address lookup through OpenStreetMap Nominatim.
(function createGeocodingService(global) {
  let activeRequest = null;
  let lastRequestAt = 0;
  const resultCache = new Map();

  async function search(query) {
    const value = String(query || '').trim();
    if (value.length < 2) return [];
    const cacheKey = value.toLocaleLowerCase('vi');
    if (resultCache.has(cacheKey)) return resultCache.get(cacheKey);

    const config = (global.PETFINDER_CONFIG && global.PETFINDER_CONFIG.geocoding) || {};
    const endpoint = config.endpoint || 'https://nominatim.openstreetmap.org/search';
    const params = new URLSearchParams({
      q: value,
      format: 'jsonv2',
      addressdetails: '1',
      'accept-language': 'vi',
      countrycodes: config.countryCode || 'vn',
      limit: String(config.limit || 5)
    });

    if (activeRequest) activeRequest.abort();
    activeRequest = new AbortController();
    const requestController = activeRequest;
    let timedOut = false;

    const waitMs = Math.max(0, 1000 - (Date.now() - lastRequestAt));
    if (waitMs) await new Promise(resolve => setTimeout(resolve, waitMs));
    lastRequestAt = Date.now();

    const timeoutId = setTimeout(() => {
      timedOut = true;
      requestController.abort();
    }, 10000);
    let response;
    try {
      response = await fetch(`${endpoint}?${params.toString()}`, {
        signal: requestController.signal,
        headers: { Accept: 'application/json' }
      });
    } catch (error) {
      if (timedOut) throw new Error('Dịch vụ tìm địa chỉ phản hồi quá chậm.');
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
    if (!response.ok) throw new Error(`Geocoding API trả về HTTP ${response.status}.`);

    const data = await response.json();
    const results = data.map(item => ({
      lat: Number(item.lat),
      lng: Number(item.lon),
      displayName: item.display_name,
      type: item.type,
      boundingBox: item.boundingbox
    })).filter(item => Number.isFinite(item.lat) && Number.isFinite(item.lng));
    resultCache.set(cacheKey, results);
    return results;
  }

  global.PetFinderGeocoding = { search };
})(window);
