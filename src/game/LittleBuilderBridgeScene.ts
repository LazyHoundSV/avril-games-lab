import Phaser from "phaser";
import {
  createBridgeTargets,
  createBridgeBlocks,
  isBridgeComplete,
  isCorrectBridgeTarget,
  type BridgeBlock,
  type BridgeBlockKind,
  type BridgeTargetKind,
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
const LITTLE_BUILDER_ASSET_BASE_PATH = "/assets/little-builder-bridge";
const COMPLETION_APPLAUSE_ASSET_KEY = "little-builder-bridge-applause-complete";
const COMPLETION_APPLAUSE_ASSET_FILES = [
  `${COLOR_BASKET_ASSET_BASE_PATH}/audio/applause-complete-chosic-3s.ogg`,
  `${COLOR_BASKET_ASSET_BASE_PATH}/audio/applause-complete-chosic-3s.mp3`,
];
const REPLAY_BUTTON_ASSET_KEY = "little-builder-bridge-replay-button";
const REPLAY_BUTTON_ASSET_FILE = "replay_icon_hq_248.png";
const BACKGROUND_ASSET_KEY = "little-builder-bridge-background";
const PUPPY_ASSET_KEY = "little-builder-bridge-puppy";
const PUPPY_WALKING_ASSET_KEY = "little-builder-bridge-puppy-walking";
const GIRL_ASSET_KEY = "little-builder-bridge-girl";
const BALLOONS_ASSET_KEY = "little-builder-bridge-balloons";
const BLOCK_SOURCE_SIZE = 250;
const CHARACTER_SOURCE_HEIGHT = 1536;
const SQUARE_ASSET_SIZE = 1024;
const MIN_NAV_BUTTON_SIZE = 58;
const MAX_NAV_BUTTON_SIZE = 74;

export const LITTLE_BUILDER_BRIDGE_LEVEL_COMPLETE_EVENT = "little-builder-bridge:level-complete";

interface BridgeTargetState {
  id: BridgeTargetKind;
  accepts: BridgeBlockKind[];
  zone: Phaser.GameObjects.Zone;
  glow: Phaser.GameObjects.Ellipse;
  layout: BridgeTargetLayout;
  width: number;
  height: number;
  placed: boolean;
}

interface DraggableBridgeBlock {
  data: BridgeBlock;
  sprite: Phaser.GameObjects.Image;
  origin: Phaser.Math.Vector2;
  baseScale: number;
}

const BLOCK_ASSET_FILES: Record<string, string> = {
  "little-builder-bridge-wood-block": "wood_block_clean_250x250_transparent.png",
  "little-builder-bridge-stone-arch-block": "stone_arch_block_clean_250x250_transparent.png",
  "little-builder-bridge-stone-block": "stone_block_clean_250x250_transparent.png",
};

export class LittleBuilderBridgeScene extends Phaser.Scene {
  private layout: LittleBuilderBridgeLayout = computeLittleBuilderBridgeLayout(960, 540);
  private targets: BridgeTargetState[] = [];
  private blocks: DraggableBridgeBlock[] = [];
  private placedCount = 0;
  private totalCount = 0;
  private puppy?: Phaser.GameObjects.Image;
  private replayButton?: Phaser.GameObjects.Image;
  private replayPulse?: Phaser.Tweens.Tween;
  private replayTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super("LittleBuilderBridge");
  }

  preload(): void {
    this.load.audio(COMPLETION_APPLAUSE_ASSET_KEY, COMPLETION_APPLAUSE_ASSET_FILES);
    this.load.image(REPLAY_BUTTON_ASSET_KEY, `${COLOR_BASKET_ASSET_BASE_PATH}/${REPLAY_BUTTON_ASSET_FILE}`);
    this.load.image(BACKGROUND_ASSET_KEY, `${LITTLE_BUILDER_ASSET_BASE_PATH}/background.png`);
    this.load.image(PUPPY_ASSET_KEY, `${LITTLE_BUILDER_ASSET_BASE_PATH}/puppy.png`);
    this.load.image(PUPPY_WALKING_ASSET_KEY, `${LITTLE_BUILDER_ASSET_BASE_PATH}/puppy-walking.png`);
    this.load.image(GIRL_ASSET_KEY, `${LITTLE_BUILDER_ASSET_BASE_PATH}/girl.png`);
    this.load.image(BALLOONS_ASSET_KEY, `${LITTLE_BUILDER_ASSET_BASE_PATH}/celebration-balloons.png`);

    for (const [textureKey, file] of Object.entries(BLOCK_ASSET_FILES)) {
      this.load.image(textureKey, `${LITTLE_BUILDER_ASSET_BASE_PATH}/${file}`);
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
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xbceeff).setOrigin(0).setDepth(-2);
    this.add.image(playArea.centerX, playArea.centerY, BACKGROUND_ASSET_KEY).setDisplaySize(playArea.width, playArea.height).setDepth(0);
    this.createTitle();
    this.drawTray();
    this.puppy = this.createPuppy();
    this.createGirl();
  }

  private drawTray(): void {
    const { playArea } = this.layout;
    const graphics = this.add.graphics();
    const trayInset = 20 * this.layout.uiScale;
    const trayHeight = (this.layout.isPortrait ? 184 : 138) * this.layout.blockScale;
    const trayY = playArea.y + playArea.height - trayHeight - 10 * this.layout.uiScale;

    graphics.fillStyle(0xfff6dc, 0.94);
    graphics.lineStyle(2 * this.layout.uiScale, 0xb87f47, 0.36);
    graphics.fillRoundedRect(playArea.x + trayInset, trayY, playArea.width - trayInset * 2, trayHeight, 22 * this.layout.uiScale);
    graphics.strokeRoundedRect(playArea.x + trayInset, trayY, playArea.width - trayInset * 2, trayHeight, 22 * this.layout.uiScale);
    graphics.setDepth(18);
  }

  private createTargets(): void {
    const targets = createBridgeTargets();

    for (const targetLayout of getLittleBuilderBridgeTargets(this.layout)) {
      const target = targets.find((candidate) => candidate.id === targetLayout.id);

      if (!target) {
        continue;
      }

      const width = targetLayout.width * targetLayout.scale;
      const height = targetLayout.height * targetLayout.scale;
      const glow = this.add.ellipse(targetLayout.x, targetLayout.y, width * 1.34, height * 1.26, 0xffffff, 0).setDepth(9);
      const zoneWidth = Math.max(148, width + 62);
      const zoneHeight = Math.max(136, height + 56);
      const zone = this.add.zone(targetLayout.x, targetLayout.y, zoneWidth, zoneHeight).setRectangleDropZone(zoneWidth, zoneHeight);

      this.targets.push({
        id: targetLayout.id,
        accepts: target.accepts,
        zone,
        glow,
        layout: targetLayout,
        width,
        height,
        placed: false,
      });
    }
  }

  private createBlocks(): void {
    const blocks = createBridgeBlocks();
    const positions = getLittleBuilderBridgeTrayPositions(this.layout);
    this.totalCount = blocks.length;

    blocks.forEach((block, index) => {
      const origin = new Phaser.Math.Vector2(positions[index].x, positions[index].y);
      const baseScale = this.getTrayBlockScale();
      const sprite = this.add.image(origin.x, origin.y, block.textureKey).setScale(baseScale).setDepth(26);

      sprite.setInteractive({ useHandCursor: true });

      const draggable = { data: block, sprite, origin, baseScale };
      this.blocks.push(draggable);
      this.registerBlockDragHandlers(draggable);
      this.input.setDraggable(sprite);
      this.tweens.add({
        targets: sprite,
        y: origin.y - 4,
        duration: 1450 + index * 120,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    });
  }

  private registerBlockDragHandlers(block: DraggableBridgeBlock): void {
    block.sprite.on("pointerdown", () => {
      this.sound.unlock();
    });

    block.sprite.on("dragstart", () => {
      this.tweens.killTweensOf(block.sprite);
      block.sprite.setDepth(45);
      this.tweens.add({ targets: block.sprite, scale: block.baseScale * 1.08, duration: 110, ease: "Sine.out" });
      this.setTargetDragState(undefined, this.findMatchingTargets(block.data.id));
    });

    block.sprite.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      block.sprite.setPosition(dragX, dragY);
      const target = this.findHoveredTarget(dragX, dragY, block.sprite);
      this.setTargetDragState(
        target && isCorrectBridgeTarget(block.data, target) ? target : undefined,
        this.findMatchingTargets(block.data.id),
      );
    });

    block.sprite.on("dragend", () => {
      const target = this.findHoveredTarget(block.sprite.x, block.sprite.y, block.sprite);
      this.setTargetDragState(undefined);

      if (target && isCorrectBridgeTarget(block.data, target)) {
        this.placeBlock(block, target);
        return;
      }

      this.returnBlock(block);
    });
  }

  private findMatchingTargets(id: BridgeBlockKind): BridgeTargetState[] {
    return this.targets.filter((target) => !target.placed && target.accepts.includes(id));
  }

  private findHoveredTarget(x: number, y: number, sprite: Phaser.GameObjects.Image): BridgeTargetState | undefined {
    if (!sprite.input?.enabled) {
      return undefined;
    }

    const bounds = sprite.getBounds();

    return this.targets
      .filter((target) => {
        if (target.placed) {
          return false;
        }

        const targetBounds = Phaser.Geom.Rectangle.Clone(target.zone.getBounds());
        Phaser.Geom.Rectangle.Inflate(targetBounds, 34 * target.layout.scale, 30 * target.layout.scale);
        return targetBounds.contains(x, y) || Phaser.Geom.Intersects.RectangleToRectangle(bounds, targetBounds);
      })
      .sort(
        (a, b) =>
          Phaser.Math.Distance.Between(x, y, a.zone.x, a.zone.y) -
          Phaser.Math.Distance.Between(x, y, b.zone.x, b.zone.y),
      )[0];
  }

  private setTargetDragState(active?: BridgeTargetState, candidates: BridgeTargetState[] = []): void {
    for (const target of this.targets) {
      const isActive = target === active;
      const isCandidate = candidates.includes(target);
      target.glow.setAlpha(isActive ? 0.42 : isCandidate ? 0.18 : 0);
      target.glow.setScale(isActive ? 1.08 : 1);
    }
  }

  private placeBlock(block: DraggableBridgeBlock, target: BridgeTargetState): void {
    const placedPosition = this.getPlacedBlockPosition(target);

    block.sprite.disableInteractive();
    this.input.setDraggable(block.sprite, false);
    this.placedCount += 1;
    target.placed = true;
    this.tweens.killTweensOf(block.sprite);
    this.sound.play(COMPLETION_APPLAUSE_ASSET_KEY, { volume: 0.18, rate: 1.35, seek: 0.45 });

    this.tweens.add({
      targets: block.sprite,
      x: placedPosition.x,
      y: placedPosition.y,
      scale: this.getTargetScale(target.layout),
      duration: 165,
      ease: "Back.out",
      onComplete: () => {
        block.sprite.setDepth(14);
        target.glow.setVisible(false);
        this.sparkle(target.zone.x, target.zone.y, block.data.color, 7);
        this.tweens.add({
          targets: block.sprite,
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
    this.tweens.killTweensOf(block.sprite);
    this.tweens.add({
      targets: block.sprite,
      x: block.origin.x,
      y: block.origin.y,
      scale: block.baseScale,
      duration: 230,
      ease: "Sine.inOut",
      onComplete: () => block.sprite.setDepth(26),
    });
  }

  private completeRound(): void {
    const { playArea } = this.layout;
    const puppy = this.puppy;
    const endX = playArea.x + playArea.width * (this.layout.isPortrait ? 0.77 : 0.78);
    const endY = this.getWalkingPuppyY();

    this.input.enabled = false;
    this.game.events.emit(LITTLE_BUILDER_BRIDGE_LEVEL_COMPLETE_EVENT);
    this.sound.play(COMPLETION_APPLAUSE_ASSET_KEY, { volume: 0.5, seek: 0.1 });
    this.sparkle(playArea.centerX, playArea.y + playArea.height * 0.38, 0xffffff, 18);

    if (puppy) {
      puppy.setDepth(42);
      this.tweens.killTweensOf(puppy);
      puppy.setTexture(PUPPY_WALKING_ASSET_KEY);
      puppy.setScale(this.getWalkingPuppyScale());
      this.tweens.add({
        targets: puppy,
        x: endX,
        y: endY,
        duration: 1350,
        ease: "Sine.inOut",
        onComplete: () => this.showBalloon(endX, playArea.y + playArea.height * (this.layout.isPortrait ? 0.32 : 0.3)),
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

  private createTitle(): void {
    const { playArea } = this.layout;
    const titleWidth = this.layout.isPortrait
      ? Phaser.Math.Clamp(playArea.width - 124, 224, 286)
      : Phaser.Math.Clamp(playArea.width * 0.38, 306, 456);
    const titleHeight = Phaser.Math.Clamp(playArea.height * (this.layout.isPortrait ? 0.065 : 0.085), 48, 64);
    const titleX = this.layout.isPortrait ? playArea.x + 76 + titleWidth / 2 : playArea.centerX;
    const titleY = playArea.y + titleHeight * 0.8;
    const radius = 20 * this.layout.uiScale;
    const graphics = this.add.graphics().setDepth(29);
    const fontSize = Math.round((this.layout.isPortrait ? 22 : 31) * this.layout.uiScale);

    graphics.fillStyle(0x8a542c, 0.93);
    graphics.fillRoundedRect(titleX - titleWidth / 2, titleY - titleHeight / 2, titleWidth, titleHeight, radius);
    graphics.lineStyle(3 * this.layout.uiScale, 0xffe4aa, 0.62);
    graphics.strokeRoundedRect(titleX - titleWidth / 2, titleY - titleHeight / 2, titleWidth, titleHeight, radius);

    this.add
      .text(titleX, titleY, "Little Builder Bridge", {
        color: "#ffffff",
        fontFamily: "Arial Rounded MT Bold, Trebuchet MS, sans-serif",
        fontSize: `${fontSize}px`,
        fontStyle: "bold",
        stroke: "#5a3218",
        strokeThickness: Math.max(3, Math.round(4 * this.layout.uiScale)),
      })
      .setOrigin(0.5)
      .setDepth(30);
  }

  private createPuppy(): Phaser.GameObjects.Image {
    const { playArea } = this.layout;
    const targetHeight = (this.layout.isPortrait ? 170 : 156) * this.layout.uiScale;
    const puppyScale = Phaser.Math.Clamp(targetHeight / CHARACTER_SOURCE_HEIGHT, 0.085, 0.14);
    const puppyX = playArea.x + playArea.width * (this.layout.isPortrait ? 0.15 : 0.12);
    const puppyY = playArea.y + playArea.height * (this.layout.isPortrait ? 0.47 : 0.49);
    const puppy = this.add.image(puppyX, puppyY, PUPPY_ASSET_KEY).setScale(puppyScale).setDepth(16);

    this.tweens.add({
      targets: puppy,
      y: puppyY + 4 * this.layout.uiScale,
      duration: 1650,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    return puppy;
  }

  private createGirl(): Phaser.GameObjects.Image {
    const { playArea } = this.layout;
    const targetHeight = (this.layout.isPortrait ? 210 : 205) * this.layout.uiScale;
    const girlScale = Phaser.Math.Clamp(targetHeight / CHARACTER_SOURCE_HEIGHT, 0.105, 0.18);
    const girlX = playArea.x + playArea.width * (this.layout.isPortrait ? 0.88 : 0.9);
    const girlY = playArea.y + playArea.height * (this.layout.isPortrait ? 0.43 : 0.47);
    const girl = this.add.image(girlX, girlY, GIRL_ASSET_KEY).setScale(girlScale).setDepth(15);

    this.tweens.add({
      targets: girl,
      y: girlY + 4 * this.layout.uiScale,
      duration: 1750,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    return girl;
  }

  private getNavButtonSize(): number {
    return Phaser.Math.Clamp(this.layout.viewportWidth * 0.1, MIN_NAV_BUTTON_SIZE, MAX_NAV_BUTTON_SIZE);
  }

  private getTrayBlockScale(): number {
    const targetVisualSize = (this.layout.isPortrait ? 128 : 122) * this.layout.blockScale;
    return Phaser.Math.Clamp(targetVisualSize / BLOCK_SOURCE_SIZE, 0.38, 0.58);
  }

  private getTargetScale(targetLayout: BridgeTargetLayout): number {
    return (Math.max(targetLayout.width, targetLayout.height) * targetLayout.scale) / BLOCK_SOURCE_SIZE;
  }

  private getWalkingPuppyScale(): number {
    const targetHeight = (this.layout.isPortrait ? 190 : 176) * this.layout.uiScale;
    return Phaser.Math.Clamp(targetHeight / SQUARE_ASSET_SIZE, 0.15, 0.24);
  }

  private getWalkingPuppyY(): number {
    const targetRowY = getLittleBuilderBridgeTargets(this.layout)[1]?.y ?? this.layout.playArea.centerY;

    return targetRowY - 50 * this.layout.uiScale;
  }

  private getPlacedBlockPosition(target: BridgeTargetState): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(target.zone.x, target.zone.y + (target.id === "center-wood" ? -2 : 0) * this.layout.uiScale);
  }

  private showBalloon(x: number, y: number): void {
    const targetHeight = (this.layout.isPortrait ? 150 : 170) * this.layout.uiScale;
    const balloons = this.add
      .image(x + 20 * this.layout.uiScale, y, BALLOONS_ASSET_KEY)
      .setScale(Phaser.Math.Clamp(targetHeight / SQUARE_ASSET_SIZE, 0.12, 0.2))
      .setDepth(55);

    this.tweens.add({
      targets: balloons,
      y: balloons.y - 18 * this.layout.uiScale,
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
