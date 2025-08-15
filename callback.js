(function() {
  // URL parametrelerini oku
  const urlParams = new URLSearchParams(window.location.search);
  const callbackName = urlParams.get('callback') || 'callback';
  const il = urlParams.get('il');
  const ilce = urlParams.get('ilce');
  const mahalle = urlParams.get('mahalle');
  const sokak = urlParams.get('sokak');

  // CSV verilerinin GitHub URL'leri
  const CSV_URLS = {
    il: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/il.csv',
    ilce: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/ilce.csv',
    mahalle: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/mahalle.csv',
    // Sokak verisi parçalı, mahalle koduna göre
    sokak: (mahalleKod) => `https://raw.githubusercontent.com/ckoglu/csv-tr-api/main/sokak/sokak${mahalleKod}.csv`
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

  // Fetch ve callback
  async function loadData() {
    try {
      const ilData = parseCsv(await (await fetch(CSV_URLS.il)).text());
      const ilceData = parseCsv(await (await fetch(CSV_URLS.ilce)).text());
      const mahalleData = parseCsv(await (await fetch(CSV_URLS.mahalle)).text());

      // Sokak verisi (örnek: mahalle koduna göre 1. dosya)
      const sokakData = parseCsv(await (await fetch(CSV_URLS.sokak(1))).text());

      const data = {
        il, ilce, mahalle, sokak,
        ilData, ilceData, mahalleData, sokakData,
        mesaj: "Tüm veriler yüklendi"
      };

      // Callback çağır
      if (typeof window[callbackName] === 'function') {
        window[callbackName](data);
      } else {
        console.error("Callback fonksiyonu bulunamadı:", callbackName);
      }
    } catch (e) {
      console.error("Veri yükleme hatası:", e);
    }
  }

  loadData();
})();
