export interface PlayerProfile {
  id: string;
  username: string;
  avatarUrl?: string;
}

export interface Player extends PlayerProfile {
  peerId: string; // For multiplayer signalling
  isHost: boolean;
  isConnected: boolean;
}
