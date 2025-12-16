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
  version_number: number;
  message: string;
  code_html: string;
  created_at: string;
};

export default function GamePage({ params }: { params: { id: string } }) {
  const gameId = params.id;

  const [me, setMe] = useState<string>("");
  const [game, setGame] = useState<Game | null>(null);
  const [revs, setRevs] = useState<Rev[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [message, setMessage] = useState("update");
  const [preview, setPreview] = useState("");

  const [shareHandle, setShareHandle] = useState("");
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const isOwner = useMemo(() => !!game && game.owner_id === me, [game, me]);
  const current = useMemo(() => revs.find((r) => r.id === game?.current_revision_id) ?? null, [revs, game]);

  async function load() {
    setErr(null);
    const { data: u } = await supabase.auth.getUser();
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
      .select("id,game_id,version_number,message,code_html,created_at")
      .eq("game_id", gameId)
      .order("version_number", { ascending: false });

    if (e2) {
      setErr(e2.message);
      return;
    }
    setRevs((r ?? []) as any);

    const cur = (r ?? []).find((x: any) => x.id === (g as any).current_revision_id);
    if (cur) {
      setPreview(cur.code_html);
      setCode(cur.code_html);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  async function saveRevision() {
    setErr(null);
    if (!isOwner) {
      setErr("Only the owner can save revisions.");
      return;
    }
    const { error } = await supabase
      .from("game_revisions")
      .insert({ game_id: gameId, message, code_html: code });

    if (error) {
      setErr(error.message);
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
    const { error } = await supabase
      .from("games")
      .update({ current_revision_id: revId })
      .eq("id", gameId);

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

    const { data: dir, error: e1 } = await supabase
      .from("profile_directory")
      .select("id,handle")
      .eq("handle", h)
      .single();

    if (e1) {
      setErr("Handle not found.");
      return;
    }

    const { error: e2 } = await supabase
      .from("game_shares")
      .insert({ game_id: gameId, shared_with_user_id: dir.id });

    if (e2) {
      setErr(e2.message);
      return;
    }

    setShareMsg(`Shared with @${h}`);
    setShareHandle("");
  }

  return (
    <AuthGate>
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{game?.title ?? "Game"}</h1>
          <button className="rounded border px-3 py-1 text-sm" onClick={() => (window.location.href = "/games")}>
            Back
          </button>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="grid gap-2">
          <div className="text-sm opacity-80">
            Current: {current ? `v${current.version_number} — ${current.message}` : "—"}
            {!isOwner && <span className="ml-2">(read-only)</span>}
          </div>

          <div className="flex gap-2">
            <button className="rounded border px-3 py-1 text-sm" type="button" onClick={() => setPreview(code)}>
              Run
            </button>
            {isOwner && (
              <button className="rounded bg-black text-white px-3 py-1 text-sm" type="button" onClick={saveRevision}>
                Save New Revision
              </button>
            )}
          </div>

          {isOwner && (
            <>
              <input className="border rounded px-3 py-2" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Revision message" />
              <textarea className="border rounded px-3 py-2 font-mono text-xs h-48" value={code} onChange={(e) => setCode(e.target.value)} />
            </>
          )}
        </div>

        <SandboxPlayer html={preview} />

        <section className="space-y-2">
          <h2 className="font-medium">Revisions</h2>
          {revs.length === 0 ? (
            <div className="text-sm opacity-70">No revisions.</div>
          ) : (
            <ul className="space-y-1">
              {revs.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2">
                  <div className="text-sm">
                    <b>v{r.version_number}</b> — {r.message}
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded border px-3 py-1 text-sm" type="button" onClick={() => setPreview(r.code_html)}>
                      Play
                    </button>
                    {isOwner && (
                      <button className="rounded border px-3 py-1 text-sm" type="button" onClick={() => restoreRevision(r.id)}>
                        Restore
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {isOwner && (
          <section className="space-y-2">
            <h2 className="font-medium">Share</h2>
            <div className="flex gap-2">
              <input
                className="border rounded px-3 py-2"
                placeholder="friend handle (exact, e.g. cool_coder)"
                value={shareHandle}
                onChange={(e) => setShareHandle(e.target.value)}
              />
              <button className="rounded border px-3 py-1 text-sm" type="button" onClick={share}>
                Share
              </button>
            </div>
            {shareMsg && <div className="text-sm opacity-80">{shareMsg}</div>}
            <div className="text-xs opacity-70">
              MVP note: This shares by handle. We’ll tighten to “friends-only share” at the policy layer next.
            </div>
          </section>
        )}
      </div>
    </AuthGate>
  );
}
