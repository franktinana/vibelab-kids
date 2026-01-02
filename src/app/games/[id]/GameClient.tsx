"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import AuthGate from "@/components/AuthGate";
import { DeviceFrame, DeviceType, Orientation } from "@/interfaces/components/DeviceFrame";
import { supabase } from "@/lib/supabase";
import { injectGameMessaging } from "@/lib/sandbox";
import { useGameMessages } from "@/interfaces/hooks/useGameMessages";
import GameErrorBoundary from "@/interfaces/components/GameErrorBoundary";

type ViewMode = "preview" | "code";

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

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

const deviceOptions: { value: DeviceType; label: string; icon: string }[] = [
  { value: "mobile", label: "Mobile", icon: "📱" },
  { value: "720p", label: "720p", icon: "💻" },
  { value: "1080p", label: "1080p", icon: "🖥️" },
  { value: "1440p", label: "1440p", icon: "🖥️" },
];

/**
 * Sandbox configuration for game iframes
 * 
 * Security considerations for a kids' game platform:
 * - allow-scripts: Required for games to run JavaScript
 * - allow-pointer-lock: Allows FPS/shooter games to capture mouse
 * - allow-same-origin: Required for keyboard events to work properly with srcDoc
 * 
 * Blocked (for security):
 * - allow-forms: Games shouldn't submit forms
 * - allow-popups: Prevents opening new windows/tabs
 * - allow-top-navigation: Prevents redirecting the parent page
 * - allow-downloads: Prevents file downloads
 * - allow-modals: Prevents alert/confirm/prompt dialogs
 * 
 * Note: allow-same-origin is safe here because we use srcDoc (inline HTML),
 * not an external URL. The iframe cannot access parent cookies/storage
 * because it has no actual origin - it's a data URL origin.
 */
const GAME_SANDBOX = "allow-scripts allow-same-origin allow-pointer-lock";

export default function GameClient({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<Game | null>(null);
  const [revisions, setRevisions] = useState<Rev[]>([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [versionLabel, setVersionLabel] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [device, setDevice] = useState<DeviceType>("1080p");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [showRevisions, setShowRevisions] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [isGameFocused, setIsGameFocused] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Game message handling for state save/load
  const { isReady: gameReady, lastError: gameError, resetGame } = useGameMessages(iframeRef, {
    onGameState: (state) => {
        const now = Date.now();
        const lastSave = parseInt(localStorage.getItem(`vibelab-last-save-${gameId}`) || '0');
        if (now - lastSave < 5000) return; // Skip if saved within 5 seconds
        
        setSaveStatus('saving');
        try {
          localStorage.setItem(`vibelab-last-save-${gameId}`, now.toString());
          localStorage.setItem(`vibelab-game-state-${gameId}`, JSON.stringify(state));
          setSaveStatus('saved');
          setLastSaveTime(new Date(now).toLocaleTimeString());
          setHasSavedGame(true);
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
          console.error('Failed to save game state:', err);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      },
    onGameError: (error, stack) => {
      console.error("Game error:", error, stack);
    },
    onGameReady: () => {
      console.log("Game is ready");
    },
  });


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

  // Focus iframe when switching to preview mode or when game refreshes
  useEffect(() => {
    if (viewMode === "preview" && iframeRef.current) {
      const timer = setTimeout(() => {
        focusGame();
      }, 300); // Longer delay to ensure iframe content is loaded
    
  // Check for saved game on component mount
  useEffect(() => {
    const savedState = localStorage.getItem(`vibelab-game-state-${gameId}`);
    const savedTime = localStorage.getItem(`vibelab-last-save-${gameId}`);
    if (savedState && savedTime) {
      setHasSavedGame(true);
      const date = new Date(parseInt(savedTime, 10));
      setLastSaveTime(date.toLocaleTimeString());
    }
  }, [gameId]);

  // Restore game from last save
  const restoreLastSave = () => {
    const savedState = localStorage.getItem(`vibelab-game-state-${gameId}`);
    if (savedState && iframeRef.current?.contentWindow) {
      try {
        const state = JSON.parse(savedState);
        iframeRef.current.contentWindow.postMessage({
          type: 'restore-state',
          state
        }, '*');
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Failed to restore game state:', err);
        setSaveStatus('error');
      }
    }
  };

  return () => clearTimeout(timer);
    }
  }, [viewMode, runKey]);

  // Track focus state
  useEffect(() => {
    const handleFocusIn = () => {
      if (document.activeElement === iframeRef.current) {
        setIsGameFocused(true);
      }
    };
    const handleFocusOut = (e: FocusEvent) => {
      if (e.target === iframeRef.current) {
        setIsGameFocused(false);
      }
    };
    
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

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

  const focusGame = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.focus();
      // Also try to focus the iframe's content window
      try {
        iframeRef.current.contentWindow?.focus();
      } catch (e) {
        // May fail due to cross-origin restrictions, but that's okay
      }
      setIsGameFocused(true);
    }
  }, []);

  if (!game) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-gradient-to-br from-cyan-500 to-purple-600">
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
            /* Preview Mode - Game focused, no card wrapper */
            <div className="flex flex-col items-center">
              {/* Device Selector */}
              <div className="flex justify-center gap-2 mb-4">
                {deviceOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDevice(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      device === opt.value
                        ? "bg-white text-blue-600 shadow"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    {opt.icon} {opt.label}
              {/* Orientation Toggle - Only for Mobile */}
              {device === "mobile" && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setOrientation("portrait")}
                    className={orientation === "portrait" ? "px-4 py-2 rounded-lg bg-white text-ink" : "px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30"}
                  >
                    📱 Portrait
                  </button>
                  <button
                    onClick={() => setOrientation("landscape")}
                    className={orientation === "landscape" ? "px-4 py-2 rounded-lg bg-white text-ink" : "px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30"}
                  >
                    📱 Landscape
                  </button>
                </div>
              )}
                  </button>
                ))}
              </div>
              
              {/* Focus Status Indicator */}
              <div className={`mb-2 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isGameFocused 
                  ? "bg-green-500 text-white" 
                  : "bg-yellow-500 text-black"
              }`}>
                {isGameFocused ? "🎮 Game Active - Use WASD/Arrows to play!" : "⚠️ Click game to enable controls"}
              </div>
              
              {/* Game Preview - Click to focus for keyboard controls */}
              <div 
                className={`relative cursor-pointer transition-all ${
                  isGameFocused ? "ring-4 ring-green-400 ring-opacity-50" : ""
                }`}
                onClick={focusGame}
              >
                <GameErrorBoundary>
                    <DeviceFrame device={device} orientation={orientation}>
                  <iframe
                    ref={iframeRef}
                    key={runKey}
                    srcDoc={injectGameMessaging(code)}
                    className="w-full h-full border-0"
                    sandbox={GAME_SANDBOX}
                    title="Game Preview"
                    tabIndex={0}
                    allow="autoplay"
                    onLoad={focusGame}
                  />
                </DeviceFrame>
                  </GameErrorBoundary>
              </div>

              {/* Controls */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleRun}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition font-medium"
                >
                  🔄 Refresh
                </button>
                <button
                  onClick={focusGame}
                  className={`px-6 py-2 rounded-lg transition font-medium ${
                    isGameFocused
                      ? "bg-green-500/20 text-green-200 border border-green-400"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  🎮 {isGameFocused ? "Focused!" : "Focus Game"}
                </button>
              </div>
              
              {/* Keyboard Controls Help */}
              <div className="mt-4 text-white/70 text-sm text-center">
                <p>🎹 <strong>Controls:</strong> WASD or Arrow Keys to move • Space to jump/action</p>
              </div>
            </div>
          ) : (
            /* Code Mode - Full screen editor */
            <div className="bg-surface rounded-2xl shadow-xl p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">Version Label</label>
                <input
                  type="text"
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                  placeholder="e.g., v1, v2, bug-fix"
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
                  onClick={() => { handleRun(); setViewMode("preview"); }}
                  className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition font-medium"
                >
                  ▶️ Run & Preview
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
            className="w-full bg-white/10 backdrop-blur rounded-2xl p-4 flex items-center justify-between hover:bg-white/20 transition text-white"
          >
            <span className="text-lg font-bold">
              📜 Revisions ({revisions.length})
            </span>
            <span className="text-2xl">{showRevisions ? "▲" : "▼"}</span>
          </button>
          {showRevisions && revisions.length > 0 && (
            <div className="bg-white/10 backdrop-blur rounded-b-2xl px-4 pb-4 -mt-2 pt-4">
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {revisions.map((rev) => (
                  <button
                    key={rev.id}
                    onClick={() => handleRevisionChange(rev.id)}
                    className={`p-3 rounded-lg text-left transition ${
                      selectedRevisionId === rev.id
                        ? "bg-white text-blue-600"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    <div className="font-medium">{rev.version_label}</div>
                    <div className="text-xs opacity-70">
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
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <h2 className="text-lg font-bold text-white mb-3">🤝 Share with Friends</h2>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Friend's email"
                  className="flex-1 bg-white/20 border-2 border-white/30 rounded-xl px-3 py-2 text-sm text-white placeholder-white/50 focus:border-white focus:outline-none"
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
