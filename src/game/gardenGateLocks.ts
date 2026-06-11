export type GateLockKind = "red-circle" | "blue-star" | "yellow-square";

export interface GateToken {
  id: GateLockKind;
  color: number;
  shadow: number;
  shape: "circle" | "star" | "square";
}

export interface GateLock {
  id: GateLockKind;
  color: number;
  shape: "circle" | "star" | "square";
  visitor: "kitten" | "puppy" | "butterfly";
}

export const GARDEN_GATE_LOCKS: GateLock[] = [
  { id: "red-circle", color: 0xef5b4f, shape: "circle", visitor: "kitten" },
  { id: "blue-star", color: 0x3f8fe5, shape: "star", visitor: "puppy" },
  { id: "yellow-square", color: 0xf0c847, shape: "square", visitor: "butterfly" },
];

export const GARDEN_GATE_TOKENS: GateToken[] = GARDEN_GATE_LOCKS.map((lock) => ({
  id: lock.id,
  color: lock.color,
  shadow: lock.id === "red-circle" ? 0xa93c38 : lock.id === "blue-star" ? 0x2864a8 : 0xa97822,
  shape: lock.shape,
}));

export function createGardenGateLocks(): GateLock[] {
  return GARDEN_GATE_LOCKS.map((lock) => ({ ...lock }));
}

export function createGardenGateTokens(): GateToken[] {
  return GARDEN_GATE_TOKENS.map((token) => ({ ...token }));
}

export function isCorrectGardenGateToken(token: GateToken, gate: GateLock): boolean {
  return token.id === gate.id;
}

export function isGardenGateComplete(openedCount: number, totalCount: number): boolean {
  return totalCount > 0 && openedCount >= totalCount;
}
