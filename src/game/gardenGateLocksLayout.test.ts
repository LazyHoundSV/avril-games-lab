import { describe, expect, it } from "vitest";
import {
  computeGardenGateLocksLayout,
  getGardenGateReplayPosition,
  getGardenGateSlots,
  getGardenGateTokenPositions,
  getGardenGateTokenVisualSize,
} from "./gardenGateLocksLayout";

describe("Garden Gate Locks layout", () => {
  it("uses three gates and three tokens", () => {
    const layout = computeGardenGateLocksLayout(1280, 720);

    expect(getGardenGateSlots(layout)).toHaveLength(3);
    expect(getGardenGateTokenPositions(layout)).toHaveLength(3);
  });

  it("keeps mobile tokens and lock drop targets toddler-sized", () => {
    const layout = computeGardenGateLocksLayout(390, 844);
    const slots = getGardenGateSlots(layout);

    expect(layout.isPortrait).toBe(true);
    expect(getGardenGateTokenVisualSize(layout)).toBeGreaterThanOrEqual(96);
    for (const slot of slots) {
      expect(slot.lockSize).toBeGreaterThanOrEqual(68);
      expect(slot.lockSize + 36).toBeGreaterThanOrEqual(96);
    }
  });

  it.each([
    [1280, 720],
    [960, 540],
    [390, 844],
    [360, 640],
  ])("keeps gates and tokens inside the play area at %ix%i", (width, height) => {
    const layout = computeGardenGateLocksLayout(width, height);
    const slots = getGardenGateSlots(layout);
    const tokens = getGardenGateTokenPositions(layout);

    for (const slot of slots) {
      expect(slot.x - slot.gateWidth / 2).toBeGreaterThanOrEqual(layout.playArea.x);
      expect(slot.x + slot.gateWidth / 2).toBeLessThanOrEqual(layout.playArea.x + layout.playArea.width);
      expect(slot.y - slot.gateHeight / 2).toBeGreaterThanOrEqual(layout.playArea.y);
      expect(slot.y + slot.gateHeight / 2).toBeLessThanOrEqual(layout.playArea.y + layout.playArea.height);
    }

    for (const token of tokens) {
      expect(token.x).toBeGreaterThanOrEqual(layout.playArea.x);
      expect(token.x).toBeLessThanOrEqual(layout.playArea.x + layout.playArea.width);
      expect(token.y).toBeGreaterThanOrEqual(layout.playArea.y);
      expect(token.y).toBeLessThanOrEqual(layout.playArea.y + layout.playArea.height);
    }
  });

  it("keeps mobile tray spacing comfortable", () => {
    const layout = computeGardenGateLocksLayout(360, 640);
    const tokens = getGardenGateTokenPositions(layout);

    expect(Math.abs(tokens[1].x - tokens[0].x)).toBeGreaterThanOrEqual(86);
    expect(Math.abs(tokens[2].x - tokens[1].x)).toBeGreaterThanOrEqual(86);
    expect(Math.abs(tokens[1].y - tokens[0].y)).toBeGreaterThanOrEqual(34);
  });

  it("aligns replay with the fixed home button inset", () => {
    const layout = computeGardenGateLocksLayout(1280, 720);
    const replay = getGardenGateReplayPosition(layout);

    expect(replay.x).toBe(1280 - 12 - 74 / 2);
    expect(replay.y).toBe(12 + 74 / 2);
  });
});
