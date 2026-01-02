'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { 
  GameToParentMessage, 
  ParentToGameMessage,
  isGameToParentMessage,
  LoadStateMessage,
  ResetGameMessage,
  PauseGameMessage,
  ResumeGameMessage
} from '@/core/types/sandbox-messages';

interface UseGameMessagesOptions {
  onGameState?: (state: string) => void;
  onGameError?: (error: string, stack?: string) => void;
  onGameReady?: (version?: string) => void;
  onGameScore?: (score: number, level?: number) => void;
  onGameComplete?: (score: number, time?: number) => void;
}

interface UseGameMessagesReturn {
  sendMessage: (message: ParentToGameMessage) => void;
  loadState: (state: string) => void;
  resetGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  isReady: boolean;
  lastError: string | null;
}

export function useGameMessages(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  options: UseGameMessagesOptions = {}
): UseGameMessagesReturn {
  const [isReady, setIsReady] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const optionsRef = useRef(options);
  
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const sendMessage = useCallback((message: ParentToGameMessage) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    try {
      iframe.contentWindow.postMessage(message, '*');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  }, [iframeRef]);

  const loadState = useCallback((state: string) => {
    const msg: LoadStateMessage = { type: 'LOAD_STATE', state, timestamp: Date.now() };
    sendMessage(msg);
  }, [sendMessage]);

  const resetGame = useCallback(() => {
    const msg: ResetGameMessage = { type: 'RESET_GAME', timestamp: Date.now() };
    sendMessage(msg);
    setIsReady(false);
    setLastError(null);
  }, [sendMessage]);

  const pauseGame = useCallback(() => {
    const msg: PauseGameMessage = { type: 'PAUSE_GAME', timestamp: Date.now() };
    sendMessage(msg);
  }, [sendMessage]);

  const resumeGame = useCallback(() => {
    const msg: ResumeGameMessage = { type: 'RESUME_GAME', timestamp: Date.now() };
    sendMessage(msg);
  }, [sendMessage]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!isGameToParentMessage(data)) return;

      const message = data as GameToParentMessage;
      const opts = optionsRef.current;

      switch (message.type) {
        case 'GAME_STATE':
          opts.onGameState?.(message.state);
          break;
        case 'GAME_ERROR':
          setLastError(message.error);
          opts.onGameError?.(message.error, message.stack);
          break;
        case 'GAME_READY':
          setIsReady(true);
          setLastError(null);
          opts.onGameReady?.(message.version);
          break;
        case 'GAME_SCORE':
          opts.onGameScore?.(message.score, message.level);
          break;
        case 'GAME_COMPLETE':
          opts.onGameComplete?.(message.score, message.time);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return { sendMessage, loadState, resetGame, pauseGame, resumeGame, isReady, lastError };
}

export default useGameMessages;
