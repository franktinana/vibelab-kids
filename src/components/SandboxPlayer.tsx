"use client";

import { useMemo, useState } from "react";
import { wrapHtmlForSandbox } from "@/lib/sandbox";

export default function SandboxPlayer({ html }: { html: string }) {
  const [nonce, setNonce] = useState(0);

  const srcDoc = useMemo(() => {
    try {
      return wrapHtmlForSandbox(html);
    } catch (e: any) {
      return `<!doctype html><html><body><pre style="white-space:pre-wrap;font-family:ui-monospace,monospace;">${String(
        e?.message ?? e
      )}</pre></body></html>`;
    }
  }, [html]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          className="rounded border px-3 py-1 text-sm"
          onClick={() => setNonce((n) => n + 1)}
          type="button"
        >
          Stop / Reset
        </button>
        <span className="text-xs opacity-70 self-center">
          Runs in a sandboxed iframe (no networking).
        </span>
      </div>

      <iframe
        key={nonce}
        title="Game Sandbox"
        sandbox="allow-scripts allow-pointer-lock allow-fullscreen"
        className="w-full h-[520px] border rounded"
        srcDoc={srcDoc}
      />
    </div>
  );
}
