import { describe, expect, it } from "vitest";
import {
  computeKittyRoomBuilderLayout,
  getKittyRoomObjectTrayPositions,
  getKittyRoomReplayPosition,
  getKittyRoomTargetSlots,
} from "./kittyRoomBuilderLayout";

describe("Kitty Room Builder layout", () => {
  it("keeps five large targets visible on desktop", () => {
    const layout = computeKittyRoomBuilderLayout(1280, 720);
    const targets = getKittyRoomTargetSlots(layout);

    expect(targets).toHaveLength(5);
    for (const target of targets) {
      expect(target.width * target.scale).toBeGreaterThanOrEqual(96);
      expect(target.x).toBeGreaterThanOrEqual(layout.playArea.x);
      expect(target.x).toBeLessThanOrEqual(layout.playArea.x + layout.playArea.width);
    }
  });

  it("uses three tray positions on mobile portrait to avoid crowding", () => {
    const layout = computeKittyRoomBuilderLayout(390, 844);
    const positions = getKittyRoomObjectTrayPositions(layout);

    expect(layout.isPortrait).toBe(true);
    expect(positions).toHaveLength(3);
    expect(positions[1].x - positions[0].x).toBeGreaterThanOrEqual(100);
  });

  it.each([
    [1280, 720],
    [960, 540],
    [390, 844],
  ])("keeps target centers and tray positions inside the play area at %ix%i", (width, height) => {
    const layout = computeKittyRoomBuilderLayout(width, height);
    const targets = getKittyRoomTargetSlots(layout);
    const trayPositions = getKittyRoomObjectTrayPositions(layout);

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
    const layout = computeKittyRoomBuilderLayout(1280, 720);
    const replay = getKittyRoomReplayPosition(layout);

    expect(replay.x).toBe(1280 - 12 - 74 / 2);
    expect(replay.y).toBe(12 + 74 / 2);
  });
});
