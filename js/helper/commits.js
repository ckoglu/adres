// commits.js
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

export async function meMode() {
  const user = 'ckoglu';
  const pathname = location.pathname.split('/').filter(Boolean);
  const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
  const ul = document.getElementById('commits');
  const status = document.getElementById('me-durum-info');

  const uid = getCurrentUID(); 
  const setKey = `set-${uid}`;

  const today = new Date().toISOString().split('T')[0];
  let setData = JSON.parse(localStorage.getItem(setKey) || "null");

  if (!setData) {
    setData = { lastCommit: today };
    localStorage.setItem(setKey, JSON.stringify(setData));
  }

  const lastCommit = setData?.lastCommit || null;
  const cachedCommits = localStorage.getItem('cachedCommits');

  // Eğer cache bugünküse direkt kullan
  if (lastCommit === today && cachedCommits) {
    const commits = JSON.parse(cachedCommits);
    renderCommits(commits, ul);
    if (status) status.setAttribute('data-ust-title', 'localStorage');
    return;
  }

  const now = new Date();
  const until = now.toISOString();
  const past = new Date();
  past.setDate(now.getDate() - 90);
  const since = past.toISOString();

  const baseUrl = `https://api.github.com/repos/${user}/${repo}/commits?author=${user}&since=${since}&until=${until}&per_page=100`;
  const proxyUrl = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(baseUrl)}`;

  try {
    const res = await fetch(proxyUrl);
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.warn('API beklenen formatta değil, cache verisi kullanılacak.');
      if (cachedCommits) {
        const commits = JSON.parse(cachedCommits);
        renderCommits(commits, ul);
        if (status) status.setAttribute('data-ust-title', 'localStorage (API hatası)');
        return;
      } else {
        throw new Error('API geçersiz veri döndürdü ve local cache yok.');
      }
    }

    const commits = data
      .map((c) => {
        const [title, ...rest] = c.commit.message.split('\n');
        return {
          date: new Date(c.commit.author.date),
          title: title,
          description: rest.join('</p><p>') || '',
        };
      })
      .sort((a, b) => b.date - a.date);

    localStorage.setItem('cachedCommits', JSON.stringify(commits));
    setData.lastCommit = today;
    localStorage.setItem(setKey, JSON.stringify(setData));

    renderCommits(commits, ul);
    if (status) status.setAttribute('data-ust-title', 'API');

  } catch (err) {
    console.error(err);
    if (cachedCommits) {
      const commits = JSON.parse(cachedCommits);
      renderCommits(commits, ul);
      if (status) status.setAttribute('data-ust-title', 'localStorage (fetch hatası)');
      showAlert(`API'den veri alınamadı, cache kullanıldı.`, 'warning');
    } else {
      ul.innerHTML = `<div>Veri alınamadı ve cache yok.</div>`;
      showAlert(`Veri alınamadı: ${err.message}`, 'danger');
    }
  }
}


// Yardımcı fonksiyon: Commits listele
export function renderCommits(commits, container) {
  if (!container) return;

  if (commits.length === 0) {
    container.innerHTML = '<div>Hiç commit bulunamadı.</div>';
    showAlert(`Bu dönemde commit bulunamadı.`, 'warning');
    return;
  }

  const grouped = {};
  commits.forEach(commit => {
    const tarih = new Date(commit.date).toLocaleDateString("tr-TR", {day: '2-digit', month: 'long', year: 'numeric'});
    if (!grouped[tarih]) grouped[tarih] = [];
    grouped[tarih].push(commit);
  });

  let html = '';
  for (const tarih in grouped) {
    html += `<div class="changelog-day"><h4>${tarih}</h4><ul class="changelog-list">`;
    
    grouped[tarih].forEach(commit => {
      html += `<li class="changelog-entry">
                <div class="entry-header">
                  <strong class="entry-title">${commit.title}</strong>
                  <span class="entry-time">${timeAgo(commit.date)}</span>
                </div>
                ${commit.description ? `<div class="entry-description">${commit.description}</div>` : ''}
              </li>`;
            });
    html += `</ul></div>`;
  }
  container.innerHTML = html;
}
