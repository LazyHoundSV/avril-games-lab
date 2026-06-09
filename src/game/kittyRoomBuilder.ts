export type RoomObjectKind = "window" | "bed" | "rug" | "bowl" | "yarn";

export interface RoomObject {
  id: RoomObjectKind;
  label: string;
  textureKey: string;
  silhouetteKey: string;
}

export interface RoomTarget {
  id: RoomObjectKind;
}

export const ROOM_OBJECTS: RoomObject[] = [
  { id: "window", label: "window", textureKey: "kitty-window", silhouetteKey: "kitty-window-target" },
  { id: "bed", label: "bed", textureKey: "kitty-bed", silhouetteKey: "kitty-bed-target" },
  { id: "rug", label: "rug", textureKey: "kitty-rug", silhouetteKey: "kitty-rug-target" },
  { id: "bowl", label: "bowl", textureKey: "kitty-bowl", silhouetteKey: "kitty-bowl-target" },
  { id: "yarn", label: "yarn", textureKey: "kitty-yarn", silhouetteKey: "kitty-yarn-target" },
];

export function createRoomObjects(): RoomObject[] {
  return ROOM_OBJECTS.map((object) => ({ ...object }));
}

export function isCorrectRoomTarget(object: RoomObject, target: RoomTarget): boolean {
  return object.id === target.id;
}

export function isRoomComplete(placedCount: number, totalCount: number): boolean {
  return totalCount > 0 && placedCount >= totalCount;
}
