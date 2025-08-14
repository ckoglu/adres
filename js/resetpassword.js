let url;
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const pathname = location.pathname.split('/').filter(Boolean);
    const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
    const { siteURL } = await import(`${location.origin}${repo}js/siteurl.js`);
    url = siteURL();

    const userModul = await import(`${url.modul}user.js`);

    const form = document.getElementById('resetForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.elements.email.value;

        try {
          const result = await userModul.resetPassword(email);
          showSuccess(result);
        } catch (error) {
          showError(error.message);
        }
      });
    }

  } catch (error) {
    console.error("Şifre sıfırlama hata:", error);
    showError("Bir hata oluştu. Lütfen tekrar deneyin.");
  }
});

function showError(message) {
  const errorElement = document.getElementById('resetError');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    errorElement.style.color = '#ef4444';
  }
}

function showSuccess(message) {
  const errorElement = document.getElementById('resetError');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    errorElement.style.color = '#22c55e';
    errorElement.style.background = '#4ace6a1a';
    errorElement.style.borderColor = '#60ce4ad4';
  }
}

  document.documentElement.style.setProperty("--before-display", "none");
  document.body.style.visibility = "visible"; 