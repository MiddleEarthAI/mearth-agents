export interface Position {
  x: number;
  y: number;
}

export interface Agent {
  id: string;
  name: string;
  position: Position;
  tokens: number;
  alliances: string[];
  allianceCooldowns: { [agentId: string]: number };
  battleCooldowns: { [agentId: string]: number };
  isAlive: boolean;
}
