import type { RoomObjectKind } from "./kittyRoomBuilder";

const TARGET_LANDSCAPE_ASPECT = 16 / 9;
const MIN_NAV_BUTTON_SIZE = 58;
const MAX_NAV_BUTTON_SIZE = 74;
const NAV_BUTTON_INSET = 12;

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
      { id: "window", x: playArea.x + playArea.width * 0.58, y: playArea.y + playArea.height * 0.24, width: 112, height: 116, scale },
      { id: "bed", x: playArea.x + playArea.width * 0.52, y: playArea.y + playArea.height * 0.45, width: 186, height: 132, scale },
      { id: "rug", x: playArea.x + playArea.width * 0.5, y: playArea.y + playArea.height * 0.62, width: 178, height: 102, scale },
      { id: "bowl", x: playArea.x + playArea.width * 0.23, y: playArea.y + playArea.height * 0.61, width: 132, height: 94, scale },
      { id: "yarn", x: playArea.x + playArea.width * 0.78, y: playArea.y + playArea.height * 0.56, width: 116, height: 80, scale },
    ];
  }

  return [
    { id: "window", x: playArea.x + playArea.width * 0.34, y: playArea.y + playArea.height * 0.29, width: 124, height: 128, scale },
    { id: "bed", x: playArea.x + playArea.width * 0.64, y: playArea.y + playArea.height * 0.51, width: 202, height: 142, scale },
    { id: "rug", x: playArea.x + playArea.width * 0.49, y: playArea.y + playArea.height * 0.69, width: 190, height: 108, scale },
    { id: "bowl", x: playArea.x + playArea.width * 0.24, y: playArea.y + playArea.height * 0.68, width: 142, height: 100, scale },
    { id: "yarn", x: playArea.x + playArea.width * 0.78, y: playArea.y + playArea.height * 0.67, width: 122, height: 82, scale },
  ];
};

export const getKittyRoomObjectTrayPositions = (layout: KittyRoomBuilderLayout): PointLayout[] => {
  const { playArea } = layout;
  const y = playArea.y + playArea.height - layout.bottomSafe - (layout.isPortrait ? 78 : 74) * layout.objectScale;

  if (layout.isPortrait) {
    return [
      { x: playArea.x + playArea.width * 0.18, y },
      { x: playArea.x + playArea.width * 0.48, y },
      { x: playArea.x + playArea.width * 0.68, y },
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
  const buttonSize = clamp(layout.viewportWidth * 0.1, MIN_NAV_BUTTON_SIZE, MAX_NAV_BUTTON_SIZE);

  return {
    x: layout.viewportWidth - NAV_BUTTON_INSET - buttonSize / 2,
    y: NAV_BUTTON_INSET + buttonSize / 2,
  };
};
