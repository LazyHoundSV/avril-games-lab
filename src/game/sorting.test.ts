import { describe, expect, it } from "vitest";
import {
  BASKET_COLORS,
  createRoundObjects,
  getGardenObjectSpokenLabel,
  isCorrectBasket,
  isRoundComplete,
} from "./sorting";

describe("Color Basket Garden sorting", () => {
  it("matches objects only with baskets of the same color", () => {
    expect(
      isCorrectBasket(
        { id: "red-flower", color: "red", kind: "flower", assetKey: "red-flower" },
        { color: "red" },
      ),
    ).toBe(true);
    expect(
      isCorrectBasket(
        { id: "red-flower", color: "red", kind: "flower", assetKey: "red-flower" },
        { color: "yellow" },
      ),
    ).toBe(false);
  });

  it("creates a balanced first round across the five basket colors", () => {
    const objects = createRoundObjects();

    expect(objects).toHaveLength(10);
    for (const color of BASKET_COLORS) {
      expect(objects.filter((object) => object.color === color)).toHaveLength(2);
    }
  });

  it("uses the expected garden sprite assets for the first round", () => {
    expect(createRoundObjects().map((object) => object.assetKey)).toEqual([
      "red-flower",
      "red-strawberry",
      "yellow-flower",
      "yellow-lemon",
      "blue-flower",
      "blueberries",
      "green-leaf",
      "green-apple",
      "purple-flower",
      "purple-grapes",
    ]);
  });

  it("provides natural spoken labels for each garden object", () => {
    expect(createRoundObjects().map(getGardenObjectSpokenLabel)).toEqual([
      "red flower",
      "red strawberry",
      "yellow flower",
      "yellow lemon",
      "blue flower",
      "blue berries",
      "green leaf",
      "green apple",
      "purple flower",
      "purple grapes",
    ]);
  });

  it("requires at least one object before a round can complete", () => {
    expect(isRoundComplete(0, 0)).toBe(false);
    expect(isRoundComplete(9, 10)).toBe(false);
    expect(isRoundComplete(10, 10)).toBe(true);
  });
});
