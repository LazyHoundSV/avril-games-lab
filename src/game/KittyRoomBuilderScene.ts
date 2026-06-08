import Phaser from "phaser";
import {
  createRoomObjects,
  isCorrectRoomTarget,
  isRoomComplete,
  type RoomObject,
  type RoomObjectKind,
} from "./kittyRoomBuilder";
import {
  computeKittyRoomBuilderLayout,
  getKittyRoomObjectTrayPositions,
  getKittyRoomReplayPosition,
  getKittyRoomTargetSlots,
  type KittyRoomBuilderLayout,
} from "./kittyRoomBuilderLayout";

const COLOR_BASKET_ASSET_BASE_PATH = "/assets/color-basket-garden";
const REPLAY_BUTTON_ASSET_KEY = "kitty-room-replay-button";
const REPLAY_BUTTON_ASSET_FILE = "replay_icon_hq_248.png";
const ACTIVE_OBJECT_LIMIT = 3;

export const KITTY_ROOM_BUILDER_LEVEL_COMPLETE_EVENT = "kitty-room-builder:level-complete";

interface RoomTargetState {
  id: RoomObjectKind;
  zone: Phaser.GameObjects.Zone;
  silhouette: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Ellipse;
  scale: number;
}

interface DraggableRoomItem {
  data: RoomObject;
  sprite: Phaser.GameObjects.Image;
  origin: Phaser.Math.Vector2;
  baseScale: number;
}

const OBJECT_SIZE: Record<RoomObjectKind, { width: number; height: number }> = {
  window: { width: 124, height: 124 },
  bed: { width: 190, height: 128 },
  rug: { width: 184, height: 116 },
  ball: { width: 118, height: 118 },
  bowl: { width: 138, height: 98 },
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

  constructor() {
    super("KittyRoomBuilder");
  }

  preload(): void {
    this.load.image(REPLAY_BUTTON_ASSET_KEY, `${COLOR_BASKET_ASSET_BASE_PATH}/${REPLAY_BUTTON_ASSET_FILE}`);
  }

  create(): void {
    this.input.dragDistanceThreshold = 4;
    this.input.topOnly = false;
    this.createGeneratedTextures();
    this.scale.on("resize", this.startRound, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.startRound, this);
    });
    this.startRound();
  }

  private startRound(): void {
    this.layout = computeKittyRoomBuilderLayout(this.scale.width, this.scale.height);
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
    const wallBottom = playArea.y + playArea.height * (this.layout.isPortrait ? 0.47 : 0.5);
    const floorTop = wallBottom;

    graphics.fillGradientStyle(0xffe2d2, 0xffe2d2, 0xffc9b0, 0xffc9b0, 1);
    graphics.fillRect(playArea.x, playArea.y, playArea.width, wallBottom - playArea.y);
    graphics.fillGradientStyle(0xdba66c, 0xdba66c, 0xb97744, 0xb97744, 1);
    graphics.fillRect(playArea.x, floorTop, playArea.width, playArea.height - floorTop);
    graphics.lineStyle(6 * this.layout.uiScale, 0x9d6c4a, 0.45);
    graphics.lineBetween(playArea.x, wallBottom, playArea.x + playArea.width, wallBottom);

    for (let index = 0; index < 5; index += 1) {
      const y = floorTop + (index + 1) * 34 * this.layout.uiScale;
      graphics.lineStyle(2 * this.layout.uiScale, 0xb77b4f, 0.16);
      graphics.lineBetween(playArea.x, y, playArea.x + playArea.width, y + 22 * this.layout.uiScale);
    }

    this.createPeekingKitten(playArea.x + playArea.width * 0.08, wallBottom - 32 * this.layout.uiScale, 0.68);
  }

  private createTargets(): void {
    for (const slot of getKittyRoomTargetSlots(this.layout)) {
      const glow = this.add
        .ellipse(slot.x, slot.y, slot.width * slot.scale * 1.12, slot.height * slot.scale * 1.12, 0xfff5b8, 0)
        .setDepth(7);
      const silhouette = this.add
        .image(slot.x, slot.y, `${slot.id}-silhouette`)
        .setScale(slot.scale)
        .setDepth(8)
        .setAlpha(0.58);
      const zoneWidth = Math.max(104, slot.width * slot.scale + 28);
      const zoneHeight = Math.max(104, slot.height * slot.scale + 28);
      const zone = this.add.zone(slot.x, slot.y, zoneWidth, zoneHeight).setRectangleDropZone(zoneWidth, zoneHeight);

      this.targets.push({ id: slot.id, zone, silhouette, glow, scale: slot.scale });
      this.tweens.add({
        targets: silhouette,
        alpha: 0.7,
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
      target.silhouette.setAlpha(isActive ? 0.86 : 0.58);
      target.silhouette.setScale(target.scale * (isActive ? 1.04 : 1));
    }
  }

  private placeItem(item: DraggableRoomItem, target: RoomTargetState): void {
    const refillOrigin = item.origin.clone();
    item.sprite.disableInteractive();
    this.input.setDraggable(item.sprite, false);
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
          angle: item.data.id === "ball" ? 10 : 0,
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
    this.sparkle(playArea.centerX, playArea.y + playArea.height * 0.42, 0xffffff, 18);
    this.createHappyKitten(playArea.x + playArea.width * 0.5, playArea.y + playArea.height * 0.43, 1.02);
    this.replayTimer = this.time.delayedCall(1450, () => {
      this.createReplayButton();
      this.input.enabled = true;
    });
  }

  private createReplayButton(): void {
    const position = getKittyRoomReplayPosition(this.layout);
    const size = Phaser.Math.Clamp(this.layout.playArea.width * 0.105, 62, 78);

    this.replayButton = this.add.image(position.x, position.y, REPLAY_BUTTON_ASSET_KEY).setDisplaySize(size, size).setDepth(90);
    this.replayButton.setInteractive({ useHandCursor: true });
    this.replayButton.on("pointerdown", () => this.startRound());
    this.replayPulse = this.tweens.add({
      targets: this.replayButton,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 760,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
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

  private createPeekingKitten(x: number, y: number, scale: number): void {
    const kitten = this.makeKittenContainer(x, y, scale * this.layout.uiScale).setDepth(18);
    kitten.setAlpha(0.82);
    this.tweens.add({ targets: kitten, y: y + 5, duration: 1700, yoyo: true, repeat: -1, ease: "Sine.inOut" });
  }

  private createHappyKitten(x: number, y: number, scale: number): void {
    const kitten = this.makeKittenContainer(x, y + 60 * this.layout.uiScale, scale * this.layout.uiScale).setDepth(55);
    kitten.setScale(0.12);
    this.tweens.add({ targets: kitten, y, scale: scale * this.layout.uiScale, duration: 520, ease: "Back.out" });
  }

  private makeKittenContainer(x: number, y: number, scale: number): Phaser.GameObjects.Container {
    const tail = this.add.ellipse(58, 18, 28, 86, 0xf4b46d, 1).setAngle(-30);
    const body = this.add.ellipse(0, 48, 86, 104, 0xf4b46d, 1);
    const head = this.add.circle(0, -12, 48, 0xf8c789, 1);
    const leftEar = this.add.triangle(-30, -50, 0, 34, 26, 0, 52, 34, 0xf8c789, 1);
    const rightEar = this.add.triangle(30, -50, 0, 34, 26, 0, 52, 34, 0xf8c789, 1);
    const leftEye = this.add.circle(-16, -14, 5, 0x4b342c, 1);
    const rightEye = this.add.circle(16, -14, 5, 0x4b342c, 1);
    const nose = this.add.circle(0, 2, 4, 0x9e5e54, 1);
    const smile = this.add.arc(0, 9, 16, 0, 180, false, 0x4b342c, 0).setStrokeStyle(4, 0x4b342c, 1);
    const shadow = this.add.ellipse(0, 102, 98, 24, 0x4b342c, 0.14);

    return this.add.container(x, y, [shadow, tail, body, head, leftEar, rightEar, leftEye, rightEye, nose, smile]).setScale(scale);
  }

  private getObjectScale(id: RoomObjectKind): number {
    const size = OBJECT_SIZE[id];
    const targetVisualSize = this.layout.isPortrait ? 104 : 112;
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

  private createGeneratedTextures(): void {
    for (const object of createRoomObjects()) {
      this.createObjectTexture(object.id, object.textureKey, false);
      this.createObjectTexture(object.id, object.silhouetteKey, true);
    }
  }

  private createObjectTexture(id: RoomObjectKind, key: string, silhouette: boolean): void {
    if (this.textures.exists(key)) {
      return;
    }

    const graphics = this.make.graphics({ x: 0, y: 0 });
    const fill = silhouette ? 0x9d7d81 : this.getObjectColor(id);
    const stroke = silhouette ? 0x7f6267 : 0xffffff;
    const alpha = silhouette ? 0.58 : 1;

    graphics.fillStyle(fill, alpha);
    graphics.lineStyle(silhouette ? 0 : 5, stroke, silhouette ? 0 : 0.95);

    if (id === "window") {
      graphics.fillRoundedRect(12, 12, 100, 100, 18);
      graphics.strokeRoundedRect(12, 12, 100, 100, 18);
      if (!silhouette) {
        graphics.lineStyle(8, 0xffffff, 0.9);
        graphics.lineBetween(62, 18, 62, 106);
        graphics.lineBetween(18, 62, 106, 62);
      }
    }

    if (id === "bed") {
      graphics.fillRoundedRect(10, 42, 170, 70, 24);
      graphics.strokeRoundedRect(10, 42, 170, 70, 24);
      graphics.fillStyle(silhouette ? fill : 0xfff2cf, alpha);
      graphics.fillRoundedRect(28, 18, 76, 54, 20);
      if (!silhouette) {
        graphics.lineStyle(5, 0xffffff, 0.8);
        graphics.strokeRoundedRect(28, 18, 76, 54, 20);
      }
    }

    if (id === "rug") {
      graphics.fillEllipse(92, 58, 168, 96);
      if (!silhouette) {
        graphics.lineStyle(6, 0xffffff, 0.78);
        graphics.strokeEllipse(92, 58, 168, 96);
      }
    }

    if (id === "ball") {
      graphics.fillCircle(59, 59, 48);
      if (!silhouette) {
        graphics.lineStyle(7, 0xffffff, 0.82);
        graphics.beginPath();
        graphics.arc(59, 59, 34, Phaser.Math.DegToRad(210), Phaser.Math.DegToRad(30));
        graphics.strokePath();
      }
    }

    if (id === "bowl") {
      graphics.fillEllipse(69, 56, 118, 66);
      graphics.fillStyle(silhouette ? fill : 0xffffff, silhouette ? alpha : 0.28);
      graphics.fillEllipse(69, 44, 102, 34);
      if (!silhouette) {
        graphics.lineStyle(5, 0xffffff, 0.82);
        graphics.strokeEllipse(69, 56, 118, 66);
      }
    }

    graphics.generateTexture(key, OBJECT_SIZE[id].width, OBJECT_SIZE[id].height);
    graphics.destroy();
  }

  private getObjectColor(id: RoomObjectKind): number {
    const colors: Record<RoomObjectKind, number> = {
      window: 0x9fe7ff,
      bed: 0xf48da8,
      rug: 0xb98be8,
      ball: 0x69c5ff,
      bowl: 0x83d9a8,
    };

    return colors[id];
  }
}
