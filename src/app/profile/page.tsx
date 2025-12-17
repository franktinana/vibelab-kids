"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        setErr(userErr.message);
        setLoading(false);
        return;
      }

      const user = userData.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      // Fetch current handle (may be empty if profile row missing)
      const { data, error } = await supabase
        .from("profiles")
        .select("handle")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setErr(error.message);
      } else if (data?.handle) {
        setHandle(data.handle);
      }

      setLoading(false);
    })();
  }, [router]);

  async function save() {
    setErr(null);

    const h = handle.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(h)) {
      setErr("Handle must be 3–20 characters: lowercase letters, numbers, underscore.");
      return;
    }

    setSaving(true);

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      setErr(userErr.message);
      setSaving(false);
      return;
    }

    const user = userData.user;
    if (!user) {
      router.replace("/login");
      return;
    }

    // Check if handle is already taken by another user
    const { data: existing, error: checkErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("handle", h)
      .neq("id", user.id)
      .maybeSingle();

    if (checkErr) {
      setErr(checkErr.message);
      setSaving(false);
      return;
    }

    if (existing) {
      setErr("Handle is already taken. Please choose another.");
      setSaving(false);
      return;
    }

    // Upsert profile so it works even if no row exists yet
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, handle: h }, { onConflict: "id" });

    if (error) {
      setErr(error.message);
      setSaving(false);
      return;
    }

    router.replace("/games");
  }

  return (
    <div className="gradient-bg dot-texture min-h-screen flex items-center justify-center p-6">
      <div className="bg-surface rounded-3xl shadow-2xl p-8 max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black text-ink">Pick a Handle</h1>
          <p className="text-base text-ink opacity-80 mt-2">
            Friends add you by your handle. Example: <b>cool_coder</b>
          </p>
        </div>

        <div className="space-y-4">
          <input
            className="w-full border-4 border-gray-200 rounded-xl px-4 py-3 text-base font-medium shadow-inner focus-ring"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="cool_coder"
            disabled={loading || saving}
          />

          {err && <div className="text-sm text-red-600 font-medium">{err}</div>}

          <button
            className="w-full bg-sunshine text-ink font-black rounded-2xl min-h-[52px] shadow-xl hover:opacity-90 focus-ring disabled:opacity-50"
            onClick={save}
            disabled={loading || saving}
          >
            {saving ? "Saving..." : "Save Handle"}
          </button>
        </div>
      </div>
    </div>
  );
}
