"use client";

import { useEffect, useState } from "react";

export default function SandboxPlayer({ html }: { html: string }) {
  // Force iframe reload whenever html changes (so scripts re-run)
  const [rev, setRev] = useState(0);
  useEffect(() => setRev((n) => n + 1), [html]);

  const srcDoc =
    (html ?? "").trim() ||
    "<!doctype html><html><body style='font-family:system-ui;padding:16px'>No code to run.</body></html>";

  return (
    <div className="border rounded overflow-hidden">
      <iframe
        key={rev}
        title="Vibe Sandbox"
        className="w-full h-[520px] bg-white"
        srcDoc={srcDoc}
        // ✅ allow scripts so games actually run
        // ✅ no allow-same-origin (keeps user code isolated from your app origin)
        sandbox="allow-scripts allow-pointer-lock"
        // ✅ fullscreen is NOT a sandbox flag — it’s separate:
        allow="fullscreen"
        allowFullScreen
      />
    </div>
  );
}
