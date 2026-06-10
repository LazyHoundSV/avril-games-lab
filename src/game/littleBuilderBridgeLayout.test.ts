import { describe, expect, it } from "vitest";
import {
  computeLittleBuilderBridgeLayout,
  getLittleBuilderBridgeReplayPosition,
  getLittleBuilderBridgeTargets,
  getLittleBuilderBridgeTrayPositions,
} from "./littleBuilderBridgeLayout";

describe("Little Builder Bridge layout", () => {
  it("uses three bridge targets and three tray positions", () => {
    const layout = computeLittleBuilderBridgeLayout(1280, 720);

    expect(getLittleBuilderBridgeTargets(layout)).toHaveLength(3);
    expect(getLittleBuilderBridgeTrayPositions(layout)).toHaveLength(3);
  });

  it("keeps touch targets large in mobile portrait", () => {
    const layout = computeLittleBuilderBridgeLayout(390, 844);
    const targets = getLittleBuilderBridgeTargets(layout);
    const trayPositions = getLittleBuilderBridgeTrayPositions(layout);

    expect(layout.isPortrait).toBe(true);
    for (const target of targets) {
      expect(target.width * target.scale).toBeGreaterThanOrEqual(88);
      expect(target.height * target.scale).toBeGreaterThanOrEqual(88);
    }
    expect(Math.abs(trayPositions[1].x - trayPositions[0].x)).toBeGreaterThanOrEqual(120);
    expect(Math.abs(trayPositions[2].y - trayPositions[0].y)).toBeGreaterThanOrEqual(64);
  });

  it("keeps landscape bridge gaps aligned with the painted background slots", () => {
    const layout = computeLittleBuilderBridgeLayout(1280, 720);
    const targets = getLittleBuilderBridgeTargets(layout);

    expect(targets.map((target) => Math.round((target.x - layout.playArea.x) / layout.playArea.width * 100))).toEqual([
      31,
      50,
      70,
    ]);
    for (let index = 1; index < targets.length; index += 1) {
      expect(targets[index].x - targets[index - 1].x).toBeGreaterThanOrEqual(110);
    }
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
