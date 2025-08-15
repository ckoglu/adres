(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const callbackName = urlParams.get('callback') || 'callback';
  const il = urlParams.get('il');
  const ilce = urlParams.get('ilce');
  const mahalle = urlParams.get('mahalle');
  const sokak = urlParams.get('sokak');

  const CSV_URLS = {
    il: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/il.csv',
    ilce: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/ilce.csv',
    mahalle: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/mahalle.csv',
    sokak: (index) => `https://raw.githubusercontent.com/ckoglu/csv-tr-api/main/sokak/sokak${index}.csv`
  };

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

  // Mahalle kodundan sokak dosyasını seç
  async function fetchSokakForMahalle(mahalleKod) {
    if (!mahalleKod) return [];
    // Mahalle koduna göre dosya numarası
    const index = Math.min(Math.floor((parseInt(mahalleKod)-1)/20000) + 1, 50);
    try {
      const response = await fetch(CSV_URLS.sokak(index));
      if (!response.ok) throw new Error(`Sokak dosyası ${index} yüklenemedi`);
      const csvText = await response.text();
      const allSokak = parseCsv(csvText);
      // Sadece ilgili mahalle koduna ait sokaklar
      return allSokak.filter(s => s.mahalle_kod === mahalleKod);
    } catch(e) {
      console.error(e);
      return [];
    }
  }

  async function loadData() {
    try {
      const ilData = parseCsv(await (await fetch(CSV_URLS.il)).text());
      const ilceData = parseCsv(await (await fetch(CSV_URLS.ilce)).text());
      const mahalleData = parseCsv(await (await fetch(CSV_URLS.mahalle)).text());
      const mahalleObj = mahalleData.find(m => m.ilce_adi === ilce && m.ad === mahalle);
      const mahalleKod = mahalleObj ? mahalleObj.kod : null;

      const sokakData = await fetchSokakForMahalle(mahalleKod);

      const data = { il, ilce, mahalle, sokak, ilData, ilceData, mahalleData, sokakData, mesaj:"Veriler yüklendi" };

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
