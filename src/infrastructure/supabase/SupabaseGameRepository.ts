import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IGameRepository } from '../../core/repositories/IGameRepository';
import { GameSession } from '../../core/entities/GameSession';

export class SupabaseGameRepository implements IGameRepository {
  private client: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  async createSession(hostId: string): Promise<GameSession> {
    const newSession = {
      id: crypto.randomUUID(),
      host_id: hostId,
      status: 'LOBBY',
      players: [],
      state: {
        score: 0,
        level: 1,
        playerPositions: {},
      },
      code_snippet: '',
      config: {},
    };

    const { data, error } = await (this.client as any)
      .from('games')
      .insert(newSession)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return this.mapRowToGameSession(data);
  }

  async getSession(sessionId: string): Promise<GameSession | null> {
    const { data, error } = await (this.client as any)
      .from('games')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch session: ${error.message}`);
    }

    return this.mapRowToGameSession(data);
  }

  async updateGameState(
    sessionId: string,
    state: Partial<GameSession['state']>
  ): Promise<void> {
    const { error } = await (this.client as any)
      .from('games')
      .update({ state })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to update game state: ${error.message}`);
    }
  }

  async updateCodeSnippet(sessionId: string, code: string): Promise<void> {
    const { error } = await (this.client as any)
      .from('games')
      .update({ code_snippet: code })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to update code snippet: ${error.message}`);
    }
  }

  private mapRowToGameSession(row: any): GameSession {
    return {
      id: row.id,
      hostId: row.host_id,
      status: row.status,
      players: row.players || [],
      state: row.state,
      codeSnippet: row.code_snippet || '',
      config: row.config || {},
    };
  }
}
