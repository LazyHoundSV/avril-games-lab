import type { BridgeTargetKind } from "./littleBuilderBridge";

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
  id: BridgeTargetKind;
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
  const scale = layout.isPortrait ? clamp(playArea.width / 390, 0.86, 1) : clamp(playArea.width / 900, 0.96, 1.12);
  const y = playArea.y + playArea.height * (layout.isPortrait ? 0.48 : 0.485);
  const ids: BridgeTargetKind[] = ["left-stone", "center-wood", "right-stone"];
  const xs = layout.isPortrait
    ? [0.23, 0.5, 0.77]
    : [0.31, 0.5, 0.7];

  return ids.map((id, index) => ({
    id,
    x: playArea.x + playArea.width * xs[index],
    y,
    width: layout.isPortrait ? (id === "center-wood" ? 118 : 92) : id === "center-wood" ? 150 : 118,
    height: layout.isPortrait ? (id === "center-wood" ? 92 : 96) : id === "center-wood" ? 110 : 124,
    scale,
  }));
};

export const getLittleBuilderBridgeTrayPositions = (layout: LittleBuilderBridgeLayout): PointLayout[] => {
  const { playArea } = layout;

  if (layout.isPortrait) {
    const trayHeight = 184 * layout.blockScale;
    const trayCenterY = playArea.y + playArea.height - trayHeight / 2 - 10 * layout.uiScale;
    const rowOffset = 42 * layout.blockScale;

    return [
      { x: playArea.x + playArea.width * 0.32, y: trayCenterY - rowOffset },
      { x: playArea.x + playArea.width * 0.68, y: trayCenterY - rowOffset },
      { x: playArea.x + playArea.width * 0.5, y: trayCenterY + rowOffset },
    ];
  }

  const trayHeight = 138 * layout.blockScale;
  const y = playArea.y + playArea.height - trayHeight / 2 - 10 * layout.uiScale;
  const spacing = clamp(playArea.width * 0.16, 150, 210);

  return [
    { x: playArea.centerX - spacing, y },
    { x: playArea.x + playArea.width * 0.5, y },
    { x: playArea.centerX + spacing, y },
  ];
};

export const getLittleBuilderBridgeReplayPosition = (layout: LittleBuilderBridgeLayout): PointLayout => {
  const buttonSize = clamp(layout.viewportWidth * 0.1, MIN_NAV_BUTTON_SIZE, MAX_NAV_BUTTON_SIZE);

  return {
    x: layout.viewportWidth - NAV_BUTTON_INSET - buttonSize / 2,
    y: NAV_BUTTON_INSET + buttonSize / 2,
  };
};
