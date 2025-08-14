// komutIsleyici.js
const { normalizeTR, normalizeLoc } = await import(`${url.helper}other.js`);
/**
 * Main command processing function
 * @param {string} cmdText - Command text to process
 * @returns {Promise<{success: boolean, data?: any, error?: {message: string, details?: string, cmd: string}}>}
 */
export async function handleAllParams(cmdText) {
  try {
    if (!window.dataLoader) throw new Error("veri yükleyici yüklenmedi!");

    let cmdString;
    if (typeof cmdText === "string") {
      cmdString = cmdText.trim();
    } else if (typeof cmdText === "object" && cmdText !== null) {
      cmdString = Object.entries(cmdText).map(([k, v]) => `${k}=${v}`).join('&');
    } else {
      throw new Error("Geçersiz komut tipi");
    }

    if (["il", "ilce"].includes(cmdString)) {
      const data = await window.dataLoader.loadCsvData(cmdString);
      return { success: true, data: { [cmdString]: data } };
    }

    const params = parseParameters(cmdString);
    let result = {};

    if (params.ara) {
      result = await handleSearch(params);
    } else {
      await processAllParameters(params, result);
    }

    applyGlobalFilters(params, result);
    applySorting(params, result);
    result = applyColumnFiltering(params, result);
    applyPagination(params, result);
    return { success: true, data: result };

  } catch (error) {
    console.error("parametre işleme hatası:", error);
    return {success: false, error: {message: error.message, details: error.stack, cmd: cmdText}};
  }
}

// Helper functions
function parseParameters(cmdString) {
  const params = {};
  const pairs = cmdString.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=').map(p => p ? decodeURIComponent(p.trim()) : '');
    if (key) params[key] = value || '';
  }
  return params;
}

async function processAllParameters(params, result) {
  const typesToProcess = ["il", "ilce", "mahalle", "koy", "sokak", "belediye", "universite", "filtre", "ara", "sutun", "sirala", "rakim", "kiyi", "nufus", "buyuksehir", "bolge", "sayfa"];
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
  
  return result;
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
    result = filterColumns(result, columns); // Değiştirilmiş sonucu döndür
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
    const iller = await window.dataLoader.loadCsvData("il");
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

    } else {
      result.il_hata = "il bulunamadı";
    }

    // Get all districts for city if ilce parameter is empty
    if (params.il && params.ilce === "") {
      const ilceler = await window.dataLoader.loadCsvData("ilce");
      const ilKodu = result.iller?.[0]?.kodu;
      if (ilKodu) {
        result.ilceler = ilceler.filter(ilce => ilce.il_kod === ilKodu);
      }
    }
  }
}

async function processIlceParams(params, result) {
  if (!params.ilce) return;

  const ilceler = await window.dataLoader.loadCsvData("ilce");
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
      normalizeTR(ilce.ad) === arananNormalized
    );
  }

  if (bulunanIlce) {
    // İl bilgisini yükle ve ilçe nesnesine ekle
    const iller = await window.dataLoader.loadCsvData("il");
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
      const koyler = await window.dataLoader.loadCsvData("koy");
      const mahalleler = await window.dataLoader.loadCsvData("mahalle");
  
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
    const mahalleler = await window.dataLoader.loadCsvData("mahalle");
    mahalle = mahalleler.find(m => String(m.kod) === temizKod);
  } else {
    mahalle = await window.dataLoader.getMahalleByAdi(aranan, ilceKodu);
  }

  if (mahalle) {
    result.mahalle = mahalle;

    // Get streets if sokak parameter is empty
    if (params.sokak === "") {
      try {
        const sokaklar = await window.dataLoader.loadCsvData("sokak", mahalle.kod);
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
      const mahalleGenel = await window.dataLoader.getMahalleByAdi(aranan);
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
    const koyler = await window.dataLoader.loadCsvData("koy");
    koy = koyler.find(k => String(k.koykod) === temizKod);
  } else {
    koy = await window.dataLoader.getKoyByAdi(aranan, ilceKodu);
  }

  if (koy) {
    result.koy = koy;

    // Get neighborhoods for the village
    const mahalleler = await window.dataLoader.loadCsvData("mahalle");
    const ilgiliMahalleler = mahalleler.filter(m => m.koy_kod === koy.koykod);
    result.mahalleler = ilgiliMahalleler;

    // Get streets for the neighborhoods
    const sokaklarToplam = [];
    for (const mahalle of ilgiliMahalleler) {
      try {
        const sokaklar = await window.dataLoader.loadCsvData("sokak", mahalle.kod);
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
    const sokaklar = await window.dataLoader.loadCsvData("sokak", mahalleKodu);
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
    const matches = await window.dataLoader.getBelediyeByAdi(adlar);
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
    const matches = await window.dataLoader.getUniversiteByAdi(adlar);
    if (matches.length > 0) {
      result.universite = matches;
    } else {
      result.universite_hata = `${params.universite} için üniversite bulunamadı`;
    }
  }
}

async function handleSearch(params) {
  // 1. Parametre kontrolü
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

  // 2. Minimum uzunluk kontrolü
  if (searchTerm.length < minSearchLength) {
    return { arama_hata: `en az ${minSearchLength} karakter girin` };
  }

  let searchResult = {};
  const allTypes = ["il", "ilce", "mahalle", "koy", "sokak", "universite"];
  const filters = params.filtre ? params.filtre.split(',').map(f => f.trim()).filter(f => allTypes.includes(f)) : allTypes;

  // 3. Mahalle kodunu önceden al
  const mahalleKod = params.mahalle || (params.mahalle_kod ? params.mahalle_kod.toString() : null);

  // 4. Her filtre türü için arama yap
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

      // Sokak araması için özel kontrol
      if (type === 'sokak') {
        if (!mahalleKod) {
          searchResult.sokak_hata = "Sokak araması için mahalle kodu gereklidir";
          continue;
        }
        
        try {
          const sokakData = await window.dataLoader.loadCsvData(type, mahalleKod);
          const filtered = filterData(sokakData, searchTerm, matchMode);

          if (filtered.length) searchResult.sokak = filtered;
        } catch (error) {
          searchResult.sokak_hata = `Sokak verisi yüklenemedi: ${error.message}`;
        }
        continue;
      }

      // Diğer türler için arama
      const data = await window.dataLoader.loadCsvData(type);
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

// Yardımcı fonksiyon: Veri filtreleme
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

function filterColumns(data, columns) {
  if (Array.isArray(data)) {
    return data.map(item => {
      const filtered = {};
      columns.forEach(col => {
        if (item[col] !== undefined) {
          filtered[col] = item[col];
        }
      });
      return filtered;
    });
  } else if (typeof data === 'object' && data !== null) {
    const filtered = {};
    for (const key in data) {
      if (Array.isArray(data[key])) {
        filtered[key] = data[key].map(item => {
          const itemFiltered = {};
          columns.forEach(col => {
            if (item[col] !== undefined) {
              itemFiltered[col] = item[col];
            }
          });
          return itemFiltered;
        });
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        const itemFiltered = {};
        columns.forEach(col => {
          if (data[key][col] !== undefined) {
            itemFiltered[col] = data[key][col];
          }
        });
        filtered[key] = itemFiltered;
      } else {
        filtered[key] = data[key];
      }
    }
    return filtered;
  }
  return data;
}