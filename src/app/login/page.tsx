"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
    const [err, setErr] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    async function submit(e: React.FormEvent) {
          e.preventDefault();
          setErr(null);
          setInfo(null);

          // Password reset mode - only needs email
          if (mode === "reset") {
                  if (!email) {
                            setErr("Email is required.");
                            return;
                  }
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                            redirectTo: `${window.location.origin}/login`,
                  });
                  if (error) return setErr(error.message);
                  setInfo("Check your email for the password reset link.");
                  return;
          }

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
                        <h1 className="text-3xl font-black text-ink text-center">Vibe Code Labs</h1>h1>
                
                        <form className="space-y-4" onSubmit={submit}>
                                  <div className="space-y-2">
                                              <label className="text-base font-semibold text-ink">Email</label>label>
                                              <input
                                                              className="w-full border-4 border-gray-200 rounded-xl px-4 py-3 text-base font-medium shadow-inner focus-ring"
                                                              type="email"
                                                              value={email}
                                                              onChange={(e) => setEmail(e.target.value)}
                                                            />
                                  </div>div>
                        
                          {mode !== "reset" && (
                        <div className="space-y-2">
                                      <label className="text-base font-semibold text-ink">Password</label>label>
                                      <input
                                                        className="w-full border-4 border-gray-200 rounded-xl px-4 py-3 text-base font-medium shadow-inner focus-ring"
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                      />
                        </div>div>
                                  )}
                        
                          {err && <div className="text-sm text-red-600 font-medium">{err}</div>div>}
                          {info && <div className="text-sm text-ink opacity-80 font-medium">{info}</div>div>}
                        
                                  <button className="w-full bg-sunshine text-ink font-black rounded-2xl min-h-[52px] shadow-xl hover:opacity-90 focus-ring" type="submit">
                                    {mode === "login" ? "Log in" : mode === "signup" ? "Sign up" : "Send Reset Link"}
                                  </button>button>
                        
                          {mode === "login" && (
                        <button
                                        className="w-full text-ink/60 text-sm font-medium hover:text-ink transition-colors"
                                        type="button"
                                        onClick={() => { setMode("reset"); setErr(null); setInfo(null); }}
                                      >
                                      Forgot your password?
                        </button>button>
                                  )}
                        
                                  <button
                                                className="w-full border-2 border-ink/10 bg-white text-ink font-semibold rounded-2xl min-h-[52px] focus-ring"
                                                type="button"
                                                onClick={() => {
                                                                if (mode === "reset") {
                                                                                  setMode("login");
                                                                } else {
                                                                                  setMode((m) => (m === "login" ? "signup" : "login"));
                                                                }
                                                                setErr(null);
                                                                setInfo(null);
                                                }}
                                              >
                                    {mode === "reset" ? "Back to Log in" : `Switch to ${mode === "login" ? "Sign up" : "Log in"}`}
                                  </button>button>
                        </form>form>
                </div>div>
          </div>div>
        );
}</div>
