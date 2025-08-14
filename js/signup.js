let url;
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const pathname = location.pathname.split('/').filter(Boolean);
    const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
    const { siteURL } = await import(`${location.origin}${repo}js/siteurl.js`);
    url = siteURL();

    const userModul = await import(`${url.modul}user.js`);
    if (await userModul.isLoggedIn()) {
      window.location.href = `${url.site}${url.repository}`;
      return;
    }

    // Form event listener'ını ekle
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.elements.email.value;
        const password = e.target.elements.password.value;
        const repassword = e.target.elements.repassword?.value;
        try {
          if (repassword && password !== repassword) {
            showError('şifreler birbiri ile uyuşmuyor!');
            return;
          }
          await userModul.register(email, password);
          showError('kayıt başarılı! lütfen e-posta adresinizi, gelen kutusundan (spam) linke tıklayarak doğrulayın.');
          setTimeout(() => {window.location.href = `${url.site}${url.repository}login/`;}, 3000);
        } catch (error) {
          showError(error.message);
        }
      });
    }

    // Giriş yap bağlantısı
    const loginLink = document.getElementById('loginLink');
    if (loginLink) {
      loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = `${url.site}${url.repository}login.html`;
      });
    }

  } catch (error) {
    console.error('Modül yükleme hatası:', error);
    showError('sistem hatası! lütfen sayfayı yenileyin.');
  }

  document.documentElement.style.setProperty("--before-display", "none");
  document.body.style.visibility = "visible"; 
});

// Hata göster
function showError(message) {
  const errorElement = document.getElementById('registerError');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}
