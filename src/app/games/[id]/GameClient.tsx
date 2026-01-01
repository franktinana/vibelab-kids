"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { DeviceFrame } from "@/interfaces/components/DeviceFrame";
import { supabase } from "@/lib/supabase";

type DeviceType = "mobile" | "tablet" | "desktop";

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
  
  const [device, setDevice] = useState<DeviceType>("mobile");
  const [showRevisions, setShowRevisions] = useState(false);

  const [shareHandle, setShareHandle] = useState("");
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const isOwner = useMemo(() => !!game && game.owner_id === me, [game, me]);
  const current = useMemo(() => revs.find((r) => r.id === game?.current_revision_id) ?? null, [revs, game]);

  async function load() {
    setErr(null);
    const { data: u, error: uErr } = await supabase.auth.getUser();
    if (uErr) { setErr(uErr.message); return; }
    setMe(u.user?.id ?? "");

    const { data: g, error: e1 } = await supabase
      .from("games")
      .select("id,title,owner_id,current_revision_id")
      .eq("id", gameId)
      .single();
    if (e1) { setErr(e1.message); return; }
    setGame(g as Game);

    const { data: r, error: e2 } = await supabase
      .from("game_revisions")
      .select("id,game_id,version_label,code,created_at")
      .eq("game_id", gameId)
      .order("created_at", { ascending: false });
    if (e2) { setErr(e2.message); return; }

    const rr = (r ?? []) as Rev[];
    setRevs(rr);
    const cur = rr.find((x) => x.id === (g as Game).current_revision_id) ?? rr[0] ?? null;
    if (cur) {
      setPreview(cur.code);
      setCode(cur.code);
      setVersionLabel(cur.version_label || "v1");
    }
  }

  useEffect(() => {
    if (!gameId) return;
    load();
  }, [gameId]);

  async function saveRevision() {
    setErr(null);
    if (!isOwner) { setErr("Only the owner can save revisions."); return; }
    const codeToSave = (code ?? "").toString();
    if (!codeToSave.trim()) { setErr("Paste code before saving."); return; }
    const label = (versionLabel ?? "").trim() || "update";
    const { data: u, error: uErr } = await supabase.auth.getUser();
    if (uErr) { setErr(uErr.message); return; }
    const uid = u.user?.id;
    if (!uid) { setErr("Not logged in."); return; }
    const { data: rev, error } = await supabase
      .from("game_revisions")
      .insert({ game_id: gameId, version_label: label, code: codeToSave, created_by: uid })
      .select("id")
      .single();
    if (error) { setErr(error.message); return; }
    const { error: e2 } = await supabase.from("games").update({ current_revision_id: rev.id }).eq("id", gameId);
    if (e2) { setErr(e2.message); return; }
    await load();
  }

  async function restoreRevision(revId: string) {
    setErr(null);
    if (!isOwner) { setErr("Only the owner can restore revisions."); return; }
    const { error } = await supabase.from("games").update({ current_revision_id: revId }).eq("id", gameId);
    if (error) { setErr(error.message); return; }
    await load();
  }

  async function share() {
    setShareMsg(null);
    setErr(null);
    if (!isOwner) { setErr("Only the owner can share this game."); return; }
    const h = shareHandle.trim().toLowerCase();
    if (!h) return;
    const { data: dir, error: e1 } = await supabase.from("profile_directory").select("id,handle").eq("handle", h).maybeSingle();
    if (e1) { setErr(e1.message); return; }
    if (!dir?.id) { setErr("Handle not found."); return; }
    const { error: e2 } = await supabase.from("game_shares").insert({ game_id: gameId, shared_with_user_id: dir.id });
    if (e2) { setErr(e2.message); return; }
    setShareMsg("Shared with @" + h);
    setShareHandle("");
  }

  return (
    <AuthGate>
      <div className="gradient-bg dot-texture min-h-screen p-4">
        <div className="flex items-center justify-between mb-4 max-w-7xl mx-auto">
          <h1 className="text-2xl font-black text-white drop-shadow-lg">{game?.title ?? "Game"}</h1>
          <div className="flex gap-2">
            {!isOwner && <span className="text-white/70 text-sm self-center">(read-only)</span>}
            <button className="border-2 border-white/20 bg-white/10 text-white font-semibold rounded-xl px-4 py-2 hover:bg-white/20 transition" onClick={() => (window.location.href = "/games")}>Back</button>
          </div>
        </div>
        {err && <div className="max-w-7xl mx-auto mb-4 text-red-400 bg-red-900/30 rounded-xl px-4 py-2">{err}</div>}
        {shareMsg && <div className="max-w-7xl mx-auto mb-4 text-green-400 bg-green-900/30 rounded-xl px-4 py-2">{shareMsg}</div>}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface rounded-2xl shadow-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Code Editor</h2>
              <div className="text-sm text-ink/60">{current ? current.version_label : "New"}</div>
            </div>
            {isOwner && (
              <input className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-blue-400 focus:outline-none" value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} placeholder="Revision label (e.g. v2)" />
            )}
            <textarea className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-mono text-sm h-80 focus:border-blue-400 focus:outline-none resize-none" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste your HTML/JS code here..." readOnly={!isOwner} />
            <div className="flex gap-2">
              <button className="flex-1 border-2 border-ink/10 bg-white text-ink font-semibold rounded-xl px-4 py-2 hover:bg-gray-50 transition" type="button" onClick={() => setPreview(code)}>Run</button>
              {isOwner && (<button className="flex-1 bg-sunshine text-ink font-black rounded-xl px-4 py-2 shadow-lg hover:opacity-90 transition" type="button" onClick={saveRevision}>Save</button>)}
            </div>
          </div>
          <div className="bg-surface rounded-2xl shadow-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Preview</h2>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button className={"px-3 py-1 text-xs font-medium rounded-md transition " + (device === "mobile" ? "bg-white shadow text-ink" : "text-ink/60 hover:text-ink")} onClick={() => setDevice("mobile")}>Mobile</button>
                <button className={"px-3 py-1 text-xs font-medium rounded-md transition " + (device === "tablet" ? "bg-white shadow text-ink" : "text-ink/60 hover:text-ink")} onClick={() => setDevice("tablet")}>Tablet</button>
                <button className={"px-3 py-1 text-xs font-medium rounded-md transition " + (device === "desktop" ? "bg-white shadow text-ink" : "text-ink/60 hover:text-ink")} onClick={() => setDevice("desktop")}>Desktop</button>
              </div>
            </div>
            <div className="flex justify-center bg-gray-100 rounded-xl p-4 min-h-[400px]">
              <DeviceFrame device={device}>
                <iframe srcDoc={preview} className="w-full h-full border-0" sandbox="allow-scripts" title="Game Preview" />
              </DeviceFrame>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-4">
          <div className="bg-surface rounded-2xl shadow-xl overflow-hidden">
            <button className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition" onClick={() => setShowRevisions(!showRevisions)}>
              <h2 className="text-lg font-bold text-ink">Revisions ({revs.length})</h2>
              <span className="text-ink/60">{showRevisions ? "▲" : "▼"}</span>
            </button>
            {showRevisions && (
              <div className="border-t border-gray-200 p-4 space-y-2 max-h-60 overflow-y-auto">
                {revs.length === 0 ? (<div className="text-ink/60 text-sm">No revisions yet.</div>) : (
                  revs.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <div className="font-medium text-ink">{r.version_label}</div>
                        <div className="text-xs text-ink/60">{new Date(r.created_at).toLocaleString()}</div>
                      </div>
                      {isOwner && r.id !== game?.current_revision_id && (<button className="text-sm text-blue-600 hover:text-blue-800 font-medium" onClick={() => restoreRevision(r.id)}>Restore</button>)}
                      {r.id === game?.current_revision_id && (<span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Current</span>)}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        {isOwner && (
          <div className="max-w-7xl mx-auto mt-4">
            <div className="bg-surface rounded-2xl shadow-xl p-4">
              <h2 className="text-lg font-bold text-ink mb-3">Share with Friends</h2>
              <div className="flex gap-2">
                <input className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" value={shareHandle} onChange={(e) => setShareHandle(e.target.value)} placeholder="Enter friend's handle" />
                <button className="bg-sunshine text-ink font-black rounded-xl px-6 py-2 shadow-lg hover:opacity-90 transition" onClick={share}>Share</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGate>
  );
}
