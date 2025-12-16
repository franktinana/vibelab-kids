"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setMe(data.user?.id ?? null);

      if (data.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("handle")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profile?.handle) {
          router.replace("/games");
        }
      }
    })();
  }, [router]);

  async function save() {
    setErr(null);

    const normalized = handle.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
      setErr("Handle must be 3–20 chars: a-z, 0-9, underscore.");
      return;
    }
    if (!me) {
      setErr("Not logged in.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ handle: normalized })
      .eq("id", me);

    if (error) {
      setErr(error.message);
      return;
    }

    router.replace("/games");
  }

  return (
    <AuthGate requireHandle={false}>
      <div className="p-6 max-w-md mx-auto space-y-4">
        <h1 className="text-xl font-semibold">Pick a handle</h1>
        <p className="text-sm opacity-80">Friends add you by your handle. Example: <b>cool_coder</b></p>

        <input
          className="w-full border rounded px-3 py-2"
          placeholder="handle (a-z, 0-9, _)"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />

        {err && <div className="text-sm text-red-600">{err}</div>}

        <button className="rounded bg-black text-white px-4 py-2 text-sm" onClick={save}>
          Save handle
        </button>
      </div>
    </AuthGate>
  );
}
