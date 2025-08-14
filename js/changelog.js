// changelog.js
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

async function initializeApp() {
  try {

    const alertModul = await import(`${url.helper}alert.js`);
    window.showAlert = alertModul.showAlert;
    window.hideAlert = alertModul.hideAlert;

    const themeModul = await import(`${url.helper}theme.js`);
    themeModul.loadStoredTheme();
    themeModul.initializeThemeDropdown({isPageLoaded: false, showAlert: window.showAlert,});
    setupThemeClickHandler();

    const otherModul = await import(`${url.helper}other.js`);
    otherModul.menuToggle();
    otherModul.endpointButtons();
    otherModul.Year();
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

    const commitsModul = await import(`${url.helper}commits.js`);
    await commitsModul.meMode();

    document.documentElement.style.setProperty("--before-display", "none");
    document.body.style.visibility = "visible"; 
  } catch (error) {
    console.error("Uygulama başlatılırken kritik bir hata oluştu:", error);
    window.showAlert?.("Uygulama yüklenemedi. Lütfen sayfayı yenileyin.", "error");
  }
}