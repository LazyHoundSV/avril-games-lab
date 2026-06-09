import { describe, expect, it } from "vitest";
import { createBridgeBlocks, isBridgeComplete, isCorrectBridgeTarget } from "./littleBuilderBridge";

describe("Little Builder Bridge rules", () => {
  it("uses four bridge blocks for the first prototype", () => {
    expect(createBridgeBlocks()).toHaveLength(4);
  });

  it("matches blocks only with their own bridge slot", () => {
    const [block] = createBridgeBlocks();

    expect(isCorrectBridgeTarget(block, { id: block.id })).toBe(true);
    expect(isCorrectBridgeTarget(block, { id: "right-plank" })).toBe(block.id === "right-plank");
  });

  it("completes only after every block is placed", () => {
    expect(isBridgeComplete(3, 4)).toBe(false);
    expect(isBridgeComplete(4, 4)).toBe(true);
  });
});
