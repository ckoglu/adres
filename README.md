# 🇹🇷 Adres API

Türkiye'nin tüm resmi idari birimlerini (il, ilçe, mahalle/köy, sokak) açık veri standartlarıyla sunan hafif bir JSON API arayüzü.

## ✨ Özellikler

- %100 istemci tarafında çalışır (sunucu gerektirmez)
- GitHub'daki CSV verileriyle çalışır
- Hızlı ve minimal tasarım
- Açık kaynak (MIT Lisansı)
- TÜİK, NVİ, OSM ve Wikipedia entegrasyonu

## 🚀 Hızlı Başlangıç

### Temel Örnek
```bash
il=istanbul&ilce=kadıköy&mahalle=beyazevler
```

### Gelişmiş Örnek
```bash
ara=*ada*&filtre=il&sirala=az
```

### Özel Sütunlar
```bash
il=ankara&sutun=id,adi,nufus
```

## 🔍 Sorgu Parametreleri

| Parametre | Açıklama | Örnek |
|---|---|---|
| `il` | Tüm iller | `il` |
| `il` | İl filtresi | `il=istanbul` |
| `ilce` | Tüm ilçeler | `ilce` |
| `ilce` | İlçe filtresi | `ilce=kadıköy` |
| `mahalle` | Mahalle/köy filtresi | `mahalle=beyazevler` |
| `sokak` | Sokak filtresi | `sokak=80060` |
| `belediye` | İl ve ilçe belediyeleri | `belediye=istanbul` |
| `universite` | İl içerisindeki üniversiteler | `universite=burdur` |
| `ara` | Genel arama | `ara=ataşehir` |
| `filtre` | Sonuç filtresi (il,ilce vb.) | `filtre=il,ilce` |
| `sirala` | Sıralama (az/za) | `sirala=za` |
| `sayfa` | Sayfalama | `sayfa=2` |
| `sutun` | Gösterilecek sütunlar | `sutun=id,adi,nufus` |
| `bolge` | Bölge filtresi | `il&bolge=akdeniz` |
| `nufus` | Nüfus filtresi | `il&nufus=1000000` |
| `alan` | Alan filtresi | `il&alan=1000000` |
| `rakim` | Rakım filtresi | `il&rakim=1000000` |
| `buyuksehir`| Büyükşehir filtresi | `il&buyuksehir=true` |
| `kiyi`| Kıyısı olan iller | `il&kiyi=true` |

## 🌍 API Entegrasyonu

### Temel Kullanım
```javascript
fetch('https://adres.ckoglu.workers.dev/?api=il=istanbul&key=[KEY]')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Gelişmiş Örnek
```javascript
fetch('https://adres.ckoglu.workers.dev/?api=il=ankara&ilce&sutun=id,adi&key=[KEY]')
  .then(response => response.json())
  .then(data => {
    // Veri işleme
  });
```

## 📊 Veri Yapısı Örneği

```json
{
  "type": "il",
  "data": [
    {
      "id": 6,
      "adi": "Ankara",
      "nufus": 5639076,
      "bolge": "İç Anadolu"
    }
  ]
}
```

## 📌 Önemli Notlar

- Veriler güncel resmi kaynaklardan sağlanmaktadır.
- Büyük veri setleri için sayfalama kullanın.
- `*` joker karakteri ile kısmi arama yapabilirsiniz.

## 🛠️ Örnek Sorgular ve Sonuçları

### 1️⃣ İl Bilgisi

**Sorgu:**
```bash
il=izmir
```

**Sonuç:**
```json
{
  "type": "il",
  "data": [
    {
      "id": 35,
      "adi": "İzmir",
      "nufus": 4320519,
      "bolge": "Ege"
    }
  ]
}
```

### 2️⃣ İlçe Listesi

**Sorgu:**
```bash
il=ankara&ilce
```

**Sonuç:**
```json
{
  "type": "ilce",
  "data": [
    {"id": 1, "adi": "Çankaya"},
    {"id": 2, "adi": "Keçiören"},
    {"id": 3, "adi": "Mamak"}
  ]
}
```

### 3️⃣ Mahalle Filtreleme

**Sorgu:**
```bash
il=istanbul&ilce=kadıköy&mahalle
```

**Sonuç:**
```json
{
  "type": "mahalle",
  "data": [
    {"id": 101, "adi": "Bostancı"},
    {"id": 102, "adi": "Fenerbahçe"},
    {"id": 103, "adi": "Suadiye"}
  ]
}
```

### 4️⃣ Sokak Sorgusu

**Sorgu:**
```bash
il=istanbul&ilce=beşiktaş&mahalle=levazım&sokak
```

**Sonuç:**
```json
{
  "type": "sokak",
  "data": [
    {"id": 5001, "adi": "Abdi İpekçi Caddesi"},
    {"id": 5002, "adi": "Kılıçali Paşa Sokak"}
  ]
}
```

## ⚡ İnteraktif Demo

Canlı denemek için aşağıdaki URL’leri kullanabilirsiniz:

- **İl sorgusu:** [https://adres.ckoglu.workers.dev/?api=il=ankara&key=[KEY]](https://adres.ckoglu.workers.dev/?api=il=ankara&key=[KEY])
- **İlçe sorgusu:** [https://adres.ckoglu.workers.dev/?api=il=ankara&ilce&key=[KEY]](https://adres.ckoglu.workers.dev/?api=il=ankara&ilce&key=[KEY])
- **Mahalle sorgusu:** [https://adres.ckoglu.workers.dev/?api=il=istanbul&ilce=kadıköy&mahalle&key=[KEY]](https://adres.ckoglu.workers.dev/?api=il=istanbul&ilce=kadıköy&mahalle&key=[KEY])
- **Sokak sorgusu:** [https://adres.ckoglu.workers.dev/?api=il=istanbul&ilce=beşiktaş&mahalle=levazım&sokak&key=[KEY]](https://adres.ckoglu.workers.dev/?api=il=istanbul&ilce=beşiktaş&mahalle=levazım&sokak&key=[KEY])

## 🤝 Katkıda Bulunma

Katkılarınız için GitHub Repo sayfasını ziyaret edebilirsiniz.

## 🔗 Sayfayı Gör

[Adres API](https://ckoglu.github.io/adres/)

## 📄 Lisans

[MIT License](https://opensource.org/licenses/MIT)
