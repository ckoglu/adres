//loginStart.js
(async () => {
  try {
    const pathname = location.pathname.split('/').filter(Boolean);
    const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
    const { siteURL } = await import(`${location.origin}${repo}js/siteurl.js`);
    const url = siteURL();
    const userModul = await import(`${url.modul}user.js`);
    const isLoggedIn = await userModul.isLoggedIn();
    const isVerified = await userModul.isVerified();

    if (isLoggedIn && isVerified) {
      window.location.replace(url.site + url.repository);
    } else {
      document.body.style.display = "block"; 
    }
  } catch (err) {
    console.error("yönlendirme hatası:", err);
    document.body.style.display = "block"; 
  }
})();