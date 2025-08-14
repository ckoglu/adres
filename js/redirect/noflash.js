(function() {
  // 1. Tema belirleme mantığını doğrudan uygula
  function determineTheme() {
    const saat = new Date().getHours();
    const karanlik = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let tema = "light";

    // UID al
    const uid = Object.keys(localStorage).find(key => key.startsWith("user-"))?.replace("user-", "") || "guest";
    const setKey = `set-${uid}`;

    // set verisini oku veya bos nesne döndür
    let settings;
    try {
      settings = JSON.parse(localStorage.getItem(setKey)) || {};
    } catch {
      settings = {};
    }

    // set yoksa, default değerleri ekle
    if (Object.keys(settings).length === 0) {
      settings = {
        theme: "light",
        sidebarCollapsed: false,
        prefix: "true",
        cmdList: "text",
        lastCommit: new Date().toISOString().split("T")[0]
      };
      localStorage.setItem(setKey, JSON.stringify(settings));
    }

    // varsa tema kullan
    if (settings.theme) {
      tema = settings.theme;
    }

    // auto theme
    if (tema === "auto") {
      return (saat < 6 || saat >= 18) ? "dark" : "light";
    } else if (tema === "system") {
      return karanlik ? "dark" : "light";
    }
    return tema;
  }

  // temayı hemen uygula (render engelleme)
  const tema = determineTheme();
  if (tema === "dark") {
    document.documentElement.classList.add("dark-mode");
    document.documentElement.setAttribute("data-theme", "dark-mode");
  } else if (tema !== "light") {
    document.documentElement.setAttribute("data-theme", tema);
  }
  
  // sayfa yuklendikten sonra tema.js ile senkronize et
  document.addEventListener('DOMContentLoaded', () => {
    if (window.temayiUygula) {
      window.temayiUygula(tema);
    }
  });
})();