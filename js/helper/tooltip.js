export function initializeTooltip() {
  let currentTooltipEl = null;
  let currentTargetEl = null;

  const showTooltip = (el) => {
    const tooltipText =
      el.dataset.altTitle ||
      el.dataset.sagTitle ||
      el.dataset.solTitle ||
      el.dataset.ustTitle;

    if (!tooltipText) return;

    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.textContent = tooltipText;

    // Stil (dilersen CSS'te tanımla)
    tooltip.style.position = "fixed";
    tooltip.style.zIndex = "10000";
    tooltip.style.padding = "6px 10px";
    tooltip.style.background = "var(--bg)";
    tooltip.style.color = "var(--primary-clr)";
    tooltip.style.borderRadius = "7px";
    tooltip.style.fontSize = "14px";
    tooltip.style.fontWeight = "400";
    tooltip.style.pointerEvents = "none";
    tooltip.style.whiteSpace = "nowrap";

    document.body.appendChild(tooltip);

    // Pozisyon hesapla
    const rect = el.getBoundingClientRect();
    const offset = 8;

    if (el.hasAttribute("data-alt-title")) {
      // Altına, ortalayarak
      tooltip.style.top = `${rect.bottom + offset}px`;
      tooltip.style.left = `${rect.left + (rect.width - tooltip.offsetWidth) / 2}px`;
    } else if (el.hasAttribute("data-ust-title")) {
      // Üstüne, ortalayarak
      tooltip.style.top = `${rect.top - tooltip.offsetHeight - offset}px`;
      tooltip.style.left = `${rect.left + (rect.width - tooltip.offsetWidth) / 2}px`;
    } else if (el.hasAttribute("data-sag-title")) {
      // Sağında, ortalayarak
      tooltip.style.top = `${rect.top + (rect.height - tooltip.offsetHeight) / 2}px`;
      tooltip.style.left = `${rect.right + offset}px`;
    } else if (el.hasAttribute("data-sol-title")) {
      // Solunda, ortalayarak
      tooltip.style.top = `${rect.top + (rect.height - tooltip.offsetHeight) / 2}px`;
      tooltip.style.left = `${rect.left - tooltip.offsetWidth - offset}px`;
    }

    currentTooltipEl = tooltip;
    currentTargetEl = el;
  };

  const hideTooltip = () => {
    if (currentTooltipEl) {
      currentTooltipEl.remove();
      currentTooltipEl = null;
      currentTargetEl = null;
    }
  };

  // Hover ile göster
  document.addEventListener(
    "mouseenter",
    (e) => {
      const el = e.target;
      if (
        el.nodeType === Node.ELEMENT_NODE &&
        el.matches("[data-alt-title], [data-sag-title], [data-sol-title], [data-ust-title]")
      ) {
        el.tooltipTimeout = setTimeout(() => showTooltip(el), 500);
      }
    },
    true
  );

  // Mouse çıkınca gizle
  document.addEventListener(
    "mouseleave",
    (e) => {
      const el = e.target;
      if (
        el.nodeType === Node.ELEMENT_NODE &&
        el.matches("[data-alt-title], [data-sag-title], [data-sol-title], [data-ust-title]")
      ) {
        clearTimeout(el.tooltipTimeout);
        hideTooltip();
      }
    },
    true
  );

  // Scroll ile tooltip konumunu güncelle
  window.addEventListener("scroll", () => {
    if (!currentTooltipEl || !currentTargetEl) return;

    const el = currentTargetEl;
    const tooltip = currentTooltipEl;
    const rect = el.getBoundingClientRect();
    const offset = 8;

    if (el.hasAttribute("data-alt-title")) {
      tooltip.style.top = `${rect.bottom + offset}px`;
      tooltip.style.left = `${rect.left + (rect.width - tooltip.offsetWidth) / 2}px`;
    } else if (el.hasAttribute("data-ust-title")) {
      tooltip.style.top = `${rect.top - tooltip.offsetHeight - offset}px`;
      tooltip.style.left = `${rect.left + (rect.width - tooltip.offsetWidth) / 2}px`;
    } else if (el.hasAttribute("data-sag-title")) {
      tooltip.style.top = `${rect.top + (rect.height - tooltip.offsetHeight) / 2}px`;
      tooltip.style.left = `${rect.right + offset}px`;
    } else if (el.hasAttribute("data-sol-title")) {
      tooltip.style.top = `${rect.top + (rect.height - tooltip.offsetHeight) / 2}px`;
      tooltip.style.left = `${rect.left - tooltip.offsetWidth - offset}px`;
    }
  });
}
