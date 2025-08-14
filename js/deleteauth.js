let url;
document.addEventListener('DOMContentLoaded', async () => {
  const pathname = location.pathname.split('/').filter(Boolean);
  const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
  const { siteURL } = await import(`${location.origin}${repo}js/siteurl.js`);
  url = siteURL();

  const userModul = await import(`${url.modul}user.js`);
  await userModul.initFirebase();
  const user = await userModul.getCurrentUser();
  
  if (!user) {
    window.location.href = `${url.site}${url.repository}login.html`;
    return;
  }

  const form = document.getElementById('deleteForm');
  const messageDiv = document.getElementById('deleteMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = e.target.elements.password.value;
    try {
      const result = await userModul.reauthAndDelete(password);
      messageDiv.textContent = result;
      messageDiv.style.color = '#22c55e';
      setTimeout(() => {window.location.href = `${url.site}${url.repository}login.html`}, 2000);
    } catch (err) {
      messageDiv.textContent = err.message;
      messageDiv.style.color = '#ef4444';
    }
  });

  document.documentElement.style.setProperty("--before-display", "none");
  document.body.style.visibility = "visible"; 
});