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

function getTheme() {
  const setKeyUID = `set-${getCurrentUID()}`;
  const settingsRaw = localStorage.getItem(setKeyUID);
  let settings;

  try {
    settings = settingsRaw ? JSON.parse(settingsRaw) : {};
  } catch (err) {
    console.warn(`"${setKeyUID}" JSON parse edilemedi, varsayılan değerler kullanılacak.`);
    return;
  }

  const theme = settings.theme || "light"; // Varsayılan tema light olarak ayarlandı
  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect && theme) {themeSelect.value = theme;}
}

function getToggleButtons() {
  const prefixBtn = document.getElementById("prefixToggleBtn");
  const cmdListBtn = document.getElementById("cmdListToggleBtn");
  if (!prefixBtn || !cmdListBtn) return;

  const setKeyUID = `set-${getCurrentUID()}`;
  const settingsRaw = localStorage.getItem(setKeyUID);
  let settings;
  try {
    settings = settingsRaw ? JSON.parse(settingsRaw) : {};
  } catch (err) {
    console.warn(`"${setKeyUID}" JSON parse edilemedi, sıfırdan başlatılıyor.`);
    settings = {};
  }

  // prefix toggle butonu
  if (prefixBtn) {prefixBtn.innerText = settings.prefix === true ? "önek gizle" : "önek göster";}
  // cmd liste toggle butonu
  if (cmdListBtn) {
    if (settings.cmdList === true) {
      cmdListBtn.innerText = "cmd liste kapat";
    } else if (settings.cmdList === false) {
      cmdListBtn.innerText = "cmd liste aç";
    } else if (settings.cmdList === "text") {
      cmdListBtn.innerText = "cmd liste yazınca göster";
    } else {
      cmdListBtn.innerText = "cmd liste aç"; // varsayılan
    }
  }
}

function getButtonHs() {
  const hsCloseBtn = document.getElementById('hsclose');
  if (!hsCloseBtn) return;

  const setKeyUID = `set-${getCurrentUID()}`;
  const settingsRaw = localStorage.getItem(setKeyUID);
  let settings;

  try {
    settings = settingsRaw ? JSON.parse(settingsRaw) : {};
  } catch (err) {
    console.warn(`"${setKeyUID}" JSON parse edilemedi, sıfırdan başlatılıyor.`);
    settings = {};
  }

  if (settings.history === false) {
    hsCloseBtn.innerText = "geçmişi aç";
  } else {
    hsCloseBtn.innerText = "geçmişi kapat";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  getButtonHs();
  getTheme();
  getToggleButtons();
});