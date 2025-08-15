(function() {
  // URL parametrelerini al
  const params = new URLSearchParams(location.search);
  const il = params.get('il');
  const ilce = params.get('ilce');
  const mahalle = params.get('mahalle');
  const sokak = params.get('sokak');
  const callbackName = params.get('callback');

  if (!callbackName || typeof window[callbackName] !== 'function') {
    console.error('Callback fonksiyonu bulunamadı:', callbackName);
    return;
  }

  // CSV dosyaları
  const CSV_URLS = {
    il: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/il.csv',
    ilce: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/ilce.csv',
    mahalle: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/mahalle.csv',
    // sokak örnek dosya
    sokak: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/main/sokak/sokak1.csv'
  };

  // CSV parse fonksiyonu
  function parseCsv(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 1) return [];
    const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const values = line.split(';');
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = values[i] ? values[i].trim() : '';
      });
      return obj;
    });
  }

  // CSV yükle ve filtrele
  async function loadAndFilterCsv(url, filterKey, filterValue) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CSV yüklenemedi: ${url}`);
    const text = await res.text();
    const data = parseCsv(text);
    if (!filterKey || !filterValue) return data;
    return data.filter(row => row[filterKey.toLowerCase()] === filterValue);
  }

  // Tüm verileri yükle
  (async function() {
    try {
      const ilData = await loadAndFilterCsv(CSV_URLS.il, 'il', il);
      const ilceData = await loadAndFilterCsv(CSV_URLS.ilce, 'ilce', ilce);
      const mahalleData = await loadAndFilterCsv(CSV_URLS.mahalle, 'mahalle', mahalle);
      const sokakData = await loadAndFilterCsv(CSV_URLS.sokak, 'sokak', sokak);

      const result = {
        il: ilData,
        ilce: ilceData,
        mahalle: mahalleData,
        sokak: sokakData
      };

      // JSONP callback çağır
      window[callbackName](result);
    } catch (e) {
      console.error('Veri yüklenirken hata:', e);
      window[callbackName]({ error: e.message });
    }
  })();
})();
