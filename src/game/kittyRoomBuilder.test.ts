import { describe, expect, it } from "vitest";
import { createRoomObjects, isCorrectRoomTarget, isRoomComplete } from "./kittyRoomBuilder";

describe("Kitty Room Builder rules", () => {
  it("creates the five required room objects", () => {
    expect(createRoomObjects().map((object) => object.id)).toEqual(["window", "bed", "rug", "bowl", "yarn"]);
  });

  it("matches objects only to their own silhouette target", () => {
    const [windowObject, bedObject] = createRoomObjects();

    expect(isCorrectRoomTarget(windowObject, { id: "window" })).toBe(true);
    expect(isCorrectRoomTarget(bedObject, { id: "window" })).toBe(false);
  });

  it("requires at least one placed object before completion", () => {
    expect(isRoomComplete(0, 0)).toBe(false);
    expect(isRoomComplete(4, 5)).toBe(false);
    expect(isRoomComplete(5, 5)).toBe(true);
  });
});
