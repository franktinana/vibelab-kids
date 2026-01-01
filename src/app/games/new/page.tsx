"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import { DeviceFrame, DeviceType } from "@/interfaces/components/DeviceFrame";
import { supabase } from "@/lib/supabase";

const GAME_SANDBOX = "allow-scripts allow-same-origin allow-pointer-lock";

const deviceOptions: { value: DeviceType; label: string; icon: string }[] = [
  { value: "mobile", label: "Mobile", icon: "📱" },
  { value: "720p", label: "720p", icon: "💻" },
  { value: "1080p", label: "1080p", icon: "🖥️" },
];

export default function NewGamePage() {
  const router = useRouter();
  const [title, setTitle] = useState("Untitled Game");
  const [versionLabel, setVersionLabel] = useState("v1");
  const [code, setCode] = useState("");
  const [device, setDevice] = useState<DeviceType>("720p");
  const [runKey, setRunKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRun = () => {
    setRunKey((k) => k + 1);
    setTimeout(() => iframeRef.current?.focus(), 100);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    // Create new game
    const { data: newGame, error: gameError } = await supabase
      .from("games")
      .insert({ title, owner_id: user.id })
      .select()
      .single();

    if (gameError || !newGame) {
      alert("Error creating game");
      setSaving(false);
      return;
    }

    // Create first revision
    const { data: newRev, error: revError } = await supabase
      .from("game_revisions")
      .insert({
        game_id: newGame.id,
        code,
        version_label: versionLabel,
      })
      .select()
      .single();

    if (revError || !newRev) {
      alert("Error saving code");
      setSaving(false);
      return;
    }

    // Update game with current revision
    await supabase
      .from("games")
      .update({ current_revision_id: newRev.id })
      .eq("id", newGame.id);

    router.push(`/games/${newGame.id}`);
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-gradient-to-br from-cyan-500 to-purple-600">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-white">🎮 New Game</h1>
          <a
            href="/games"
            className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition"
          >
            ← Back
          </a>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="px-4 pb-8">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Code Editor */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">💻 Code Editor</h2>
              
              {/* Game Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-1">Game Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Awesome Game"
                  className="w-full bg-white/20 border-2 border-white/30 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:border-white focus:outline-none"
                />
              </div>

              {/* Version Label */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-1">Version Label</label>
                <input
                  type="text"
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                  placeholder="v1"
                  className="w-full bg-white/20 border-2 border-white/30 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:border-white focus:outline-none"
                />
              </div>

              {/* Code Textarea */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-[350px] p-4 font-mono text-sm bg-gray-900 text-green-400 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="Paste your HTML/JS game code here..."
              />

              {/* Buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleRun}
                  className="flex-1 bg-mint text-white px-6 py-3 rounded-xl hover:opacity-90 transition font-medium"
                >
                  ▶️ Run Preview
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-sunshine text-ink font-bold rounded-xl px-6 py-3 hover:opacity-90 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "💾 Save Game"}
                </button>
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">👁️ Preview</h2>
              
              {/* Device Selector */}
              <div className="flex justify-center gap-2 mb-4">
                {deviceOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDevice(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      device === opt.value
                        ? "bg-white text-purple-600 shadow"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>

              {/* Preview Area */}
              <div className="flex justify-center items-start overflow-auto py-4 min-h-[400px]">
                {code ? (
                  <DeviceFrame device={device}>
                    <iframe
                      ref={iframeRef}
                      key={runKey}
                      srcDoc={code}
                      className="w-full h-full border-0"
                      sandbox={GAME_SANDBOX}
                      title="Game Preview"
                      tabIndex={0}
                    />
                  </DeviceFrame>
                ) : (
                  <div className="text-white/50 text-center py-20">
                    <div className="text-6xl mb-4">🎮</div>
                    <p>Paste your game code and click "Run Preview"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center text-white/60 text-sm">
            <p>💡 Tip: Use Gemini AI Canvas to create HTML5 games, then paste the code here to test and save!</p>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
