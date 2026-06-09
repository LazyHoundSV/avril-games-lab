import type { BridgeBlockKind } from "./littleBuilderBridge";

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

export interface LittleBuilderBridgeLayout {
  viewportWidth: number;
  viewportHeight: number;
  playArea: PlayArea;
  isPortrait: boolean;
  bottomSafe: number;
  uiScale: number;
  blockScale: number;
}

export interface BridgeTargetLayout {
  id: BridgeBlockKind;
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

export const computeLittleBuilderBridgeLayout = (
  viewportWidth: number,
  viewportHeight: number,
): LittleBuilderBridgeLayout => {
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
    bottomSafe: clamp(viewportHeight * 0.05, 24, 42),
    uiScale: clamp(Math.min(playWidth / 560, viewportHeight / 700), 0.78, 1.12),
    blockScale: clamp(Math.min(playWidth / 430, viewportHeight / 640), 0.78, 1.08),
  };
};

export const getLittleBuilderBridgeTargets = (layout: LittleBuilderBridgeLayout): BridgeTargetLayout[] => {
  const { playArea } = layout;
  const scale = layout.isPortrait ? clamp(playArea.width / 390, 0.82, 0.96) : clamp(playArea.width / 900, 0.94, 1.1);
  const y = playArea.y + playArea.height * (layout.isPortrait ? 0.43 : 0.48);
  const ids: BridgeBlockKind[] = ["left-plank", "arch-cap", "center-plank", "right-plank"];
  const xs = layout.isPortrait
    ? [0.2, 0.4, 0.6, 0.8]
    : [0.31, 0.44, 0.57, 0.7];

  return ids.map((id, index) => ({
    id,
    x: playArea.x + playArea.width * xs[index],
    y,
    width: id === "arch-cap" ? 108 : 98,
    height: id === "arch-cap" ? 94 : 86,
    scale,
  }));
};

export const getLittleBuilderBridgeTrayPositions = (layout: LittleBuilderBridgeLayout): PointLayout[] => {
  const { playArea } = layout;

  if (layout.isPortrait) {
    const upperY = playArea.y + playArea.height - layout.bottomSafe - 126 * layout.blockScale;
    const lowerY = playArea.y + playArea.height - layout.bottomSafe - 42 * layout.blockScale;

    return [
      { x: playArea.x + playArea.width * 0.29, y: upperY },
      { x: playArea.x + playArea.width * 0.71, y: upperY },
      { x: playArea.x + playArea.width * 0.29, y: lowerY },
      { x: playArea.x + playArea.width * 0.71, y: lowerY },
    ];
  }

  const y = playArea.y + playArea.height - layout.bottomSafe - 74 * layout.blockScale;

  return [
    { x: playArea.x + playArea.width * 0.26, y },
    { x: playArea.x + playArea.width * 0.42, y },
    { x: playArea.x + playArea.width * 0.58, y },
    { x: playArea.x + playArea.width * 0.74, y },
  ];
};

export const getLittleBuilderBridgeReplayPosition = (layout: LittleBuilderBridgeLayout): PointLayout => {
  const buttonSize = clamp(layout.viewportWidth * 0.1, MIN_NAV_BUTTON_SIZE, MAX_NAV_BUTTON_SIZE);

  return {
    x: layout.viewportWidth - NAV_BUTTON_INSET - buttonSize / 2,
    y: NAV_BUTTON_INSET + buttonSize / 2,
  };
};
