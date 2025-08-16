// history.js
const HISTORY_KEY_PREFIX = "history-";
const MAX_HISTORY_ITEMS = 50;

// Geçmiş öğelerini localStorage'dan al
async function getUserHistory(uid) {
  if (!uid) return [];
  try {
    const history = JSON.parse(localStorage.getItem(`${HISTORY_KEY_PREFIX}${uid}`)) || [];
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error("Geçmiş okunurken hata:", error);
    return [];
  }
}

// Geçmişe yeni komut ekle
export async function addToHistory(cmd, uid) {
  if (!cmd || !uid) return;

  // history=false ise kayıt yok
  const settingsRaw = localStorage.getItem(`set-${uid}`);
  if (settingsRaw) {
    try {
      const settings = JSON.parse(settingsRaw);
      if (settings.history === false) {return;}
    } catch (e) {
      console.warn(`"set-${uid}" JSON bozuk:`, e);
      return; // JSON hatalıysa da işleme devam etmeyelim
    }
  }

  try {
    const history = await getUserHistory(uid);
    const existingIndex = history.findIndex(item => item.cmd === cmd);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      history.splice(existingIndex, 1); // Eski kaydı sil
    }

    // Yeni kaydı başa ekle
    history.unshift({ cmd, date: now });

    // Max kayıt limitini uygula
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(`${HISTORY_KEY_PREFIX}${uid}`, JSON.stringify(trimmedHistory));
    
    // UI'ı güncelle
    renderHistory(uid);
  } catch (error) {
    console.error("Geçmiş güncellenirken hata:", error);
  }
}

// Geçmişi ekrana render et
export async function renderHistory(uid) {
  const container = document.getElementById("history-cmd");
  if (!container) return;

  try {
    const history = await getUserHistory(uid);
    
    if (history.length === 0) {
      container.innerHTML = `<p class="text-muted">geçmiş yok.</p>`;
      return;
    }

    let html = '';
    const now = new Date();
    let lastGroup = null;

    history.forEach(item => {
      const date = new Date(item.date);
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      let group;

      if (diffDays === 0) group = "Bugün";
      else if (diffDays === 1) group = "Dün";
      else if (diffDays <= 7) group = "Bu Hafta";
      else if (diffDays <= 30) group = "Bu Ay";
      else group = "Daha Eski";

      if (group !== lastGroup) {
        html += `<p class="history-group-title">${group}</p>`;
        lastGroup = group;
      }

      html += `
        <div class="history-item" data-sag-title="${item.cmd}">
          <a class="history-cmd-link" href="${url.site}${url.repository}?cmd=${item.cmd}">${item.cmd}</a>
          <div class="popup-cmd-link" onclick="togglePopupCmd(this)">
            <i class="more-alt"></i>
            <div class="popup-menu">
              <a class="popup-menu-item" target="_blank" href="https://adres.ckoglu.workers.dev/?api=${item.cmd}&key=${uid}"><div class="icon" data-scale="0.9"><i class="code"></i></div><span class="text">API</span></a>
              <a class="popup-menu-item" onclick="shareHistoryCommand('${item.cmd.replace(/'/g, "\\'")}')"><div class="icon" data-scale="0.8"><i class="share"></i></div><span class="text">paylaş</span></a>
              <a class="popup-menu-item delete" onclick="deleteHistoryCommand('${item.cmd.replace(/'/g, "\\'")}')"><div class="icon"><i class="trash"></i></div><span class="text">sil</span></a>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (error) {
    console.error("Geçmiş render edilirken hata:", error);
    container.innerHTML = `<p class="text-muted">geçmiş yüklenirken hata oluştu.</p>`;
  }
}

// Sayfa yüklendiğinde geçmişi göster
export async function initializeHistory() {
  const pathname = location.pathname.split('/').filter(Boolean);
  const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
  const { siteURL } = await import(`${location.origin}${repo}js/siteurl.js`);
  const url = siteURL();
  window.url = url;

  try {
    // Kullanıcı modülünü dinamik olarak yükle
    const userModule = await import(`${url.modul}user.js`);
    const user = await userModule.getCurrentUser();
    if (user?.uid) {
      await renderHistory(user.uid);
    } else {
      const container = document.getElementById("history-cmd");
      if (container) {
        container.innerHTML = ``; // <p class="text-muted">giriş yapılmamış!</p>
      }
    }
  } catch (error) {
    console.error("Geçmiş başlatılırken hata:", error);
  }
}

// Komutu paylaş
window.shareHistoryCommand = async function(cmd) {
  const pathname = location.pathname.split('/').filter(Boolean);
  const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
  const { siteURL } = await import(`${location.origin}${repo}js/siteurl.js`);
  const url = siteURL();
  window.url = url;
  const urlLink = `${url.site}${url.repository}?cmd=${encodeURIComponent(cmd)}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Komut Paylaş',
        text: `İşte bu komutu paylaşmak istedim: ${cmd}`,
        url: urlLink,
      });
    } catch (err) {
      console.error("Paylaşım iptal edildi veya başarısız:", err);
    }
  } else {
    showAlert(`Tarayıcınız paylaşım desteklemiyor.`, `error`);
  }
  closeAllPopups();
};

// Komutu sil
window.deleteHistoryCommand = async function(cmd) {
  try {
    const userModule = await import(`${url.modul}user.js`);
    const user = await userModule.getCurrentUser();
    if (!user?.uid) return;

    const key = `${HISTORY_KEY_PREFIX}${user.uid}`;
    const history = JSON.parse(localStorage.getItem(key)) || [];

    const updated = history.filter(item => item.cmd !== cmd);
    localStorage.setItem(key, JSON.stringify(updated));
    showAlert(`Kayıt silindi`, `clean`);
    await renderHistory(user.uid);
    
  } catch (err) {
    console.error("Komut silinirken hata:", err);
    showAlert(`Komut silinirken hata oluştu!`, `error`);
  }
  closeAllPopups();
};

function closeAllPopups() {
  document.querySelectorAll('.popup-menu').forEach(p => {
    p.style = "display:none;"
  });
}

// Global fonksiyon olarak tanımla
window.handleHistoryCommand = function(cmd) {
  const url = `${url.site}${url.repository}?cmd=${cmd}`;
  location.href = url.toString();
};
