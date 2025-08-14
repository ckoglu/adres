// settings.js
let url;
document.addEventListener("DOMContentLoaded", async () => {
  const pathname = location.pathname.split('/').filter(Boolean);
  const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
  const { siteURL } = await import(`${location.origin}${repo}js/siteurl.js`);
  url = siteURL();
  await initializeApp();
});

const headerTitle = document.getElementById("header-title");
const headerText = document.getElementById("header-text");
const userName = document.getElementById("user-name");

let previousCommand = "";
let inputTimeout;
let highlightApplyModule;

window.showAlert = function (message, type) {console.log(`${type}: ${message}`);};

function setupThemeClickHandler() {
  document.body.addEventListener("click", (e) => {
    const target = e.target.closest(".theme-option");
    if (target) {
      const selectedTheme = target.getAttribute("data-cmd");
      if (["dark", "light", "auto", "system"].includes(selectedTheme)) {
        import(`${url.helper}theme.js`).then((mod) => {
          mod.temayiUygula(selectedTheme);
          window.showAlert(`${selectedTheme} tema ayarlandı`, selectedTheme);
        });
      }
    }
  });
}

async function setupLocalStorageHandlers() {
  const userModul = await import(`${url.modul}user.js`);
  await userModul.initFirebase();
  const uidKey = (await userModul.getCurrentUser())?.uid; 
  
  try {
    // localKeyModule'ü let ile tanımla
    let localKeyModule = await import(`${url.helper}localKey.js`);
    
    document.getElementById('hsexport')?.addEventListener('click', async () => {
      try {
        const result = await localKeyModule.exportUserHistory(uidKey);
        window.showAlert(result.message, "success");
      } catch (error) {
        console.error('Export error:', error);
        window.showAlert(error.message, "error");
      }
    });
    
    document.getElementById('hsimport')?.addEventListener('click', async () => {
      try {
        const result = await localKeyModule.importUserHistory(uidKey);
        window.showAlert(result.message, "success");
        setTimeout(() => {
          if (window.renderHistoryLazy) {
            window.renderHistoryLazy();
          }
        }, 500);
      } catch (error) {
        console.error('Import error:', error);
        window.showAlert(error.message, "error");
      }
    });
  } catch (error) {
    console.error("localKey modülü yüklenemedi:", error);
    window.showAlert?.("Geçmiş işlemleri devre dışı", "warning");
  }
}

async function initializeApp() {
  try {

    const userModul = await import(`${url.modul}user.js`);
    await userModul.initFirebase();
    if (!(await userModul.isLoggedIn())) {
      showAlert("Bu işlem için önce giriş yapmalısınız.", "error");
      window.location.href = url.site + url.repository;
      return;
    }

    await setupLocalStorageHandlers();

    const form = document.getElementById('resetForm');
    const currentUser = await userModul.getCurrentUser();
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = currentUser?.email;

        try {
          const result = await userModul.resetPassword(email);
          showAlert(result, "info");
        } catch (error) {
          showAlert("Hata: " + error.message, "error");
        }
      });
    }

    const alertModul = await import(`${url.helper}alert.js`);
    window.showAlert = alertModul.showAlert;
    window.hideAlert = alertModul.hideAlert;

    const themeModul = await import(`${url.helper}theme.js`);
    themeModul.loadStoredTheme();
    themeModul.initializeThemeDropdown({
      isPageLoaded: false,
      showAlert: window.showAlert,
    });
    setupThemeClickHandler();

    const otherModul = await import(`${url.helper}other.js`);
    otherModul.menuToggle();
    otherModul.endpointButtons();
    otherModul.Year();
    window.deleteLoc = otherModul.deleteLoc;
    window.changeLoc = otherModul.changeLoc;
    window.toggleLoc = otherModul.toggleLoc;
    window.toggleDropdown = otherModul.toggleDropdown;
    window.togglePopupCmd = otherModul.togglePopupCmd;
    
    window.addEventListener("storage", (event) => {if (event.key === STORAGE_KEY) {renderHistoryLazy();}});

    const initAuthUI = await import(`${url.modul}authUI.js`);
    await initAuthUI.initAuthUI();

    const processBtnModul = await import(`${url.helper}processBtn.js`);
    processBtnModul.setupCommandButtons();

    const historyModul = await import(`${url.modul}history.js`);
    await historyModul.initializeHistory();

    const tooltipModul = await import(`${url.helper}tooltip.js`);
    tooltipModul.initializeTooltip();

    const urlModul = await import(`${url.modul}urlParams.js`);
    await urlModul.processUrlParams();
    
    const timeModul = await import(`${url.helper}timeAgo.js`);
    window.timeAgo = timeModul.timeAgo; 

    document.documentElement.style.setProperty("--before-display", "none");
    document.body.style.visibility = "visible"; 
  } catch (error) {
    console.error("Uygulama başlatılırken kritik bir hata oluştu:", error);
    window.showAlert?.("Uygulama yüklenemedi. Lütfen sayfayı yenileyin.", "error");
  }
}