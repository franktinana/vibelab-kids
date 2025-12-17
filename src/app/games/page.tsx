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
      <div className="gradient-bg dot-texture min-h-screen p-6">
        <div className="bg-surface rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black text-ink">Games</h1>
            <div className="flex gap-3">
              <Link className="border-2 border-ink/10 bg-white text-ink font-semibold rounded-2xl px-4 py-2 min-h-[52px] flex items-center focus-ring" href="/friends">Friends</Link>
              <button className="border-2 border-ink/10 bg-white text-ink font-semibold rounded-2xl px-4 py-2 min-h-[52px] focus-ring" onClick={logout}>Logout</button>
            </div>
          </div>

          {err && <div className="text-base text-red-600 font-medium">{err}</div>}

          <div className="flex gap-4">
            <Link className="bg-sunshine text-ink font-black rounded-2xl px-6 py-3 min-h-[52px] shadow-xl hover:opacity-90 flex items-center focus-ring" href="/games/new">New Game</Link>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-ink">My Games</h2>
            {mine.length === 0 ? (
              <div className="text-base text-ink opacity-70">No games yet.</div>
            ) : (
              <ul className="space-y-2">
                {mine.map((g) => (
                  <li key={g.id}>
                    <Link className="text-ink underline text-base font-medium hover:text-purple" href={`/games/${g.id}`}>{g.title}</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-ink">Shared With Me</h2>
            {shared.length === 0 ? (
              <div className="text-base text-ink opacity-70">Nothing shared with you yet.</div>
            ) : (
              <ul className="space-y-2">
                {shared.map((g) => (
                  <li key={g.id}>
                    <Link className="text-ink underline text-base font-medium hover:text-purple" href={`/games/${g.id}`}>{g.title}</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AuthGate>
  );
}
