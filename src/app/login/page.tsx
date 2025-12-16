"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!email || !password) {
      setErr("Email and password required.");
      return;
    }

    const fn =
      mode === "login"
        ? supabase.auth.signInWithPassword
        : supabase.auth.signUp;

    const { error } =
      mode === "login"
        ? await fn({ email, password } as any)
        : await fn({ email, password });

    if (error) {
      setErr(error.message);
      return;
    }

    router.replace("/games");
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Vibe Labs Kids</h1>

      <form className="space-y-3" onSubmit={submit}>
        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input className="w-full border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input className="w-full border rounded px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <button className="w-full rounded bg-black text-white py-2 text-sm" type="submit">
          {mode === "login" ? "Log in" : "Sign up"}
        </button>

        <button
          className="w-full rounded border py-2 text-sm"
          type="button"
          onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
        >
          Switch to {mode === "login" ? "Sign up" : "Log in"}
        </button>
      </form>
    </div>
  );
}
