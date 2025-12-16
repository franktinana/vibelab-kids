"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import SandboxPlayer from "@/components/SandboxPlayer";
import { supabase } from "@/lib/supabase";

export default function NewGamePage() {
  const router = useRouter();
  const [title, setTitle] = useState("Untitled Game");
  const [message, setMessage] = useState("v1");
  const [code, setCode] = useState("<!doctype html><html><body><canvas id='c'></canvas><script>const c=document.getElementById('c');c.width=600;c.height=400;const x=c.getContext('2d');x.fillRect(10,10,50,50);</script></body></html>");
  const [preview, setPreview] = useState(code);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setErr(null);
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error("Not logged in.");

      const { data: game, error: e1 } = await supabase
        .from("games")
        .insert({ owner_id: uid, title })
        .select("id")
        .single();

      if (e1) throw new Error(e1.message);

      const { error: e2 } = await supabase
        .from("game_revisions")
        .insert({ game_id: game.id, message, code_html: code });

      if (e2) throw new Error(e2.message);

      router.replace(`/games/${game.id}`);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthGate>
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <h1 className="text-xl font-semibold">New Game</h1>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="grid gap-3">
          <input className="border rounded px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Game title" />
          <input className="border rounded px-3 py-2" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Revision message (e.g. v1)" />
          <textarea className="border rounded px-3 py-2 font-mono text-xs h-48" value={code} onChange={(e) => setCode(e.target.value)} />
          <div className="flex gap-2">
            <button className="rounded border px-3 py-1 text-sm" type="button" onClick={() => setPreview(code)}>Run</button>
            <button className="rounded bg-black text-white px-3 py-1 text-sm" type="button" disabled={saving} onClick={save}>
              {saving ? "Saving..." : "Save Game"}
            </button>
          </div>
        </div>

        <SandboxPlayer html={preview} />
      </div>
    </AuthGate>
  );
}
