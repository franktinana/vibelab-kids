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
    <div className="p-6 max-w-md mx-auto space-y-3">
      <h1 className="text-xl font-semibold">Pick a handle</h1>
      <p className="text-sm opacity-80">
        Friends add you by your handle. Example: <b>cool_coder</b>
      </p>

      <input
        className="w-full border rounded px-3 py-2"
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        placeholder="cool_coder"
        disabled={loading || saving}
      />

      {err && <div className="text-sm text-red-600">{err}</div>}

      <button
        className="w-full rounded bg-black text-white py-2 text-sm disabled:opacity-50"
        onClick={save}
        disabled={loading || saving}
      >
        {saving ? "Saving..." : "Save handle"}
      </button>
    </div>
  );
}
