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
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);

    if (!email || !password) {
      setErr("Email and password required.");
      return;
    }

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setErr(error.message);
      router.replace("/games");
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return setErr(error.message);

    // If email confirmations are enabled, session may be null until confirmed.
    if (!data.session) {
      setInfo("Account created. Check your email to confirm, then log in.");
      return;
    }

    router.replace("/games");
  }

  return (
    <div className="gradient-bg dot-texture min-h-screen flex items-center justify-center p-6">
      <div className="bg-surface rounded-3xl shadow-2xl p-8 max-w-md w-full space-y-6">
        <h1 className="text-3xl font-black text-ink text-center">Vibe Code Labs</h1>

        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <label className="text-base font-semibold text-ink">Email</label>
            <input
              className="w-full border-4 border-gray-200 rounded-xl px-4 py-3 text-base font-medium shadow-inner focus-ring"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-base font-semibold text-ink">Password</label>
            <input
              className="w-full border-4 border-gray-200 rounded-xl px-4 py-3 text-base font-medium shadow-inner focus-ring"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {err && <div className="text-sm text-red-600 font-medium">{err}</div>}
          {info && <div className="text-sm text-ink opacity-80 font-medium">{info}</div>}

          <button className="w-full bg-sunshine text-ink font-black rounded-2xl min-h-[52px] shadow-xl hover:opacity-90 focus-ring" type="submit">
            {mode === "login" ? "Log in" : "Sign up"}
          </button>

          <button
            className="w-full border-2 border-ink/10 bg-white text-ink font-semibold rounded-2xl min-h-[52px] focus-ring"
            type="button"
            onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
          >
            Switch to {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
