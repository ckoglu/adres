export async function jsonpAdres() {
    const CSV_URLS = {
        il: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/il.csv',
        ilce: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/ilce.csv',
        koy: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/koy.csv',
        mahalle: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/mahalle.csv',
        ilbelediye: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/ilbelediye.csv',
        ilcebelediye: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/ilcebelediye.csv',
        universite: 'https://raw.githubusercontent.com/ckoglu/csv-tr-api/refs/heads/main/universite.csv',
    };

    const cache = {
        _data: {},
        has(key) { return this._data.hasOwnProperty(key); },
        get(key) { return this._data[key]; },
        set(key, value) { this._data[key] = value; },
        clear() { this._data = {}; }
    };

    // URL parametreleri
    const params = new URLSearchParams(window.location.search);
    const il = params.get("il")?.toUpperCase() || null;
    const ilce = params.get("ilce")?.toUpperCase() || null;
    const mahalle = params.get("mahalle")?.toUpperCase() || null;
    const sokak = params.get("sokak") || null;
    const callbackName = params.get("callback") || "callback";

    // CSV yükleme ve parse
    async function loadCsv(type) {
        if (cache.has(type)) return cache.get(type);

        const res = await fetch(CSV_URLS[type]);
        if (!res.ok) throw new Error(`${type} yüklenemedi: ${res.status}`);
        const text = await res.text();

        const lines = text.split("\n").filter(l => l.trim() !== '');
        const headers = lines[0].split(';').map(h => h.trim().toLowerCase());

        const data = lines.slice(1).map(line => {
            const values = line.split(';');
            const obj = {};
            headers.forEach((h, i) => obj[h] = values[i]?.trim() || '');
            return obj;
        });

        cache.set(type, data);
        return data;
    }

    // Verileri yükle ve filtrele
    const [ils, ilces, mahalles] = await Promise.all([
        loadCsv('il'),
        loadCsv('ilce'),
        loadCsv('mahalle')
    ]);

    const filtered = mahalles.filter(m => {
        const m_ilce = ilces.find(i => i.kod === m.ilce_kod);
        const m_il = ils.find(i => i.kod === m_ilce?.il_kod);
        return (!il || m_il?.adi.toUpperCase() === il) &&
               (!ilce || m_ilce?.adi.toUpperCase() === ilce) &&
               (!mahalle || m.adi.toUpperCase() === mahalle);
    }).map(m => ({
        il: ils.find(i => i.kod === ilces.find(ic => ic.kod === m.ilce_kod)?.il_kod)?.adi,
        ilce: ilces.find(ic => ic.kod === m.ilce_kod)?.adi,
        mahalle: m.adi,
        sokak: sokak || ''
    }));

    // JSONP callback çağır
    if (typeof window[callbackName] === "function") {
        window[callbackName](filtered);
    } else {
        console.warn("Callback fonksiyonu bulunamadı:", callbackName);
    }
}

// Eğer script direkt <script> ile çağrılıyorsa otomatik çalıştır
if (typeof window !== "undefined") {
    jsonpAdres();
}
