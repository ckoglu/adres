// helper/alert.js
export function showAlert(message, type = 'info', duration = 3000) {
  const alertBox = document.getElementById('alert');
  const messageBox = document.getElementById('alertMessage');
  const iconBox = document.getElementById('alertIcon');

  const icons = {
    success: '<div class="icon"><i class="check"></i></div>',
    error: '<div class="icon"><i class="danger"></i></div>',
    warning: '<div class="icon"><i class="warning"></i></div>',
    info: '<div class="icon"><i class="info"></i></div>',
    clean: '<div class="icon"><i class="info"></i></div>',
    copy: '<div class="icon"><i class="copy"></i></div>',
    light: '<div class="icon">☀️</div>',
    dark: '<div class="icon">🌙</div>',
    auto: '<div class="icon">🔄</div>',
    system: '<div class="icon">💻</div>',
    pastel: '<div class="icon">🎨</div>',
    dracula: '<div class="icon">🧛</div>',
    sepia: '<div class="icon">📜</div>',
    ice: '<div class="icon">❄️</div>',
    forest: '<div class="icon">🌲</div>',
    'solarized-light': '<div class="icon">🔆</div>',
    midnight: '<div class="icon">🌌</div>',
    'retro-green': '<div class="icon">🟢</div>',
    sunset: '<div class="icon">🌇</div>',
    cyberpunk: '<div class="icon">🤖</div>',
    'ocean-deep': '<div class="icon">🌊</div>',
    'neon-night': '<div class="icon">💡</div>',
    'galactic-purple': '<div class="icon">🌌</div>',
    'cyber-neon': '<div class="icon">🔮</div>',
    'mystic-forest': '<div class="icon">🧙</div>',
    'candy-pop': '<div class="icon">🍬</div>',
    'obsidian-dark': '<div class="icon">⚫</div>',
    'sunrise-glow': '<div class="icon">🌅</div>',
    'deep-space': '<div class="icon">🚀</div>',
    'cotton-candy': '<div class="icon">🍭</div>',
    'midnight-gold': '<div class="icon">🌟</div>',
    'electric-violet': '<div class="icon">⚡</div>'
  };

  const bgColors = {
    success: 'bg-success',
    error: 'bg-danger',
    warning: 'bg-warning',
    info: 'bg-info',
    clean: 'bg-danger',
    dark: 'bg-dark',
    light: 'bg-light',
    auto: 'bg-info',
    system: 'bg-info',
    copy: 'bg-success',
  };

  if (messageBox) messageBox.textContent = message;
  if (iconBox) iconBox.innerHTML = icons[type] || icons.info;

  const bgClass = bgColors[type] || 'bg-info';
  if (alertBox) {alertBox.className = `alert show ${bgClass}`;}

  clearTimeout(window.alertTimeout);
  window.alertTimeout = setTimeout(hideAlert, duration);
}

export function hideAlert() {
  const alertBox = document.getElementById('alert');
  if (alertBox) {alertBox.classList.remove('show');}
}
