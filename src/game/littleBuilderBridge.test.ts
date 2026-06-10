import { describe, expect, it } from "vitest";
import { createBridgeBlocks, createBridgeTargets, isBridgeComplete, isCorrectBridgeTarget } from "./littleBuilderBridge";

describe("Little Builder Bridge rules", () => {
  it("uses three bridge blocks for the painted bridge artwork", () => {
    expect(createBridgeBlocks()).toHaveLength(3);
  });

  it("assigns local sprite textures to every bridge block", () => {
    expect(createBridgeBlocks().map((block) => block.textureKey)).toEqual([
      "little-builder-bridge-stone-arch-block",
      "little-builder-bridge-wood-block",
      "little-builder-bridge-stone-block",
    ]);
  });

  it("only places the wood block in the center bridge slot", () => {
    const wood = createBridgeBlocks().find((block) => block.id === "wood-block");
    const center = createBridgeTargets().find((target) => target.id === "center-wood");
    const side = createBridgeTargets().find((target) => target.id === "left-stone");

    expect(wood && center && isCorrectBridgeTarget(wood, center)).toBe(true);
    expect(wood && side && isCorrectBridgeTarget(wood, side)).toBe(false);
  });

  it("allows either stone block on either side bridge slot", () => {
    const stones = createBridgeBlocks().filter((block) => block.id !== "wood-block");
    const sideTargets = createBridgeTargets().filter((target) => target.id !== "center-wood");

    for (const block of stones) {
      for (const target of sideTargets) {
        expect(isCorrectBridgeTarget(block, target)).toBe(true);
      }
    }
  });

  it("completes only after every block is placed", () => {
    expect(isBridgeComplete(2, 3)).toBe(false);
    expect(isBridgeComplete(3, 3)).toBe(true);
  });
});
