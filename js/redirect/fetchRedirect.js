// fetchRedict.js
let db;
let docFn, getDocFn;

async function initFirebase() {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const { getFirestore, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    
    const pathname = location.pathname.split('/').filter(Boolean);
    const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
    const { siteURL } = await import(`${location.origin}${repo}js/siteurl.js`);
    url = siteURL();

    const configModul = await import(`${url.modul}firebaseConfig.js`);
    const firebaseConfig = configModul.firebaseConfig;
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    docFn = doc;
    getDocFn = getDoc;
    return { db };
  } catch (error) {
    console.error("Firebase başlatma hatası:", error);
    throw error;
  }
}

async function verifyUserKey(key) {
  try {
    const userRef = docFn(db, "users", key);
    const docSnap = await getDocFn(userRef);
    return docSnap.exists();
  } catch (error) {
    console.error("Doğrulama hatası:", error);
    return false;
  }
}

function parseUrlParams(urlParams) {
  const params = {};
  urlParams.forEach((value, key) => {if (key !== 'fetch') params[key] = value;});
  const fetchParam = urlParams.get('fetch');
  if (fetchParam && typeof fetchParam === 'string') {
    fetchParam.split('&').forEach(part => {
      const [key, value] = part.split('=').map(p => p ? decodeURIComponent(p.trim()) : '');
      if (key) params[key] = value || '';
    });
  }
  return params;
}

async function processRequest(params) {
  const pathname = location.pathname.split('/').filter(Boolean);
  const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
  const { siteURL } = await import(`${location.origin}${repo}js/siteurl.js`);
  url = siteURL();

  const veriModul = await import(`${url.modul}veriYukleyici.js`);
  await veriModul.verileriYukle();
  const paramsModul = await import(`${url.modul}komutIsleyici.js`);
  let paramString;
  if (typeof params === 'string') {paramString = params;} 
  else if (typeof params === 'object' && params !== null) {paramString = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');} 
  else {throw new Error("Geçersiz parametre tipi");}
  return await paramsModul.handleAllParams(paramString);
}

function showError(message, error = null) {
  const errorData = { error: message };
  if (error) errorData.details = error.message;
  document.body.innerHTML = `<pre>${JSON.stringify(errorData, null, 2)}</pre>`;
}

function showResult(data) {
  
  let isDark = false;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('set-') && key !== 'set-guest') {
      try {
        const value = JSON.parse(localStorage.getItem(key));
        if (value && value.theme === "dark") {isDark = true;break;}
      } catch (e) {
        console.warn(`LocalStorage key '${key}' JSON parse hatası:`, e);
      }
    }
  }

  if (isDark) {
      document.body.style.color = "#fff";
      document.body.style.background = "#1e1e1e";
  } else {
      document.body.style.background = "#fff";
      document.body.style.color = "#1e1e1e";
  }

  document.body.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  document.body.style.fontSize = "14px"; 
  document.documentElement.style.setProperty("--before-display", "none");
  document.body.style.visibility = "visible"; 
}

(async () => {
  try {

    const urlParams = new URLSearchParams(window.location.search);
    const fetchParam = urlParams.get('fetch');
    const key = urlParams.get('key');
    if (fetchParam && key) {
      await initFirebase();
      
      const pathname = location.pathname.split('/').filter(Boolean);
      const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
      const { siteURL } = await import(`${location.origin}${repo}js/siteurl.js`);
      url = siteURL();

      if (!key) {showError("API key gerekli (&key=uid)");return;}
      if (!await verifyUserKey(key)) {showError("Geçersiz API key");return;}
      const params = parseUrlParams(urlParams);
      if (!params || Object.keys(params).length === 0) {showError("Geçersiz istek - parametre yok");return;}
      try {
        const result = await processRequest(params);
        showResult(result);
      } catch (err) {
        showError("İşlem hatası", err);
      }
      return;
    }

  } catch (err) {
    console.error("fetchRedict hatası:", err);
    showError("Sistem hatası", err);
  }
})();
