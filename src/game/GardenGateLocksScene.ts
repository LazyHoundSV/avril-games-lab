import Phaser from "phaser";
import {
  createGardenGateLocks,
  createGardenGateTokens,
  isCorrectGardenGateToken,
  isGardenGateComplete,
  type GateLock,
  type GateCueMode,
  type GateLockKind,
  type GateToken,
} from "./gardenGateLocks";
import {
  computeGardenGateLocksLayout,
  getGardenGateReplayPosition,
  getGardenGateSlots,
  getGardenGateTokenPositions,
  getGardenGateTokenVisualSize,
  type GardenGateLocksLayout,
  type GateSlotLayout,
} from "./gardenGateLocksLayout";

const COLOR_BASKET_ASSET_BASE_PATH = "/assets/color-basket-garden";
const GARDEN_GATE_ASSET_BASE_PATH = "/assets/garden-gate-locks";
const REPLAY_BUTTON_ASSET_KEY = "garden-gate-locks-replay-button";
const REPLAY_BUTTON_ASSET_FILE = "replay_icon_hq_248.png";
const COMPLETION_APPLAUSE_ASSET_KEY = "garden-gate-locks-applause-complete";
const COMPLETION_APPLAUSE_ASSET_FILES = [
  `${COLOR_BASKET_ASSET_BASE_PATH}/audio/applause-complete-chosic-3s.ogg`,
  `${COLOR_BASKET_ASSET_BASE_PATH}/audio/applause-complete-chosic-3s.mp3`,
];
const BACKGROUND_ASSET_KEY = "garden-gate-locks-background";
const GATE_DOOR_ASSET_KEY = "garden-gate-locks-door-closed";
const FOUNTAIN_ASSET_KEY = "garden-gate-locks-fountain";
const SPARKLE_BURST_ASSET_KEY = "garden-gate-locks-sparkle-burst";
const MIN_NAV_BUTTON_SIZE = 58;
const MAX_NAV_BUTTON_SIZE = 74;

export const GARDEN_GATE_LOCKS_LEVEL_COMPLETE_EVENT = "garden-gate-locks:level-complete";

const GARDEN_GATE_ASSET_FILES: Record<string, string> = {
  [BACKGROUND_ASSET_KEY]: "background.png",
  [GATE_DOOR_ASSET_KEY]: "gate-door-closed.png",
  [FOUNTAIN_ASSET_KEY]: "fountain.png",
  [SPARKLE_BURST_ASSET_KEY]: "sparkle-burst.png",
  "garden-gate-lock-red-color": "lock-red-color.png",
  "garden-gate-lock-red-shape": "lock-red-shape.png",
  "garden-gate-lock-blue-color": "lock-blue-color.png",
  "garden-gate-lock-blue-shape": "lock-blue-shape.png",
  "garden-gate-lock-yellow-color": "lock-yellow-color.png",
  "garden-gate-lock-yellow-shape": "lock-yellow-shape.png",
  "garden-gate-token-red-color": "token-red-color.png",
  "garden-gate-token-red-shape": "token-red-shape.png",
  "garden-gate-token-blue-color": "token-blue-color.png",
  "garden-gate-token-blue-shape": "token-blue-shape.png",
  "garden-gate-token-yellow-color": "token-yellow-color.png",
  "garden-gate-token-yellow-shape": "token-yellow-shape.png",
  "garden-gate-reveal-kitten": "reveal-kitten-gate.png",
  "garden-gate-reveal-puppy": "reveal-puppy-gate.png",
  "garden-gate-reveal-butterfly": "reveal-butterfly-gate.png",
  "garden-gate-visitor-kitten": "visitor-kitten.png",
  "garden-gate-visitor-puppy": "visitor-puppy.png",
  "garden-gate-visitor-butterfly": "visitor-butterfly.png",
};

interface GateState {
  data: GateLock;
  slot: GateSlotLayout;
  zone: Phaser.GameObjects.Zone;
  glow: Phaser.GameObjects.Ellipse;
  door: Phaser.GameObjects.Image;
  lockFace: Phaser.GameObjects.Image;
  reveal: Phaser.GameObjects.Image;
  visitor: Phaser.GameObjects.Image;
  opened: boolean;
}

interface DraggableGateToken {
  data: GateToken;
  container: Phaser.GameObjects.Container;
  origin: Phaser.Math.Vector2;
  visualSize: number;
}

export class GardenGateLocksScene extends Phaser.Scene {
  private layout: GardenGateLocksLayout = computeGardenGateLocksLayout(960, 540);
  private gates: GateState[] = [];
  private tokens: DraggableGateToken[] = [];
  private openedCount = 0;
  private totalCount = 0;
  private replayButton?: Phaser.GameObjects.Image;
  private replayPulse?: Phaser.Tweens.Tween;
  private replayTimer?: Phaser.Time.TimerEvent;
  private trayGraphic?: Phaser.GameObjects.Graphics;
  private cueMode: GateCueMode = "color";

  constructor() {
    super("GardenGateLocks");
  }

  preload(): void {
    this.load.audio(COMPLETION_APPLAUSE_ASSET_KEY, COMPLETION_APPLAUSE_ASSET_FILES);
    this.load.image(REPLAY_BUTTON_ASSET_KEY, `${COLOR_BASKET_ASSET_BASE_PATH}/${REPLAY_BUTTON_ASSET_FILE}`);
    for (const [assetKey, file] of Object.entries(GARDEN_GATE_ASSET_FILES)) {
      this.load.image(assetKey, `${GARDEN_GATE_ASSET_BASE_PATH}/${file}`);
    }
  }

  create(): void {
    this.input.dragDistanceThreshold = 4;
    this.input.topOnly = false;
    this.scale.on("resize", this.startRound, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.startRound, this);
    });
    this.startRound();
  }

  private startRound(): void {
    this.layout = computeGardenGateLocksLayout(this.scale.width, this.scale.height);
    this.replayTimer?.remove(false);
    this.replayPulse?.stop();
    this.input.enabled = true;
    this.children.removeAll();
    this.gates = [];
    this.tokens = [];
    this.openedCount = 0;
    this.replayButton = undefined;
    this.replayPulse = undefined;
    this.trayGraphic = undefined;

    this.drawGarden();
    this.createGates();
    this.createTokens();
  }

  private drawGarden(): void {
    const { playArea } = this.layout;
    const graphics = this.add.graphics();

    graphics.fillStyle(0xbff2ff, 1);
    graphics.fillRect(0, 0, this.scale.width, this.scale.height);
    this.addCoverImage(BACKGROUND_ASSET_KEY, playArea.centerX, playArea.centerY, playArea.width, playArea.height, 1);
    this.drawTray();
  }

  private drawTray(): void {
    const { playArea } = this.layout;
    const graphics = this.add.graphics();
    const trayHeight = (this.layout.isPortrait ? 148 : 136) * this.layout.tokenScale;
    const trayY = playArea.y + playArea.height * (this.layout.isPortrait ? 0.72 : 0.69);
    const inset = 18 * this.layout.uiScale;

    graphics.fillStyle(0xfff1ce, 0.76);
    graphics.lineStyle(2 * this.layout.uiScale, 0xb87a35, 0.34);
    graphics.fillRoundedRect(playArea.x + inset, trayY, playArea.width - inset * 2, trayHeight, 24 * this.layout.uiScale);
    graphics.strokeRoundedRect(playArea.x + inset, trayY, playArea.width - inset * 2, trayHeight, 24 * this.layout.uiScale);
    graphics.setDepth(10);
    this.trayGraphic = graphics;
  }

  private createGates(): void {
    const locks = createGardenGateLocks();
    this.totalCount = locks.length;

    for (const slot of getGardenGateSlots(this.layout)) {
      const lock = locks.find((candidate) => candidate.id === slot.id);
      if (!lock) {
        continue;
      }

      const gate = this.drawGate(lock, slot);
      this.gates.push(gate);
    }
  }

  private drawGate(lock: GateLock, slot: GateSlotLayout): GateState {
    const baseY = slot.y + slot.gateHeight * 0.1;
    const door = this.add.image(slot.x, baseY, GATE_DOOR_ASSET_KEY).setDepth(16);
    const glow = this.add.ellipse(slot.x, slot.y, slot.lockSize + 42, slot.lockSize + 42, 0xffffff, 0).setDepth(21);
    const lockFace = this.createLockFace(slot.x, slot.y, lock, slot.lockSize).setDepth(23);
    const zoneSize = Math.max(108, slot.lockSize + 46);
    const zone = this.add.zone(slot.x, slot.y, zoneSize, zoneSize).setRectangleDropZone(zoneSize, zoneSize);
    const reveal = this.createGateReveal(lock, slot.x, baseY, slot).setAlpha(0).setDepth(18);
    const visitor = this.createVisitor(lock, slot.x, baseY + slot.gateHeight * 0.2, slot.scale).setAlpha(0).setDepth(14);

    this.fitClosedGateImage(door, slot);

    return { data: lock, slot, zone, glow, door, lockFace, reveal, visitor, opened: false };
  }

  private createTokens(): void {
    const tokens = createGardenGateTokens();
    const positions = getGardenGateTokenPositions(this.layout);
    const visualSize = getGardenGateTokenVisualSize(this.layout);

    tokens.forEach((token, index) => {
      const origin = new Phaser.Math.Vector2(positions[index].x, positions[index].y);
      const container = this.createToken(token, origin.x, origin.y, visualSize).setDepth(30);
      const draggable = { data: token, container, origin, visualSize };

      this.tokens.push(draggable);
      container.setInteractive(
        new Phaser.Geom.Circle(visualSize / 2, visualSize / 2, visualSize * 0.62),
        Phaser.Geom.Circle.Contains,
      );
      this.input.setDraggable(container);
      this.registerTokenDragHandlers(draggable);
      this.tweens.add({
        targets: container,
        y: origin.y - 4,
        duration: 1450 + index * 140,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    });
  }

  private registerTokenDragHandlers(token: DraggableGateToken): void {
    token.container.on("pointerdown", () => {
      this.sound.unlock();
    });

    token.container.on("dragstart", () => {
      this.tweens.killTweensOf(token.container);
      token.container.setDepth(60);
      this.tweens.add({ targets: token.container, scale: 1.08, duration: 100, ease: "Sine.out" });
      this.setGateDragState(this.findMatchingGate(token.data.id));
    });

    token.container.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      token.container.setPosition(dragX, dragY);
      const gate = this.findHoveredGate(dragX, dragY, token.container);
      this.setGateDragState(gate && isCorrectGardenGateToken(token.data, gate.data) ? gate : this.findMatchingGate(token.data.id));
    });

    token.container.on("dragend", () => {
      const gate = this.findHoveredGate(token.container.x, token.container.y, token.container);
      this.setGateDragState(undefined);

      if (gate && isCorrectGardenGateToken(token.data, gate.data)) {
        this.placeToken(token, gate);
        return;
      }

      this.returnToken(token);
    });
  }

  private findMatchingGate(id: GateLockKind): GateState | undefined {
    return this.gates.find((gate) => !gate.opened && gate.data.id === id);
  }

  private findHoveredGate(x: number, y: number, token: Phaser.GameObjects.Container): GateState | undefined {
    const bounds = token.getBounds();

    return this.gates
      .filter((gate) => {
        if (gate.opened) {
          return false;
        }

        const targetBounds = Phaser.Geom.Rectangle.Clone(gate.zone.getBounds());
        Phaser.Geom.Rectangle.Inflate(targetBounds, 18 * gate.slot.scale, 18 * gate.slot.scale);
        return targetBounds.contains(x, y) || Phaser.Geom.Intersects.RectangleToRectangle(bounds, targetBounds);
      })
      .sort(
        (a, b) =>
          Phaser.Math.Distance.Between(x, y, a.zone.x, a.zone.y) -
          Phaser.Math.Distance.Between(x, y, b.zone.x, b.zone.y),
      )[0];
  }

  private setGateDragState(active?: GateState): void {
    for (const gate of this.gates) {
      const isActive = gate === active;
      gate.glow.setAlpha(isActive ? 0.38 : 0);
      gate.glow.setScale(isActive ? 1.08 : 1);
    }
  }

  private placeToken(token: DraggableGateToken, gate: GateState): void {
    token.container.disableInteractive();
    this.input.setDraggable(token.container, false);
    gate.opened = true;
    this.openedCount += 1;
    this.tweens.killTweensOf(token.container);

    this.tweens.add({
      targets: token.container,
      x: gate.zone.x,
      y: gate.zone.y,
      scale: gate.slot.lockSize / token.visualSize,
      duration: 160,
      ease: "Back.out",
      onComplete: () => {
        token.container.setDepth(24);
        this.openGate(gate, token);
        this.sparkle(gate.zone.x, gate.zone.y, 8);

        if (isGardenGateComplete(this.openedCount, this.totalCount)) {
          this.completeRound();
        }
      },
    });
  }

  private returnToken(token: DraggableGateToken): void {
    this.tweens.killTweensOf(token.container);
    this.tweens.add({
      targets: token.container,
      x: token.origin.x,
      y: token.origin.y,
      scale: 1,
      duration: 230,
      ease: "Sine.inOut",
      onComplete: () => token.container.setDepth(30),
    });
  }

  private openGate(gate: GateState, token: DraggableGateToken): void {
    this.tweens.add({
      targets: [token.container, gate.lockFace, gate.door],
      alpha: 0,
      duration: 180,
      ease: "Sine.inOut",
      onComplete: () => token.container.destroy(),
    });
    this.tweens.add({
      targets: gate.reveal,
      alpha: 1,
      y: gate.reveal.y - 8 * this.layout.uiScale,
      duration: 320,
      ease: "Back.out",
    });
  }

  private completeRound(): void {
    const { playArea } = this.layout;
    const fountainY = playArea.y + playArea.height * (this.layout.isPortrait ? 0.57 : 0.62);
    const visitorSpacing = (this.layout.isPortrait ? 78 : 116) * this.layout.uiScale;
    const visitorY = fountainY + (this.layout.isPortrait ? 78 : 92) * this.layout.uiScale;

    this.input.enabled = false;
    this.game.events.emit(GARDEN_GATE_LOCKS_LEVEL_COMPLETE_EVENT);
    this.sound.play(COMPLETION_APPLAUSE_ASSET_KEY, { volume: 0.72, seek: 0.1 });
    this.fadeOutTray();
    this.drawFountain(playArea.centerX, fountainY);
    this.sparkle(playArea.centerX, fountainY - 28 * this.layout.uiScale, 18);

    this.gates.forEach((gate, index) => {
      gate.visitor.setPosition(gate.reveal.x, gate.reveal.y);
      gate.visitor.setDepth(44);
      this.tweens.add({
        targets: gate.reveal,
        alpha: 0,
        duration: 360,
        ease: "Sine.inOut",
      });
      this.tweens.add({
        targets: gate.visitor,
        x: playArea.centerX + (index - 1) * visitorSpacing,
        y: visitorY,
        alpha: 1,
        scaleX: gate.visitor.scaleX * (this.layout.isPortrait ? 1.48 : 1.7),
        scaleY: gate.visitor.scaleY * (this.layout.isPortrait ? 1.48 : 1.7),
        duration: 520 + index * 80,
        ease: "Sine.inOut",
      });
    });

    this.replayTimer = this.time.delayedCall(1700, () => {
      this.createReplayButton();
      this.input.enabled = true;
    });
  }

  private createReplayButton(): void {
    const position = getGardenGateReplayPosition(this.layout);
    const size = this.getNavButtonSize();

    this.replayButton = this.add.image(position.x, position.y, REPLAY_BUTTON_ASSET_KEY).setDisplaySize(size, size).setDepth(90);
    this.replayButton.setInteractive({ useHandCursor: true });
    this.replayButton.on("pointerdown", () => {
      this.cueMode = "color";
      this.startRound();
    });
    this.replayPulse = this.tweens.add({
      targets: this.replayButton,
      scaleX: this.replayButton.scaleX * 1.14,
      scaleY: this.replayButton.scaleY * 1.14,
      duration: 480,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  private createToken(token: GateToken, x: number, y: number, size: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const tokenImage = this.add.image(0, 0, token.assetKeys[this.cueMode]);

    this.fitImageToBox(tokenImage, size, size);
    container.setSize(size, size);
    container.add(tokenImage);
    return container;
  }

  private createLockFace(x: number, y: number, lock: GateLock, size: number): Phaser.GameObjects.Image {
    const lockFace = this.add.image(x, y, lock.lockAssetKeys[this.cueMode]);

    this.fitImageToBox(lockFace, size, size);
    return lockFace;
  }

  private createGateReveal(lock: GateLock, x: number, y: number, slot: GateSlotLayout): Phaser.GameObjects.Image {
    const reveal = this.add.image(x, y, lock.revealAssetKey);
    const maxWidth = slot.gateWidth * (this.layout.isPortrait ? 1.22 : 1.72);
    const maxHeight = slot.gateHeight * 1.16;

    this.fitImageToBox(reveal, maxWidth, maxHeight);
    return reveal;
  }

  private fitClosedGateImage(image: Phaser.GameObjects.Image, slot: GateSlotLayout): Phaser.GameObjects.Image {
    const maxWidth = slot.gateWidth * (this.layout.isPortrait ? 1.56 : 2.08);
    const maxHeight = slot.gateHeight * 1.08;

    return this.fitImageToBox(image, maxWidth, maxHeight);
  }

  private createVisitor(lock: GateLock, x: number, y: number, scale: number): Phaser.GameObjects.Image {
    const visitor = this.add.image(x, y, lock.visitorAssetKey);
    const maxWidth = lock.visitor === "butterfly" ? 86 * scale : 78 * scale;
    const maxHeight = lock.visitor === "butterfly" ? 62 * scale : 72 * scale;

    this.fitImageToBox(visitor, maxWidth, maxHeight);
    return visitor;
  }

  private fadeOutTray(): void {
    if (!this.trayGraphic) {
      return;
    }

    this.tweens.add({
      targets: this.trayGraphic,
      alpha: 0,
      duration: 260,
      ease: "Sine.inOut",
    });
  }

  private drawFountain(x: number, y: number): Phaser.GameObjects.Image {
    const scale = this.layout.uiScale;
    const fountain = this.add.image(x, y + 18 * scale, FOUNTAIN_ASSET_KEY).setDepth(36).setAlpha(0);
    const maxWidth = (this.layout.isPortrait ? 318 : 420) * scale;
    const maxHeight = (this.layout.isPortrait ? 248 : 318) * scale;

    this.fitImageToBox(fountain, maxWidth, maxHeight);
    this.tweens.add({
      targets: fountain,
      alpha: 1,
      scaleX: fountain.scaleX * 1.04,
      scaleY: fountain.scaleY * 1.04,
      duration: 360,
      ease: "Back.out",
    });

    return fountain;
  }

  private sparkle(x: number, y: number, count: number): void {
    const maxSize = (count > 12 ? 280 : 142) * this.layout.uiScale;
    const burst = this.add.image(x, y, SPARKLE_BURST_ASSET_KEY).setAlpha(count > 12 ? 0.9 : 0.78).setDepth(80);

    this.fitImageToBox(burst, maxSize, maxSize);
    const finalScaleX = burst.scaleX * 1.08;
    const finalScaleY = burst.scaleY * 1.08;
    burst.setScale(burst.scaleX * 0.62, burst.scaleY * 0.62);

    this.tweens.add({
      targets: burst,
      scaleX: finalScaleX,
      scaleY: finalScaleY,
      alpha: 0,
      duration: count > 12 ? 860 : 540,
      ease: "Sine.out",
      onComplete: () => burst.destroy(),
    });
  }

  private addCoverImage(
    key: string,
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
  ): Phaser.GameObjects.Image {
    const image = this.add.image(x, y, key).setDepth(depth);
    const scale = Math.max(width / image.width, height / image.height);

    image.setScale(scale);
    return image;
  }

  private fitImageToBox(image: Phaser.GameObjects.Image, maxWidth: number, maxHeight: number): Phaser.GameObjects.Image {
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height);

    image.setScale(scale);
    return image;
  }

  private getNavButtonSize(): number {
    return Phaser.Math.Clamp(this.layout.viewportWidth * 0.1, MIN_NAV_BUTTON_SIZE, MAX_NAV_BUTTON_SIZE);
  }
}
