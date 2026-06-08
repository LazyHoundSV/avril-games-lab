import { describe, expect, it } from "vitest";
import {
  computeColorBasketGardenLayout,
  getColorBasketGardenBasketSlots,
  getColorBasketGardenObjectPositions,
  getColorBasketGardenReplayPosition,
} from "./colorBasketGardenLayout";

const expectClose = (actual: number, expected: number, precision = 1): void => {
  expect(actual).toBeCloseTo(expected, precision);
};

describe("Color Basket Garden layout", () => {
  it("centers landscape tablet gameplay inside a logical 16:9 play area", () => {
    const layout = computeColorBasketGardenLayout(960, 450);
    const slots = getColorBasketGardenBasketSlots(layout);
    const centerAverage = (slots[0].x + slots[slots.length - 1].x) / 2;
    const maxBasketBottom = Math.max(...slots.map((slot) => slot.y + 62 * slot.scale));

    expect(layout.isPortrait).toBe(false);
    expectClose(layout.playArea.width, 800);
    expectClose(layout.playArea.x, 80);
    expectClose(centerAverage, layout.playArea.centerX);
    expect(slots[0].x).toBeGreaterThan(layout.playArea.x + layout.playArea.width * 0.2);
    expect(slots[slots.length - 1].x).toBeLessThan(layout.playArea.x + layout.playArea.width * 0.8);
    expect(Math.min(...slots.map((slot) => 138 * slot.scale))).toBeGreaterThanOrEqual(96);
    expect(maxBasketBottom).toBeLessThanOrEqual(layout.viewportHeight - layout.bottomSafe);
  });

  it("keeps wide landscape basket positions clustered instead of edge-to-edge", () => {
    const layout = computeColorBasketGardenLayout(1280, 600);
    const slots = getColorBasketGardenBasketSlots(layout);
    const first = slots[0];
    const last = slots[slots.length - 1];
    const centerAverage = (first.x + last.x) / 2;

    expectClose(layout.playArea.width, 600 * (16 / 9));
    expectClose(layout.playArea.x, (1280 - layout.playArea.width) / 2);
    expectClose(centerAverage, layout.playArea.centerX);
    expect(last.x - first.x).toBeLessThan(layout.playArea.width * 0.7);
    expect(first.x - 62 * first.scale).toBeGreaterThanOrEqual(layout.playArea.centerX - layout.playArea.width * 0.35);
    expect(last.x + 62 * last.scale).toBeLessThanOrEqual(layout.playArea.centerX + layout.playArea.width * 0.35);
  });

  it("preserves portrait touch targets and bottom safety", () => {
    const layout = computeColorBasketGardenLayout(360, 640);
    const slots = getColorBasketGardenBasketSlots(layout);
    const positions = getColorBasketGardenObjectPositions(layout);
    const maxBasketBottom = Math.max(...slots.map((slot) => slot.y + 62 * slot.scale));

    expect(layout.isPortrait).toBe(true);
    expect(slots).toHaveLength(5);
    expect(positions).toHaveLength(3);
    expect(Math.min(...slots.map((slot) => 138 * slot.scale))).toBeGreaterThanOrEqual(96);
    expect(maxBasketBottom).toBeLessThanOrEqual(layout.viewportHeight - layout.bottomSafe);
    expect(positions.every((position) => position.x >= 0 && position.x <= layout.viewportWidth)).toBe(true);
  });

  it("places replay in the upper-right of the logical play area", () => {
    const layout = computeColorBasketGardenLayout(960, 450);
    const replay = getColorBasketGardenReplayPosition(layout);

    expect(replay.x).toBeGreaterThan(layout.playArea.x + layout.playArea.width * 0.88);
    expect(replay.x).toBeLessThan(layout.playArea.x + layout.playArea.width);
    expect(replay.y).toBeGreaterThan(layout.playArea.y + 60);
    expect(replay.y).toBeLessThan(layout.playArea.y + layout.playArea.height * 0.25);
  });
});
