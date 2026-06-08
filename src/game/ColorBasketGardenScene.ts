import Phaser from "phaser";
import {
  computeColorBasketGardenLayout,
  getColorBasketGardenBasketSlots,
  getColorBasketGardenObjectPositions,
  getColorBasketGardenReplayPosition,
} from "./colorBasketGardenLayout";
import {
  BASKET_COLORS,
  type BasketColor,
  type GardenAssetKey,
  type GardenObject,
  createRoundObjects,
  getGardenObjectSpokenLabel,
  isCorrectBasket,
  isRoundComplete,
} from "./sorting";
import { ColorBasketGardenAudio } from "./colorBasketGardenAudio";

const ASSET_BASE_PATH = "/assets/color-basket-garden";
const GARDEN_BACKGROUND_ASSET_KEY = "garden-background";

const COLOR_HEX: Record<BasketColor, number> = {
  red: 0xe9544f,
  yellow: 0xf4c84f,
  blue: 0x2f8de8,
  green: 0x63bd34,
  purple: 0x9a58e8,
};

const BASKET_ASSET_FILES: Record<BasketColor, string> = {
  red: "garden_red_basket_124.png",
  yellow: "garden_yellow_basket_124.png",
  blue: "garden_blue_basket_124.png",
  green: "garden_green_basket_124.png",
  purple: "garden_purple_basket_124.png",
};

const HELPER_ASSET_KEY = "kitten-helper";
export const COLOR_BASKET_GARDEN_LEVEL_COMPLETE_EVENT = "color-basket-garden:level-complete";

const OBJECT_ASSET_FILES: Record<GardenAssetKey, string> = {
  "red-flower": "garden_red_flower_124.png",
  "red-strawberry": "garden_strawberry_124.png",
  "yellow-flower": "garden_yellow_flower_124.png",
  "yellow-lemon": "garden_yellow_lemon_124.png",
  "blue-flower": "garden_blue_flower_124.png",
  blueberries: "garden_blueberries_124.png",
  "green-leaf": "garden_green_leaf_124.png",
  "green-apple": "garden_green_apple_124.png",
  "purple-flower": "garden_purple_flower_124.png",
  "purple-grapes": "garden_purple_grapes_124.png",
};

interface BasketTarget {
  color: BasketColor;
  zone: Phaser.GameObjects.Zone;
  sprite: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Ellipse;
  sorted: number;
  scale: number;
}

interface DraggableItem {
  data: GardenObject;
  sprite: Phaser.GameObjects.Image;
  origin: Phaser.Math.Vector2;
  baseScale: number;
}

const ACTIVE_OBJECT_LIMIT = 3;

export class ColorBasketGardenScene extends Phaser.Scene {
  private baskets: BasketTarget[] = [];
  private items: DraggableItem[] = [];
  private objectQueue: GardenObject[] = [];
  private sortedCount = 0;
  private totalCount = 0;
  private helper?: Phaser.GameObjects.Container;
  private celebrationLayer?: Phaser.GameObjects.Container;
  private replayButton?: Phaser.GameObjects.Container;
  private replayHitArea?: Phaser.GameObjects.Arc;
  private stageWidth = 960;
  private stageHeight = 540;
  private layout = computeColorBasketGardenLayout(this.stageWidth, this.stageHeight);
  private uiScale = 1;
  private itemScale = 1;
  private replayTimer?: Phaser.Time.TimerEvent;
  private readonly audio = new ColorBasketGardenAudio();

  constructor() {
    super("ColorBasketGarden");
  }

  preload(): void {
    this.load.image(GARDEN_BACKGROUND_ASSET_KEY, `${ASSET_BASE_PATH}/garden_background.png`);
    this.load.image(HELPER_ASSET_KEY, `${ASSET_BASE_PATH}/kitty_helper.png`);

    for (const [color, file] of Object.entries(BASKET_ASSET_FILES) as [BasketColor, string][]) {
      this.load.image(this.getBasketAssetKey(color), `${ASSET_BASE_PATH}/${file}`);
    }

    for (const [assetKey, file] of Object.entries(OBJECT_ASSET_FILES) as [GardenAssetKey, string][]) {
      this.load.image(assetKey, `${ASSET_BASE_PATH}/${file}`);
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
    this.stageWidth = this.scale.width;
    this.stageHeight = this.scale.height;
    this.layout = computeColorBasketGardenLayout(this.stageWidth, this.stageHeight);
    this.uiScale = this.layout.uiScale;
    this.itemScale = this.layout.itemScale;
    this.audio.cleanup();
    this.replayTimer?.remove(false);
    this.input.enabled = true;
    this.children.removeAll();
    this.baskets = [];
    this.items = [];
    this.objectQueue = [];
    this.sortedCount = 0;
    this.helper = undefined;
    this.replayButton = undefined;
    this.replayHitArea = undefined;

    this.drawGarden();
    this.createBaskets();
    this.createObjects();
    this.celebrationLayer = this.add.container(0, 0).setDepth(70);
  }

  private drawGarden(): void {
    const w = this.stageWidth;
    const h = this.stageHeight;
    const background = this.add.image(w / 2, h / 2, GARDEN_BACKGROUND_ASSET_KEY).setDepth(0);
    const backgroundScale = Math.max(w / background.width, h / background.height);

    background.setScale(backgroundScale);
  }

  private createHelper(x: number, y: number, scale: number): void {
    const shadow = this.add.ellipse(0, 88, 108, 24, 0x24432f, 0.14);
    const kitten = this.add.image(0, 0, HELPER_ASSET_KEY);

    this.helper = this.add.container(x, y, [shadow, kitten]).setDepth(18);
    this.helper.setScale(scale);
    this.tweens.add({
      targets: this.helper,
      y: y + 6,
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  private createBaskets(): void {
    for (const slot of getColorBasketGardenBasketSlots(this.layout)) {
      const shadow = this.add.ellipse(
        slot.x,
        slot.y + 48 * slot.scale,
        108 * slot.scale,
        24 * slot.scale,
        0x24432f,
        0.18,
      );
      const glow = this.add
        .ellipse(slot.x, slot.y + 4 * slot.scale, 128 * slot.scale, 94 * slot.scale, COLOR_HEX[slot.color], 0)
        .setDepth(7);
      const sprite = this.add.image(slot.x, slot.y, this.getBasketAssetKey(slot.color)).setScale(slot.scale).setDepth(12);
      const zoneWidth = 138 * slot.scale;
      const zoneHeight = 132 * slot.scale;
      const zone = this.add
        .zone(slot.x, slot.y - 2 * slot.scale, zoneWidth, zoneHeight)
        .setRectangleDropZone(zoneWidth, zoneHeight);

      shadow.setDepth(6);
      this.baskets.push({ color: slot.color, zone, sprite, glow, sorted: 0, scale: slot.scale });
      this.tweens.add({
        targets: [sprite, glow, shadow],
        y: "-=4",
        duration: 1900 + BASKET_COLORS.indexOf(slot.color) * 120,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }
  }

  private createObjects(): void {
    this.objectQueue = createRoundObjects();
    this.totalCount = this.objectQueue.length;

    for (const position of this.getActiveObjectPositions().slice(0, ACTIVE_OBJECT_LIMIT)) {
      this.spawnNextObject(position);
    }
  }

  private getActiveObjectPositions(): Phaser.Math.Vector2[] {
    return getColorBasketGardenObjectPositions(this.layout).map(
      (position) => new Phaser.Math.Vector2(position.x, position.y),
    );
  }

  private spawnNextObject(origin: Phaser.Math.Vector2): void {
    const object = this.objectQueue.shift();
    if (!object) {
      return;
    }

    const sprite = this.createGardenObject(object, origin.x, origin.y);
    const draggable: DraggableItem = {
      data: object,
      sprite,
      origin: origin.clone(),
      baseScale: this.itemScale,
    };

    this.items.push(draggable);
    sprite.setInteractive();
    this.registerItemDragHandlers(draggable);
    this.input.setDraggable(sprite);
    this.tweens.add({
      targets: sprite,
      y: origin.y - 5,
      duration: 1500 + this.sortedCount * 80,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  private registerItemDragHandlers(item: DraggableItem): void {
    item.sprite.on("pointerdown", () => {
      this.audio.speak(getGardenObjectSpokenLabel(item.data));
    });

    item.sprite.on("dragstart", () => {
      this.tweens.killTweensOf(item.sprite);
      item.sprite.setDepth(40);
      this.tweens.add({ targets: item.sprite, scale: item.baseScale * 1.1, duration: 110, ease: "Sine.out" });
      this.setBasketDragState(undefined);
    });

    item.sprite.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      item.sprite.setPosition(dragX, dragY);
      const basket = this.findHoveredBasket(dragX, dragY, item.sprite);
      this.setBasketDragState(basket && isCorrectBasket(item.data, basket) ? basket : undefined);
    });

    item.sprite.on("dragend", () => {
      const basket = this.findHoveredBasket(item.sprite.x, item.sprite.y, item.sprite);
      this.setBasketDragState(undefined);

      if (basket && isCorrectBasket(item.data, basket)) {
        this.placeItem(item, basket);
        return;
      }

      this.returnItem(item);
    });
  }

  private createGardenObject(object: GardenObject, x: number, y: number): Phaser.GameObjects.Image {
    return this.add.image(x, y, object.assetKey).setScale(this.itemScale).setDepth(24);
  }

  private findHoveredBasket(x: number, y: number, target: Phaser.GameObjects.Image): BasketTarget | undefined {
    if (!target.input?.enabled) {
      return undefined;
    }

    const objectRadius = 58 * this.itemScale;
    const objectBounds = new Phaser.Geom.Rectangle(
      x - objectRadius,
      y - objectRadius,
      objectRadius * 2,
      objectRadius * 2,
    );

    return this.baskets
      .filter((basket) => {
        const bounds = Phaser.Geom.Rectangle.Clone(basket.zone.getBounds());
        Phaser.Geom.Rectangle.Inflate(bounds, 24 * basket.scale, 32 * basket.scale);
        return bounds.contains(x, y) || Phaser.Geom.Intersects.RectangleToRectangle(objectBounds, bounds);
      })
      .sort(
        (a, b) =>
          Phaser.Math.Distance.Between(x, y, a.zone.x, a.zone.y) -
          Phaser.Math.Distance.Between(x, y, b.zone.x, b.zone.y),
      )[0];
  }

  private setBasketDragState(active?: BasketTarget): void {
    for (const basket of this.baskets) {
      const isActive = basket === active;
      basket.glow.setAlpha(isActive ? 0.34 : 0);
      basket.sprite.setScale(basket.scale * (isActive ? 1.08 : 1));
    }
  }

  private placeItem(item: DraggableItem, basket: BasketTarget): void {
    const refillOrigin = item.origin.clone();
    item.sprite.disableInteractive();
    this.input.setDraggable(item.sprite, false);
    this.audio.playDropChime();
    basket.sorted += 1;
    this.sortedCount += 1;

    const itemOffset = basket.sorted === 1 ? -18 : 18;
    const targetX = basket.zone.x + itemOffset * basket.scale;
    const targetY = basket.zone.y - (18 + Math.min(basket.sorted, 2) * 5) * basket.scale;
    const collectedScale = basket.scale * 0.56;

    this.tweens.killTweensOf(item.sprite);
    this.tweens.add({
      targets: item.sprite,
      x: targetX,
      y: targetY,
      scale: collectedScale,
      duration: 160,
      ease: "Back.out",
      onComplete: () => {
        item.sprite.setDepth(10);
        this.sparkle(targetX, targetY - 20, COLOR_HEX[item.data.color], 5);
        this.growProgressFlower(item.data.color);
        this.tweens.add({
          targets: basket.sprite,
          scaleX: basket.scale * 1.1,
          scaleY: basket.scale * 1.1,
          duration: 120,
          yoyo: true,
          ease: "Sine.out",
        });
        this.spawnNextObject(refillOrigin);

        if (isRoundComplete(this.sortedCount, this.totalCount)) {
          this.completeRound();
        }
      },
    });
  }

  private returnItem(item: DraggableItem): void {
    this.tweens.killTweensOf(item.sprite);
    this.tweens.add({
      targets: item.sprite,
      x: item.origin.x,
      y: item.origin.y,
      scale: item.baseScale,
      duration: 240,
      ease: "Sine.inOut",
      onComplete: () => {
        item.sprite.setDepth(24);
      },
    });
  }

  private completeRound(): void {
    const { playArea } = this.layout;

    this.input.enabled = false;
    this.game.events.emit(COLOR_BASKET_GARDEN_LEVEL_COMPLETE_EVENT);
    this.audio.playCompletionCelebration();
    this.sparkle(playArea.centerX, playArea.y + playArea.height * 0.38, 0xffffff, 18);

    for (const basket of this.baskets) {
      this.tweens.add({
        targets: basket.sprite,
        y: basket.sprite.y - 12,
        duration: 150,
        yoyo: true,
        repeat: 2,
        ease: "Sine.out",
      });
    }

    const helperScale = 1.08 * this.uiScale;
    this.createHelper(playArea.centerX, playArea.centerY - 34 * this.uiScale, helperScale);
    this.helper?.setScale(0.18);
    this.tweens.add({
      targets: this.helper,
      scale: helperScale,
      duration: 520,
      ease: "Back.out",
    });

    this.replayTimer = this.time.delayedCall(1500, () => {
      this.createReplayButton();
      this.input.enabled = true;
    });
  }

  private createReplayButton(): void {
    if (this.replayButton) {
      return;
    }

    const replayPosition = getColorBasketGardenReplayPosition(this.layout);
    const circle = this.add.circle(0, 0, 48, 0xffffff, 0.94).setStrokeStyle(6, 0x5aa85a);
    const arrow = this.add.graphics();
    let hasReplayed = false;
    const replay = (): void => {
      if (hasReplayed) {
        return;
      }

      hasReplayed = true;
      this.replayHitArea?.disableInteractive();
      this.startRound();
    };

    arrow.lineStyle(8, 0x5aa85a, 1);
    arrow.beginPath();
    arrow.arc(0, 0, 24, Phaser.Math.DegToRad(40), Phaser.Math.DegToRad(310), false);
    arrow.strokePath();
    arrow.fillStyle(0x5aa85a, 1);
    arrow.fillTriangle(22, -20, 42, -18, 30, 0);

    this.replayButton = this.add
      .container(replayPosition.x, replayPosition.y, [circle, arrow])
      .setDepth(80);
    this.replayButton.setSize(124, 124);
    this.replayHitArea = this.add
      .circle(replayPosition.x, replayPosition.y, 62, 0xffffff, 0.001)
      .setDepth(81)
      .setInteractive();
    this.replayHitArea.on("pointerdown", replay);
  }

  private sparkle(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i += 1) {
      const star = this.add.star(x, y, 5, 4, Phaser.Math.Between(11, 18), color, 0.95).setDepth(72);
      this.celebrationLayer?.add(star);
      this.tweens.add({
        targets: star,
        x: x + Phaser.Math.Between(-80, 80),
        y: y + Phaser.Math.Between(-70, 40),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(520, 880),
        ease: "Sine.out",
        onComplete: () => star.destroy(),
      });
    }
  }

  private growProgressFlower(color: BasketColor): void {
    const { playArea } = this.layout;
    const side = this.sortedCount % 2 === 0 ? 0.12 : 0.88;
    const x = playArea.x + playArea.width * side + Phaser.Math.Between(-20, 20) * this.uiScale;
    const y = playArea.y + playArea.height * Phaser.Math.FloatBetween(0.58, 0.7);
    const scale = Phaser.Math.FloatBetween(0.25, 0.42) * this.uiScale;

    const flower = this.drawTinyFlower(x, y, 0xfff0a4, COLOR_HEX[color], scale).setDepth(8);
    flower.setScale(0.1);
    this.tweens.add({
      targets: flower,
      scale,
      duration: 220,
      ease: "Back.out",
    });
  }

  private drawTinyFlower(
    x: number,
    y: number,
    centerColor: number,
    petalColor: number,
    scale: number,
  ): Phaser.GameObjects.Graphics {
    const flower = this.add.graphics({ x, y });
    flower.setScale(scale);
    flower.fillStyle(petalColor, 1);
    flower.fillCircle(-9, 0, 8);
    flower.fillCircle(9, 0, 8);
    flower.fillCircle(0, -9, 8);
    flower.fillCircle(0, 9, 8);
    flower.fillStyle(centerColor, 1);
    flower.fillCircle(0, 0, 7);
    return flower;
  }

  private getBasketAssetKey(color: BasketColor): string {
    return `${color}-basket`;
  }
}
