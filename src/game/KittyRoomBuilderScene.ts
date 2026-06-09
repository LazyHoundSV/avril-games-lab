import Phaser from "phaser";
import {
  createRoomObjects,
  isCorrectRoomTarget,
  isRoomComplete,
  type RoomObject,
  type RoomObjectKind,
} from "./kittyRoomBuilder";
import { ColorBasketGardenAudio } from "./colorBasketGardenAudio";
import {
  computeKittyRoomBuilderLayout,
  getKittyRoomObjectTrayPositions,
  getKittyRoomReplayPosition,
  getKittyRoomTargetSlots,
  type KittyRoomBuilderLayout,
} from "./kittyRoomBuilderLayout";

const COLOR_BASKET_ASSET_BASE_PATH = "/assets/color-basket-garden";
const KITTY_ROOM_ASSET_BASE_PATH = "/assets/kitty-room-builder";
const COMPLETION_APPLAUSE_ASSET_KEY = "kitty-room-applause-complete";
const COMPLETION_APPLAUSE_ASSET_FILES = [
  `${COLOR_BASKET_ASSET_BASE_PATH}/audio/applause-complete-chosic-3s.ogg`,
  `${COLOR_BASKET_ASSET_BASE_PATH}/audio/applause-complete-chosic-3s.mp3`,
];
const REPLAY_BUTTON_ASSET_KEY = "kitty-room-replay-button";
const REPLAY_BUTTON_ASSET_FILE = "replay_icon_hq_248.png";
const LANDSCAPE_BACKDROP_ASSET_KEY = "kitty-room-backdrop-landscape";
const PORTRAIT_BACKDROP_ASSET_KEY = "kitty-room-backdrop-portrait";
const HAPPY_KITTEN_ASSET_KEY = "kitty-room-happy-kitten";
const ACTIVE_OBJECT_LIMIT = 3;
const MIN_NAV_BUTTON_SIZE = 58;
const MAX_NAV_BUTTON_SIZE = 74;

export const KITTY_ROOM_BUILDER_LEVEL_COMPLETE_EVENT = "kitty-room-builder:level-complete";

interface RoomTargetState {
  id: RoomObjectKind;
  zone: Phaser.GameObjects.Zone;
  silhouette: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Ellipse;
  scale: number;
  width: number;
  height: number;
}

interface DraggableRoomItem {
  data: RoomObject;
  sprite: Phaser.GameObjects.Image;
  origin: Phaser.Math.Vector2;
  baseScale: number;
}

const OBJECT_SIZE: Record<RoomObjectKind, { width: number; height: number }> = {
  window: { width: 376, height: 367 },
  bed: { width: 416, height: 343 },
  rug: { width: 413, height: 228 },
  bowl: { width: 283, height: 204 },
  yarn: { width: 318, height: 251 },
};

export class KittyRoomBuilderScene extends Phaser.Scene {
  private layout: KittyRoomBuilderLayout = computeKittyRoomBuilderLayout(960, 540);
  private targets: RoomTargetState[] = [];
  private items: DraggableRoomItem[] = [];
  private objectQueue: RoomObject[] = [];
  private placedCount = 0;
  private totalCount = 0;
  private replayButton?: Phaser.GameObjects.Image;
  private replayPulse?: Phaser.Tweens.Tween;
  private replayTimer?: Phaser.Time.TimerEvent;
  private readonly audio = new ColorBasketGardenAudio();

  constructor() {
    super("KittyRoomBuilder");
  }

  preload(): void {
    this.load.audio(COMPLETION_APPLAUSE_ASSET_KEY, COMPLETION_APPLAUSE_ASSET_FILES);
    this.load.image(REPLAY_BUTTON_ASSET_KEY, `${COLOR_BASKET_ASSET_BASE_PATH}/${REPLAY_BUTTON_ASSET_FILE}`);
    this.load.image(LANDSCAPE_BACKDROP_ASSET_KEY, `${KITTY_ROOM_ASSET_BASE_PATH}/room-backdrop-landscape.png`);
    this.load.image(PORTRAIT_BACKDROP_ASSET_KEY, `${KITTY_ROOM_ASSET_BASE_PATH}/room-backdrop-portrait.png`);
    this.load.image(HAPPY_KITTEN_ASSET_KEY, `${KITTY_ROOM_ASSET_BASE_PATH}/happy-kitten.png`);

    for (const object of createRoomObjects()) {
      this.load.image(object.textureKey, `${KITTY_ROOM_ASSET_BASE_PATH}/${object.id}.png`);
      this.load.image(object.silhouetteKey, `${KITTY_ROOM_ASSET_BASE_PATH}/${object.id}-target.png`);
    }
  }

  create(): void {
    this.input.dragDistanceThreshold = 4;
    this.input.topOnly = false;
    this.scale.on("resize", this.startRound, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.startRound, this);
      this.audio.cleanup();
    });
    this.startRound();
  }

  private startRound(): void {
    this.layout = computeKittyRoomBuilderLayout(this.scale.width, this.scale.height);
    this.audio.cleanup();
    this.replayTimer?.remove(false);
    this.replayPulse?.stop();
    this.input.enabled = true;
    this.children.removeAll();
    this.targets = [];
    this.items = [];
    this.objectQueue = [];
    this.placedCount = 0;
    this.replayButton = undefined;
    this.replayPulse = undefined;

    this.drawRoom();
    this.createTargets();
    this.createObjects();
  }

  private drawRoom(): void {
    const { playArea } = this.layout;
    const graphics = this.add.graphics();
    const backdropKey = this.layout.isPortrait ? PORTRAIT_BACKDROP_ASSET_KEY : LANDSCAPE_BACKDROP_ASSET_KEY;
    this.add
      .image(playArea.centerX, playArea.centerY, backdropKey)
      .setDisplaySize(playArea.width, playArea.height)
      .setDepth(0);

    const titleWidth = this.layout.isPortrait
      ? Phaser.Math.Clamp(playArea.width - 128, 224, 268)
      : Phaser.Math.Clamp(playArea.width * 0.38, 286, 420);
    const titleHeight = Phaser.Math.Clamp(playArea.height * (this.layout.isPortrait ? 0.09 : 0.105), 52, 76);
    const titleX = this.layout.isPortrait ? playArea.x + 78 + titleWidth / 2 : playArea.centerX;
    const titleY = playArea.y + titleHeight * 0.72;
    graphics.fillStyle(0x7431c5, 0.93);
    graphics.fillRoundedRect(titleX - titleWidth / 2, titleY - titleHeight / 2, titleWidth, titleHeight, 24);
    graphics.lineStyle(3 * this.layout.uiScale, 0x4a1f94, 0.36);
    graphics.strokeRoundedRect(titleX - titleWidth / 2, titleY - titleHeight / 2, titleWidth, titleHeight, 24);
    this.add
      .text(titleX, titleY, "Kitty Room Builder", {
        color: "#ffffff",
        fontFamily: "Arial Rounded MT Bold, Trebuchet MS, sans-serif",
        fontSize: `${Math.round((this.layout.isPortrait ? 23 : 32) * this.layout.uiScale)}px`,
        fontStyle: "bold",
        stroke: "#5b2ca5",
        strokeThickness: this.layout.isPortrait ? 3 : 4,
      })
      .setOrigin(0.5)
      .setDepth(21);

    const trayInset = 22 * this.layout.uiScale;
    const trayHeight = (this.layout.isPortrait ? 138 : 128) * this.layout.objectScale;
    const trayY = playArea.y + playArea.height - trayHeight - 12 * this.layout.uiScale;
    graphics.fillStyle(0xfff7ec, 0.94);
    graphics.lineStyle(2 * this.layout.uiScale, 0xb67b4f, 0.34);
    graphics.fillRoundedRect(playArea.x + trayInset, trayY, playArea.width - trayInset * 2, trayHeight, 20 * this.layout.uiScale);
    graphics.strokeRoundedRect(playArea.x + trayInset, trayY, playArea.width - trayInset * 2, trayHeight, 20 * this.layout.uiScale);
    graphics.setDepth(19);
  }

  private createTargets(): void {
    for (const slot of getKittyRoomTargetSlots(this.layout)) {
      const targetWidth = slot.width * slot.scale;
      const targetHeight = slot.height * slot.scale;
      const glow = this.add
        .ellipse(slot.x, slot.y, targetWidth * 1.16, targetHeight * 1.16, 0xfff5b8, 0)
        .setDepth(7);
      const silhouette = this.add
        .image(slot.x, slot.y, this.getTargetTextureKey(slot.id))
        .setDisplaySize(targetWidth, targetHeight)
        .setDepth(8)
        .setAlpha(1);
      const zoneWidth = Math.max(104, targetWidth + 28);
      const zoneHeight = Math.max(104, targetHeight + 28);
      const zone = this.add.zone(slot.x, slot.y, zoneWidth, zoneHeight).setRectangleDropZone(zoneWidth, zoneHeight);

      this.targets.push({ id: slot.id, zone, silhouette, glow, scale: slot.scale, width: targetWidth, height: targetHeight });
      this.tweens.add({
        targets: silhouette,
        alpha: 0.86,
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }
  }

  private createObjects(): void {
    this.objectQueue = createRoomObjects();
    this.totalCount = this.objectQueue.length;

    for (const position of this.getActiveObjectPositions().slice(0, this.layout.isPortrait ? ACTIVE_OBJECT_LIMIT : 5)) {
      this.spawnNextObject(position);
    }
  }

  private getActiveObjectPositions(): Phaser.Math.Vector2[] {
    return getKittyRoomObjectTrayPositions(this.layout).map((position) => new Phaser.Math.Vector2(position.x, position.y));
  }

  private spawnNextObject(origin: Phaser.Math.Vector2): void {
    const object = this.objectQueue.shift();
    if (!object) {
      return;
    }

    const scale = this.getObjectScale(object.id);
    const sprite = this.add.image(origin.x, origin.y, object.textureKey).setScale(scale).setDepth(24);
    const draggable: DraggableRoomItem = {
      data: object,
      sprite,
      origin: origin.clone(),
      baseScale: scale,
    };

    this.items.push(draggable);
    sprite.setInteractive({ useHandCursor: true });
    this.registerItemDragHandlers(draggable);
    this.input.setDraggable(sprite);
    this.tweens.add({
      targets: sprite,
      y: origin.y - 4,
      duration: 1500 + this.items.length * 110,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  private registerItemDragHandlers(item: DraggableRoomItem): void {
    item.sprite.on("pointerdown", () => {
      this.audio.prepare();
      this.audio.speak(item.data.label);
    });

    item.sprite.on("dragstart", () => {
      this.tweens.killTweensOf(item.sprite);
      item.sprite.setDepth(42);
      this.tweens.add({ targets: item.sprite, scale: item.baseScale * 1.08, duration: 110, ease: "Sine.out" });
      this.setTargetDragState(this.findMatchingTarget(item.data.id));
    });

    item.sprite.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      item.sprite.setPosition(dragX, dragY);
      const target = this.findHoveredTarget(dragX, dragY, item.sprite);
      this.setTargetDragState(target && isCorrectRoomTarget(item.data, target) ? target : this.findMatchingTarget(item.data.id));
    });

    item.sprite.on("dragend", () => {
      const target = this.findHoveredTarget(item.sprite.x, item.sprite.y, item.sprite);
      this.setTargetDragState(undefined);

      if (target && isCorrectRoomTarget(item.data, target)) {
        this.placeItem(item, target);
        return;
      }

      this.returnItem(item);
    });
  }

  private findMatchingTarget(id: RoomObjectKind): RoomTargetState | undefined {
    return this.targets.find((target) => target.id === id);
  }

  private findHoveredTarget(x: number, y: number, sprite: Phaser.GameObjects.Image): RoomTargetState | undefined {
    if (!sprite.input?.enabled) {
      return undefined;
    }

    const bounds = sprite.getBounds();

    return this.targets
      .filter((target) => {
        const targetBounds = Phaser.Geom.Rectangle.Clone(target.zone.getBounds());
        Phaser.Geom.Rectangle.Inflate(targetBounds, 18 * target.scale, 18 * target.scale);
        return targetBounds.contains(x, y) || Phaser.Geom.Intersects.RectangleToRectangle(bounds, targetBounds);
      })
      .sort(
        (a, b) =>
          Phaser.Math.Distance.Between(x, y, a.zone.x, a.zone.y) -
          Phaser.Math.Distance.Between(x, y, b.zone.x, b.zone.y),
      )[0];
  }

  private setTargetDragState(active?: RoomTargetState): void {
    for (const target of this.targets) {
      const isActive = target === active;
      target.glow.setAlpha(isActive ? 0.45 : 0);
      target.silhouette.setAlpha(isActive ? 1 : 0.92);
      target.silhouette.setDisplaySize(target.width * (isActive ? 1.04 : 1), target.height * (isActive ? 1.04 : 1));
    }
  }

  private placeItem(item: DraggableRoomItem, target: RoomTargetState): void {
    const refillOrigin = item.origin.clone();
    item.sprite.disableInteractive();
    this.input.setDraggable(item.sprite, false);
    this.audio.playDropChime();
    this.placedCount += 1;

    this.tweens.killTweensOf(item.sprite);
    this.tweens.add({
      targets: item.sprite,
      x: target.zone.x,
      y: target.zone.y,
      scale: this.getPlacedScale(item.data.id, target.scale),
      duration: 165,
      ease: "Back.out",
      onComplete: () => {
        item.sprite.setDepth(14);
        target.silhouette.setVisible(false);
        this.sparkle(target.zone.x, target.zone.y, 0xfff4a8, 7);
        this.tweens.add({
          targets: item.sprite,
          angle: item.data.id === "yarn" ? 10 : 0,
          duration: 110,
          yoyo: true,
          ease: "Sine.out",
        });
        this.spawnNextObject(refillOrigin);

        if (isRoomComplete(this.placedCount, this.totalCount)) {
          this.completeRound();
        }
      },
    });
  }

  private returnItem(item: DraggableRoomItem): void {
    this.tweens.killTweensOf(item.sprite);
    this.tweens.add({
      targets: item.sprite,
      x: item.origin.x,
      y: item.origin.y,
      scale: item.baseScale,
      duration: 230,
      ease: "Sine.inOut",
      onComplete: () => item.sprite.setDepth(24),
    });
  }

  private completeRound(): void {
    const { playArea } = this.layout;

    this.input.enabled = false;
    this.game.events.emit(KITTY_ROOM_BUILDER_LEVEL_COMPLETE_EVENT);
    this.sound.play(COMPLETION_APPLAUSE_ASSET_KEY, { volume: 0.75 });
    this.audio.speakCompletionPraise();
    this.sparkle(playArea.centerX, playArea.y + playArea.height * 0.42, 0xffffff, 18);
    this.createHappyKitten(playArea.x + playArea.width * 0.5, playArea.y + playArea.height * 0.43, 1.02);
    this.replayTimer = this.time.delayedCall(1450, () => {
      this.createReplayButton();
      this.input.enabled = true;
    });
  }

  private createReplayButton(): void {
    const position = getKittyRoomReplayPosition(this.layout);
    const size = this.getNavButtonSize();

    this.replayButton = this.add.image(position.x, position.y, REPLAY_BUTTON_ASSET_KEY).setDisplaySize(size, size).setDepth(90);
    this.replayButton.setInteractive({ useHandCursor: true });
    this.replayButton.on("pointerdown", () => this.startRound());
    this.replayPulse = this.tweens.add({
      targets: this.replayButton,
      scaleX: this.replayButton.scaleX * 1.16,
      scaleY: this.replayButton.scaleY * 1.16,
      duration: 460,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  private getNavButtonSize(): number {
    return Phaser.Math.Clamp(this.layout.viewportWidth * 0.1, MIN_NAV_BUTTON_SIZE, MAX_NAV_BUTTON_SIZE);
  }

  private sparkle(x: number, y: number, color: number, count: number): void {
    for (let index = 0; index < count; index += 1) {
      const dot = this.add.circle(x, y, Phaser.Math.Between(4, 9) * this.layout.uiScale, color, 0.9).setDepth(80);
      const angle = (Math.PI * 2 * index) / count;
      const distance = Phaser.Math.Between(36, 86) * this.layout.uiScale;
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.25,
        duration: 560,
        ease: "Sine.out",
        onComplete: () => dot.destroy(),
      });
    }
  }

  private createHappyKitten(x: number, y: number, scale: number): void {
    const finalScale = Phaser.Math.Clamp((this.layout.playArea.width / (this.layout.isPortrait ? 1700 : 4300)) * scale, 0.16, 0.24);
    const kitten = this.add.image(x, y + 60 * this.layout.uiScale, HAPPY_KITTEN_ASSET_KEY).setDepth(55);
    kitten.setScale(0.12);
    this.tweens.add({ targets: kitten, y, scale: finalScale, duration: 520, ease: "Back.out" });
  }

  private getObjectScale(id: RoomObjectKind): number {
    const size = OBJECT_SIZE[id];
    const targetVisualSize = this.layout.isPortrait ? 96 : 140;
    return Math.min((targetVisualSize * this.layout.objectScale) / Math.max(size.width, size.height), this.layout.objectScale);
  }

  private getPlacedScale(id: RoomObjectKind, targetScale: number): number {
    const size = OBJECT_SIZE[id];
    const largerSide = Math.max(size.width, size.height);
    const target = getKittyRoomTargetSlots(this.layout).find((slot) => slot.id === id);

    if (!target) {
      return targetScale;
    }

    return Math.min((Math.max(target.width, target.height) * targetScale) / largerSide, targetScale);
  }

  private getTargetTextureKey(id: RoomObjectKind): string {
    return createRoomObjects().find((object) => object.id === id)?.silhouetteKey ?? `kitty-${id}-target`;
  }
}
