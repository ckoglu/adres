// Tüm desteklenen temalar
const supportedThemes = [
  "light", 
  "dark", 
  "auto", 
  "system",
  "pastel", 
  "dracula", 
  "sepia", 
  "ice", 
  "forest",
  "solarized-light", 
  "midnight", 
  "retro-green",
  "sunset", 
  "cyberpunk", 
  "ocean-deep", 
  "neon-night",
  "galactic-purple", 
  "cyber-neon",
  "mystic-forest",
  "candy-pop",
  "obsidian-dark",
  "sunrise-glow",
  "deep-space",
  "cotton-candy",
  "midnight-gold",
  "electric-violet"
];

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

export function applyTheme(theme) {
  const body = document.body;
  supportedThemes.forEach(t => {
    if (t !== "auto" && t !== "system") {
      body.classList.remove(t === "dark" ? "dark-mode" : t);
      document.documentElement.removeAttribute("data-theme");
    }
  });

  if (theme === "auto") {
    const hour = new Date().getHours();
    theme = (hour < 6 || hour >= 18) ? "dark" : "light";
  } else if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    theme = prefersDark ? "dark" : "light";
  }

  if (theme === "dark") {
    body.classList.add("dark-mode");
    document.documentElement.setAttribute("data-theme", "dark-mode");
  } else if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    body.classList.add(theme);
    document.documentElement.setAttribute("data-theme", theme);
  }
}

export function updateThemeUI(theme) {
  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect) {themeSelect.value = theme;}
}

export function saveThemeToStorage(theme) {
  const uid = getCurrentUID();
  const key = "set-" + uid;
  const userSettings = JSON.parse(localStorage.getItem(key) || "{}");
  userSettings.theme = theme;
  localStorage.setItem(key, JSON.stringify(userSettings));
}

export function temayiUygula(theme) {
  applyTheme(theme);
  updateThemeUI(theme);
  saveThemeToStorage(theme);
}

export function loadStoredTheme() {
  const uid = getCurrentUID();
  const userSettings = JSON.parse(localStorage.getItem("set-" + uid) || "{}");
  const theme = userSettings.theme || "light";
  if (!document.documentElement.hasAttribute("data-theme")) {
    applyTheme(theme);
  }
  updateThemeUI(theme);
}

export async function optionTheme(cmd, { showAlert = () => {}, isPageLoaded = false } = {}) {
  if (!supportedThemes.includes(cmd)) return;
  temayiUygula(cmd);
  if (!isPageLoaded) {
    showAlert(`${cmd} tema ayarlandı`, cmd);
  }
}

export function initializeThemeDropdown({ isPageLoaded = true, showAlert = () => {} } = {}) {
  const themeSelect = document.getElementById("themeSelect");
  if (!themeSelect) return;

  themeSelect.addEventListener("change", (e) => {
    const selectedTheme = e.target.value;
    if (!supportedThemes.includes(selectedTheme)) return;
    temayiUygula(selectedTheme);
    if (!isPageLoaded) {
      showAlert(`${selectedTheme} tema ayarlandı`, selectedTheme);
    }
  });
}