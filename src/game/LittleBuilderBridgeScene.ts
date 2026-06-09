import Phaser from "phaser";
import {
  createBridgeBlocks,
  isBridgeComplete,
  isCorrectBridgeTarget,
  type BridgeBlock,
  type BridgeBlockKind,
} from "./littleBuilderBridge";
import {
  computeLittleBuilderBridgeLayout,
  getLittleBuilderBridgeReplayPosition,
  getLittleBuilderBridgeTargets,
  getLittleBuilderBridgeTrayPositions,
  type BridgeTargetLayout,
  type LittleBuilderBridgeLayout,
} from "./littleBuilderBridgeLayout";

const COLOR_BASKET_ASSET_BASE_PATH = "/assets/color-basket-garden";
const COMPLETION_APPLAUSE_ASSET_KEY = "little-builder-bridge-applause-complete";
const COMPLETION_APPLAUSE_ASSET_FILES = [
  `${COLOR_BASKET_ASSET_BASE_PATH}/audio/applause-complete-chosic-3s.ogg`,
  `${COLOR_BASKET_ASSET_BASE_PATH}/audio/applause-complete-chosic-3s.mp3`,
];
const REPLAY_BUTTON_ASSET_KEY = "little-builder-bridge-replay-button";
const REPLAY_BUTTON_ASSET_FILE = "replay_icon_hq_248.png";
const MIN_NAV_BUTTON_SIZE = 58;
const MAX_NAV_BUTTON_SIZE = 74;

interface BridgeTargetState {
  id: BridgeBlockKind;
  zone: Phaser.GameObjects.Zone;
  visual: Phaser.GameObjects.Container;
  glow: Phaser.GameObjects.Ellipse;
  layout: BridgeTargetLayout;
}

interface DraggableBridgeBlock {
  data: BridgeBlock;
  container: Phaser.GameObjects.Container;
  origin: Phaser.Math.Vector2;
  baseScale: number;
}

export class LittleBuilderBridgeScene extends Phaser.Scene {
  private layout: LittleBuilderBridgeLayout = computeLittleBuilderBridgeLayout(960, 540);
  private targets: BridgeTargetState[] = [];
  private blocks: DraggableBridgeBlock[] = [];
  private placedCount = 0;
  private totalCount = 0;
  private puppy?: Phaser.GameObjects.Container;
  private replayButton?: Phaser.GameObjects.Image;
  private replayPulse?: Phaser.Tweens.Tween;
  private replayTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super("LittleBuilderBridge");
  }

  preload(): void {
    this.load.audio(COMPLETION_APPLAUSE_ASSET_KEY, COMPLETION_APPLAUSE_ASSET_FILES);
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
    const reportedVisibleWidth =
      typeof window === "undefined"
        ? this.scale.width
        : Math.min(
            this.scale.width,
            window.visualViewport?.width ?? this.scale.width,
            document.documentElement.clientWidth || this.scale.width,
            window.innerWidth || this.scale.width,
          );
    const visibleWidth = reportedVisibleWidth <= 520 ? Math.min(reportedVisibleWidth, 390) : reportedVisibleWidth;
    this.layout = computeLittleBuilderBridgeLayout(visibleWidth, this.scale.height);
    this.replayTimer?.remove(false);
    this.replayPulse?.stop();
    this.input.enabled = true;
    this.children.removeAll();
    this.targets = [];
    this.blocks = [];
    this.placedCount = 0;
    this.replayButton = undefined;
    this.replayPulse = undefined;

    this.drawScene();
    this.createTargets();
    this.createBlocks();
  }

  private drawScene(): void {
    const { playArea } = this.layout;
    const graphics = this.add.graphics();

    graphics.fillGradientStyle(0xb9ecff, 0xb9ecff, 0xf4fbff, 0xf4fbff, 1);
    graphics.fillRect(playArea.x, playArea.y, playArea.width, playArea.height);

    this.drawCloud(playArea.x + playArea.width * 0.22, playArea.y + playArea.height * 0.14, 1.1);
    this.drawCloud(playArea.x + playArea.width * 0.76, playArea.y + playArea.height * 0.18, 0.88);

    graphics.fillStyle(0x9fd76f, 1);
    graphics.fillEllipse(playArea.centerX, playArea.y + playArea.height * 0.75, playArea.width * 1.12, playArea.height * 0.48);
    graphics.fillStyle(0x66cde0, 1);
    graphics.fillRoundedRect(
      playArea.x + playArea.width * 0.08,
      playArea.y + playArea.height * 0.49,
      playArea.width * 0.84,
      playArea.height * 0.17,
      34 * this.layout.uiScale,
    );
    graphics.fillStyle(0x9be4ef, 0.78);
    graphics.fillRoundedRect(
      playArea.x + playArea.width * 0.15,
      playArea.y + playArea.height * 0.53,
      playArea.width * 0.7,
      playArea.height * 0.055,
      20 * this.layout.uiScale,
    );

    this.drawBridgeBase();
    this.puppy = this.drawPuppy(playArea.x + playArea.width * 0.12, playArea.y + playArea.height * 0.47, 1);
    this.drawTray();
  }

  private drawBridgeBase(): void {
    const { playArea } = this.layout;
    const graphics = this.add.graphics();
    const bridgeY = playArea.y + playArea.height * (this.layout.isPortrait ? 0.43 : 0.48);
    const bridgeX = playArea.x + playArea.width * (this.layout.isPortrait ? 0.14 : 0.24);
    const bridgeWidth = playArea.width * (this.layout.isPortrait ? 0.72 : 0.55);
    const railY = bridgeY - 62 * this.layout.uiScale;

    graphics.lineStyle(10 * this.layout.uiScale, 0x95613d, 0.95);
    graphics.beginPath();
    graphics.moveTo(bridgeX, railY);
    graphics.lineTo(bridgeX + bridgeWidth, railY);
    graphics.strokePath();
    graphics.lineStyle(8 * this.layout.uiScale, 0x7e5134, 0.9);
    graphics.beginPath();
    graphics.moveTo(bridgeX + bridgeWidth * 0.08, bridgeY + 46 * this.layout.uiScale);
    graphics.lineTo(bridgeX + bridgeWidth * 0.92, bridgeY + 46 * this.layout.uiScale);
    graphics.strokePath();

    for (let index = 0; index < 5; index += 1) {
      const x = bridgeX + bridgeWidth * (0.1 + index * 0.2);
      graphics.lineStyle(7 * this.layout.uiScale, 0x8c5b39, 0.92);
      graphics.beginPath();
      graphics.moveTo(x, railY + 8 * this.layout.uiScale);
      graphics.lineTo(x, bridgeY + 38 * this.layout.uiScale);
      graphics.strokePath();
    }
  }

  private drawTray(): void {
    const { playArea } = this.layout;
    const graphics = this.add.graphics();
    const trayInset = 20 * this.layout.uiScale;
    const trayHeight = (this.layout.isPortrait ? 178 : 128) * this.layout.blockScale;
    const trayY = playArea.y + playArea.height - trayHeight - 10 * this.layout.uiScale;

    graphics.fillStyle(0xfff6dc, 0.94);
    graphics.lineStyle(2 * this.layout.uiScale, 0xb87f47, 0.32);
    graphics.fillRoundedRect(playArea.x + trayInset, trayY, playArea.width - trayInset * 2, trayHeight, 22 * this.layout.uiScale);
    graphics.strokeRoundedRect(playArea.x + trayInset, trayY, playArea.width - trayInset * 2, trayHeight, 22 * this.layout.uiScale);
    graphics.setDepth(18);
  }

  private createTargets(): void {
    for (const targetLayout of getLittleBuilderBridgeTargets(this.layout)) {
      const width = targetLayout.width * targetLayout.scale;
      const height = targetLayout.height * targetLayout.scale;
      const glow = this.add.ellipse(targetLayout.x, targetLayout.y, width * 1.3, height * 1.3, 0xffffff, 0).setDepth(9);
      const visual = this.drawBlockShape(targetLayout.id, targetLayout.x, targetLayout.y, width, height, 0xb18b66, 0x8f6d4f, 0.32);
      visual.setDepth(10);
      const zoneWidth = Math.max(112, width + 34);
      const zoneHeight = Math.max(104, height + 34);
      const zone = this.add.zone(targetLayout.x, targetLayout.y, zoneWidth, zoneHeight).setRectangleDropZone(zoneWidth, zoneHeight);

      this.targets.push({ id: targetLayout.id, zone, visual, glow, layout: targetLayout });
      this.tweens.add({
        targets: visual,
        alpha: 0.62,
        duration: 1700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }
  }

  private createBlocks(): void {
    const blocks = createBridgeBlocks();
    const positions = getLittleBuilderBridgeTrayPositions(this.layout);
    this.totalCount = blocks.length;

    blocks.forEach((block, index) => {
      const origin = new Phaser.Math.Vector2(positions[index].x, positions[index].y);
      const baseScale = this.getBlockScale();
      const container = this.drawBlockShape(block.id, origin.x, origin.y, 96, 84, block.color, block.shadow, 1);
      container.setScale(baseScale);
      container.setDepth(26);
      container.setSize(108, 96);
      container.setInteractive(
        new Phaser.Geom.Rectangle(-54, -48, 108, 96),
        Phaser.Geom.Rectangle.Contains,
      );

      const draggable = { data: block, container, origin, baseScale };
      this.blocks.push(draggable);
      this.registerBlockDragHandlers(draggable);
      this.input.setDraggable(container);
      this.tweens.add({
        targets: container,
        y: origin.y - 4,
        duration: 1450 + index * 120,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    });
  }

  private registerBlockDragHandlers(block: DraggableBridgeBlock): void {
    block.container.on("pointerdown", () => {
      this.sound.unlock();
    });

    block.container.on("dragstart", () => {
      this.tweens.killTweensOf(block.container);
      block.container.setDepth(45);
      this.tweens.add({ targets: block.container, scale: block.baseScale * 1.08, duration: 110, ease: "Sine.out" });
      this.setTargetDragState(this.findMatchingTarget(block.data.id));
    });

    block.container.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      block.container.setPosition(dragX, dragY);
      const target = this.findHoveredTarget(dragX, dragY);
      this.setTargetDragState(target && isCorrectBridgeTarget(block.data, target) ? target : this.findMatchingTarget(block.data.id));
    });

    block.container.on("dragend", () => {
      const target = this.findHoveredTarget(block.container.x, block.container.y);
      this.setTargetDragState(undefined);

      if (target && isCorrectBridgeTarget(block.data, target)) {
        this.placeBlock(block, target);
        return;
      }

      this.returnBlock(block);
    });
  }

  private findMatchingTarget(id: BridgeBlockKind): BridgeTargetState | undefined {
    return this.targets.find((target) => target.id === id);
  }

  private findHoveredTarget(x: number, y: number): BridgeTargetState | undefined {
    return this.targets
      .filter((target) => {
        const targetBounds = Phaser.Geom.Rectangle.Clone(target.zone.getBounds());
        Phaser.Geom.Rectangle.Inflate(targetBounds, 24 * target.layout.scale, 24 * target.layout.scale);
        return targetBounds.contains(x, y);
      })
      .sort(
        (a, b) =>
          Phaser.Math.Distance.Between(x, y, a.zone.x, a.zone.y) -
          Phaser.Math.Distance.Between(x, y, b.zone.x, b.zone.y),
      )[0];
  }

  private setTargetDragState(active?: BridgeTargetState): void {
    for (const target of this.targets) {
      const isActive = target === active;
      target.glow.setAlpha(isActive ? 0.42 : 0);
      target.visual.setAlpha(isActive ? 0.86 : 0.54);
      target.visual.setScale(isActive ? 1.04 : 1);
    }
  }

  private placeBlock(block: DraggableBridgeBlock, target: BridgeTargetState): void {
    block.container.disableInteractive();
    this.input.setDraggable(block.container, false);
    this.placedCount += 1;
    this.tweens.killTweensOf(block.container);
    this.sound.play(COMPLETION_APPLAUSE_ASSET_KEY, { volume: 0.18, rate: 1.35, seek: 0.45 });

    this.tweens.add({
      targets: block.container,
      x: target.zone.x,
      y: target.zone.y,
      scale: target.layout.scale,
      duration: 165,
      ease: "Back.out",
      onComplete: () => {
        block.container.setDepth(14);
        target.visual.setVisible(false);
        this.sparkle(target.zone.x, target.zone.y, block.data.color, 7);
        this.tweens.add({
          targets: block.container,
          y: target.zone.y + 3 * this.layout.uiScale,
          duration: 120,
          yoyo: true,
          ease: "Sine.out",
        });

        if (isBridgeComplete(this.placedCount, this.totalCount)) {
          this.completeRound();
        }
      },
    });
  }

  private returnBlock(block: DraggableBridgeBlock): void {
    this.tweens.killTweensOf(block.container);
    this.tweens.add({
      targets: block.container,
      x: block.origin.x,
      y: block.origin.y,
      scale: block.baseScale,
      duration: 230,
      ease: "Sine.inOut",
      onComplete: () => block.container.setDepth(26),
    });
  }

  private completeRound(): void {
    const { playArea } = this.layout;
    const puppy = this.puppy;

    this.input.enabled = false;
    this.sound.play(COMPLETION_APPLAUSE_ASSET_KEY, { volume: 0.5, seek: 0.1 });
    this.sparkle(playArea.centerX, playArea.y + playArea.height * 0.38, 0xffffff, 18);

    if (puppy) {
      puppy.setDepth(42);
      this.tweens.add({
        targets: puppy,
        x: playArea.x + playArea.width * 0.88,
        duration: 1350,
        ease: "Sine.inOut",
        onComplete: () => this.showBalloon(playArea.x + playArea.width * 0.88, playArea.y + playArea.height * 0.31),
      });
    }

    this.replayTimer = this.time.delayedCall(1900, () => {
      this.createReplayButton();
      this.input.enabled = true;
    });
  }

  private createReplayButton(): void {
    const position = getLittleBuilderBridgeReplayPosition(this.layout);
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

  private getNavButtonSize(): number {
    return Phaser.Math.Clamp(this.layout.viewportWidth * 0.1, MIN_NAV_BUTTON_SIZE, MAX_NAV_BUTTON_SIZE);
  }

  private getBlockScale(): number {
    return Phaser.Math.Clamp(this.layout.blockScale, 0.86, 1.08);
  }

  private drawBlockShape(
    id: BridgeBlockKind,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    shadow: number,
    alpha: number,
  ): Phaser.GameObjects.Container {
    const graphics = this.add.graphics();
    const radius = 16 * this.layout.uiScale;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    graphics.fillStyle(shadow, alpha);
    graphics.fillRoundedRect(-halfWidth + 4, -halfHeight + 8, width, height, radius);
    graphics.fillStyle(color, alpha);

    if (id === "arch-cap") {
      graphics.fillRoundedRect(-halfWidth, -halfHeight + 20, width, height - 20, radius);
      graphics.fillCircle(0, -halfHeight + 22, width * 0.38);
    } else {
      graphics.fillRoundedRect(-halfWidth, -halfHeight, width, height, radius);
    }

    graphics.lineStyle(4, shadow, alpha * 0.72);
    graphics.strokeRoundedRect(-halfWidth + 8, -halfHeight + 12, width - 16, height - 24, radius * 0.7);

    return this.add.container(x, y, [graphics]);
  }

  private drawPuppy(x: number, y: number, scale: number): Phaser.GameObjects.Container {
    const graphics = this.add.graphics();
    const s = this.layout.uiScale * scale;

    graphics.fillStyle(0x9b673e, 1);
    graphics.fillEllipse(-24 * s, 14 * s, 82 * s, 48 * s);
    graphics.fillCircle(22 * s, -2 * s, 25 * s);
    graphics.fillStyle(0x6d4228, 1);
    graphics.fillEllipse(14 * s, -20 * s, 16 * s, 30 * s);
    graphics.fillEllipse(34 * s, -15 * s, 14 * s, 28 * s);
    graphics.fillStyle(0x3b2418, 1);
    graphics.fillCircle(31 * s, -6 * s, 4 * s);
    graphics.fillCircle(43 * s, 1 * s, 4 * s);
    graphics.fillStyle(0x865436, 1);
    graphics.fillRoundedRect(-52 * s, 31 * s, 16 * s, 28 * s, 5 * s);
    graphics.fillRoundedRect(-8 * s, 31 * s, 16 * s, 28 * s, 5 * s);
    graphics.lineStyle(8 * s, 0x9b673e, 1);
    graphics.beginPath();
    graphics.moveTo(-58 * s, 6 * s);
    graphics.lineTo(-82 * s, -12 * s);
    graphics.strokePath();

    return this.add.container(x, y, [graphics]).setDepth(16);
  }

  private drawCloud(x: number, y: number, scale: number): void {
    const graphics = this.add.graphics();
    const s = this.layout.uiScale * scale;

    graphics.fillStyle(0xffffff, 0.72);
    graphics.fillCircle(x - 34 * s, y + 8 * s, 24 * s);
    graphics.fillCircle(x - 8 * s, y - 4 * s, 31 * s);
    graphics.fillCircle(x + 28 * s, y + 8 * s, 24 * s);
    graphics.fillRoundedRect(x - 54 * s, y + 8 * s, 108 * s, 24 * s, 14 * s);
    graphics.setDepth(1);
  }

  private showBalloon(x: number, y: number): void {
    const graphics = this.add.graphics().setDepth(55);

    graphics.lineStyle(3 * this.layout.uiScale, 0x6d5a8f, 0.85);
    graphics.beginPath();
    graphics.moveTo(x, y + 44 * this.layout.uiScale);
    graphics.lineTo(x, y + 94 * this.layout.uiScale);
    graphics.strokePath();
    graphics.fillStyle(0xff5fa8, 1);
    graphics.fillEllipse(x, y, 52 * this.layout.uiScale, 66 * this.layout.uiScale);
    graphics.fillStyle(0xffffff, 0.42);
    graphics.fillEllipse(x - 10 * this.layout.uiScale, y - 12 * this.layout.uiScale, 14 * this.layout.uiScale, 20 * this.layout.uiScale);

    this.tweens.add({
      targets: graphics,
      y: -18 * this.layout.uiScale,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  private sparkle(x: number, y: number, color: number, count: number): void {
    for (let index = 0; index < count; index += 1) {
      const dot = this.add.circle(x, y, Phaser.Math.Between(4, 8) * this.layout.uiScale, color, 0.88).setDepth(80);
      const angle = (Math.PI * 2 * index) / count;
      const distance = Phaser.Math.Between(28, 76) * this.layout.uiScale;
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
}
