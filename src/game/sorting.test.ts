import { describe, expect, it } from "vitest";
import { BASKET_COLORS, createRoundObjects, isCorrectBasket, isRoundComplete } from "./sorting";

describe("Color Basket Garden sorting", () => {
  it("matches objects only with baskets of the same color", () => {
    expect(isCorrectBasket({ id: "red-flower", color: "red", kind: "flower" }, { color: "red" })).toBe(
      true,
    );
    expect(
      isCorrectBasket({ id: "red-flower", color: "red", kind: "flower" }, { color: "yellow" }),
    ).toBe(false);
  });

  it("creates a balanced first round across the three basket colors", () => {
    const objects = createRoundObjects();

    expect(objects).toHaveLength(9);
    for (const color of BASKET_COLORS) {
      expect(objects.filter((object) => object.color === color)).toHaveLength(3);
    }
  });

  it("requires at least one object before a round can complete", () => {
    expect(isRoundComplete(0, 0)).toBe(false);
    expect(isRoundComplete(8, 9)).toBe(false);
    expect(isRoundComplete(9, 9)).toBe(true);
  });
});
