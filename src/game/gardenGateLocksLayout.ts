import type { GateLockKind } from "./gardenGateLocks";

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

export interface GardenGateLocksLayout {
  viewportWidth: number;
  viewportHeight: number;
  playArea: PlayArea;
  isPortrait: boolean;
  uiScale: number;
  gateScale: number;
  tokenScale: number;
}

export interface GateSlotLayout {
  id: GateLockKind;
  x: number;
  y: number;
  gateWidth: number;
  gateHeight: number;
  lockSize: number;
  scale: number;
}

export interface PointLayout {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

export const computeGardenGateLocksLayout = (
  viewportWidth: number,
  viewportHeight: number,
): GardenGateLocksLayout => {
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
    uiScale: clamp(Math.min(playWidth / 560, viewportHeight / 700), 0.78, 1.12),
    gateScale: clamp(Math.min(playWidth / 430, viewportHeight / 680), 0.82, 1.12),
    tokenScale: clamp(Math.min(playWidth / 390, viewportHeight / 680), 0.84, 1.14),
  };
};

export const getGardenGateSlots = (layout: GardenGateLocksLayout): GateSlotLayout[] => {
  const { playArea } = layout;
  const ids: GateLockKind[] = ["red-circle", "blue-star", "yellow-square"];
  const xs = layout.isPortrait ? [0.2, 0.5, 0.8] : [0.27, 0.5, 0.73];
  const y = playArea.y + playArea.height * (layout.isPortrait ? 0.42 : 0.46);
  const gateWidth = (layout.isPortrait ? 102 : 128) * layout.gateScale;
  const gateHeight = (layout.isPortrait ? 150 : 170) * layout.gateScale;
  const lockSize = clamp((layout.isPortrait ? 72 : 82) * layout.gateScale, 68, 96);

  return ids.map((id, index) => ({
    id,
    x: playArea.x + playArea.width * xs[index],
    y,
    gateWidth,
    gateHeight,
    lockSize,
    scale: layout.gateScale,
  }));
};

export const getGardenGateTokenPositions = (layout: GardenGateLocksLayout): PointLayout[] => {
  const { playArea } = layout;

  if (layout.isPortrait) {
    const y = playArea.y + playArea.height * 0.78;

    return [
      { x: playArea.x + playArea.width * 0.23, y },
      { x: playArea.x + playArea.width * 0.5, y: y + 42 * layout.tokenScale },
      { x: playArea.x + playArea.width * 0.77, y },
    ];
  }

  const y = playArea.y + playArea.height * 0.78;
  const spacing = clamp(playArea.width * 0.16, 152, 212);

  return [
    { x: playArea.centerX - spacing, y },
    { x: playArea.centerX, y },
    { x: playArea.centerX + spacing, y },
  ];
};

export const getGardenGateReplayPosition = (layout: GardenGateLocksLayout): PointLayout => {
  const buttonSize = clamp(layout.viewportWidth * 0.1, MIN_NAV_BUTTON_SIZE, MAX_NAV_BUTTON_SIZE);

  return {
    x: layout.viewportWidth - NAV_BUTTON_INSET - buttonSize / 2,
    y: NAV_BUTTON_INSET + buttonSize / 2,
  };
};

export const getGardenGateTokenVisualSize = (layout: GardenGateLocksLayout): number =>
  clamp((layout.isPortrait ? 104 : 108) * layout.tokenScale, 96, 128);
