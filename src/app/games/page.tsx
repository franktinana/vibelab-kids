"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import { supabase } from "@/lib/supabase";

type GameRow = {
  id: string;
  title: string;
  owner_id: string;
  current_revision_id: string | null;
  updated_at: string;
};

export default function GamesPage() {
  const [me, setMe] = useState<string>("");
  const [rows, setRows] = useState<GameRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? "";
      setMe(uid);

      // Fetch my games
      const { data: myGames, error: e1 } = await supabase
        .from("games")
        .select("id,title,owner_id,current_revision_id,updated_at")
        .eq("owner_id", uid)
        .order("updated_at", { ascending: false });

      if (e1) {
        setErr(e1.message);
        return;
      }

      // Fetch shared games
      const { data: sharedGames, error: e2 } = await supabase
        .from("game_shares")
        .select(`
          games!inner(id,title,owner_id,current_revision_id,updated_at)
        `)
        .eq("shared_with_user_id", uid);

      if (e2) {
        setErr(e2.message);
        return;
      }

      const allGames = [
        ...(myGames ?? []),
        ...(sharedGames?.map(s => s.games).filter(Boolean) ?? [])
      ];

      setRows(allGames as any);
    })();
  }, []);

  const mine = useMemo(() => rows.filter((g) => g.owner_id === me), [rows, me]);
  const shared = useMemo(() => rows.filter((g) => g.owner_id !== me), [rows, me]);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <AuthGate>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Games</h1>
          <div className="flex gap-2">
            <Link className="rounded border px-3 py-1 text-sm" href="/friends">Friends</Link>
            <button className="rounded border px-3 py-1 text-sm" onClick={logout}>Logout</button>
          </div>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="flex gap-3">
          <Link className="rounded bg-black text-white px-4 py-2 text-sm" href="/games/new">New Game</Link>
        </div>

        <section className="space-y-2">
          <h2 className="font-medium">My Games</h2>
          {mine.length === 0 ? (
            <div className="text-sm opacity-70">No games yet.</div>
          ) : (
            <ul className="space-y-1">
              {mine.map((g) => (
                <li key={g.id}>
                  <Link className="underline" href={`/games/${g.id}`}>{g.title}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="font-medium">Shared With Me</h2>
          {shared.length === 0 ? (
            <div className="text-sm opacity-70">Nothing shared with you yet.</div>
          ) : (
            <ul className="space-y-1">
              {shared.map((g) => (
                <li key={g.id}>
                  <Link className="underline" href={`/games/${g.id}`}>{g.title}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AuthGate>
  );
}
