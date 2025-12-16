export function wrapHtmlForSandbox(userHtml: string): string {
  const maxBytes = 200_000;
  if (new TextEncoder().encode(userHtml).length > maxBytes) {
    throw new Error(`Code too large. Max ${maxBytes} bytes.`);
  }

  // Basic "obvious danger" checks (NOT perfect; MVP guardrails)
  const banned = [
    /<script[^>]+src=/i,
    /<link[^>]+href=/i,
    /\bfetch\s*\(/i,
    /\bXMLHttpRequest\b/i,
    /\bWebSocket\b/i,
    /\bnavigator\.sendBeacon\b/i,
  ];
  for (const re of banned) {
    if (re.test(userHtml)) {
      throw new Error("This code appears to use external resources or networking. Remove external links/fetch/WebSocket for MVP.");
    }
  }

  const csp =
    "default-src 'none'; " +
    "connect-src 'none'; " +
    "img-src data:; " +
    "media-src 'none'; " +
    "font-src 'none'; " +
    "frame-src 'none'; " +
    "worker-src 'none'; " +
    "style-src 'unsafe-inline'; " +
    "script-src 'unsafe-inline';";

  // Ensure there's a basic HTML document wrapper
  const hasHtmlTag = /<html[\s>]/i.test(userHtml);
  const hasHeadTag = /<head[\s>]/i.test(userHtml);

  let html = userHtml.trim();

  if (!hasHtmlTag) {
    html = `<!doctype html><html><head></head><body>${html}</body></html>`;
  }
  if (!hasHeadTag) {
    html = html.replace(/<html[^>]*>/i, (m) => `${m}<head></head>`);
  }

  // Inject CSP meta at top of head
  html = html.replace(/<head[^>]*>/i, (m) => `${m}<meta http-equiv="Content-Security-Policy" content="${csp}">`);

  return html;
}
