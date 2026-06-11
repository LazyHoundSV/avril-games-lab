import Phaser from "phaser";
import {
  createGardenGateLocks,
  createGardenGateTokens,
  isCorrectGardenGateToken,
  isGardenGateComplete,
  type GateLock,
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
const REPLAY_BUTTON_ASSET_KEY = "garden-gate-locks-replay-button";
const REPLAY_BUTTON_ASSET_FILE = "replay_icon_hq_248.png";
const MIN_NAV_BUTTON_SIZE = 58;
const MAX_NAV_BUTTON_SIZE = 74;

interface GateState {
  data: GateLock;
  slot: GateSlotLayout;
  zone: Phaser.GameObjects.Zone;
  glow: Phaser.GameObjects.Ellipse;
  door: Phaser.GameObjects.Rectangle;
  lockFace: Phaser.GameObjects.Container;
  visitor: Phaser.GameObjects.Container;
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

  constructor() {
    super("GardenGateLocks");
  }

  preload(): void {
    this.load.image(REPLAY_BUTTON_ASSET_KEY, `${COLOR_BASKET_ASSET_BASE_PATH}/${REPLAY_BUTTON_ASSET_FILE}`);
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

    this.drawGarden();
    this.createGates();
    this.createTokens();
  }

  private drawGarden(): void {
    const { playArea } = this.layout;
    const graphics = this.add.graphics();

    graphics.fillGradientStyle(0xbff2ff, 0xbff2ff, 0xd9ffe2, 0xd9ffe2, 1);
    graphics.fillRect(0, 0, this.scale.width, this.scale.height);
    graphics.fillStyle(0x8fd66e, 1);
    graphics.fillRoundedRect(playArea.x, playArea.y + playArea.height * 0.44, playArea.width, playArea.height * 0.56, 28);
    graphics.fillStyle(0x6fb95f, 0.42);
    graphics.fillEllipse(playArea.centerX, playArea.y + playArea.height * 0.7, playArea.width * 0.92, playArea.height * 0.22);

    this.drawCloud(playArea.x + playArea.width * 0.18, playArea.y + playArea.height * 0.13, 0.85);
    this.drawCloud(playArea.x + playArea.width * 0.78, playArea.y + playArea.height * 0.18, 0.72);
    this.drawFlowerPatch(playArea.x + playArea.width * 0.14, playArea.y + playArea.height * 0.62, 0xe96b8f);
    this.drawFlowerPatch(playArea.x + playArea.width * 0.86, playArea.y + playArea.height * 0.64, 0xf2cf55);
    this.drawTray();
  }

  private drawTray(): void {
    const { playArea } = this.layout;
    const graphics = this.add.graphics();
    const trayHeight = (this.layout.isPortrait ? 148 : 136) * this.layout.tokenScale;
    const trayY = playArea.y + playArea.height * (this.layout.isPortrait ? 0.72 : 0.69);
    const inset = 18 * this.layout.uiScale;

    graphics.fillStyle(0xfff5d8, 0.94);
    graphics.lineStyle(2 * this.layout.uiScale, 0x8dbf67, 0.5);
    graphics.fillRoundedRect(playArea.x + inset, trayY, playArea.width - inset * 2, trayHeight, 24 * this.layout.uiScale);
    graphics.strokeRoundedRect(playArea.x + inset, trayY, playArea.width - inset * 2, trayHeight, 24 * this.layout.uiScale);
    graphics.setDepth(10);
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
    const gateColor = lock.id === "red-circle" ? 0xf29d78 : lock.id === "blue-star" ? 0x78c8c9 : 0xf1d270;
    const postColor = lock.id === "red-circle" ? 0xb9654b : lock.id === "blue-star" ? 0x4c8f91 : 0xb99638;
    const baseY = slot.y + slot.gateHeight * 0.1;
    const leftPost = this.add.rectangle(slot.x - slot.gateWidth * 0.38, baseY, slot.gateWidth * 0.14, slot.gateHeight, postColor);
    const rightPost = this.add.rectangle(slot.x + slot.gateWidth * 0.38, baseY, slot.gateWidth * 0.14, slot.gateHeight, postColor);
    const door = this.add.rectangle(slot.x, baseY, slot.gateWidth * 0.62, slot.gateHeight * 0.86, gateColor).setDepth(16);
    const arch = this.add.ellipse(slot.x, baseY - slot.gateHeight * 0.42, slot.gateWidth * 0.62, slot.gateHeight * 0.42, gateColor);
    const glow = this.add.ellipse(slot.x, slot.y, slot.lockSize + 42, slot.lockSize + 42, 0xffffff, 0).setDepth(21);
    const lockFace = this.createLockFace(slot.x, slot.y, lock.color, lock.shape, slot.lockSize).setDepth(23);
    const zoneSize = Math.max(108, slot.lockSize + 46);
    const zone = this.add.zone(slot.x, slot.y, zoneSize, zoneSize).setRectangleDropZone(zoneSize, zoneSize);
    const visitor = this.createVisitor(lock.visitor, slot.x, baseY + slot.gateHeight * 0.18, slot.scale).setAlpha(0).setDepth(14);

    leftPost.setDepth(15);
    rightPost.setDepth(15);
    arch.setDepth(15);

    return { data: lock, slot, zone, glow, door, lockFace, visitor, opened: false };
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
      container.setInteractive(new Phaser.Geom.Circle(0, 0, visualSize * 0.62), Phaser.Geom.Circle.Contains);
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
        this.openGate(gate);
        this.sparkle(gate.zone.x, gate.zone.y, gate.data.color, 8);

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

  private openGate(gate: GateState): void {
    this.tweens.add({
      targets: [gate.door, gate.lockFace],
      x: gate.slot.x + gate.slot.gateWidth * 0.25,
      alpha: 0.42,
      duration: 260,
      ease: "Sine.inOut",
    });
    this.tweens.add({
      targets: gate.visitor,
      y: gate.visitor.y - 18 * this.layout.uiScale,
      alpha: 1,
      duration: 320,
      ease: "Back.out",
    });
  }

  private completeRound(): void {
    const { playArea } = this.layout;
    this.input.enabled = false;
    this.drawFountain(playArea.centerX, playArea.y + playArea.height * (this.layout.isPortrait ? 0.58 : 0.62));
    this.sparkle(playArea.centerX, playArea.y + playArea.height * 0.56, 0xffffff, 18);

    this.gates.forEach((gate, index) => {
      this.tweens.add({
        targets: gate.visitor,
        x: playArea.centerX + (index - 1) * 54 * this.layout.uiScale,
        y: playArea.y + playArea.height * (this.layout.isPortrait ? 0.58 : 0.61),
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
    this.replayButton.on("pointerdown", () => this.startRound());
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
    const shadow = this.add.circle(4, 7, size * 0.48, token.shadow, 0.36);
    const face = this.add.circle(0, 0, size * 0.48, token.color, 1);
    const shine = this.add.circle(-size * 0.12, -size * 0.16, size * 0.13, 0xffffff, 0.42);

    container.add([shadow, face, shine, this.createShape(0, 0, size * 0.34, token.shape, 0xffffff, 0.96)]);
    return container;
  }

  private createLockFace(
    x: number,
    y: number,
    color: number,
    shape: GateToken["shape"],
    size: number,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const back = this.add.circle(0, 0, size * 0.5, color, 1);
    const rim = this.add.circle(0, 0, size * 0.54).setStrokeStyle(4 * this.layout.uiScale, 0xffffff, 0.76);

    container.add([back, rim, this.createShape(0, 0, size * 0.32, shape, 0xffffff, 0.96)]);
    return container;
  }

  private createShape(
    x: number,
    y: number,
    size: number,
    shape: GateToken["shape"],
    color: number,
    alpha: number,
  ): Phaser.GameObjects.Shape {
    if (shape === "square") {
      return this.add.rectangle(x, y, size * 1.25, size * 1.25, color, alpha);
    }

    if (shape === "star") {
      return this.add.star(x, y, 5, size * 0.42, size * 0.86, color, alpha);
    }

    return this.add.circle(x, y, size * 0.68, color, alpha);
  }

  private createVisitor(kind: GateLock["visitor"], x: number, y: number, scale: number): Phaser.GameObjects.Container {
    const size = 42 * scale;
    const container = this.add.container(x, y);

    if (kind === "butterfly") {
      container.add([
        this.add.ellipse(-size * 0.38, 0, size * 0.74, size * 0.9, 0xf59bd6, 1),
        this.add.ellipse(size * 0.38, 0, size * 0.74, size * 0.9, 0xf4d45f, 1),
        this.add.ellipse(0, size * 0.08, size * 0.28, size * 0.95, 0x6c4b8f, 1),
      ]);
      return container;
    }

    const bodyColor = kind === "kitten" ? 0xffb067 : 0xd99058;
    const accentColor = kind === "kitten" ? 0xffd1a3 : 0xffffff;
    container.add([
      this.add.circle(0, size * 0.24, size * 0.55, bodyColor, 1),
      this.add.circle(0, -size * 0.22, size * 0.48, bodyColor, 1),
      this.add.triangle(-size * 0.24, -size * 0.58, 0, size * 0.1, size * 0.24, size * 0.1, 0, -size * 0.34, bodyColor, 1),
      this.add.triangle(size * 0.24, -size * 0.58, 0, size * 0.1, size * 0.24, size * 0.1, 0, -size * 0.34, bodyColor, 1),
      this.add.circle(-size * 0.16, -size * 0.24, size * 0.06, 0x263b35, 1),
      this.add.circle(size * 0.16, -size * 0.24, size * 0.06, 0x263b35, 1),
      this.add.circle(0, -size * 0.06, size * 0.08, accentColor, 1),
    ]);

    return container;
  }

  private drawCloud(x: number, y: number, scale: number): void {
    const graphics = this.add.graphics().setDepth(1);
    graphics.fillStyle(0xffffff, 0.78);
    graphics.fillCircle(x - 28 * scale, y + 8 * scale, 22 * scale);
    graphics.fillCircle(x, y, 30 * scale);
    graphics.fillCircle(x + 34 * scale, y + 9 * scale, 24 * scale);
    graphics.fillRoundedRect(x - 58 * scale, y + 10 * scale, 116 * scale, 22 * scale, 12 * scale);
  }

  private drawFlowerPatch(x: number, y: number, color: number): void {
    for (let index = 0; index < 7; index += 1) {
      const flowerX = x + (index - 3) * 16 * this.layout.uiScale;
      const flowerY = y + (index % 2) * 12 * this.layout.uiScale;
      this.add.rectangle(flowerX, flowerY + 12 * this.layout.uiScale, 4 * this.layout.uiScale, 22 * this.layout.uiScale, 0x3d8748, 1);
      this.add.star(flowerX, flowerY, 6, 4 * this.layout.uiScale, 11 * this.layout.uiScale, color, 0.86);
    }
  }

  private drawFountain(x: number, y: number): void {
    const scale = this.layout.uiScale;
    const graphics = this.add.graphics().setDepth(36);
    graphics.fillStyle(0x6fd4e8, 0.94);
    graphics.fillEllipse(x, y + 24 * scale, 110 * scale, 42 * scale);
    graphics.fillStyle(0xdff9ff, 0.96);
    graphics.fillEllipse(x, y + 14 * scale, 82 * scale, 25 * scale);
    graphics.lineStyle(5 * scale, 0xdff9ff, 0.8);
    graphics.lineBetween(x, y + 6 * scale, x - 44 * scale, y + 2 * scale);
    graphics.lineBetween(x, y + 6 * scale, x + 44 * scale, y + 2 * scale);
    graphics.lineBetween(x, y + 6 * scale, x, y - 26 * scale);
  }

  private sparkle(x: number, y: number, color: number, count: number): void {
    for (let index = 0; index < count; index += 1) {
      const dot = this.add.circle(x, y, Phaser.Math.Between(4, 8) * this.layout.uiScale, color, 0.88).setDepth(80);
      const angle = (Math.PI * 2 * index) / count;
      const distance = Phaser.Math.Between(28, 74) * this.layout.uiScale;
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.3,
        duration: 560,
        ease: "Sine.out",
        onComplete: () => dot.destroy(),
      });
    }
  }

  private getNavButtonSize(): number {
    return Phaser.Math.Clamp(this.layout.viewportWidth * 0.1, MIN_NAV_BUTTON_SIZE, MAX_NAV_BUTTON_SIZE);
  }
}
