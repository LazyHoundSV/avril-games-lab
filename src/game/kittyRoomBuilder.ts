export type RoomObjectKind = "window" | "bed" | "rug" | "ball" | "bowl";

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
  { id: "window", label: "window", textureKey: "kitty-window", silhouetteKey: "kitty-window-silhouette" },
  { id: "bed", label: "bed", textureKey: "kitty-bed", silhouetteKey: "kitty-bed-silhouette" },
  { id: "rug", label: "rug", textureKey: "kitty-rug", silhouetteKey: "kitty-rug-silhouette" },
  { id: "ball", label: "ball", textureKey: "kitty-ball", silhouetteKey: "kitty-ball-silhouette" },
  { id: "bowl", label: "bowl", textureKey: "kitty-bowl", silhouetteKey: "kitty-bowl-silhouette" },
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
