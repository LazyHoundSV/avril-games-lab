import { describe, expect, it } from "vitest";
import {
  computeKittyRoomBuilderLayout,
  getKittyRoomObjectTrayPositions,
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
});
