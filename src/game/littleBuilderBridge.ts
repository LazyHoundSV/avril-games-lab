export type BridgeBlockKind = "left-plank" | "arch-cap" | "center-plank" | "right-plank";

export interface BridgeBlock {
  id: BridgeBlockKind;
  color: number;
  shadow: number;
}

export interface BridgeTarget {
  id: BridgeBlockKind;
}

export const BRIDGE_BLOCKS: BridgeBlock[] = [
  { id: "left-plank", color: 0xf25757, shadow: 0xbb3939 },
  { id: "arch-cap", color: 0xf4c84f, shadow: 0xc89524 },
  { id: "center-plank", color: 0x4f9ded, shadow: 0x2d6fb6 },
  { id: "right-plank", color: 0x62be5a, shadow: 0x3f8840 },
];

export function createBridgeBlocks(): BridgeBlock[] {
  return BRIDGE_BLOCKS.map((block) => ({ ...block }));
}

export function isCorrectBridgeTarget(block: BridgeBlock, target: BridgeTarget): boolean {
  return block.id === target.id;
}

export function isBridgeComplete(placedCount: number, totalCount: number): boolean {
  return totalCount > 0 && placedCount >= totalCount;
}
