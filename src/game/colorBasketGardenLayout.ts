import { BASKET_COLORS, type BasketColor } from "./sorting";

const TARGET_LANDSCAPE_ASPECT = 16 / 9;
const BASKET_SIZE = 124;
const BASKET_GAP = 24;

export interface PlayArea {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface GardenLayout {
  viewportWidth: number;
  viewportHeight: number;
  playArea: PlayArea;
  isPortrait: boolean;
  bottomSafe: number;
  uiScale: number;
  itemScale: number;
}

export interface BasketSlotLayout {
  color: BasketColor;
  x: number;
  y: number;
  scale: number;
}

export interface PointLayout {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

export const computeColorBasketGardenLayout = (viewportWidth: number, viewportHeight: number): GardenLayout => {
  const isPortrait = viewportHeight > viewportWidth * 1.15;
  const viewportAspect = viewportWidth / viewportHeight;
  const playWidth =
    !isPortrait && viewportAspect > TARGET_LANDSCAPE_ASPECT ? viewportHeight * TARGET_LANDSCAPE_ASPECT : viewportWidth;
  const playHeight = viewportHeight;
  const playX = (viewportWidth - playWidth) / 2;
  const playY = 0;
  const playArea = {
    x: playX,
    y: playY,
    width: playWidth,
    height: playHeight,
    centerX: playX + playWidth / 2,
    centerY: playY + playHeight / 2,
  };

  return {
    viewportWidth,
    viewportHeight,
    playArea,
    isPortrait,
    bottomSafe: clamp(viewportHeight * 0.055, 24, 42),
    uiScale: clamp(Math.min(playWidth / 560, viewportHeight / 700), 0.78, 1.12),
    itemScale: clamp(Math.min(playWidth / 460, viewportHeight / 650), 0.84, 1.12),
  };
};

export const getColorBasketGardenBasketSlots = (layout: GardenLayout): BasketSlotLayout[] => {
  const { playArea } = layout;

  if (layout.isPortrait) {
    const rowScale = clamp((playArea.width - 40) / (3 * BASKET_SIZE + 36), 0.72, 0.9);
    const lowerY = playArea.y + playArea.height - layout.bottomSafe - 84 * rowScale;
    const upperY = playArea.y + playArea.height * 0.67;
    const lowerXs = [playArea.x + playArea.width * 0.19, playArea.centerX, playArea.x + playArea.width * 0.81];
    const upperXs = [playArea.x + playArea.width * 0.34, playArea.x + playArea.width * 0.66];
    const lowerColors: BasketColor[] = ["red", "yellow", "blue"];
    const upperColors: BasketColor[] = ["green", "purple"];

    return [
      ...upperColors.map((color, index) => ({ color, x: upperXs[index], y: upperY, scale: rowScale })),
      ...lowerColors.map((color, index) => ({ color, x: lowerXs[index], y: lowerY, scale: rowScale })),
    ];
  }

  const clusterWidth = Math.min(playArea.width * 0.7, playArea.width - 64);
  const rowScale = clamp(clusterWidth / (BASKET_COLORS.length * BASKET_SIZE + 4 * BASKET_GAP), 0.78, 1.08);
  const centerSpan = Math.max(0, clusterWidth - BASKET_SIZE * rowScale);
  const left = playArea.centerX - centerSpan / 2;
  const right = playArea.centerX + centerSpan / 2;
  const y = playArea.y + playArea.height - layout.bottomSafe - 84 * rowScale;

  return BASKET_COLORS.map((color, index) => ({
    color,
    x: left + (right - left) * (index / (BASKET_COLORS.length - 1)),
    y,
    scale: rowScale,
  }));
};

export const getColorBasketGardenObjectPositions = (layout: GardenLayout): PointLayout[] => {
  const { playArea } = layout;

  if (layout.isPortrait) {
    return [
      { x: playArea.x + playArea.width * 0.25, y: playArea.y + playArea.height * 0.28 },
      { x: playArea.x + playArea.width * 0.72, y: playArea.y + playArea.height * 0.36 },
      { x: playArea.centerX, y: playArea.y + playArea.height * 0.49 },
    ];
  }

  return [
    { x: playArea.x + playArea.width * 0.28, y: playArea.y + playArea.height * 0.33 },
    { x: playArea.centerX, y: playArea.y + playArea.height * 0.43 },
    { x: playArea.x + playArea.width * 0.72, y: playArea.y + playArea.height * 0.35 },
  ];
};

export const getColorBasketGardenReplayPosition = (layout: GardenLayout): PointLayout => {
  const { playArea } = layout;
  const inset = clamp(playArea.width * 0.085, 68, 92);

  return {
    x: playArea.x + playArea.width - inset,
    y: playArea.y + inset,
  };
};
