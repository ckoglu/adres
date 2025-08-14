// js/newpassword.js
const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
const { getAuth, confirmPasswordReset, verifyPasswordResetCode } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");

// Firebase konfigürasyonu
const pathname = location.pathname.split('/').filter(Boolean);
const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
const { siteURL } = await import(`${location.origin}${repo}js/siteurl.js`);
const url = siteURL();
const configModul = await import(`${url.modul}firebaseConfig.js`);
const firebaseConfig = configModul.firebaseConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const urlParams = new URLSearchParams(window.location.search);
const oobCode = urlParams.get("oobCode");

const form = document.getElementById("newPasswordForm");
const errorDiv = document.getElementById("newPassError");
const successDiv = document.getElementById("newPassSuccess");

if (!oobCode) {
  errorDiv.textContent = "Geçersiz bağlantı.";
  errorDiv.style.display = "block";
} else {
  verifyPasswordResetCode(auth, oobCode)
    .then(() => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const newPassword = form.password.value;

        try {
          await confirmPasswordReset(auth, oobCode, newPassword);
          successDiv.textContent = "Şifreniz başarıyla değiştirildi. Giriş sayfasına yönlendiriliyorsunuz...";
          successDiv.style.display = "block";
          errorDiv.style.display = "none";
          setTimeout(() => window.location.href = "login.html", 3000);
        } catch (error) {
          errorDiv.textContent = "şifre güncellenemedi: " + error.message;
          errorDiv.style.display = "block";
          successDiv.style.display = "none";
        }
      });
    })
    .catch(() => {
      errorDiv.textContent = "Bağlantı süresi dolmuş veya geçersiz.";
      errorDiv.style.display = "block";
    });
}

  document.documentElement.style.setProperty("--before-display", "none");
  document.body.style.visibility = "visible"; 