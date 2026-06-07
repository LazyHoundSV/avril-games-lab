export type BasketColor = "red" | "yellow" | "blue" | "green" | "purple";
export type GardenObjectKind = "flower" | "fruit" | "leaf";
export type GardenAssetKey =
  | "red-flower"
  | "red-strawberry"
  | "yellow-flower"
  | "yellow-lemon"
  | "blue-flower"
  | "blueberries"
  | "green-leaf"
  | "green-apple"
  | "purple-flower"
  | "purple-grapes";

export interface GardenObject {
  id: string;
  color: BasketColor;
  kind: GardenObjectKind;
  assetKey: GardenAssetKey;
}

export interface Basket {
  color: BasketColor;
}

export const BASKET_COLORS: BasketColor[] = ["red", "yellow", "blue", "green", "purple"];

const ROUND_OBJECTS: GardenObject[] = [
  { id: "red-flower", color: "red", kind: "flower", assetKey: "red-flower" },
  { id: "red-strawberry", color: "red", kind: "fruit", assetKey: "red-strawberry" },
  { id: "yellow-flower", color: "yellow", kind: "flower", assetKey: "yellow-flower" },
  { id: "yellow-lemon", color: "yellow", kind: "fruit", assetKey: "yellow-lemon" },
  { id: "blue-flower", color: "blue", kind: "flower", assetKey: "blue-flower" },
  { id: "blueberries", color: "blue", kind: "fruit", assetKey: "blueberries" },
  { id: "green-leaf", color: "green", kind: "leaf", assetKey: "green-leaf" },
  { id: "green-apple", color: "green", kind: "fruit", assetKey: "green-apple" },
  { id: "purple-flower", color: "purple", kind: "flower", assetKey: "purple-flower" },
  { id: "purple-grapes", color: "purple", kind: "fruit", assetKey: "purple-grapes" },
];

export function isCorrectBasket(object: GardenObject, basket: Basket): boolean {
  return object.color === basket.color;
}

export function createRoundObjects(): GardenObject[] {
  return ROUND_OBJECTS.map((object) => ({ ...object }));
}

export function isRoundComplete(sortedCount: number, totalCount: number): boolean {
  return totalCount > 0 && sortedCount >= totalCount;
}
