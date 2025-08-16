export async function initAuthUI() {
  const pathname = location.pathname.split('/').filter(Boolean);
  const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
  const { siteURL } = await import(`${location.origin}${repo}js/siteurl.js`);
  const url = siteURL();
  window.url = url;

  try {
    const userModul = await import(`${url.modul}user.js`);
    const user = await userModul.getCurrentUser();

    const verified = await userModul.isVerified();
    if (!verified && user) {
      showMailVerify(url);
      document.getElementById("mainContent").classList.add("mainContentVerify");
    } 

    let verifyHTML ="";
    if (verified && user) {verifyHTML = '<div class="auth-verify-icon icon" data-alt-title="onaylanmış email"><i class="check"></i></div>';}

    if (user) {
      showUserInfo(user.email, user.uid, verifyHTML, userModul.logout);
      const fullInfo = await userModul.getFullUserInfo();
      showCurrentUserInfo(fullInfo);
    } else {
      showAuthButtons(url);
    }

  } catch (error) {
    console.error("UI init hatası:", error);
    showAuthButtons();
  }
}

function showUserInfo(email, uid, verifyHTML, logoutFn) {
  const username = email.split("@")[0];
  const container = document.getElementById("showUserInfo");
  const h1UserName = document.getElementById("user-name");
  const settignsKey = document.getElementById("settings-key");
  const authName = document.getElementById("authName");
  if (h1UserName) {h1UserName.innerText = "Merhaba, " + username + "!";}
  if (settignsKey) {settignsKey.innerText = uid;}
  if (authName) {authName.innerText = username;}
  if (!container) return;

  container.innerHTML = `
    <button class="dropdown-btn" onclick="toggleDropdown('mainDropdown')" data-sol-title="${username}"><span class="icon">${username.charAt(0).toUpperCase()}</span></button>
    <div class="dropdown-content">
      <div class="username-dropdown-div"><span id="username-dropdown-name">${username} <div id="username-dropdown-verify">${verifyHTML}</div></span><span id="username-dropdown-api" data-text="kopyala">${uid}</span></div>
      <a href="${url.site}${url.repository}settings/" class="dropdown-item"><div class="icon"><i class="i-options"></i></div>ayarlar</a>
      <a href="#" id="logoutBtnDropdown" class="dropdown-item"><div class="icon"><i class="log-out"></i></div>çıkış yap</a>
    </div>`;

  document.getElementById("logoutBtnDropdown").addEventListener("click", async () => {
    await logoutFn();
    location.reload();
  });
}

function showAuthButtons(url) {
  const container = document.getElementById("authButtons");
  const h1UserName = document.getElementById("user-name");
  if (h1UserName) {h1UserName.innerText = "Merhaba!";}
  if (!container) return;
  if (window.innerWidth < 768) {container.innerHTML = `<button id="loginBtn" class="btn-auth">giriş</button><button id="registerBtn" class="btn-auth">kayıt</button>`;} 
  else {container.innerHTML = `<button id="loginBtn" class="btn-auth">giriş yap</button><button id="registerBtn" class="btn-auth">kayıt ol</button>`;}
  document.getElementById("loginBtn")?.addEventListener("click", () => {window.location.href = `${url.site}${url.repository}login/`;});
  document.getElementById("registerBtn")?.addEventListener("click", () => {window.location.href = `${url.site}${url.repository}signup/`;});
}

async function showMailVerify(url) {
  const container = document.getElementById("verifyMail");
  if (!container) return;

  container.innerHTML = `
    <div class="verify-warning">
      <div class="verify-warning-text">E-posta adresinizi doğrulamadınız, lütfen e-postanızı kontrol edin!</div>
      <button id="resendVerifyEmail" class="resend-btn">Tekrar Gönder</button>
    </div>
  `;

  const resendBtn = document.getElementById("resendVerifyEmail");
  if (resendBtn) {
    resendBtn.addEventListener("click", async () => {
      try {
        const userModul = await import(`${url.modul}user.js`);
        const result = await userModul.resendVerificationEmail();
        window.showAlert?.(result, "success");
      } catch (err) {
        window.showAlert?.(err.message, "error");
      }
    });
  }
}

function showCurrentUserInfo(info) {
  const container = document.getElementById("currentUserInfo");
  if (!container || !info) return;
  container.innerHTML = `<p>📅 hesap oluşturma: ${timeAgoAuth(info.creationTime)}</p><p>🕒 giriş: ${timeAgoAuth(info.lastSignInTime)}</p>`;
  if (info.emailVerified === true) {document.getElementById("authVerify").innerHTML = '<div class="auth-verify-icon icon" data-sag-title="onaylanmış email"><i class="check"></i></div>';}
}
//${info.email}
//${info.uid}
//${info.emailVerified}
//${info.creationTime}
//${info.lastSignInTime}

function timeAgoAuth(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // saniye cinsinden fark
  const times = [
    { label: 'yıl', seconds: 31536000 },
    { label: 'ay', seconds: 2592000 },
    { label: 'gün', seconds: 86400 },
    { label: 'sa', seconds: 3600 },
    { label: 'dk', seconds: 60 },
    { label: 'sn', seconds: 1 },
  ];
  for (const t of times) {
    const amount = Math.floor(diff / t.seconds);
    if (amount >= 1) {
      return `${amount} ${t.label}${amount > 1 ? '' : ''} önce`;
    }
  }
  return 'az önce';
}
