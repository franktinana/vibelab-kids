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


// VibeLab Game Messaging Script - injected into game iframes for save/restore
const GAME_MESSAGING_SCRIPT = `
<script>
(function() {
  window.parent.postMessage({ type: 'GAME_READY', timestamp: Date.now() }, '*');
    window.addEventListener('message', function(e) {
        if (e.data && e.data.type === 'LOAD_STATE' && e.data.state) {
              try {
                      var state = JSON.parse(e.data.state);
                              if (typeof window.vibelabRestoreState === 'function') window.vibelabRestoreState(state);
                                    } catch (err) { console.error('VibeLab restore error', err); }
                                        }
                                            if (e.data && e.data.type === 'RESET_GAME' && typeof window.vibelabResetGame === 'function') {
                                                  window.vibelabResetGame();
                                                      }
                                                        });
                                                          window.vibelabSaveState = function(state) {
                                                              window.parent.postMessage({ type: 'GAME_STATE', state: JSON.stringify(state), timestamp: Date.now() }, '*');
                                                                };
                                                                  window.vibelabReportScore = function(score, level) {
                                                                      window.parent.postMessage({ type: 'GAME_SCORE', score: score, level: level, timestamp: Date.now() }, '*');
                                                                        };
                                                                        })();
                                                                        <\/script>
                                                                        `;

                                                                        /**
                                                                         *  * Injects the VibeLab messaging script into game HTML to enable save/restore.
                                                                          * @param html - The game HTML code
                                                                          *  * @returns HTML with messaging script injected before </body> or appended
                                                                           */
                                                                           export function injectGameMessaging(html: string): string {
                                                                             if (html.includes('</body>')) {
                                                                                 return html.replace('</body>', GAME_MESSAGING_SCRIPT + '</body>');
                                                                                   }
                                                                                     return html + GAME_MESSAGING_SCRIPT;
                                                                                     }