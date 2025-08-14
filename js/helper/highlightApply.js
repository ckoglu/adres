export function highlightIfJson(elementOrSelector) {
  const el = typeof elementOrSelector === "string" ? document.querySelector(elementOrSelector) : elementOrSelector;
  if (!el || !window.Highlight?.syntaxHighlight) return;

  try {
    const rawText = el.textContent.trim();
    const isLikelyJson = (rawText.startsWith("{") && rawText.endsWith("}")) || (rawText.startsWith("[") && rawText.endsWith("]"));

    if (isLikelyJson) {
      const parsed = JSON.parse(rawText);
      el.innerHTML = window.Highlight.syntaxHighlight(parsed);
    }
  } catch (e) {
    console.warn("highlightIfJson: JSON parse edilemedi:", e);
  }
}