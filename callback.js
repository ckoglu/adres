// callback.js
(async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const cmd = params.get("cmd");
    const callbackName = params.get("callback") || "myCallback";

    if (!cmd) throw new Error("cmd parametresi eksik");

    // Localhost veya GitHub Pages için path tanımı
    window.url = {
      helper: "./js/helper/",
      modul: "./js/modules/"
    };

    // Modülleri import et
    const { handleAllParams } = await import(`${window.url.modul}komutIsleyici.js`);

    // Komutu çalıştır
    const result = await handleAllParams(cmd);

    // JSONP callback olarak döndür
    const scriptTag = document.createElement("script");
    scriptTag.textContent = `${callbackName}(${JSON.stringify(result)});`;
    document.body.appendChild(scriptTag);

  } catch (error) {
    console.error("callback.js hatası:", error);
    const callbackName = new URLSearchParams(window.location.search).get("callback") || "myCallback";
    const scriptTag = document.createElement("script");
    scriptTag.textContent = `${callbackName}({ error: "${error.message}" });`;
    document.body.appendChild(scriptTag);
  }
})();
