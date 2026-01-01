"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { DeviceFrame } from "@/interfaces/components/DeviceFrame";
import { supabase } from "@/lib/supabase";

type DeviceType = "mobile" | "tablet" | "desktop";
type ViewMode = "preview" | "code";

type Game = {
  id: string;
  title: string;
  owner_id: string;
  current_revision_id: string | null;
};

type Rev = {
  id: string;
  game_id: string;
  version_label: string;
  code: string;
  created_at: string;
};

export default function GameClient({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<Game | null>(null);
  const [revisions, setRevisions] = useState<Rev[]>([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [versionLabel, setVersionLabel] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [device, setDevice] = useState<DeviceType>("mobile");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [showRevisions, setShowRevisions] = useState(false);
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: gameData } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (gameData) {
        setGame(gameData);
        setIsOwner(user?.id === gameData.owner_id);

        const { data: revData } = await supabase
          .from("game_revisions")
          .select("*")
          .eq("game_id", gameId)
          .order("created_at", { ascending: false });

        if (revData && revData.length > 0) {
          setRevisions(revData);
          const currentRev = gameData.current_revision_id
            ? revData.find((r: Rev) => r.id === gameData.current_revision_id)
            : revData[0];
          if (currentRev) {
            setSelectedRevisionId(currentRev.id);
            setCode(currentRev.code);
            setVersionLabel(currentRev.version_label);
          }
        }
      }
    }
    load();
  }, [gameId]);

  const selectedRevision = useMemo(
    () => revisions.find((r) => r.id === selectedRevisionId),
    [revisions, selectedRevisionId]
  );

  const handleRevisionChange = (revId: string) => {
    const rev = revisions.find((r) => r.id === revId);
    if (rev) {
      setSelectedRevisionId(revId);
      setCode(rev.code);
      setVersionLabel(rev.version_label);
    }
  };

  const handleSave = async () => {
    if (!game) return;
    const { data: newRev } = await supabase
      .from("game_revisions")
      .insert({ game_id: game.id, code, version_label: versionLabel })
      .select()
      .single();
    if (newRev) {
      await supabase
        .from("games")
        .update({ current_revision_id: newRev.id })
        .eq("id", game.id);
      setRevisions([newRev, ...revisions]);
      setSelectedRevisionId(newRev.id);
    }
  };

  const handleShare = async () => {
    if (!game || !shareEmail) return;
    const { data: userToShare } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", shareEmail)
      .single();
    if (userToShare) {
      await supabase
        .from("game_shares")
        .insert({ game_id: game.id, shared_with_user_id: userToShare.id });
      setShareEmail("");
      alert("Shared successfully!");
    } else {
      alert("User not found");
    }
  };

  const handleRun = () => {
    setRunKey((k) => k + 1);
  };

  if (!game) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-gradient-to-br from-cyan-500 to-blue-600">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-white">{game.title}</h1>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="bg-white/20 rounded-lg p-1 flex">
              <button
                onClick={() => setViewMode("preview")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === "preview"
                    ? "bg-white text-blue-600 shadow"
                    : "text-white hover:bg-white/10"
                }`}
              >
                🎮 Play
              </button>
              <button
                onClick={() => setViewMode("code")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === "code"
                    ? "bg-white text-blue-600 shadow"
                    : "text-white hover:bg-white/10"
                }`}
              >
                💻 Code
              </button>
            </div>
            <a
              href="/games"
              className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
            >
              Back
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 pb-4">
          {viewMode === "preview" ? (
            /* Preview Mode - Full screen game */
            <div className="bg-surface rounded-2xl shadow-xl p-6">
              {/* Device Selector */}
              <div className="flex justify-center gap-2 mb-4">
                {(["mobile", "tablet", "desktop"] as DeviceType[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDevice(d)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      device === d
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {d === "mobile" ? "📱" : d === "tablet" ? "📱" : "🖥️"} {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
              
              {/* Game Preview - Centered and Large */}
              <div className="flex justify-center items-center min-h-[500px]">
                <DeviceFrame device={device}>
                  <iframe
                    key={runKey}
                    srcDoc={code}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts"
                    title="Game Preview"
                  />
                </DeviceFrame>
              </div>

              {/* Quick Run Button in Preview Mode */}
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleRun}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition font-medium"
                >
                  🔄 Refresh Game
                </button>
              </div>
            </div>
          ) : (
            /* Code Mode - Full screen editor */
            <div className="bg-surface rounded-2xl shadow-xl p-6">
              <div className="mb-4">
                <input
                  type="text"
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                  placeholder="Version label (e.g., v1, v2)"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-400 focus:outline-none"
                />
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-[500px] p-4 font-mono text-sm bg-gray-900 text-green-400 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Paste your HTML/JS game code here..."
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleRun}
                  className="flex-1 bg-gray-100 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  ▶️ Run
                </button>
                {isOwner && (
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-sunshine text-ink font-black rounded-lg px-6 py-3 shadow-lg hover:opacity-90 transition"
                  >
                    💾 Save
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Revisions Accordion */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowRevisions(!showRevisions)}
            className="w-full bg-surface rounded-2xl shadow-xl p-4 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <span className="text-lg font-bold text-ink">
              Revisions ({revisions.length})
            </span>
            <span className="text-2xl">{showRevisions ? "▲" : "▼"}</span>
          </button>
          {showRevisions && revisions.length > 0 && (
            <div className="bg-surface rounded-b-2xl shadow-xl px-4 pb-4 -mt-2 pt-2 border-t border-gray-100">
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {revisions.map((rev) => (
                  <button
                    key={rev.id}
                    onClick={() => handleRevisionChange(rev.id)}
                    className={`p-3 rounded-lg text-left transition ${
                      selectedRevisionId === rev.id
                        ? "bg-blue-100 border-2 border-blue-400"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-medium">{rev.version_label}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(rev.created_at).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Share with Friends (Owner Only) */}
        {isOwner && (
          <div className="px-4 pb-4">
            <div className="bg-surface rounded-2xl shadow-xl p-4">
              <h2 className="text-lg font-bold text-ink mb-3">Share with Friends</h2>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Friend's email"
                  className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
                <button
                  onClick={handleShare}
                  className="bg-sunshine text-ink font-black rounded-xl px-6 py-2 shadow-lg hover:opacity-90 transition"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGate>
  );
}
