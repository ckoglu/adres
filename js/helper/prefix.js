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

export function updatePrefix(site, repository) {
  const prefixElement = document.getElementById("prefix");
  if (!prefixElement) return;

  const uid = getCurrentUID();
  const setKey = `set-${uid}`;
  const settings = JSON.parse(localStorage.getItem(setKey) || '{}');

  // Hem "off" string hem de false boolean kontrolü
  if (settings.prefix === false) return;

  if (window.innerWidth > 768) {
    prefixElement.innerText = site;
  } else {
    prefixElement.innerText = repository;
  }
}

export function initPrefix(site, repository) {
  updatePrefix(site, repository);
  window.addEventListener("resize", () => updatePrefix(site, repository));
}