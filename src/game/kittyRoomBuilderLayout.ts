import type { RoomObjectKind } from "./kittyRoomBuilder";

const TARGET_LANDSCAPE_ASPECT = 16 / 9;

export interface PlayArea {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface KittyRoomBuilderLayout {
  viewportWidth: number;
  viewportHeight: number;
  playArea: PlayArea;
  isPortrait: boolean;
  bottomSafe: number;
  uiScale: number;
  objectScale: number;
}

export interface RoomTargetLayout {
  id: RoomObjectKind;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface PointLayout {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

export const computeKittyRoomBuilderLayout = (viewportWidth: number, viewportHeight: number): KittyRoomBuilderLayout => {
  const isPortrait = viewportHeight > viewportWidth * 1.15;
  const viewportAspect = viewportWidth / viewportHeight;
  const playWidth =
    !isPortrait && viewportAspect > TARGET_LANDSCAPE_ASPECT ? viewportHeight * TARGET_LANDSCAPE_ASPECT : viewportWidth;
  const playHeight = viewportHeight;
  const playX = (viewportWidth - playWidth) / 2;
  const playArea = {
    x: playX,
    y: 0,
    width: playWidth,
    height: playHeight,
    centerX: playX + playWidth / 2,
    centerY: playHeight / 2,
  };

  return {
    viewportWidth,
    viewportHeight,
    playArea,
    isPortrait,
    bottomSafe: clamp(viewportHeight * 0.055, 24, 42),
    uiScale: clamp(Math.min(playWidth / 560, viewportHeight / 700), 0.78, 1.12),
    objectScale: clamp(Math.min(playWidth / 460, viewportHeight / 650), 0.78, 1.08),
  };
};

export const getKittyRoomTargetSlots = (layout: KittyRoomBuilderLayout): RoomTargetLayout[] => {
  const { playArea } = layout;
  const scale = layout.isPortrait ? clamp(playArea.width / 410, 0.76, 0.94) : clamp(playArea.width / 920, 0.9, 1.08);

  if (layout.isPortrait) {
    return [
      { id: "window", x: playArea.x + playArea.width * 0.71, y: playArea.y + playArea.height * 0.2, width: 112, height: 112, scale },
      { id: "bed", x: playArea.x + playArea.width * 0.36, y: playArea.y + playArea.height * 0.42, width: 178, height: 118, scale },
      { id: "rug", x: playArea.x + playArea.width * 0.5, y: playArea.y + playArea.height * 0.62, width: 176, height: 108, scale },
      { id: "ball", x: playArea.x + playArea.width * 0.76, y: playArea.y + playArea.height * 0.5, width: 104, height: 104, scale },
      { id: "bowl", x: playArea.x + playArea.width * 0.23, y: playArea.y + playArea.height * 0.59, width: 126, height: 90, scale },
    ];
  }

  return [
    { id: "window", x: playArea.x + playArea.width * 0.68, y: playArea.y + playArea.height * 0.2, width: 118, height: 118, scale },
    { id: "bed", x: playArea.x + playArea.width * 0.36, y: playArea.y + playArea.height * 0.45, width: 184, height: 122, scale },
    { id: "rug", x: playArea.x + playArea.width * 0.51, y: playArea.y + playArea.height * 0.67, width: 184, height: 112, scale },
    { id: "ball", x: playArea.x + playArea.width * 0.73, y: playArea.y + playArea.height * 0.52, width: 108, height: 108, scale },
    { id: "bowl", x: playArea.x + playArea.width * 0.24, y: playArea.y + playArea.height * 0.62, width: 132, height: 92, scale },
  ];
};

export const getKittyRoomObjectTrayPositions = (layout: KittyRoomBuilderLayout): PointLayout[] => {
  const { playArea } = layout;
  const y = playArea.y + playArea.height - layout.bottomSafe - (layout.isPortrait ? 78 : 74) * layout.objectScale;

  if (layout.isPortrait) {
    return [
      { x: playArea.x + playArea.width * 0.18, y },
      { x: playArea.x + playArea.width * 0.5, y },
      { x: playArea.x + playArea.width * 0.82, y },
    ];
  }

  return [
    { x: playArea.x + playArea.width * 0.18, y },
    { x: playArea.x + playArea.width * 0.34, y },
    { x: playArea.x + playArea.width * 0.5, y },
    { x: playArea.x + playArea.width * 0.66, y },
    { x: playArea.x + playArea.width * 0.82, y },
  ];
};

export const getKittyRoomReplayPosition = (layout: KittyRoomBuilderLayout): PointLayout => {
  const { playArea } = layout;
  const inset = clamp(playArea.width * 0.085, 68, 92);

  return {
    x: playArea.x + playArea.width - inset,
    y: playArea.y + inset,
  };
};
