export function setupCommandButtons() {
  const cmdInput = document.getElementById("cmd");
  const endPoint = document.getElementById("endpoint");
  const apiKomutlar = document.getElementById("api-komutlar");
  const apiOrnekler = document.getElementById("api-ornekler");
  if (!cmdInput) return;

  function onClickHandler(e, isKomutlar = false) {
    const target = e.target.closest(".item");
    if (!target) return;

    const cmd = target.getAttribute("data-cmd");
    if (!cmd) return;

    // api-komutlar → cmd inputuna EKLE (+=)
    // api-ornekler → cmd inputunu DEĞİŞTİR (=)
    if (isKomutlar) {
      const prev = cmdInput.value.trim();
      cmdInput.value = prev ? prev + "&" + cmd : cmd;

      // {} varsa bu kısmı otomatik seç
      const fullText = cmdInput.value;
      const start = fullText.indexOf("{");
      const end = fullText.indexOf("}");
      if (start !== -1 && end > start) {
        cmdInput.focus();
        cmdInput.setSelectionRange(start, end + 1);
      }
    } else {
      // Sadece örneklerde tamamen değiştir
      cmdInput.value = cmd;
    }

    // URL güncelle
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("cmd", cmdInput.value);
    history.replaceState({}, "", newUrl.toString());

    // cmdRun fonksiyonu varsa çalıştır
    if (window.cmdRun) {
      window.cmdRun(cmdInput.value).then(() => {
        setTimeout(() => {if (endPoint && window.highlightHelper?.highlightIfJson) {window.highlightHelper.highlightIfJson(endPoint);}}, 50);
      }).catch(console.error);
    }
  }

  // Delegasyon ile olayları bağla
  if (apiKomutlar) {apiKomutlar.addEventListener("click", (e) => onClickHandler(e, true));}
  if (apiOrnekler) {apiOrnekler.addEventListener("click", (e) => onClickHandler(e, false));}
}
