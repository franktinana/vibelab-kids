"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGate from "@/components/AuthGate";
import SandboxPlayer from "@/components/SandboxPlayer";
import { supabase } from "@/lib/supabase";

type Game = {
  id: string;
  title: string;
  owner_id: string;
  current_revision_id: string | null;
};

type Rev = {
  id: string;
  game_id: string;
  version_label: string;
  code: string;
  created_at: string;
};

export default function GameClient({ gameId }: { gameId: string }) {
  const [me, setMe] = useState<string>("");
  const [game, setGame] = useState<Game | null>(null);
  const [revs, setRevs] = useState<Rev[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [versionLabel, setVersionLabel] = useState("update");
  const [preview, setPreview] = useState("");

  const [shareHandle, setShareHandle] = useState("");
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const isOwner = useMemo(() => !!game && game.owner_id === me, [game, me]);
  const current = useMemo(() => revs.find((r) => r.id === game?.current_revision_id) ?? null, [revs, game]);

  async function load() {
    setErr(null);

    const { data: u, error: uErr } = await supabase.auth.getUser();
    if (uErr) {
      setErr(uErr.message);
      return;
    }
    setMe(u.user?.id ?? "");

    const { data: g, error: e1 } = await supabase
      .from("games")
      .select("id,title,owner_id,current_revision_id")
      .eq("id", gameId)
      .single();

    if (e1) {
      setErr(e1.message);
      return;
    }
    setGame(g as any);

    const { data: r, error: e2 } = await supabase
      .from("game_revisions")
      .select("id,game_id,version_label,code,created_at")
      .eq("game_id", gameId)
      .order("created_at", { ascending: false });

    if (e2) {
      setErr(e2.message);
      return;
    }

    const rr = (r ?? []) as any as Rev[];
    setRevs(rr);

    const cur = rr.find((x) => x.id === (g as any).current_revision_id) ?? rr[0] ?? null;
    if (cur) {
      setPreview(cur.code);
      setCode(cur.code);
      setVersionLabel(cur.version_label || "v1");
    }
  }

  useEffect(() => {
    if (!gameId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  async function saveRevision() {
    setErr(null);

    if (!isOwner) {
      setErr("Only the owner can save revisions.");
      return;
    }

    const codeToSave = (code ?? "").toString();
    if (!codeToSave.trim()) {
      setErr("Paste code before saving.");
      return;
    }

    const label = (versionLabel ?? "").trim() || "update";

    const { data: u, error: uErr } = await supabase.auth.getUser();
    if (uErr) {
      setErr(uErr.message);
      return;
    }
    const uid = u.user?.id;
    if (!uid) {
      setErr("Not logged in.");
      return;
    }

    const { data: rev, error } = await supabase
      .from("game_revisions")
      .insert({ game_id: gameId, version_label: label, code: codeToSave, created_by: uid })
      .select("id")
      .single();

    if (error) {
      setErr(error.message);
      return;
    }

    const { error: e2 } = await supabase.from("games").update({ current_revision_id: rev.id }).eq("id", gameId);
    if (e2) {
      setErr(e2.message);
      return;
    }

    await load();
  }

  async function restoreRevision(revId: string) {
    setErr(null);
    if (!isOwner) {
      setErr("Only the owner can restore revisions.");
      return;
    }
    const { error } = await supabase.from("games").update({ current_revision_id: revId }).eq("id", gameId);
    if (error) {
      setErr(error.message);
      return;
    }
    await load();
  }

  async function share() {
    setShareMsg(null);
    setErr(null);

    if (!isOwner) {
      setErr("Only the owner can share this game.");
      return;
    }

    const h = shareHandle.trim().toLowerCase();
    if (!h) return;

    const { data: dir, error: e1 } = await supabase.from("profile_directory").select("id,handle").eq("handle", h).maybeSingle();

    if (e1) {
      setErr(e1.message);
      return;
    }
    if (!dir?.id) {
      setErr("Handle not found.");
      return;
    }

    const { error: e2 } = await supabase.from("game_shares").insert({ game_id: gameId, shared_with_user_id: dir.id });
    if (e2) {
      setErr(e2.message);
      return;
    }

    setShareMsg(`Shared with @${h}`);
    setShareHandle("");
  }

  return (
    <AuthGate>
      <div className="gradient-bg dot-texture min-h-screen p-6">
        <div className="bg-surface rounded-3xl shadow-2xl p-8 max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black text-ink">{game?.title ?? "Game"}</h1>
            <button className="border-2 border-ink/10 bg-white text-ink font-semibold rounded-2xl px-4 py-2 min-h-[52px] focus-ring" onClick={() => (window.location.href = "/games")}>
              Back
            </button>
          </div>

          {/* Errors / status */}
          {err && <div className="text-base text-red-600 font-medium">{err}</div>}
          {shareMsg && <div className="text-base text-ink opacity-80 font-medium">{shareMsg}</div>}

          {/* Current revision status */}
          <div className="text-base text-ink opacity-80 font-medium">
            Current: {current ? `${current.version_label} — ${new Date(current.created_at).toLocaleString()}` : "—"}
            {!isOwner && <span className="ml-2">(read-only)</span>}
          </div>

          {/* Sandbox directly under Current */}
          <SandboxPlayer html={preview} />

          {/* Run + Save controls */}
          <div className="flex gap-4">
            <button className="border-2 border-ink/10 bg-white text-ink font-semibold rounded-2xl px-4 py-2 min-h-[52px] focus-ring" type="button" onClick={() => setPreview(code)}>
              Run
            </button>
            {isOwner && (
              <button className="bg-sunshine text-ink font-black rounded-2xl px-4 py-2 min-h-[52px] shadow-xl hover:opacity-90 focus-ring" type="button" onClick={saveRevision}>
                Save New Revision
              </button>
            )}
          </div>

          {/* Revision title + code box under the sandbox */}
          {isOwner && (
            <div className="space-y-4">
              <input
                className="w-full border-4 border-gray-200 rounded-xl px-4 py-3 text-base font-medium shadow-inner focus-ring"
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder="Revision label (e.g. v2)"
              />
              <textarea className="w-full border-4 border-gray-200 rounded-xl px-4 py-3 font-mono text-base h-60 shadow-inner focus-ring" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
          )}

          {/* Revisions list */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-ink">Revisions</h2>
            {revs.length === 0 ? (
              <div className="text-base text-ink opacity-70">No revisions.</div>
            ) : (
              <ul className="space-y-3">
                {revs.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-4 p-4 bg-surface-light rounded-2xl">
                    <div className="text-base text-ink">
                      <div className="font-semibold">{r.version_label}</div>
                      <div className="opacity-70">{new Date(r.created_at).toLocaleString()}</div>
                    </div>
                    {isOwner && (
                      <button className="border-2 border-ink/10 bg-white text-ink font-semibold rounded-2xl px-4 py-2 min-h-[52px] focus-ring" type="button" onClick={() => restoreRevision(r.id)}>
                        Restore
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Share */}
          {isOwner && (
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-ink">Share</h2>
              <div className="flex gap-4">
                <input className="flex-1 border-4 border-gray-200 rounded-xl px-4 py-3 text-base font-medium shadow-inner focus-ring" value={shareHandle} onChange={(e) => setShareHandle(e.target.value)} placeholder="friend_handle" />
                <button className="bg-sunshine text-ink font-black rounded-2xl px-4 py-2 min-h-[52px] shadow-xl hover:opacity-90 focus-ring" type="button" onClick={share}>
                  Share
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
