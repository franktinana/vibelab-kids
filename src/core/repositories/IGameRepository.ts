import { GameSession } from '../entities/GameSession';

export interface IGameRepository {
  createSession(hostId: string): Promise<GameSession>;
  getSession(sessionId: string): Promise<GameSession | null>;
  updateGameState(sessionId: string, state: Partial<GameSession['state']>): Promise<void>;
  updateCodeSnippet(sessionId: string, code: string): Promise<void>;
}
