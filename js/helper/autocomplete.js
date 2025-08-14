function getCurrentUID() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("user-")) {
      try {
        const userData = JSON.parse(localStorage.getItem(key));
        if (userData?.userUID) return userData.userUID;
      } catch (_) {}
    }
  }
  return "guest";
}

export function initAutocomplete(inputId) {

  const uid = getCurrentUID();
  const setKey = `set-${uid}`;
  if (uid === 'guest' || uid === ''  || uid === null ) {return;}
  const settings = JSON.parse(localStorage.getItem(setKey) || '{}');
  if (settings.cmdList === false) return;

    const input = document.getElementById(inputId);
    if (!input) {return;}

    let list = document.querySelector(".autocomplete-items");
    if (!list) {
        list = document.createElement("div");
        list.className = "autocomplete-items";
        document.body.appendChild(list);
    }

    let currentFocus = -1;

    function normalizeTR(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/ç/g, "c")
            .replace(/ğ/g, "g")
            .replace(/ı/g, "i")
            .replace(/i̇/g, "i")
            .replace(/ö/g, "o")
            .replace(/ş/g, "s")
            .replace(/ü/g, "u")
            .trim();
    }

    function parseParams(cmd) {
        const obj = {};
        cmd.split("&").forEach(pair => {
            const [k, v] = pair.split("=").map(x => x?.trim() || "");
            if (k) obj[k] = v;
        });
        return obj;
    }

    // Komutlar ve açıklamaları
    const baseCommands = [
        { name: "il", desc: "İl adı ile filtreleme (örn: il=Ankara)" },
        { name: "ilce", desc: "İlçe adı ile filtreleme (örn: ilce=Çankaya)" },
        { name: "mahalle", desc: "Mahalle adı ile filtreleme (örn: mahalle=Yıldız)" },
        { name: "koy", desc: "Köy adı ile filtreleme (örn: koy=Güvercinlik)" },
        { name: "sokak", desc: "Sokak adı ile filtreleme (örn: sokak=Atatürk)" },
        { name: "belediye", desc: "Belediye adı ile filtreleme" },
        { name: "universite", desc: "Üniversite adı ile filtreleme" },
        { name: "ara", desc: "Genel arama (tüm alanlarda)" },
        { name: "filtre", desc: "Filtreleme alanlarını listeler" },
        { name: "sirala", desc: "Sıralama (az/za)" },
        { name: "sutun", desc: "Gösterilecek sütunları belirler" },
        { name: "sayfa", desc: "Sayfalama için sayfa numarası belirler" },
        { name: "kiyi", desc: "Kıyı şeridinde olup olmadığını filtreler (true/false)" },
        { name: "buyuksehir", desc: "Büyükşehir olup olmadığını filtreler (true/false)" },
        { name: "alan", desc: "Yüzölçümü ile filtreleme" },
        { name: "bolge", desc: "Coğrafi bölge ile filtreleme" },
        { name: "rakim", desc: "Rakım ile filtreleme" },
        { name: "nufus", desc: "Nüfus ile filtreleme" }
    ];

    const filterCommands = [
        { name: "il", desc: "İl ile filtrele" },
        { name: "ilce", desc: "İlçe ile filtrele" },
        { name: "mahalle", desc: "Mahalle ile filtrele" },
        { name: "koy", desc: "Köy ile filtrele" },
        { name: "sokak", desc: "Sokak ile filtrele" },
        { name: "belediye", desc: "Belediye ile filtrele" },
        { name: "universite", desc: "Üniversite ile filtrele" }
    ];

    const sortCommands = [
        { name: "az", desc: "Artan sıralama (A-Z)" },
        { name: "za", desc: "Azalan sıralama (Z-A)" }
    ];

    const regionCommands = [
        { name: "akdeniz", desc: "Akdeniz Bölgesi" },
        { name: "güneydoğu anadolu", desc: "Güneydoğu Anadolu Bölgesi" },
        { name: "karadeniz", desc: "Karadeniz Bölgesi" },
        { name: "doğu anadolu", desc: "Doğu Anadolu Bölgesi" },
        { name: "marmara", desc: "Marmara Bölgesi" },
        { name: "ege", desc: "Ege Bölgesi" },
        { name: "iç anadolu", desc: "İç Anadolu Bölgesi" }
    ];

    async function fetchSuggestions(params, lastKey, lastVal) {
        try {
            if (lastKey === "il") {
                const data = await window.dataLoader.loadCsvData("il");
                return data.filter(i => normalizeTR(i.adi).includes(normalizeTR(lastVal)))
                .map(i => ({name: i.adi, desc: `Kodu: ${i.kodu}`}));
            } 
            
            else if (lastKey === "ilce") {
                const data = await window.dataLoader.loadCsvData("ilce");
                
                if (params.il) {
                    const il = await window.dataLoader.getIlByAdi(params.il) || await window.dataLoader.getIlByKodu(params.il);
                    if (il) {
                        return data.filter(i => String(i.il_kod) === String(il.kodu) && normalizeTR(i.ad).includes(normalizeTR(lastVal)))
                        .map(i => ({name: i.ad, desc: `İl Kodu: ${il.kodu}, İlçe Kodu: ${i.kod}`}));
                    }
                }

                return data.filter(i => normalizeTR(i.ad).includes(normalizeTR(lastVal)))
                .map(i => ({name: i.ad, desc: `Kodu: ${i.kod}`}));
            
            } 
            
            else if (lastKey === "mahalle") {
                try {
                    const mahalleler = await window.dataLoader.loadCsvData("mahalle");
                    const ilce = params.ilce ? await window.dataLoader.getIlceByAdi(params.ilce) : null;
                    
                    if (ilce && ilce.kod) {
                        const koyler = await window.dataLoader.loadCsvData("koy");
                        const ilceKoyler = koyler.filter(k => String(k.ilcekod) === String(ilce.kod));
                        const koyKodlari = ilceKoyler.map(k => String(k.koykod));
                        
                        const filtered = mahalleler.filter(m => 
                            koyKodlari.includes(String(m.koy_kod)) && 
                            normalizeTR(m.ad).includes(normalizeTR(lastVal))
                        ).map(m => ({name: m.ad, desc: "Mahalle"}));
                        
                        if (filtered.length === 0) {
                            return mahalleler.filter(m => 
                                (String(m.ilce_kod) === String(ilce.kod) || 
                                String(m.ilcekod) === String(ilce.kod)) && 
                                normalizeTR(m.ad).includes(normalizeTR(lastVal))
                            ).map(m => ({name: m.ad, desc: "Mahalle"}));
                        }
                        return filtered;
                    }
                    
                    return mahalleler.filter(m => normalizeTR(m.ad).includes(normalizeTR(lastVal)))
                    .map(m => ({name: m.ad, desc: "Mahalle"}));
                    
                } catch (error) {
                    console.error("Mahalle öneri hatası:", error);
                    return [];
                }
            }
            
            else if (lastKey === "koy") {
                const data = await window.dataLoader.loadCsvData("koy");
                if (params.ilce) {
                    const ilce = await window.dataLoader.getIlceByAdi(params.ilce);
                    if (ilce) {
                        return data.filter(k => String(k.ilce_kod) === String(ilce.kod) && normalizeTR(k.ad).includes(normalizeTR(lastVal)))
                        .map(k => ({name: k.ad, desc: "Köy"}));
                    }
                }

                return data.filter(k => normalizeTR(k.ad).includes(normalizeTR(lastVal)))
                .map(k => ({name: k.ad, desc: "Köy"}));
            
            } 
            
            else if (lastKey === "sokak") {
                try {
                    if (!params.mahalle) {
                        console.error("Sokak önerisi için mahalle belirtilmemiş");
                        return [];
                    }

                    const mahalleler = await window.dataLoader.loadCsvData("mahalle");
                    const normalizedMahalleAdi = normalizeTR(params.mahalle);
                    
                    let mahKod = null;
                    let filteredMahalleler = [];

                    if (params.ilce) {
                        const ilce = await window.dataLoader.getIlceByAdi(params.ilce);
                        if (!ilce?.kod) {
                            console.error("Geçersiz ilçe bilgisi:", params.ilce);
                            return [];
                        }

                        const koyler = await window.dataLoader.loadCsvData("koy");
                        const ilceKoyKodlari = koyler
                            .filter(k => String(k.ilcekod) === String(ilce.kod))
                            .map(k => String(k.koykod));

                        filteredMahalleler = mahalleler.filter(m => 
                            ilceKoyKodlari.includes(String(m.koy_kod)) && 
                            normalizeTR(m.ad).includes(normalizedMahalleAdi)
                        );

                        if (filteredMahalleler.length === 0) {
                            filteredMahalleler = mahalleler.filter(m => 
                                (String(m.ilce_kod) === String(ilce.kod) || 
                                String(m.ilcekod) === String(ilce.kod)) && 
                                normalizeTR(m.ad).includes(normalizedMahalleAdi)
                            );
                        }
                    } else {
                        filteredMahalleler = mahalleler.filter(m => 
                            normalizeTR(m.ad).includes(normalizedMahalleAdi)
                        );
                    }

                    if (filteredMahalleler.length === 0) {
                        console.error(`Mahalle bulunamadı: ${params.mahalle}`);
                        return [];
                    }

                    mahKod = filteredMahalleler[0].kod;
                    const sokaklar = await window.dataLoader.loadCsvData("sokak", mahKod);
                    
                    const filteredSokaklar = sokaklar.filter(s => {
                        if (String(s.mahalle_kod) !== String(mahKod)) return false;
                        
                        if (!lastVal) return true;
                        
                        if (/^\d+/.test(lastVal)) {
                            return String(s.ad).startsWith(lastVal);
                        }
                        
                        return normalizeTR(s.ad).includes(normalizeTR(lastVal));
                    }).map(s => ({
                        name: s.ad,
                        desc: "Sokak" // Sokak olduğu belirtildi
                    }));

                    filteredSokaklar.sort((a, b) => {
                        const aNum = extractStreetNumber(a.name);
                        const bNum = extractStreetNumber(b.name);
                        
                        if (aNum !== null && bNum !== null) return aNum - bNum;
                        if (aNum !== null) return -1;
                        if (bNum !== null) return 1;
                        return a.name.localeCompare(b.name);
                    });
                    return filteredSokaklar;

                } catch (error) {
                    console.error("Sokak öneri hatası:", error);
                    return [];
                }
            }

            else if (lastKey === "universite") {
                const data = await window.dataLoader.loadCsvData("il");
                return data.filter(i => normalizeTR(i.adi).includes(normalizeTR(lastVal)))
                    .map(i => ({
                        name: i.adi,
                        desc: `Üniversite il kodu: ${i.kodu}`
                    }));
            }

            else if (lastKey === "belediye") {
                const iller = await window.dataLoader.loadCsvData("il");
                const ilceler = await window.dataLoader.loadCsvData("ilce");

                const filteredIller = iller.filter(i => normalizeTR(i.adi).includes(normalizeTR(lastVal)))
                    .map(i => ({
                        name: i.adi,
                        desc: `İl: ${i.kodu}`
                    }));

                const filteredIlceler = ilceler.filter(i => normalizeTR(i.ad).includes(normalizeTR(lastVal)))
                    .map(i => ({
                        name: i.ad,
                        desc: `İlçe: ${i.kod}`
                    }));

                return [...filteredIller, ...filteredIlceler];
            }
                                
            else if (lastKey === "filtre") {
                return filterCommands.filter(f => 
                    f.name.includes(lastVal) || 
                    normalizeTR(f.desc).includes(normalizeTR(lastVal))
                );
            } 
            
            else if (lastKey === "sirala") {
                return sortCommands.filter(s => 
                    s.name.includes(lastVal) || 
                    normalizeTR(s.desc).includes(normalizeTR(lastVal))
                );
            } 

            else if (normalizeTR(lastKey) === "kiyi") {
                return [
                    { name: "true", desc: "Kıyı şeridinde olanlar" },
                    { name: "false", desc: "Kıyı şeridinde olmayanlar" }
                ].filter(s => 
                    s.name.includes(normalizeTR(lastVal || "")) || 
                    normalizeTR(s.desc).includes(normalizeTR(lastVal || ""))
                );
            } 
            
            else if (normalizeTR(lastKey) === "buyuksehir") {
                return [
                    { name: "true", desc: "Büyükşehir olanlar" },
                    { name: "false", desc: "Büyükşehir olmayanlar" }
                ].filter(s => 
                    s.name.includes(normalizeTR(lastVal || "")) || 
                    normalizeTR(s.desc).includes(normalizeTR(lastVal || ""))
                );
            }

            else if (normalizeTR(lastKey) === "bolge") {
                return regionCommands.filter(s => 
                    s.name.includes(normalizeTR(lastVal || "")) || 
                    normalizeTR(s.desc).includes(normalizeTR(lastVal || ""))
                );
            } 

            else {
                return baseCommands.filter(c => 
                    c.name.includes(lastVal) || 
                    normalizeTR(c.desc).includes(normalizeTR(lastVal))
                );
            }
        } catch (error) {
            console.error("fetchSuggestions hatası:", error);
            return [];
        }
    }

    function extractStreetNumber(streetName) {
        const match = streetName.match(/^(\d+)/);
        return match ? parseInt(match[1]) : null;
    }

    function handleFocus() {
        if (settings.cmdList === true && !input.value) {
            showAllCommands();
        }
    }
  
    function clearList() {
        list.innerHTML = "";
        list.style.display = "none";
        currentFocus = -1;
    }
  
    function addActive(items) {
        if (!items) return false;
        removeActive(items);
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;
        items[currentFocus].classList.add("active");
    }

    function removeActive(items) {
        for (const item of items) {
            item.classList.remove("active");
        }
    }

    function showAllCommands() {
        clearList();
        list.style.display = "block";

        for (const cmd of baseCommands) {
            const item = document.createElement("div");
            item.innerHTML = `<span>${cmd.name}</span><span class="cmd-desc">${cmd.desc}</span>`;
            item.addEventListener("click", () => {
                input.value = cmd.name + "=";
                clearList();
                input.focus();
                setTimeout(() => {
                    const event = new Event('input', { bubbles: true });
                    input.dispatchEvent(event);
                }, 10);
            });
            list.appendChild(item);
        }
    }

    function shouldShowAll(key) {
        const showAllCommands = ["il", "ilce", "mahalle", "koy", "sokak", "kiyi", "buyuksehir", "bolge"];
        return showAllCommands.includes(key);
    }
  
    async function onInput() {
        const val = input.value;
        clearList();
        
        // Eğer ayar true ise ve input boşsa komutları göster
        if (settings.cmdList === true && !val) {
        showAllCommands();
        return;
        }
        
        const parts = val.split("&").map(p => p.trim());
        const lastPart = parts[parts.length - 1];

        if (!lastPart.includes("=")) {
            const filtered = baseCommands.filter(c => 
                c.name.includes(lastPart) || 
                normalizeTR(c.desc).includes(normalizeTR(lastPart))
            );
            
            if (filtered.length === 0) return;
            
            list.style.display = "block";

            for (const cmd of filtered) {
                const item = document.createElement("div");
                item.innerHTML = `<span>${cmd.name}</span><span class="cmd-desc">${cmd.desc}</span>`;
                item.addEventListener("click", () => {
                    parts[parts.length - 1] = cmd.name + "=";
                    input.value = parts.join("&");
                    clearList();
                    input.focus();
                    setTimeout(() => {
                        const event = new Event('input', { bubbles: true });
                        input.dispatchEvent(event);
                    }, 10);
                });
                list.appendChild(item);
            }
            return;
        }

        const [key, value] = lastPart.split("=");
        const params = parseParams(val);

        try {
            const showAllValues = (!value || value === "") && shouldShowAll(key);
            const searchValue = showAllValues ? "" : value;
            
            const suggestions = await fetchSuggestions(params, key, searchValue);
           
            if (!suggestions || suggestions.length === 0) {
                clearList();
                return;
            }
            
            list.style.display = "block";

            for (const sug of suggestions) {
                const text = (sug.name || sug.ad || sug.adi || sug || "").toString();
                const desc = sug.desc || "";
                
                const item = document.createElement("div");
                if (desc) {
                    item.innerHTML = `<span>${text}</span><span class="cmd-desc">${desc}</span>`;
                } else {
                    item.textContent = text;
                }
                
                item.addEventListener("click", () => {
                    parts[parts.length - 1] = key + "=" + text;
                    input.value = parts.join("&") + "&";
                    clearList();
                    input.focus();
                    setTimeout(() => {
                        const event = new Event('input', { bubbles: true });
                        input.dispatchEvent(event);
                    }, 10);
                });
                list.appendChild(item);
            }
        } catch (e) {
            console.error("Autocomplete hatası:", e);
            clearList();
        }
    }
  
    function onKeyDown(e) {
        const items = list.getElementsByTagName("div");
        if (!items) return;
    
        if (e.key === "ArrowDown") {
            currentFocus++;
            addActive(items);
            e.preventDefault();
        } else if (e.key === "ArrowUp") {
            currentFocus--;
            addActive(items);
            e.preventDefault();
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (currentFocus > -1 && items[currentFocus]) {
                items[currentFocus].click();
            }
        } else if (e.key === "Escape") {
            clearList();
        }
    }

    input.addEventListener("focus", handleFocus);
    input.addEventListener("input", onInput);
    input.addEventListener("keydown", onKeyDown);
  
    if (settings.cmdList === true && document.activeElement && document.activeElement === input && !input.value) {
        showAllCommands();
    }

    document.addEventListener("click", (e) => {
        if (e.target !== input) {
            clearList();
        }
    });
}