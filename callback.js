// callback.js
(function() {
    // URL parametrelerini al
    const params = new URLSearchParams(window.location.search);
    const callbackName = params.get('callback') || 'callback';
    const cmdParams = {
        il: params.get('il'),
        ilce: params.get('ilce'),
        mahalle: params.get('mahalle'),
        sokak: params.get('sokak')
    };

    // Komut metnini oluştur (örnek: "il=balikesir&ilce=bandirma")
    const cmdText = Object.entries(cmdParams)
        .filter(([_, value]) => value !== null)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

    // Modülleri dinamik olarak import et ve işle
    Promise.all([
        import('./js/modules/veriYukleyici.js'),
        import('./js/modules/komutIsleyici.js')
    ]).then(async ([veriYukleyiciModule, komutIsleyiciModule]) => {
        try {
            // Verileri yükle
            await veriYukleyiciModule.verileriYukle();

            // Komutu işle
            const result = await komutIsleyiciModule.handleAllParams(cmdText);

            // Callback fonksiyonunu çağır
            window[callbackName](result.data);
        } catch (error) {
            console.error('Hata:', error);
            window[callbackName]({ error: error.message });
        }
    }).catch(error => {
        console.error('Modül yükleme hatası:', error);
        window[callbackName]({ error: 'Modül yüklenemedi' });
    });
})();
