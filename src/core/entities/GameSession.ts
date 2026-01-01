import { Player } from './Player';

export interface GameState {
  score: number;
  level: number;
  // Flexible state for AI generated games, but typed enough for sync
  playerPositions: Record<string, { x: number; y: number }>;
}

export interface GameSession {
  id: string;
  hostId: string;
  status: 'LOBBY' | 'PLAYING' | 'PAUSED' | 'FINISHED';
  players: Player[];
  state: GameState;
  // The actual code the kid is "Vibe Coding"
  codeSnippet: string;
  config: Record<string, unknown>;
}
