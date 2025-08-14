// ../js/apifetch.js
export async function fetchAPI(apiQuery, urlParams, url) {
  document.documentElement.style.setProperty("--before-display", "none");
  document.body.style.visibility = "visible"; 
  const maxRetries = 2;
  let retryCount = 0;
  let lastError = null;

  while (retryCount <= maxRetries) {
    try {
      const params = new URLSearchParams();
      params.set('api', apiQuery);
      
      // URLSearchParams için doğru tip kontrolü
      if (urlParams && typeof urlParams.forEach === 'function') {
        urlParams.forEach((value, key) => {
          if (key !== 'api') params.set(key, value);
        });
      }

      const pathname = location.pathname.split('/').filter(Boolean);
      const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
      const apiUrl = new URL(`${location.origin}${repo}`);
      apiUrl.search = params.toString();

      const response = await fetch(apiUrl.toString(), {
        headers: { Accept: 'application/json' },
        redirect: 'error'
      });

      // Response tip kontrolü
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textData = await response.text();
        throw new Error(`Beklenmeyen yanıt formatı: ${textData.substring(0, 50)}`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status} Hatası`);
      }

      const data = await response.json();
      const outputEl = document.getElementById('json-output');
      if (outputEl) {
        outputEl.textContent = JSON.stringify(data, null, 2);
      }
      return data;

    } catch (error) {
      lastError = error;
      retryCount++;
      
      if (retryCount <= maxRetries) {
        // Exponential backoff ile bekle
        await new Promise(resolve => 
          setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        continue;
      }

      const outputEl = document.getElementById('json-output');
      if (outputEl) {
        outputEl.textContent = JSON.stringify({
          error: "API İsteği Başarısız",
          details: error.message,
          suggestion: "Lütfen bağlantınızı ve parametreleri kontrol edin",
          retryAttempts: retryCount - 1
        }, null, 2);
      }
      throw error; // Hata yukarıya iletilir
    }
  }
}
