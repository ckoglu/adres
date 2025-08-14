const pathname = location.pathname.split('/').filter(Boolean);
const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
const { siteURL } = await import(`${location.origin}${repo}js/siteurl.js`);
const url = siteURL();
const { normalizeTR } = await import(`${url.helper}other.js`);

export async function verileriYukle() {
    const CSV_URLS = {
      il: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/il.csv',
      ilce: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/ilce.csv',
      koy: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/koy.csv',
      mahalle: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/mahalle.csv',
      // sokak: 'https://raw.githubusercontent.com/letreset/UAVT/main/csv/uavt_sokak.csv', // parçalandı
      ilbelediye: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/ilbelediye.csv',
      ilcebelediye: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/ilcebelediye.csv',
      universite: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/universite.csv',
    };

    // Cache mekanizması
    const cache = {
        _data: {},
        has(key) { return this._data.hasOwnProperty(key); },
        get(key) { return this._data[key]; },
        set(key, value) { this._data[key] = value; },
        clear() { this._data = {}; }
    };

    // Başlangıç verilerini yükle
    async function loadInitialData() {
        try {
            await Promise.all([
                loadCsvData('il'),
                loadCsvData('ilce')
            ]);
        } catch (error) {
            console.error('Başlangıç verileri yüklenirken hata:', error);
            showAlert(`Başlangıç verileri yüklenirken hata:` + error, "error");
        }
    }

    // CSV yükleme fonksiyonu
    async function loadCsvData(type, mahalleKod = null) {
      if (type !== "sokak") {
        // Diğer türlerde cache'den kontrol ve yükle
        if (cache.has(type)) return cache.get(type);
    
        try {
          const response = await fetch(CSV_URLS[type]);
          if (!response.ok) throw new Error(`${type} yüklenemedi: ${response.status}`);
          const csvText = await response.text();
          const data = parseCsv(csvText);
          cache.set(type, data);
          return data;
        } catch (error) {
          console.error(`${type} yüklenirken hata:`, error);
          showAlert(`${type} yüklenirken hata:` + error, "error");
          throw error;
        }
      } else {
        // Sokaklar için mahalleKod'a göre dosya seçimi ve yükleme
        if (!mahalleKod) {
          // mahalleKod verilmemişse tüm dosyaları yüklemeye kalkma, hata fırlat veya boş dön
          throw new Error("Sokak verisi için mahalle_kod parametresi gerekiyor.");
        }
        const index = Math.min(Math.floor((parseInt(mahalleKod) - 1) / 20000) + 1, 50);
        const fileName = `https://raw.githubusercontent.com/ckoglu/csv-tr-api/main/sokak/sokak${index}.csv`;
    
        if (cache.has(fileName)) return cache.get(fileName);
    
        try {
          const response = await fetch(fileName);
          if (!response.ok) throw new Error(`Sokak dosyası yüklenemedi: ${fileName}`);
          const csvText = await response.text();
          const data = parseCsv(csvText);
          cache.set(fileName, data);
          return data;
        } catch (error) {
          console.error(`Sokak dosyası yüklenirken hata:`, error);
          showAlert(`Sokak dosyası yüklenirken hata:` + error, "error");
          throw error;
        }
      }
    }

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

    // İl adına göre arama fonksiyonu
    async function getIlByAdi(ilAdi) {
        const iller = await loadCsvData('il');
        const normalizedSearch = normalizeTR(ilAdi);
        
        return iller.find(il => 
            normalizeTR(il.adi) === normalizedSearch)
            || null;
    }

    // İlçe adına göre arama fonksiyonu
    async function getIlceByAdi(ilceAdi, ilKodu = null) {
        const ilceler = await loadCsvData('ilce');
        const normalizedSearch = normalizeTR(ilceAdi);
        
        let filteredIlceler = ilceler;
        
        // Eğer il kodu verilmişse, önce ona göre filtrele
        if (ilKodu) {
            filteredIlceler = ilceler.filter(ilce => ilce.il_kod === ilKodu);
        }
        
        return filteredIlceler.find(ilce => 
            normalizeTR(ilce.ad) === normalizedSearch)
            || null;
    }

    // Köy adına göre bul (tam eşleşme, opsiyonel ilceKod ile)
    async function getKoyByAdi(koyAdi, ilceKod = null) {
        const koyler = await loadCsvData("koy");
        const search = normalizeTR(koyAdi);
    
        let filtered = koyler;
        if (ilceKod) {
        filtered = koyler.filter(koy => koy.ilcekod === ilceKod);
        }
    
        return filtered.find(koy =>
        normalizeTR(koy.koyad) === search
        ) || null;
    }
    
    // Mahalle adına göre bul (tam eşleşme, opsiyonel koyKod ile)
    async function getMahalleByAdi(mahalleAdi, ilceKod = null) {
        const mahalleler = await loadCsvData("mahalle");
        const koyler = await loadCsvData("koy");
        const search = normalizeTR(mahalleAdi);
      
        let mahalleKumesi = mahalleler;
      
        if (ilceKod) {
          // Bu ilceye bağlı köyleri bul
          const ilgiliKoyler = koyler.filter(k => k.ilcekod === ilceKod).map(k => k.koykod);
          // Bu köylere bağlı mahalleleri filtrele
          mahalleKumesi = mahalleler.filter(m => ilgiliKoyler.includes(m.koy_kod));
        }
      
        return mahalleKumesi.find(m => normalizeTR(m.ad) === search) || null;
      }
    
    // Sokak adına göre bul (tam eşleşme, opsiyonel mahalleKod ile)
    async function getSokakByAdi(sokakAdi, mahalleKod = null) {
      if (!mahalleKod) {
        // mahalleKod yoksa hata fırlatabiliriz veya tüm sokak dosyalarını yüklemeye kalkabiliriz (Tavsiye edilmez)
        throw new Error("Sokak araması için mahalle_kod gereklidir.");
      }
    
      const sokaklar = await loadCsvData("sokak", mahalleKod);
      const search = normalizeTR(sokakAdi);
    
      const filtered = sokaklar.filter(s => s.mahalle_kod === mahalleKod);
    
      return filtered.find(s => normalizeTR(s.ad) === search) || null;
    }

    // İl ve ilçe belediyelerine göre arama (metin eşleşmesi)
    async function getBelediyeByAdi(adList) {
        const ilBelediyeler = await loadCsvData("ilbelediye");
        const ilceBelediyeler = await loadCsvData("ilcebelediye");
        const searchTerms = Array.isArray(adList) ? adList.map(normalizeTR) : [normalizeTR(adList)];
      
        const matches = [];
      
        for (const term of searchTerms) {
          const ilMatch = ilBelediyeler.find(b => 
            normalizeTR(b.il_adi) === term || normalizeTR(b.belediye_ismi) === term
          );
          if (ilMatch) matches.push({ ...ilMatch, tur: "il" });
      
          const ilceMatch = ilceBelediyeler.find(b => 
            normalizeTR(b.il_adi) === term || normalizeTR(b.belediye_ismi) === term
          );
          if (ilceMatch) matches.push({ ...ilceMatch, tur: "ilce" });
        }
      
        return matches;
      }
    
    // Üniversite adına göre arama (çoklu destekli)
    async function getUniversiteByAdi(adList) {
        const universiteler = await loadCsvData("universite");
        const searchTerms = Array.isArray(adList) ? adList.map(normalizeTR) : [normalizeTR(adList)];
      
        return universiteler.filter(u =>
          searchTerms.some(term => 
            normalizeTR(u.universities__name).includes(term) || 
            normalizeTR(u.province) === term
          )
        );
      }

    // Dışa aktarılacak fonksiyonlar
    window.dataLoader = {
        loadInitialData,
        loadCsvData,
        parseCsv,
        normalizeTR,
        getIlByAdi,
        getIlceByAdi,
        getKoyByAdi,
        getMahalleByAdi,
        getSokakByAdi,
        getBelediyeByAdi,
        getUniversiteByAdi,
        cache
      };
    
    //showAlert(`CSV veriler yüklendi!`, "info");
    await loadInitialData();
}