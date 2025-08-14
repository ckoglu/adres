let url;
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const pathname = location.pathname.split('/').filter(Boolean);
    const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
    const { siteURL } = await import(`${location.origin}${repo}js/siteurl.js`);
    url = siteURL();

    const userModul = await import(`${url.modul}user.js`);
    if (await userModul.isLoggedIn() && await userModul.isVerified()) {
      redirectToPreviousPage();
      return;
    }

    // Form event listener'ını ekle
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.elements.email.value;
        const password = e.target.elements.password.value;
        try {
          await userModul.login(email, password);
          const user = await userModul.getCurrentUser();
          if (!user.emailVerified) {
            showError('lütfen e-posta adresinizi, gelen kutusundan (spam) linke tıklayarak doğrulayın.');
            setTimeout(() => {window.location.href = `${url.site}${url.repository}`;}, 3000);
            return;
          }
          window.location.href = `${url.site}${url.repository}`;
        } catch (error) {
          showError(error.message);
        }
      });
    }

    // Şifremi unuttum bağlantısı
    const forgotPasswordLink = document.getElementById('forgotPassword');
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = `${url.site}${url.repository}resetpassword.html`;
      });
    }

    // Kayıt ol bağlantısı
    const registerLink = document.getElementById('registerLink');
    if (registerLink) {
      registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = `${url.site}${url.repository}signup.html`;
      });
    }

  } catch (error) {
    console.error('Modül yükleme hatası:', error);
    showError('sistem hatası! lütfen sayfayı yenileyin.');
  }

  document.documentElement.style.setProperty("--before-display", "none");
  document.body.style.visibility = "visible"; 
});

// Önceki sayfaya yönlendirme
function redirectToPreviousPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const returnUrl = urlParams.get('returnUrl') || `${url.site}${url.repository}signup.html`;
  window.location.href = returnUrl;
}

// Hata göster
function showError(message) {
  const errorElement = document.getElementById('loginError');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}