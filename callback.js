(function() {
  // URL parametrelerini oku
  const urlParams = new URLSearchParams(window.location.search);
  const callbackName = urlParams.get('callback') || 'callback';
  const il = urlParams.get('il');
  const ilce = urlParams.get('ilce');
  const mahalle = urlParams.get('mahalle');
  const sokak = urlParams.get('sokak');

  // CSV URL'leri
  const CSV_URLS = {
    il: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/il.csv',
    ilce: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/ilce.csv',
    mahalle: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/mahalle.csv',
    sokak: (index) => `https://raw.githubusercontent.com/ckoglu/csv-tr-api/main/sokak/sokak${index}.csv`
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

  // Sokak dosyalarını fetch et (örnek: 50 dosya)
  async function fetchAllSokak() {
    const sokakData = [];
    for (let i = 1; i <= 50; i++) {
      try {
        const response = await fetch(CSV_URLS.sokak(i));
        if (!response.ok) continue;
        const csvText = await response.text();
        sokakData.push(...parseCsv(csvText));
      } catch(e) {
        console.warn(`Sokak dosyası ${i} yüklenemedi:`, e);
      }
    }
    return sokakData;
  }

  // Veri yükleme ve callback çağırma
  async function loadData() {
    try {
      const ilData = parseCsv(await (await fetch(CSV_URLS.il)).text());
      const ilceData = parseCsv(await (await fetch(CSV_URLS.ilce)).text());
      const mahalleData = parseCsv(await (await fetch(CSV_URLS.mahalle)).text());
      const sokakData = await fetchAllSokak();

      const data = {
        il, ilce, mahalle, sokak,
        ilData, ilceData, mahalleData, sokakData,
        mesaj: "Tüm veriler yüklendi"
      };

      // JSONP callback
      if (typeof window[callbackName] === 'function') {
        window[callbackName](data);
      } else {
        console.error("Callback fonksiyonu bulunamadı:", callbackName);
      }
    } catch(e) {
      console.error("Veri yükleme hatası:", e);
    }
  }

  loadData();
})();
