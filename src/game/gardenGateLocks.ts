export type GateLockKind = "red-circle" | "blue-star" | "yellow-square";
export type GateCueMode = "color" | "shape";

export interface GardenGateCueAssets {
  color: string;
  shape: string;
}

export interface GateToken {
  id: GateLockKind;
  color: number;
  shadow: number;
  shape: "circle" | "star" | "square";
  assetKeys: GardenGateCueAssets;
}

export interface GateLock {
  id: GateLockKind;
  color: number;
  shape: "circle" | "star" | "square";
  visitor: "kitten" | "puppy" | "butterfly";
  lockAssetKeys: GardenGateCueAssets;
  revealAssetKey: string;
  visitorAssetKey: string;
}

export const GARDEN_GATE_LOCKS: GateLock[] = [
  {
    id: "red-circle",
    color: 0xef5b4f,
    shape: "circle",
    visitor: "kitten",
    lockAssetKeys: {
      color: "garden-gate-lock-red-color",
      shape: "garden-gate-lock-red-shape",
    },
    revealAssetKey: "garden-gate-reveal-kitten",
    visitorAssetKey: "garden-gate-visitor-kitten",
  },
  {
    id: "blue-star",
    color: 0x3f8fe5,
    shape: "star",
    visitor: "puppy",
    lockAssetKeys: {
      color: "garden-gate-lock-blue-color",
      shape: "garden-gate-lock-blue-shape",
    },
    revealAssetKey: "garden-gate-reveal-puppy",
    visitorAssetKey: "garden-gate-visitor-puppy",
  },
  {
    id: "yellow-square",
    color: 0xf0c847,
    shape: "square",
    visitor: "butterfly",
    lockAssetKeys: {
      color: "garden-gate-lock-yellow-color",
      shape: "garden-gate-lock-yellow-shape",
    },
    revealAssetKey: "garden-gate-reveal-butterfly",
    visitorAssetKey: "garden-gate-visitor-butterfly",
  },
];

export const GARDEN_GATE_TOKENS: GateToken[] = GARDEN_GATE_LOCKS.map((lock) => ({
  id: lock.id,
  color: lock.color,
  shadow: lock.id === "red-circle" ? 0xa93c38 : lock.id === "blue-star" ? 0x2864a8 : 0xa97822,
  shape: lock.shape,
  assetKeys:
    lock.id === "red-circle"
      ? {
          color: "garden-gate-token-red-color",
          shape: "garden-gate-token-red-shape",
        }
      : lock.id === "blue-star"
        ? {
            color: "garden-gate-token-blue-color",
            shape: "garden-gate-token-blue-shape",
          }
        : {
            color: "garden-gate-token-yellow-color",
            shape: "garden-gate-token-yellow-shape",
          },
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
