"use client";

import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { supabase } from "@/lib/supabase";

type DirRow = { id: string; handle: string; display_name: string };
type FriendRow = { id: string; requester_id: string; addressee_id: string; status: string };

export default function FriendsPage() {
  const [me, setMe] = useState<string>("");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<DirRow[]>([]);
  const [rels, setRels] = useState<FriendRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function loadRels(uid: string) {
    const { data, error } = await supabase
      .from("friendships")
      .select("id,requester_id,addressee_id,status")
      .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`);

    if (error) throw new Error(error.message);
    setRels((data ?? []) as any);
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? "";
      setMe(uid);
      if (uid) await loadRels(uid);
    })();
  }, []);

  async function search() {
    setErr(null);
    const term = q.trim().toLowerCase();
    if (!term) return;

    const { data, error } = await supabase
      .from("profile_directory")
      .select("id,handle,display_name")
      .ilike("handle", `%${term}%`)
      .limit(10);

    if (error) {
      setErr(error.message);
      return;
    }
    setResults((data ?? []) as any);
  }

  async function sendRequest(targetId: string) {
    setErr(null);
    const { error } = await supabase
      .from("friendships")
      .insert({ requester_id: me, addressee_id: targetId, status: "pending" });

    if (error) {
      setErr(error.message);
      return;
    }
    await loadRels(me);
  }

  async function accept(id: string) {
    setErr(null);
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", id);

    if (error) {
      setErr(error.message);
      return;
    }
    await loadRels(me);
  }

  const incoming = rels.filter((r) => r.addressee_id === me && r.status === "pending");
  const accepted = rels.filter((r) => r.status === "accepted");

  return (
    <AuthGate>
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Friends</h1>
          <button className="rounded border px-3 py-1 text-sm" onClick={() => (window.location.href = "/games")}>
            Back
          </button>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="flex gap-2">
          <input className="border rounded px-3 py-2 flex-1" placeholder="search handle" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="rounded border px-3 py-1 text-sm" onClick={search}>Search</button>
        </div>

        {results.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-medium">Results</h2>
            <ul className="space-y-1">
              {results
                .filter((r) => r.id !== me)
                .map((r) => (
                  <li key={r.id} className="flex items-center justify-between">
                    <div className="text-sm">@{r.handle}</div>
                    <button className="rounded border px-3 py-1 text-sm" onClick={() => sendRequest(r.id)}>
                      Add
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        )}

        <section className="space-y-2">
          <h2 className="font-medium">Incoming Requests</h2>
          {incoming.length === 0 ? (
            <div className="text-sm opacity-70">None.</div>
          ) : (
            <ul className="space-y-1">
              {incoming.map((r) => (
                <li key={r.id} className="flex items-center justify-between">
                  <div className="text-sm">Request</div>
                  <button className="rounded border px-3 py-1 text-sm" onClick={() => accept(r.id)}>
                    Accept
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="font-medium">Accepted</h2>
          {accepted.length === 0 ? (
            <div className="text-sm opacity-70">No friends yet.</div>
          ) : (
            <ul className="space-y-1">
              {accepted.map((r) => (
                <li key={r.id} className="text-sm opacity-80">
                  {r.requester_id === me ? `You ↔ ${r.addressee_id}` : `${r.requester_id} ↔ You`}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AuthGate>
  );
}
