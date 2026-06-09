import { describe, expect, it } from "vitest";
import {
  computeLittleBuilderBridgeLayout,
  getLittleBuilderBridgeReplayPosition,
  getLittleBuilderBridgeTargets,
  getLittleBuilderBridgeTrayPositions,
} from "./littleBuilderBridgeLayout";

describe("Little Builder Bridge layout", () => {
  it("uses four bridge targets and four tray positions", () => {
    const layout = computeLittleBuilderBridgeLayout(1280, 720);

    expect(getLittleBuilderBridgeTargets(layout)).toHaveLength(4);
    expect(getLittleBuilderBridgeTrayPositions(layout)).toHaveLength(4);
  });

  it("keeps touch targets large in mobile portrait", () => {
    const layout = computeLittleBuilderBridgeLayout(390, 844);
    const targets = getLittleBuilderBridgeTargets(layout);
    const trayPositions = getLittleBuilderBridgeTrayPositions(layout);

    expect(layout.isPortrait).toBe(true);
    for (const target of targets) {
      expect(target.width * target.scale).toBeGreaterThanOrEqual(80);
      expect(target.height * target.scale).toBeGreaterThanOrEqual(70);
    }
    expect(Math.abs(trayPositions[1].x - trayPositions[0].x)).toBeGreaterThanOrEqual(120);
    expect(Math.abs(trayPositions[2].y - trayPositions[0].y)).toBeGreaterThanOrEqual(64);
  });

  it.each([
    [1280, 720],
    [960, 540],
    [390, 844],
    [360, 640],
  ])("keeps bridge targets and tray positions inside the play area at %ix%i", (width, height) => {
    const layout = computeLittleBuilderBridgeLayout(width, height);
    const targets = getLittleBuilderBridgeTargets(layout);
    const trayPositions = getLittleBuilderBridgeTrayPositions(layout);

    for (const target of targets) {
      expect(target.x).toBeGreaterThanOrEqual(layout.playArea.x);
      expect(target.x).toBeLessThanOrEqual(layout.playArea.x + layout.playArea.width);
      expect(target.y).toBeGreaterThanOrEqual(layout.playArea.y);
      expect(target.y).toBeLessThanOrEqual(layout.playArea.y + layout.playArea.height);
    }

    for (const position of trayPositions) {
      expect(position.x).toBeGreaterThanOrEqual(layout.playArea.x);
      expect(position.x).toBeLessThanOrEqual(layout.playArea.x + layout.playArea.width);
      expect(position.y).toBeGreaterThanOrEqual(layout.playArea.y);
      expect(position.y).toBeLessThanOrEqual(layout.playArea.y + layout.playArea.height);
    }
  });

  it("aligns replay with the fixed home button inset", () => {
    const layout = computeLittleBuilderBridgeLayout(1280, 720);
    const replay = getLittleBuilderBridgeReplayPosition(layout);

    expect(replay.x).toBe(1280 - 12 - 74 / 2);
    expect(replay.y).toBe(12 + 74 / 2);
  });
});
