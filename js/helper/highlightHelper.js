export function syntaxHighlight(json) {
  if (typeof json !== "string") {json = JSON.stringify(json, null, 2);}
  json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?|[{}[\]:;"=\/&+#])/g;
  json = json.replace(regex, (match) => {
    const specialChars = {
      ";": "json-semicolon",
      '"': "json-quote",
      "=": "json-equals",
      "/": "json-slash",
      "&": "json-amp",
      "+": "json-plus",
      "#": "json-hash",
      "{": "json-brace",
      "}": "json-brace",
      "[": "json-bracket",
      "]": "json-bracket",
      ":": "json-colon"
    };
    if (specialChars[match]) {return `<span class="${specialChars[match]}">${match}</span>`;}
    if (/^"/.test(match)) {return /:$/.test(match) ? `<span class="json-key">${match}</span>` : `<span class="json-string">${match}</span>`;}
    if (/true|false/.test(match)) {return `<span class="json-boolean">${match}</span>`;}
    if (/null/.test(match)) {return `<span class="json-null">${match}</span>`;}
    return `<span class="json-number">${match}</span>`;
  });
  return `<pre class="json-highlight"><code>${json}</code></pre>`;
}
