export type BasketColor = "red" | "yellow" | "blue";
export type GardenObjectKind = "flower" | "fruit" | "leaf";

export interface GardenObject {
  id: string;
  color: BasketColor;
  kind: GardenObjectKind;
}

export interface Basket {
  color: BasketColor;
}

export const BASKET_COLORS: BasketColor[] = ["red", "yellow", "blue"];

const OBJECT_KINDS: GardenObjectKind[] = ["flower", "fruit", "leaf"];

export function isCorrectBasket(object: GardenObject, basket: Basket): boolean {
  return object.color === basket.color;
}

export function createRoundObjects(): GardenObject[] {
  return BASKET_COLORS.flatMap((color) =>
    OBJECT_KINDS.map((kind, index) => ({
      id: `${color}-${kind}-${index}`,
      color,
      kind,
    })),
  );
}

export function isRoundComplete(sortedCount: number, totalCount: number): boolean {
  return totalCount > 0 && sortedCount >= totalCount;
}
