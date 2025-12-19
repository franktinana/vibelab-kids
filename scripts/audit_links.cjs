#!/usr/bin/env node
/* TinMan 3.45 Route Auditor
   - Discovers Next.js App Router routes from src/app or app
   - Scans code for internal links:
       <Link href="...">
       <Link href={'...'}>
       router.push('...')
       router.replace('...')
       router.prefetch('...')
   - Writes BROKEN_LINKS.md
   - Exits non-zero if broken links exist (strict by default)
*/
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const NO_FAIL = args.includes("--no-fail");
const STRICT = !NO_FAIL;

const repoRoot = process.cwd();

function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
function read(p) { return fs.readFileSync(p, "utf8"); }

const APP_DIR = exists(path.join(repoRoot, "src/app")) ? "src/app"
            : exists(path.join(repoRoot, "app")) ? "app"
            : null;

const CODE_DIRS = ["src", "app", "pages", "components", "lib"].filter(d => exists(path.join(repoRoot, d)));

const ROUTE_PAGE_FILES = new Set(["page.tsx","page.ts","page.jsx","page.js"]);

function walk(dir, cb) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next" || e.name === "dist" || e.name === "build" || e.name.startsWith(".")) continue;
      walk(p, cb);
    } else {
      cb(p);
    }
  }
}

function normalizeHref(href) {
  if (!href) return null;
  href = href.trim();

  // strip quotes if still present
  href = href.replace(/^['"`]/, "").replace(/['"`]$/, "");

  // ignore external
  if (/^(https?:)?\/\//i.test(href)) return null;
  if (/^(mailto:|tel:)/i.test(href)) return null;

  // remove query/hash
  href = href.split("#")[0].split("?")[0];

  // internal only
  if (!href.startsWith("/")) return null;

  // normalize trailing slash (keep root)
  if (href.length > 1 && href.endsWith("/")) href = href.slice(0, -1);

  return href;
}

function segmentToRegex(seg) {
  // dynamic: [id] => [^/]+
  if (/^\[.+\]$/.test(seg)) return "[^/]+";
  // catch-all: [...slug] => .+
  if (/^\[\.\.\..+\]$/.test(seg)) return ".+";
  // optional catch-all: [[...slug]] (treat as optional)
  if (/^\[\[\.\.\..+\]\]$/.test(seg)) return ".*";
  return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildRouteFromFile(file) {
  // file like src/app/(group)/users/[id]/page.tsx
  const rel = path.relative(path.join(repoRoot, APP_DIR), file).replace(/\\/g, "/");
  const parts = rel.split("/");
  if (parts.length === 0) return null;

  // must end in page.*
  if (!ROUTE_PAGE_FILES.has(parts[parts.length - 1])) return null;

  // remove file name
  parts.pop();

  // drop route groups like (vr-golf)
  const segs = parts.filter(s => !(s.startsWith("(") && s.endsWith(")")));

  // ignore special segments starting with '_' (convention)
  const clean = segs.filter(s => !s.startsWith("_"));

  let route = "/" + clean.join("/");
  route = route.replace(/\/+/g, "/");
  if (route === "/") return route;
  if (route.endsWith("/")) route = route.slice(0, -1);
  return route;
}

function buildRouteRegex(route) {
  // route: /users/[id]
  const segs = route.split("/").filter(Boolean);
  const reParts = segs.map(segmentToRegex);
  return new RegExp("^/" + reParts.join("/") + "$");
}

function discoverRoutes() {
  const routes = [];
  if (!APP_DIR) return routes;

  const base = path.join(repoRoot, APP_DIR);
  walk(base, (f) => {
    const name = path.basename(f);
    if (!ROUTE_PAGE_FILES.has(name)) return;
    const route = buildRouteFromFile(f);
    if (!route) return;
    routes.push({ route, file: path.relative(repoRoot, f).replace(/\\/g, "/"), re: buildRouteRegex(route) });
  });

  // Add common implicit routes
  routes.push({ route: "/", file: "(implicit)", re: /^\/$/ });

  // unique by route
  const by = new Map();
  for (const r of routes) if (!by.has(r.route)) by.set(r.route, r);
  return Array.from(by.values()).sort((a,b)=>a.route.localeCompare(b.route));
}

function extractLinksFromText(text) {
  const hits = [];

  // <Link href="..."> and <Link href={'...'}>
  const linkRe = /<Link[^>]*\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|\{['"`]([^'"`]+)['"`]\})/g;

  // router.push('...') router.replace("...") router.prefetch("...")
  const routerRe = /\brouter\.(push|replace|prefetch)\s*\(\s*(?:"([^"]+)"|'([^']+)')/g;

  // plain <a href="..."> (optional, still useful)
  const aRe = /<a[^>]*\bhref\s*=\s*(?:"([^"]+)"|'([^']+)')/g;

  let m;
  while ((m = linkRe.exec(text))) hits.push(m[1] || m[2] || m[3]);
  while ((m = routerRe.exec(text))) hits.push(m[2] || m[3]);
  while ((m = aRe.exec(text))) hits.push(m[1] || m[2]);

  return hits;
}

function getLineNumber(text, index) {
  return text.slice(0, index).split("\n").length;
}

function scanCodeForLinks() {
  const results = [];
  const exts = new Set([".ts",".tsx",".js",".jsx",".mdx"]);

  for (const d of CODE_DIRS) {
    const base = path.join(repoRoot, d);
    walk(base, (f) => {
      const ext = path.extname(f);
      if (!exts.has(ext)) return;
      const rel = path.relative(repoRoot, f).replace(/\\/g, "/");
      if (rel.startsWith("docs/")) return; // ignore Pages
      const text = read(f);

      // we need match indices for line numbers; do a crude scan with regex again per hit
      const rawHits = extractLinksFromText(text);
      for (const raw of rawHits) {
        const norm = normalizeHref(raw);
        if (!norm) continue;

        // find first occurrence for line number (best-effort)
        const idx = text.indexOf(raw);
        const line = idx >= 0 ? getLineNumber(text, idx) : null;

        results.push({ href: norm, file: rel, line });
      }
    });
  }
  return results;
}

function matchRoute(href, routes) {
  // Exact match or dynamic match
  for (const r of routes) if (r.re.test(href)) return true;

  // Allow index-ish variations: /x might be /x/ in some cases (already normalized)
  return false;
}

function writeReport(routes, links, broken) {
  const out = [];
  out.push("# BROKEN_LINKS.md");
  out.push("");
  out.push(`Generated: ${new Date().toISOString()}`);
  out.push(`Strict: ${STRICT}`);
  out.push("");
  out.push("## Route Inventory");
  out.push("");
  out.push("| Route | Source Page File |");
  out.push("| --- | --- |");
  for (const r of routes) out.push(`| \`${r.route}\` | \`${r.file}\` |`);

  out.push("");
  out.push("## Scanned Links");
  out.push("");
  out.push(`Total internal link refs found: **${links.length}**`);
  out.push("");

  out.push("## Broken Links");
  out.push("");
  if (broken.length === 0) {
    out.push("✅ No broken internal links detected.");
  } else {
    out.push(`❌ Broken internal links found: **${broken.length}**`);
    out.push("");
    out.push("| Href | File | Line | Status |");
    out.push("| --- | --- | ---: | --- |");
    for (const b of broken) {
      out.push(`| \`${b.href}\` | \`${b.file}\` | ${b.line ?? ""} | NOT_FOUND |`);
    }
  }

  fs.writeFileSync(path.join(repoRoot, "BROKEN_LINKS.md"), out.join("\n") + "\n");
}

function main() {
  if (!APP_DIR) {
    console.log("TinMan Route Audit: No Next.js App Router directory found (src/app or app). Skipping.");
    fs.writeFileSync("BROKEN_LINKS.md", "# BROKEN_LINKS.md\n\nNo App Router found; audit skipped.\n");
    process.exit(0);
  }

  const routes = discoverRoutes();
  const links = scanCodeForLinks();

  const broken = [];
  for (const l of links) {
    if (!matchRoute(l.href, routes)) {
      // allow Next public files? (e.g., /favicon.ico) — ignore common static
      if (/\.(png|jpg|jpeg|webp|svg|ico|css|js|map)$/i.test(l.href)) continue;
      broken.push(l);
    }
  }

  writeReport(routes, links, broken);

  if (broken.length > 0) {
    console.error(`TinMan Route Audit FAILED: ${broken.length} broken link(s). See BROKEN_LINKS.md`);
    process.exit(STRICT ? 1 : 0);
  } else {
    console.log("TinMan Route Audit PASSED: No broken internal links.");
    process.exit(0);
  }
}

main();
