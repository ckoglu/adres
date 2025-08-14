// helper/other.js
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

export async function menuToggle() {
  const sidebar = document.getElementById('sidebar');
  const menuToggleBtn = document.getElementById('menuToggle');
  const header = document.querySelector('.header');
  const historyCmd = document.getElementById('history-cmd');

  if (!sidebar || !menuToggleBtn || !header || !historyCmd) return;

  const isMobile = () => window.innerWidth <= 768;

  // UID'yi hızlıca localStorage'dan al
  const uid = getCurrentUID();
  const setKey = `set-${uid}`;

  // Kullanıcıya özel ayarları oku
  const getUserSettings = () => {
    const data = localStorage.getItem(setKey);
    return data ? JSON.parse(data) : {};
  };

  // Kullanıcı ayarlarını kaydet
  const saveUserSettings = (settings) => {
    localStorage.setItem(setKey, JSON.stringify(settings));
  };

  // Kenar çubuğu durumunu uygula
  function applyInitialSidebarState() {
    const settings = getUserSettings();
    const collapsed = settings.sidebarCollapsed === true;

    if (isMobile()) {
      sidebar.classList.remove('collapsed');
      sidebar.classList.remove('visible');
      historyCmd.classList.add('hidden');
    } else {
      sidebar.classList.toggle('collapsed', collapsed);
      historyCmd.classList.toggle('hidden', collapsed);
    }
  }

  // Kenar çubuğu aç/kapat
  function toggleSidebar() {
    const settings = getUserSettings();

    if (isMobile()) {
      sidebar.classList.toggle('visible');
      if (sidebar.classList.contains('visible')) {
        document.body.classList.add('collapsed'); 
      } else {
        document.body.classList.remove('collapsed');
      }

    } else {
      const isCollapsed = sidebar.classList.toggle('collapsed');
      settings.sidebarCollapsed = isCollapsed;
      saveUserSettings(settings);
      historyCmd.classList.toggle('hidden', isCollapsed);
    }
  }

  // Mobilde dışarı tıklanınca sidebar kapat
  function handleOutsideClick(event) {
    const isVisible = sidebar.classList.contains('visible');
    const clickedOutside = !sidebar.contains(event.target) && !menuToggleBtn.contains(event.target);

    if (isMobile() && isVisible && clickedOutside) {
      sidebar.classList.remove('visible');
      if (sidebar.classList.contains('visible')) {
        document.body.classList.add('collapsed'); 
      } else {
        document.body.classList.remove('collapsed');
      }
    }
  }

  // Header pozisyonunu güncelle
  function updateHeaderPosition() {
    if (!isMobile()) {
      header.style.left = sidebar.classList.contains('collapsed') ? '62px' : '250px';
    } else {
      header.style.left = '0';
    }
  }

  // Sidebar class değişimini izle
  const observer = new MutationObserver(updateHeaderPosition);
  observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });

  window.addEventListener('resize', () => {
    applyInitialSidebarState();
    updateHeaderPosition();
    sidebar.classList.remove('visible');
    document.body.classList.remove('collapsed');
  });

  menuToggleBtn.addEventListener('click', toggleSidebar);
  document.addEventListener('click', handleOutsideClick);

  // Başlangıçta uygula
  applyInitialSidebarState();
  updateHeaderPosition();
}


export function togglePopupCmd(el) {
  // Diğer popup'ları kapat
  document.querySelectorAll('.popup-cmd-link.show-popup').forEach(p => {
    if (p !== el) {
      p.classList.remove('show-popup');
      p._popupMenu?.remove();
    }
  });

  // Açık ise kapat
  if (el.classList.contains('show-popup')) {
    el.classList.remove('show-popup');
    el._popupMenu?.remove();
    return;
  }

  el.classList.add('show-popup');

  const originalMenu = el.querySelector('.popup-menu');
  if (!originalMenu) return;

  // Menü klonla
  const popupClone = originalMenu.cloneNode(true);
  popupClone.style.display = 'flex';
  popupClone.classList.add('floating-popup');
  
  // Pozisyonu hesapla
  const rect = el.getBoundingClientRect();
  popupClone.style.position = 'fixed';
  popupClone.style.top = `${rect.bottom + 4}px`;
  popupClone.style.left = `${rect.left}px`;
  popupClone.style.zIndex = '2000';

  // Body'ye ekle
  document.body.appendChild(popupClone);
  el._popupMenu = popupClone;

  // Dış tıklama ile kapat
  const outsideClick = (e) => {
    if (!el.contains(e.target) && !popupClone.contains(e.target)) {
      el.classList.remove('show-popup');
      popupClone.remove();
      document.removeEventListener('click', outsideClick);
    }
  };

  document.addEventListener('click', outsideClick);
}

window.addEventListener('scroll', () => {
  document.querySelectorAll('.popup-cmd-link.show-popup').forEach(p => {
    const popup = p._popupMenu;
    if (popup) {
      const rect = p.getBoundingClientRect();
      popup.style.top = `${rect.bottom + 4}px`;
      popup.style.left = `${rect.left}px`;
    }
  });
}, true); 


export function toggleDropdown(id) {
  const dropdown = document.getElementById(id);
  if (!dropdown) return;

  dropdown.classList.toggle('active');

  // Aktifse dış tıklama ile kapatma dinleyicisini ekle
  if (dropdown.classList.contains('active')) {
    // Zaten varsa tekrar eklenmesin
    if (!dropdown._outsideClickListener) {
      dropdown._outsideClickListener = function (event) {
        const btn = dropdown.querySelector('.dropdown-btn');
        if (!dropdown.contains(event.target) && event.target !== btn) {
          dropdown.classList.remove('active');
          document.removeEventListener('click', dropdown._outsideClickListener);
          delete dropdown._outsideClickListener;
        }
      };
      setTimeout(() => {
        document.addEventListener('click', dropdown._outsideClickListener);
      }, 0);
    }
  }
}

export function Year() {
  let year = document.getElementById('year');
  if (year) {year.textContent = new Date().getFullYear();}
}

export function endpointButtons() {
  const prefixDIV = document.getElementById('prefix');
  const cmd = document.getElementById('cmd');
  if (prefixDIV) {
    prefixDIV.addEventListener('click', () => {cmd.focus();});
  }


  document.addEventListener('click', (e) => {
    
    // JSON çıktısı kopyala butonu
    const copyBtn = e.target.closest('.gorBtn');
    if (copyBtn) {
      const endpoint = copyBtn.closest('.output-block')?.querySelector('.endpoint');
      if (endpoint) {
        navigator.clipboard.writeText(endpoint.textContent);
        showAlert(`JSON çıktısı kopyalandı.`, `copy`);
      }
    }

    // username key kopyala
    const copyBtnKey = document.getElementById('username-dropdown-api');
    if (e.target === copyBtnKey) {
      const textToCopy = copyBtnKey.textContent;
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          showAlert(`Key: ${textToCopy}`, `copy`);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          showAlert(`Failed to copy key.`, `error`);
        });
    }
    
    // settings key kopyala
    const settingsKeyBtn = document.getElementById('settings-key-btn');
    const settingsKey = document.getElementById('settings-key');
    if (e.target === settingsKeyBtn) {
      const settingsKeyText = settingsKey.textContent
      navigator.clipboard.writeText(settingsKeyText)
        .then(() => {
          showAlert(`Key: ${settingsKeyText}`, `copy`);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          showAlert(`Failed to copy key.`, `error`);
        });
    }

    // history toggle butonu (hsclose)
    const hsCloseBtn = document.getElementById('hsclose');
    if (e.target === hsCloseBtn) {
      const uid = getCurrentUID(); 
      if (!uid) {
        showAlert('Kullanıcı UID bulunamadı.', 'error');
        return;
      }

      const setKeyUID = `set-${uid}`;
      const settingsRaw = localStorage.getItem(setKeyUID);
      let settings;

      try {
        settings = settingsRaw ? JSON.parse(settingsRaw) : {};
      } catch (err) {
        console.warn(`"${setKeyUID}" JSON parse edilemedi, sıfırdan başlatılıyor.`);
        settings = {};
      }

      if (settings.history === false) {
        settings.history = true;
        showAlert(`Geçmiş kaydı açıldı`, `info`);
        hsCloseBtn.innerText = "Geçmişi Kapat";
      } else {
        settings.history = false;
        showAlert(`Geçmiş kaydı kapatıldı`, `info`);
        hsCloseBtn.innerText = "Geçmişi Aç";
      }

      localStorage.setItem(setKeyUID, JSON.stringify(settings));
    }

  });

}

export function normalizeTR(text) {
  return text
    .toLowerCase()
    .trim() // boşlukları temizle
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/i̇/g, 'i') // bazı platformlar için
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Türkiye koordinatları için özel normalize edici
 * Örn: "37.001.667" → 37.001667
 * @param {string|number} raw - Enlem veya boylam verisi
 * @returns {number}
*/
export function normalizeLoc(raw) {
  const str = String(raw).replace(/\D/g, ""); // Sadece rakamları al
  if (str.length < 5) return NaN;
  const ondalikIndex = 2;
  const duzeltilmis = str.slice(0, ondalikIndex) + '.' + str.slice(ondalikIndex);
  return parseFloat(duzeltilmis);
}

export function deleteLoc(keyFirst) {
  if (typeof keyFirst !== 'string') {
    // console.warn('Anahtar (key) bir string olmalıdır.');
    return;
  }
  const uid = getCurrentUID();
  const valueKey = `${keyFirst}-${uid}`;
  if (localStorage.getItem(valueKey) !== null) {
    localStorage.setItem(valueKey, JSON.stringify(null));
    showAlert(`"${keyFirst}" temizlendi!`, "clean");
    if (valueKey.includes("history-")) {
      setTimeout(() => {window.location.reload();}, 1500); //1,5sn sonra reload
    }
  } else {
    console.warn(`"${key}" adlı anahtar localStorage içinde bulunamadı.`);
  }
}

export function changeLoc(mainKey, field, newValue) {
  const validTypes = ["string", "boolean"];
  if (typeof mainKey !== 'string' || typeof field !== 'string' || !validTypes.includes(typeof newValue)) {
    return false;
  }

  const uid = getCurrentUID();
  const fullKey = `${mainKey}-${uid}`;

  try {
    const existingData = JSON.parse(localStorage.getItem(fullKey)) || {};

    // Sadece değişiklik gerekiyorsa güncelle
    if (existingData[field] !== newValue) {
      existingData[field] = newValue;
      localStorage.setItem(fullKey, JSON.stringify(existingData));
      showAlert(`"${field}": "${newValue}"`, "success");
      return true;
    } else {
      showAlert(`"${field}": "${newValue}"`, "warning");
      return false;
    }
  } catch (err) {
    console.error("JSON veri okunamadı veya kaydedilemedi:", err);
    return false;
  }
}

export function toggleLoc(mainKey, field, values = [], labels = [], btnElement) {
  const uid = getCurrentUID();
  const fullKey = `${mainKey}-${uid}`;
  let existingData = {};

  try {
    existingData = JSON.parse(localStorage.getItem(fullKey)) || {};
  } catch (err) {
    console.error("JSON veri okunamadı:", err);
    existingData = {};
  }

  const currentValue = existingData[field];
  const currentIndex = values.indexOf(currentValue);
  const nextIndex = (currentIndex + 1) % values.length;
  const nextValue = values[nextIndex];

  changeLoc(mainKey, field, nextValue);

  // Eğer buton referansı gönderildiyse direkt güncelle
  if (btnElement && labels.length === values.length) {
    btnElement.textContent = labels[nextIndex];
  }

  // Her durumda diğer butonlar da güncellensin
  getToggleButtons();
}

// Buraya başka fonksiyonlar da ekleyebilirsin
// export function setupFooter() { ... }
// export function sayHello(name) { ... }