"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import { DeviceFrame, DeviceType } from "@/interfaces/components/DeviceFrame";

const DEFAULT_CODE = '<!doctype html><html><head><style>body{margin:0;background:#000;}</style></head><body><canvas id="c"></canvas><script>const c=document.getElementById("c");c.width=600;c.height=400;const x=c.getContext("2d");x.fillStyle="#0f0";x.fillRect(10,10,50,50);</script></body></html>';

const GAME_SANDBOX = "allow-scripts allow-same-origin allow-pointer-lock";

export default function NewGamePage() {
  const [title, setTitle] = useState("Untitled Game");
  const [version, setVersion] = useState("v1");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [preview, setPreview] = useState("");
  const [device, setDevice] = useState<DeviceType>("1080p");
  const [mode, setMode] = useState<"preview" | "code">("preview");
  const [isFocused, setIsFocused] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const router = useRouter();

  useEffect(() => {
    setPreview(code);
  }, []);

  useEffect(() => {
    if (mode === "preview" && iframeRef.current) {
      iframeRef.current.focus();
    }
  }, [mode, preview]);

  function runCode() {
    setPreview(code);
    setMode("preview");
    setTimeout(() => {
      iframeRef.current?.focus();
    }, 100);
  }

  async function saveGame() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Not logged in");
    const { data: game, error: gameError } = await supabase
      .from("games")
      .insert({ title, owner_id: user.id })
      .select()
      .single();
    if (gameError || !game) return alert("Error creating game");
    const { error: revError } = await supabase
      .from("game_revisions")
      .insert({ game_id: game.id, version_label: version, code });
    if (revError) return alert("Error saving revision");
    router.push("/games/" + game.id);
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-gradient-to-br from-cyan-500 to-purple-600 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center mb-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold bg-transparent text-white border-b-2 border-white/30 focus:border-white focus:outline-none px-1"
          />
          <div className="flex items-center gap-3">
            <div className="flex bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setMode("preview")}
                className={mode === "preview" ? "px-4 py-2 rounded-md bg-white text-ink" : "px-4 py-2 rounded-md text-white hover:bg-white/10"}
              >
                🎮 Play
              </button>
              <button
                onClick={() => setMode("code")}
                className={mode === "code" ? "px-4 py-2 rounded-md bg-white text-ink" : "px-4 py-2 rounded-md text-white hover:bg-white/10"}
              >
                💻 Code
              </button>
            </div>
            <button onClick={() => router.push("/games")} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg border border-white/30">
              Back
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {mode === "preview" ? (
            <div className="flex flex-col items-center">
              <div className="flex gap-2 mb-4">
                {(["mobile", "720p", "1080p", "1440p"] as DeviceType[]).map((d) => (
                  <button key={d} onClick={() => setDevice(d)} className={device === d ? "px-4 py-2 rounded-lg bg-white text-ink" : "px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30"}>
                    {d === "mobile" ? "📱 Mobile" : d === "720p" ? "💻 720p" : d === "1080p" ? "🖥️ 1080p" : "🖥️ 1440p"}
                  </button>
                ))}
              </div>
              <div className={isFocused ? "mb-2 px-4 py-1 rounded-full text-sm font-medium bg-mint text-white" : "mb-2 px-4 py-1 rounded-full text-sm font-medium bg-white/20 text-white/70"}>
                {isFocused ? "🎮 Game Active - Use WASD/Arrows!" : "Click game for controls"}
              </div>
              <div className={isFocused ? "ring-4 ring-mint rounded-2xl" : ""} onMouseEnter={() => iframeRef.current?.focus()}>
                <DeviceFrame device={device}>
                  <iframe ref={iframeRef} srcDoc={preview} sandbox={GAME_SANDBOX} className="w-full h-full border-0" title="Game" tabIndex={0} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
                </DeviceFrame>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={runCode} className="px-6 py-2 bg-mint hover:bg-green-600 text-white font-semibold rounded-lg">🔄 Refresh</button>
                <button onClick={() => iframeRef.current?.focus()} className={isFocused ? "px-6 py-2 rounded-lg font-semibold bg-mint text-white" : "px-6 py-2 rounded-lg font-semibold bg-white/20 text-white hover:bg-white/30"}>
                  {isFocused ? "🎮 Focused!" : "🎮 Focus Game"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-white/70 text-sm">Version:</label>
                  <input value={version} onChange={(e) => setVersion(e.target.value)} className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white w-24" />
                </div>
                <button onClick={runCode} className="px-6 py-2 bg-mint hover:bg-green-600 text-white font-semibold rounded-lg">▶️ Run</button>
                <button onClick={saveGame} className="px-6 py-2 bg-sunshine hover:bg-yellow-500 text-ink font-semibold rounded-lg">💾 Save</button>
              </div>
              <textarea value={code} onChange={(e) => setCode(e.target.value)} className="w-full h-[60vh] p-4 bg-ink text-green-400 font-mono text-sm rounded-lg" spellCheck={false} />
            </div>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
