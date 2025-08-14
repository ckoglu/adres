(function () {
  if (location.pathname.includes("index.html")) {
    const cleanedUrl = location.href.replace(/index\.html/, "");
    history.replaceState({}, "", cleanedUrl);
  }
  function isMobile() {return window.innerWidth <= 768;}
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
  const uid = getCurrentUID();
  const userData = JSON.parse(localStorage.getItem("set-" + uid) || "{}");
  const isCollapsed = userData.sidebarCollapsed === true;
  document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");
    const header = document.querySelector(".header");
    if (sidebar) {sidebar.classList.toggle("collapsed", isCollapsed && !isMobile());}
    if (header) {header.style.left = isMobile() ? "0" : isCollapsed ? "62px" : "250px";}
  });
})();