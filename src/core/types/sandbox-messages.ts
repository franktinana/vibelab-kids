/**
 * VibeLab Kids - Sandbox Message Types
 * Defines the message passing protocol between parent window and game iframe
 */

// Message types from game iframe to parent
export type GameToParentMessageType = 
  | 'GAME_STATE'      // Game wants to save its state
  | 'GAME_ERROR'      // Game encountered an error
  | 'GAME_READY'      // Game has finished initializing
  | 'GAME_SCORE'      // Game score update
  | 'GAME_COMPLETE';  // Game level completed

// Message types from parent to game iframe
export type ParentToGameMessageType =
  | 'LOAD_STATE'      // Parent wants game to load saved state
  | 'RESET_GAME'      // Parent wants game to reset
  | 'PAUSE_GAME'      // Parent wants game to pause
  | 'RESUME_GAME';    // Parent wants game to resume

// Base message structure
interface BaseMessage<T extends string> {
  type: T;
  timestamp: number;
}

// Game to Parent Messages
export interface GameStateMessage extends BaseMessage<'GAME_STATE'> {
  state: string; // JSON stringified game state
}

export interface GameErrorMessage extends BaseMessage<'GAME_ERROR'> {
  error: string;
  stack?: string;
}

export interface GameReadyMessage extends BaseMessage<'GAME_READY'> {
  version?: string;
}

export interface GameScoreMessage extends BaseMessage<'GAME_SCORE'> {
  score: number;
  level?: number;
}

export interface GameCompleteMessage extends BaseMessage<'GAME_COMPLETE'> {
  score: number;
  time?: number;
}

// Parent to Game Messages
export interface LoadStateMessage extends BaseMessage<'LOAD_STATE'> {
  state: string; // JSON stringified game state to load
}

export interface ResetGameMessage extends BaseMessage<'RESET_GAME'> {}

export interface PauseGameMessage extends BaseMessage<'PAUSE_GAME'> {}

export interface ResumeGameMessage extends BaseMessage<'RESUME_GAME'> {}

// Union types for message handling
export type GameToParentMessage = 
  | GameStateMessage 
  | GameErrorMessage 
  | GameReadyMessage
  | GameScoreMessage
  | GameCompleteMessage;

export type ParentToGameMessage = 
  | LoadStateMessage 
  | ResetGameMessage
  | PauseGameMessage
  | ResumeGameMessage;

// Type guards
export const isGameToParentMessage = (msg: unknown): msg is GameToParentMessage => {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as { type?: string };
  return ['GAME_STATE', 'GAME_ERROR', 'GAME_READY', 'GAME_SCORE', 'GAME_COMPLETE'].includes(m.type || '');
};

export const isParentToGameMessage = (msg: unknown): msg is ParentToGameMessage => {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as { type?: string };
  return ['LOAD_STATE', 'RESET_GAME', 'PAUSE_GAME', 'RESUME_GAME'].includes(m.type || '');
};

// Helper to create messages with timestamp
export const createMessage = <T extends GameToParentMessage | ParentToGameMessage>(
  msg: Omit<T, 'timestamp'>
): T => ({
  ...msg,
  timestamp: Date.now(),
} as T);
