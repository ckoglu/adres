(async function() {
  // URL parametrelerini al
  const params = new URLSearchParams(window.location.search);
  const il = params.get('il') || '';
  const ilce = params.get('ilce') || '';
  const mahalle = params.get('mahalle') || '';
  const sokak = params.get('sokak') || '';
  const callbackName = params.get('callback');

  if (!callbackName || typeof window[callbackName] !== 'function') {
    console.error('Callback fonksiyonu bulunamadı:', callbackName);
    return;
  }

  // CSV dosya URL'leri
  const CSV_URLS = {
    il: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/il.csv',
    ilce: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/ilce.csv',
    koy: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/koy.csv',
    mahalle: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/mahalle.csv',
  };

  // CSV parse fonksiyonu
  function parseCsv(csvText) {
    const lines = csvText.split('\n').filter(l => l.trim() !== '');
    if (!lines.length) return [];
    const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const values = line.split(';');
      const obj = {};
      headers.forEach((h, i) => obj[h] = values[i] ? values[i].trim() : '');
      return obj;
    });
  }

  // CSV yükleme
  async function loadCsv(type) {
    try {
      const res = await fetch(CSV_URLS[type]);
      const text = await res.text();
      return parseCsv(text);
    } catch (err) {
      console.error(type + ' yüklenemedi:', err);
      return [];
    }
  }

  // Verileri yükle
  const [ilData, ilceData, mahalleData] = await Promise.all([
    loadCsv('il'),
    loadCsv('ilce'),
    loadCsv('mahalle')
  ]);

  // Filtreleme
  const filteredIl = il ? ilData.filter(x => x.ad.toLowerCase() === il.toLowerCase()) : ilData;
  const filteredIlce = ilce ? ilceData.filter(x => x.ilce.toLowerCase() === ilce.toLowerCase()) : ilceData;
  const filteredMahalle = mahalle ? mahalleData.filter(x => x.mahalle.toLowerCase() === mahalle.toLowerCase()) : mahalleData;

  // Sokak verisi (mahalle koduna göre parçalı CSV)
  async function loadSokak(mahalleKod) {
    if (!mahalleKod) return [];
    const index = Math.min(Math.floor((parseInt(mahalleKod)-1)/20000)+1, 50);
    const url = `https://raw.githubusercontent.com/ckoglu/csv-tr-api/main/sokak/sokak${index}.csv`;
    try {
      const res = await fetch(url);
      const text = await res.text();
      return parseCsv(text).filter(s => sokak ? s.sokak_no === sokak : true);
    } catch (err) {
      console.error('Sokak yüklenemedi:', err);
      return [];
    }
  }

  // Mahalle kodu varsa sokakları yükle
  let sokakData = [];
  if (filteredMahalle.length) {
    const codes = filteredMahalle.map(m => m.mahalle_kod);
    for (let code of codes) {
      const data = await loadSokak(code);
      sokakData = sokakData.concat(data);
    }
  }

  // JSONP callback
  const result = {
    il: filteredIl,
    ilce: filteredIlce,
    mahalle: filteredMahalle,
    sokak: sokakData,
    timestamp: new Date().toISOString()
  };

  window[callbackName](result);

})();
