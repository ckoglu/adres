// sw.js
// Static Firebase imports (Service Worker için gerekli)
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js');

// Firebase config (user.js ile aynı)
const firebaseConfig = {
  apiKey: "AIzaSyB9vpwfuV5SGC2772801WaThxz9klWTqrA",
  authDomain: "ckoglu-adres-api.firebaseapp.com",
  projectId: "ckoglu-adres-api",
  storageBucket: "ckoglu-adres-api.firebasestorage.app",
  messagingSenderId: "747242644544",
  appId: "1:747242644544:web:80896869ee6317d81c2ba5",
  measurementId: "G-JHSPG6VS7Y"
};

// Firebase başlatma (Service Worker uyumlu)
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app);

// CSV URL'leri
const CSV_URLS = {
  il: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/il.csv',
  ilce: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/ilce.csv',
  koy: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/koy.csv',
  mahalle: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/mahalle.csv',
  ilbelediye: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/ilbelediye.csv',
  ilcebelediye: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/ilcebelediye.csv',
  universite: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/universite.csv'
};

const cache = {};

// Yardımcı Fonksiyonlar
function normalizeTR(str) {
  return str
    .toString()
    .toLowerCase()
    .trim() 
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/i̇/g, 'i') 
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeLoc(str) {
  if (!str) return null;
  let cleaned = str.toString().replace(/\./g, (match, offset) => offset === str.toString().indexOf('.') ? '.' : '');
  cleaned = cleaned.replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseCsv(csvText) {
  const lines = csvText.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) return [];
  
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

async function loadCsvData(type, mahalleKod = null) {
  if (type !== 'sokak') {
    if (cache[type]) return cache[type];
    const res = await fetch(CSV_URLS[type]);
    if (!res.ok) throw new Error(`${type} CSV yüklenemedi`);
    const text = await res.text();
    const data = parseCsv(text);
    cache[type] = data;
    return data;
  } else {
    if (!mahalleKod) throw new Error('Sokak verisi için mahalleKod zorunludur');
    const index = Math.min(Math.floor((parseInt(mahalleKod) - 1) / 20000) + 1, 50);
    const fileUrl = `https://raw.githubusercontent.com/ckoglu/csv-tr-api/main/sokak/sokak${index}.csv`;
    
    if (cache[fileUrl]) return cache[fileUrl];
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error(`Sokak CSV yüklenemedi: ${fileUrl}`);
    const text = await res.text();
    const data = parseCsv(text);
    cache[fileUrl] = data;
    return data;
  }
}

// Veri Bulma Fonksiyonları
async function getIlByAdi(ilAdi) {
  const iller = await loadCsvData('il');
  const aranan = normalizeTR(ilAdi);
  return iller.find(il => normalizeTR(il.adi) === aranan) || null;
}

async function getIlceByAdi(ilceAdi, ilKodu = null) {
  const ilceler = await loadCsvData('ilce');
  const aranan = normalizeTR(ilceAdi);
  let filtreli = ilceler;
  if (ilKodu) filtreli = ilceler.filter(ilce => ilce.il_kod === ilKodu);
  return filtreli.find(ilce => normalizeTR(ilce.ad) === aranan) || null;
}

async function getKoyByAdi(koyAdi, ilceKod = null) {
  const koyler = await loadCsvData('koy');
  const aranan = normalizeTR(koyAdi);
  let filtreli = koyler;
  if (ilceKod) filtreli = koyler.filter(koy => koy.ilcekod === ilceKod);
  return filtreli.find(koy => normalizeTR(koy.koyad) === aranan) || null;
}

async function getMahalleByAdi(mahalleAdi, ilceKod = null) {
  const mahalleler = await loadCsvData('mahalle');
  const koyler = await loadCsvData('koy');
  const aranan = normalizeTR(mahalleAdi);
  let mahalleKumesi = mahalleler;
  
  if (ilceKod) {
    const ilgiliKoyler = koyler.filter(k => k.ilcekod === ilceKod).map(k => k.koykod);
    mahalleKumesi = mahalleler.filter(m => ilgiliKoyler.includes(m.koy_kod));
  }
  
  return mahalleKumesi.find(m => normalizeTR(m.ad) === aranan) || null;
}

async function getSokakByAdi(sokakAdi, mahalleKod) {
  if (!mahalleKod) throw new Error('Sokak araması için mahalleKod gereklidir');
  const sokaklar = await loadCsvData('sokak', mahalleKod);
  const aranan = normalizeTR(sokakAdi);
  const filtreli = sokaklar.filter(s => s.mahalle_kod === mahalleKod);
  return filtreli.find(s => normalizeTR(s.ad) === aranan) || null;
}

async function getBelediyeByAdi(adList) {
  const ilBelediye = await loadCsvData('ilbelediye');
  const ilceBelediye = await loadCsvData('ilcebelediye');
  const aramalar = Array.isArray(adList) ? adList.map(normalizeTR) : [normalizeTR(adList)];
  const matches = [];

  for (const aranan of aramalar) {
    const ilMatch = ilBelediye.find(b => 
      normalizeTR(b.il_adi) === aranan || normalizeTR(b.belediye_ismi) === aranan);
    if (ilMatch) matches.push({ ...ilMatch, tur: 'il' });

    const ilceMatch = ilceBelediye.find(b => 
      normalizeTR(b.il_adi) === aranan || normalizeTR(b.belediye_ismi) === aranan);
    if (ilceMatch) matches.push({ ...ilceMatch, tur: 'ilce' });
  }

  return matches;
}

async function getUniversiteByAdi(adList) {
  const universiteler = await loadCsvData('universite');
  const aramalar = Array.isArray(adList) ? adList.map(normalizeTR) : [normalizeTR(adList)];
  return universiteler.filter(u =>
    aramalar.some(term =>
      normalizeTR(u.universities__name).includes(term) ||
      normalizeTR(u.province) === term
    )
  );
}

// Parametre İşleme Fonksiyonları
function parseParameters(cmdText) {
  const params = {};
  const pairs = cmdText.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=').map(part => decodeURIComponent(part.trim()));
    if (key && value !== undefined) {
      params[key] = value;
    }
  }
  return params;
}

async function processAllParameters(params, result) {
  const typesToProcess = [
    "il", 
    "ilce", 
    "mahalle", 
    "koy", 
    "sokak", 
    "belediye",
    "universite", 
    "filtre", 
    "ara", 
    "sutun", 
    "sirala", 
    "rakim", 
    "kiyi", 
    "nufus", 
    "buyuksehir",
    "bolge",
    "sayfa"
  ];
  
  // If it's a direct type query (e.g., "il")
  if (!Object.keys(params).some(k => typesToProcess.includes(k))) {
    for (const type of typesToProcess) {
      if (params[type] !== undefined) {
        await processParameterType(type, params, result);
      }
    }
  } else {
    // Process all parameter types
    await processIlParams(params, result);
    await processIlceParams(params, result);
    await processMahalleParams(params, result);
    await processKoyParams(params, result);
    await processSokakParams(params, result);
    await processBelediyeParams(params, result);
    await processUniversiteParams(params, result);

    // Apply filters and sorting
    applyGlobalFilters(params, result);
    applySorting(params, result);
    result = applyColumnFiltering(params, result);
    applyPagination(params, result);
  }
}

async function processParameterType(type, params, result) {
  switch (type) {
    case 'il':
      await processIlParams(params, result);
      break;
    case 'ilce':
      await processIlceParams(params, result);
      break;
    case 'mahalle':
      await processMahalleParams(params, result);
      break;
    case 'koy':
      await processKoyParams(params, result);
      break;
    case 'sokak':
      await processSokakParams(params, result);
      break;
    case 'belediye':
      await processBelediyeParams(params, result);
      break;
    case 'universite':
      await processUniversiteParams(params, result);
      break;
    default:
      break;
  }
}

function applyGlobalFilters(params, result) {
  if (params.filtre) {
    const filters = params.filtre.split(',').map(f => f.trim());
    const filtered = {};
    
    for (const type of filters) {
      if (result[type]) {
        filtered[type] = result[type];
      }
    }
    
    if (Object.keys(filtered).length > 0) {
      Object.assign(result, filtered);
    }
  }
}

function applySorting(params, result) {
  if (params.sirala) {
    const sortOrder = params.sirala === 'za' ? -1 : 1;
    
    for (const key in result) {
      if (Array.isArray(result[key])) {
        result[key].sort((a, b) => {
          const aVal = a.adi || a.ad || '';
          const bVal = b.adi || b.ad || '';
          return aVal.localeCompare(bVal, 'tr') * sortOrder;
        });
      }
    }
  }
}

function applyColumnFiltering(params, result) {
  if (params.sutun) {
    const columns = params.sutun.split(',').map(c => c.trim());
    result = filterColumns(result, columns);
  }
  return result;
}

function applyPagination(params, result) {
  const page = params.sayfa ? Math.max(1, parseInt(params.sayfa)) : null;
  const limit = params.limit ? Math.max(1, parseInt(params.limit)) : 10;

  if (page) {
    for (const key in result) {
      if (Array.isArray(result[key])) {
        const start = (page - 1) * limit;
        result[key] = result[key].slice(start, start + limit);
      }
    }
  }
}

async function processIlParams(params, result) {
  if (params.il || params.bolge || params.kiyi !== undefined || params.buyuksehir !== undefined || 
      params.nufus || params.rakim || params.alan) {
    const iller = await loadCsvData("il");
    let filteredIller = [...iller];

    // Region filter
    if (params.bolge) {
      const bolge = normalizeTR(params.bolge);
      filteredIller = filteredIller.filter(i => 
        i.bolge && normalizeTR(i.bolge) === bolge
      );
    }

    // Coastal filter
    if (params.kiyi !== undefined) {
      const kiyiAranan = params.kiyi.toString().toLowerCase() === 'true';
      filteredIller = filteredIller.filter(i => 
        i.kıyı && i.kıyı.toString().toLowerCase() === kiyiAranan.toString()
      );
    }

    // Metropolitan filter
    if (params.buyuksehir !== undefined) {
      const buyuksehir = params.buyuksehir.toString().toLowerCase() === 'true';
      filteredIller = filteredIller.filter(i => 
        i.bsehir && i.bsehir.toString().toLowerCase() === buyuksehir.toString()
      );
    }

    // Population filter
    if (params.nufus) {
      const minNufus = parseInt(params.nufus);
      filteredIller = filteredIller.filter(i => 
        i.nufus && parseInt(i.nufus) >= minNufus
      );
    }

    // Elevation filter
    if (params.rakim) {
      const minRakim = parseInt(params.rakim);
      filteredIller = filteredIller.filter(i => 
        i.rakim && parseInt(i.rakim) >= minRakim
      );
    }

    // Area filter
    if (params.alan) {
      const minAlan = parseInt(params.alan);
      filteredIller = filteredIller.filter(i => 
        i.alan && parseInt(i.alan) >= minAlan
      );
    }

    // Specific city query
    if (params.il) {
      if (isNaN(params.il)) {
        const ilAdi = normalizeTR(params.il);
        filteredIller = filteredIller.filter(i => 
          i.adi && normalizeTR(i.adi) === ilAdi
        );
      } else {
        const ilKodu = params.il.replace(/^0+/, "");
        filteredIller = filteredIller.filter(i => 
          String(i.kodu) === ilKodu
        );
      }
    }

    if (filteredIller.length > 0) {
      result.iller = filteredIller;

      result.iller = result.iller.map(il => {
        if (il.enlem) {
          il.enlem_duzeltildi = normalizeLoc(il.enlem);
        }
        if (il.boylam) {
          il.boylam_duzeltildi = normalizeLoc(il.boylam);
        }

        if (il.enlem && il.boylam) {
          const lat = normalizeLoc(il.enlem);
          const lon = normalizeLoc(il.boylam);
          il.harita = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`;
        }

        return il;
      });

      if (params.sutun) {
        const columns = params.sutun.split(',').map(c => c.trim());
        result.iller = filterColumns(result.iller, columns);
      }

    } else {
      result.il_hata = "il bulunamadı";
    }

    // Get all districts for city if ilce parameter is empty
    if (params.il && params.ilce === "") {
      const ilceler = await loadCsvData("ilce");
      const ilKodu = result.iller?.[0]?.kodu;
      if (ilKodu) {
        result.ilceler = ilceler.filter(ilce => ilce.il_kod === ilKodu);
      }
    }
  }
}

async function processIlceParams(params, result) {
  if (!params.ilce) return;

  const ilceler = await loadCsvData("ilce");
  const ilceAranan = params.ilce.trim();
  
  // 1. KOD İLE ARAMA (ilce=1104 gibi)
  if (/^\d+$/.test(ilceAranan)) {
    const temizKod = ilceAranan.replace(/^0+/, '');
    var bulunanIlce = ilceler.find(i => i.kod === temizKod);
  } 
  // 2. METİN İLE ARAMA (ilce=seyhan gibi)
  else {   
    const arananNormalized = normalizeTR(ilceAranan);
    bulunanIlce = ilceler.find(ilce => 
      normalizeTR(ilce.ad) === arananNormalized || ilce.ad.toLowerCase() === arananNormalized
    );
  }

  if (bulunanIlce) {
    // İl bilgisini yükle ve ilçe nesnesine ekle
    const iller = await loadCsvData("il");
    const ilBilgisi = iller.find(i => i.kodu === bulunanIlce.il_kod);
    
    result.ilce = {
      ...bulunanIlce,
      il: ilBilgisi ? ilBilgisi.adi : null
    };
    
  } else {
    result.ilce_hata = `"${ilceAranan}" bulunamadı`;
  }

  // 3. MAHALLE PARAMETRESİ İŞLEMLERİ
  if (params.mahalle === "" && result.ilce?.kod) {
    try {
      const koyler = await loadCsvData("koy");
      const mahalleler = await loadCsvData("mahalle");
  
      // 1. Bu ilçe için köyleri bul
      const ilceKoyler = koyler.filter(k => String(k.ilcekod) === String(result.ilce.kod));
      const koyKodlari = ilceKoyler.map(k => String(k.koykod));
  
      // 2. Köy kodlarına göre mahalleleri filtrele
      result.mahalleler = mahalleler.filter(m => koyKodlari.includes(String(m.koy_kod)));
  
    } catch (error) {
      result.mahalle_hata = "mahalle bilgisi yüklenemedi: " + error.message;
    }
  }

}

async function processMahalleParams(params, result) {
  if (!params.mahalle) return;

  const aranan = params.mahalle.trim();
  const ilceKodu = result.ilce?.kod || result.ilce_kod?.kod || null;

  let mahalle = null;

  if (/^\d+$/.test(aranan)) {
    const temizKod = aranan.replace(/^0+/, "");
    const mahalleler = await loadCsvData("mahalle");
    mahalle = mahalleler.find(m => String(m.kod) === temizKod);
  } else {
    mahalle = await getMahalleByAdi(aranan, ilceKodu);
  }

  if (mahalle) {
    result.mahalle = mahalle;

    // Get streets if sokak parameter is empty
    if (params.sokak === "") {
      try {
        const sokaklar = await loadCsvData("sokak", mahalle.kod);
        result.sokaklar = sokaklar.filter(s => 
          s.mahalle_kod.toString() === mahalle.kod.toString()
        );
      } catch (e) {
        result.sokaklar_hata = `sokak verisi yüklenirken hata: ${e.message}`;
      }
    }
  } else {
    result.mahalle_hata = `${aranan} adlı/kodlu mahalle bulunamadı`;

    // General search without district filter
    if (isNaN(aranan)) {
      const mahalleGenel = await getMahalleByAdi(aranan);
      if (mahalleGenel) result.mahalle_genel = mahalleGenel;
    }
  }
}

async function processKoyParams(params, result) {
  if (!params.koy) return;

  const aranan = params.koy.trim();
  const ilceKodu = result.ilce?.kod || result.ilce_kod?.kod || null;

  let koy = null;

  if (/^\d+$/.test(aranan)) {
    const temizKod = aranan.replace(/^0+/, "");
    const koyler = await loadCsvData("koy");
    koy = koyler.find(k => String(k.koykod) === temizKod);
  } else {
    koy = await getKoyByAdi(aranan, ilceKodu);
  }

  if (koy) {
    result.koy = koy;

    // Get neighborhoods for the village
    const mahalleler = await loadCsvData("mahalle");
    const ilgiliMahalleler = mahalleler.filter(m => m.koy_kod === koy.koykod);
    result.mahalleler = ilgiliMahalleler;

    // Get streets for the neighborhoods
    const sokaklarToplam = [];
    for (const mahalle of ilgiliMahalleler) {
      try {
        const sokaklar = await loadCsvData("sokak", mahalle.kod);
        sokaklarToplam.push(...sokaklar.filter(s => s.mahalle_kod === mahalle.kod));
      } catch {}
    }
    if (sokaklarToplam.length) result.sokaklar = sokaklarToplam;
  } else {
    result.koy_hata = `${aranan} adlı/kodlu köy bulunamadı`;
  }
}

async function processSokakParams(params, result) {
  if (!params.sokak) return;

  const aranan = params.sokak.trim();
  const mahalleKodu = result.mahalle?.kod || null;
  const isKod = /^\d+$/.test(aranan);

  try {
    const sokaklar = await loadCsvData("sokak", mahalleKodu);
    const sokak = sokaklar.find(s => 
      String(s.ad).trim() === aranan && 
      String(s.mahalle_kod) === String(mahalleKodu)
    );

    if (sokak) {
      result.sokak = sokak;
    } else {
      result.sokak_hata = `${aranan} kodlu sokak bulunamadı (mahalle: ${mahalleKodu})`;
    }
  } catch (error) {
    result.sokak_hata = `sokak verisi yüklenirken hata: ${error.message}`;
  }
}

async function processBelediyeParams(params, result) {
  if (params.belediye) {
    const adlar = params.belediye.split(',').map(s => s.trim());
    const matches = await getBelediyeByAdi(adlar);
    if (matches.length > 0) {
      result.belediye = matches;
    } else {
      result.belediye_hata = `${params.belediye} için belediye bulunamadı`;
    }
  }
}

async function processUniversiteParams(params, result) {
  if (params.universite) {
    const adlar = params.universite.split(',').map(s => s.trim());
    const matches = await getUniversiteByAdi(adlar);
    if (matches.length > 0) {
      result.universite = matches;
    } else {
      result.universite_hata = `${params.universite} için üniversite bulunamadı`;
    }
  }
}

async function handleSearch(params) {
  if (!params.ara) {
    return { arama_hata: "arama parametresi (ara) gereklidir" };
  }

  let searchTerm = params.ara.toLowerCase();
  let matchMode = "equals"; // varsayılan: tam eşleşme

  if (searchTerm.startsWith("*") && searchTerm.endsWith("*")) {
    matchMode = "contains";
    searchTerm = searchTerm.slice(1, -1);
  } else if (searchTerm.startsWith("*")) {
    matchMode = "endsWith";
    searchTerm = searchTerm.slice(1);
  } else if (searchTerm.endsWith("*")) {
    matchMode = "startsWith";
    searchTerm = searchTerm.slice(0, -1);
  }

  const minSearchLength = 3;

  if (searchTerm.length < minSearchLength) {
    return { arama_hata: `en az ${minSearchLength} karakter girin` };
  }

  let searchResult = {};
  const allTypes = ["il", "ilce", "mahalle", "koy", "sokak", "universite"];
  const filters = params.filtre ? params.filtre.split(',').map(f => f.trim()).filter(f => allTypes.includes(f)) : allTypes;

  const mahalleKod = params.mahalle || (params.mahalle_kod ? params.mahalle_kod.toString() : null);

  for (const type of filters) {
    try {
      if (![
            "il", 
            "ilce", 
            "mahalle", 
            "koy", 
            "sokak", 
            "belediye",
            "universite", 
            "filtre", 
            "ara", 
            "sutun", 
            "sirala", 
            "rakim", 
            "kiyi", 
            "nufus", 
            "buyuksehir",
            "bolge",
            "sayfa"
          ].includes(type)) continue;

      if (type === 'sokak') {
        if (!mahalleKod) {
          searchResult.sokak_hata = "Sokak araması için mahalle kodu gereklidir";
          continue;
        }
        
        try {
          const sokakData = await loadCsvData(type, mahalleKod);
          const filtered = filterData(sokakData, searchTerm, matchMode);

          if (filtered.length) searchResult.sokak = filtered;
        } catch (error) {
          searchResult.sokak_hata = `Sokak verisi yüklenemedi: ${error.message}`;
        }
        continue;
      }

      const data = await loadCsvData(type);
      const filtered = filterData(data, searchTerm, matchMode);

      if (filtered.length > 0) {
        searchResult[type] = filtered;
      }
    } catch (error) {
      console.error(`${type} aramasında hata:`, error);
      searchResult[`${type}_hata`] = `${type} aramasında hata: ${error.message}`;
    }
  }

  return searchResult;
}

function filterData(data, searchTerm, mode = "equals") {
  return data.filter(item => {
    return Object.values(item).some(val => {
      if (!val) return false;
      const normalizedVal = normalizeTR(val.toString());
      const normalizedSearch = normalizeTR(searchTerm);

      switch (mode) {
        case "contains":
          return normalizedVal.includes(normalizedSearch);
        case "startsWith":
          return normalizedVal.startsWith(normalizedSearch);
        case "endsWith":
          return normalizedVal.endsWith(normalizedSearch);
        case "equals":
        default:
          return normalizedVal === normalizedSearch;
      }
    });
  });
}

// filterColumns fonksiyonunu güncelle
function filterColumns(data, columns) {
  if (!columns || columns.length === 0) return data;
  
  // Dizi durumu
  if (Array.isArray(data)) {
    return data.map(item => {
      const filteredItem = {};
      columns.forEach(col => {
        if (item[col] !== undefined) {
          filteredItem[col] = item[col];
        }
      });
      return filteredItem;
    });
  }
  
  // Obje durumu
  if (typeof data === 'object' && data !== null) {
    const filteredData = {};
    Object.keys(data).forEach(key => {
      // Alt dizileri de filtrele
      if (Array.isArray(data[key])) {
        filteredData[key] = data[key].map(item => {
          const filteredItem = {};
          columns.forEach(col => {
            if (item[col] !== undefined) {
              filteredItem[col] = item[col];
            }
          });
          return filteredItem;
        });
      } else {
        // Normal özellikleri filtrele
        filteredData[key] = {};
        columns.forEach(col => {
          if (data[key][col] !== undefined) {
            filteredData[key][col] = data[key][col];
          }
        });
      }
    });
    return filteredData;
  }
  
  return data;
}

// Service Worker Events
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await Promise.all(Object.keys(CSV_URLS).map(type => loadCsvData(type)));
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const pathname = location.pathname.split('/').filter(Boolean);
  const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
  if (url.pathname === repo && url.searchParams.has('api')) {
    event.respondWith(handleModulRequest(url));
  } else {
    event.respondWith(fetch(event.request));
  }
});

// UID doğrulama fonksiyonu
async function verifyUserKey(key) {
  try {
    const userRef = db.collection("users").doc(key);
    const doc = await userRef.get();
    return doc.exists;
  } catch (error) {
    console.error("Doğrulama hatası:", error);
    return false;
  }
}

// Ana API İşleyici
async function handleModulRequest(url) {
  const urlParams = new URLSearchParams(url.search);
  const key = urlParams.get('key');

  if (!key) {
    return new Response(JSON.stringify({error: "API key gerekli (&key=uid)"}), {status: 401, headers: { 'Content-Type': 'application/json' }});
  }

  const isValid = await verifyUserKey(key);
  if (!isValid) {
    return new Response(JSON.stringify({error: "Geçersiz API key"}), {status: 403, headers: { 'Content-Type': 'application/json' }});
  }

  try {

    // Tüm parametreleri topla (api parametresi hariç)
    const params = {};
    for (const [key, value] of urlParams.entries()) {
      if (key !== 'key') {
        params[key] = decodeURIComponent(value);
      }
    }

    // Eski api parametresi desteği (geriye uyumluluk)
    if (urlParams.has('api')) {
      const apiParams = new URLSearchParams(urlParams.get('api'));
      for (const [key, value] of apiParams.entries()) {params[key] = decodeURIComponent(value);}
    }

    const response = await handleAllParams(params);
    const finalResponse = response.data ? response.data : response;
    return new Response(JSON.stringify(finalResponse), {headers: {'Content-Type': 'application/json', 'Cache-Control': 'max-age=3600'}});
  } catch (error) {
    return new Response(JSON.stringify({error: error.message, stack: error.stack}), {status: 500, headers: { 'Content-Type': 'application/json' }});
  }
}

// Komut İşleyici
async function handleAllParams(params) {
  try {
    let result = {};

    // 'api' parametresini işleme
    if (params.api) {
      const apiType = params.api.toLowerCase();
      
      // Desteklenen veri tiplerini kontrol et
      if (['il', 'ilce', 'mahalle', 'koy', 'sokak', 'belediye', 'universite'].includes(apiType)) {
        try {
          // İlgili CSV'den tüm verileri yükle
          let allData = await loadCsvData(apiType);
          
          // Filtreleme parametrelerini uygula
          if (apiType === 'il') {
            // Kıyı filtresi
            if (params.kiyi !== undefined) {
              const kiyiAranan = params.kiyi.toString().toLowerCase() === 'true';
              allData = allData.filter(i => 
                i.kıyı && i.kıyı.toString().toLowerCase() === kiyiAranan.toString()
              );
            }
            
            // Nüfus filtresi
            if (params.nufus) {
              const minNufus = parseInt(params.nufus);
              allData = allData.filter(i => 
                i.nufus && parseInt(i.nufus) >= minNufus
              );
            }
            
            // Bölge filtresi
            if (params.bolge) {
              const bolge = normalizeTR(params.bolge);
              allData = allData.filter(i => 
                i.bolge && normalizeTR(i.bolge) === bolge
              );
            }
            
            // Büyükşehir filtresi
            if (params.buyuksehir !== undefined) {
              const buyuksehir = params.buyuksehir.toString().toLowerCase() === 'true';
              allData = allData.filter(i => 
                i.bsehir && i.bsehir.toString().toLowerCase() === buyuksehir.toString()
              );
            }
            
            // Rakım filtresi
            if (params.rakim) {
              const minRakim = parseInt(params.rakim);
              allData = allData.filter(i => 
                i.rakim && parseInt(i.rakim) >= minRakim
              );
            }
          }
          
          result[apiType] = allData;
          
          // Sıralama parametresi varsa uygula
          if (params.sirala) {
            const sortOrder = params.sirala === 'za' ? -1 : 1;
            result[apiType].sort((a, b) => {
              const aVal = a.adi || a.ad || '';
              const bVal = b.adi || b.ad || '';
              return aVal.localeCompare(bVal, 'tr') * sortOrder;
            });
          }
          
          // Sütun filtresi varsa uygula
          if (params.sutun) {
            const columns = params.sutun.split(',').map(c => c.trim());
            result[apiType] = filterColumns(result[apiType], columns);
          }
          
          return { success: true, data: result };
        } catch (error) {
          return { 
            success: false, 
            error: `${apiType} verisi yüklenemedi: ${error.message}`
          };
        }
      }
    }

    // Diğer parametreler için mevcut işlemler
    if (params.ara) {
      result = await handleSearch(params);
    } else {
      await processAllParameters(params, result);
    }

    // Global sütun filtreleme
    if (params.sutun) {
      const columns = params.sutun.split(',').map(c => c.trim());
      result = filterColumns(result, columns);
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Hata:", error);
    return { 
      success: false, 
      error: {
        message: error.message,
        details: error.stack
      }
    };
  }
}