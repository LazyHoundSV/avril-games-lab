export type BridgeBlockKind = "stone-arch" | "wood-block" | "stone-block";
export type BridgeTargetKind = "left-stone" | "center-wood" | "right-stone";

export interface BridgeBlock {
  id: BridgeBlockKind;
  color: number;
  shadow: number;
  textureKey: string;
}

export interface BridgeTarget {
  id: BridgeTargetKind;
  accepts: BridgeBlockKind[];
}

export const BRIDGE_BLOCKS: BridgeBlock[] = [
  { id: "stone-arch", color: 0xa79da0, shadow: 0x6e676c, textureKey: "little-builder-bridge-stone-arch-block" },
  { id: "wood-block", color: 0xc8752d, shadow: 0x7c431c, textureKey: "little-builder-bridge-wood-block" },
  { id: "stone-block", color: 0x9c9297, shadow: 0x686169, textureKey: "little-builder-bridge-stone-block" },
];

export const BRIDGE_TARGETS: BridgeTarget[] = [
  { id: "left-stone", accepts: ["stone-arch", "stone-block"] },
  { id: "center-wood", accepts: ["wood-block"] },
  { id: "right-stone", accepts: ["stone-arch", "stone-block"] },
];

export function createBridgeBlocks(): BridgeBlock[] {
  return BRIDGE_BLOCKS.map((block) => ({ ...block }));
}

export function createBridgeTargets(): BridgeTarget[] {
  return BRIDGE_TARGETS.map((target) => ({ id: target.id, accepts: [...target.accepts] }));
}

export function isCorrectBridgeTarget(block: BridgeBlock, target: BridgeTarget): boolean {
  return target.accepts.includes(block.id);
}

export function isBridgeComplete(placedCount: number, totalCount: number): boolean {
  return totalCount > 0 && placedCount >= totalCount;
}
