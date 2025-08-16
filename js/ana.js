// ana.js
let url;
document.addEventListener("DOMContentLoaded", async () => {
  const pathname = location.pathname.split('/').filter(Boolean);
  const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
  const { siteURL } = await import(`${location.origin}${repo}js/siteurl.js`);
  url = siteURL();
  initializeApp();
});

const cmdInput = document.getElementById("cmd");
const endPoint = document.getElementById("endpoint");
const cmdRunButton = document.getElementById("cmdRun");
const outputContainer = document.getElementById("output-container");
const headerTitle = document.getElementById("header-title");
const headerText = document.getElementById("header-text");
const userName = document.getElementById("user-name");

let previousCommand = "";
let inputTimeout;
let highlightApplyModule;

window.showAlert = function (message, type) {console.log(`${type}: ${message}`);};

/**
 * Komutları işleyen ana fonksiyon.
 * @param {string} cmd Çalıştırılacak komut.
*/
window.cmdRun = async function (cmd) {

  if (!cmd || typeof cmd !== "string") {
    console.warn("Geçersiz komut:", cmd);
    return;
  }

  // info komutu
  if (cmd === "info") {
    const infoHelper = await import(`${url.helper}info.js`);
    infoHelper.gosterInfo(cmdInput);
    if (userName) {
      userName.scrollIntoView({ behavior: "smooth", block: "start" });
      if (typeof userName.focus === "function") {
        userName.setAttribute("tabindex", "-1");
        userName.focus();
      }
    }
    headerTitle.style.display = "none";
    return;
  }

  try {
    const userModul = await import(`${url.modul}user.js`);
    await userModul.initFirebase();

    if (!(await userModul.isLoggedIn())) {
      const typed = cmd.trim().length > 0;
      if (typed) {
        showAlert("Bu işlem için önce giriş yapmalısınız.", "error");
      }
      return;
    }

    const uid = (await userModul.getCurrentUser())?.uid; 
    if (!uid) { // Sadece UID yoksa hata ver
      window.showAlert("API anahtarı bulunamadı.", "error");
      return;
    }

    if (!(await userModul.isVerified())) {
      window.showAlert("Lütfen e-posta adresinizi doğrulayın.", "warning");
      return;
    }

    if (!window.dataLoader) {
      await import(`${url.modul}veriYukleyici.js`).then((mod) =>
        mod.verileriYukle()
      );
    }

    const komutSonucModul = await import(`${url.modul}komutSonucBlock.js`);
    const paramsModul = await import(`${url.modul}komutIsleyici.js`);
    const historyModul = await import(`${url.modul}history.js`);
    const isParametricCmd = cmd.includes("&") || cmd.includes("=") || ["il", "ilce", "mahalle", "koy", "sokak", "belediye", "universite", "filtre", "ara", "baslayan", "sutun", "sirala", "rakim", "kiyi", "nufus", "buyuksehir", "bolge"].includes(cmd);

    // Tema komutları
    if (["dark", "light", "auto", "system"].includes(cmd)) {
      const temaModul = await import(`${url.helper}theme.js`);
      await temaModul.optionTheme(cmd, {
        showAlert: window.showAlert,
        isPageLoaded: false,
      });
      return;
    }

    else if (isParametricCmd) {
      headerTitle.style.display = "none";
      const blockElements = komutSonucModul.createNewOutputBlock(cmd);
      const response = await paramsModul.handleAllParams(cmd);
      await komutSonucModul.processCommandOutput(cmd, response, blockElements);
      await historyModul.addToHistory(cmd, (await userModul.getCurrentUser())?.uid);

      // otomatik kaydırma
      if (outputContainer.children.length > 0) {
        const firstChild = outputContainer.children[0];
        const y = firstChild.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
      return;
    }

    // Bilinmeyen komut
    else {
      console.warn("Bilinmeyen komut:", cmd);
      window.showAlert("Geçersiz komut.", "warning");
      return;
    }
  } catch (error) {
    console.error(`'${cmd}' komutu işlenirken hata oluştu:`, error);
    window.showAlert("Komut işlenirken bir hata oluştu.", "error");
  }
};

function highlightIfJson() {
  setTimeout(() => {
    if (endPoint && highlightApplyModule?.highlightIfJson) {
      highlightApplyModule.highlightIfJson(endPoint);
    }
  }, 50);
}

function setupEventListeners() {
  if (!cmdInput || !cmdRunButton) return;

  cmdRunButton.addEventListener("click", async () => {
    const currentCmd = cmdInput.value.trim();
    if (currentCmd && currentCmd !== previousCommand) {
      await window.cmdRun(currentCmd);
      previousCommand = currentCmd;
    }
  });

  cmdInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const currentCmd = cmdInput.value.trim();
      if (currentCmd && currentCmd !== previousCommand) {
        await window.cmdRun(currentCmd);
        previousCommand = currentCmd;
      }
    }
  });
}

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

    const veriModul = await import(`${url.modul}veriYukleyici.js`);
    await veriModul.verileriYukle();

    highlightApplyModule = await import(`${url.helper}highlightApply.js`);
    const highlightHelperMod = await import(`${url.helper}highlightHelper.js`);
    window.Highlight = highlightHelperMod;

    const themeModul = await import(`${url.helper}theme.js`);
    themeModul.loadStoredTheme();
    themeModul.initializeThemeDropdown({
      isPageLoaded: false,
      showAlert: window.showAlert,
    });
    setupThemeClickHandler();

    const prefixModul = await import(`${url.helper}prefix.js`);
    prefixModul.initPrefix(url.site + url.repository, url.repository);

    const initAuthUI = await import(`${url.modul}authUI.js`);
    await initAuthUI.initAuthUI();

    const historyModul = await import(`${url.modul}history.js`);
    await historyModul.initializeHistory();

    const otherModul = await import(`${url.helper}other.js`);
    otherModul.menuToggle();
    otherModul.endpointButtons();
    otherModul.Year();
    otherModul.deleteLoc();
    window.toggleDropdown = otherModul.toggleDropdown;
    window.togglePopupCmd = otherModul.togglePopupCmd;

    const autocompleteModul = await import(`${url.helper}autocomplete.js`);
    autocompleteModul.initAutocomplete("cmd");

    const processBtnModul = await import(`${url.helper}processBtn.js`);
    processBtnModul.setupCommandButtons();

    const tooltipModul = await import(`${url.helper}tooltip.js`);
    tooltipModul.initializeTooltip();

    setupEventListeners();

    const urlModul = await import(`${url.modul}urlParams.js`);
    await urlModul.processUrlParams();
    
    document.documentElement.style.setProperty("--before-display", "none");
    document.body.style.visibility = "visible"; 
  } catch (error) {
    console.error("Uygulama başlatılırken kritik bir hata oluştu:", error);
    window.showAlert?.("Uygulama yüklenemedi. Lütfen sayfayı yenileyin.", "error");
  }
}
