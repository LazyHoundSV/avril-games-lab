import Phaser from "phaser";
import { type BasketColor, type GardenObject, createRoundObjects, isCorrectBasket, isRoundComplete } from "./sorting";

const COLOR_HEX: Record<BasketColor, number> = {
  red: 0xe9544f,
  yellow: 0xf4c84f,
  blue: 0x4fa7e8,
};

const COLOR_DARK_HEX: Record<BasketColor, number> = {
  red: 0xa93c3a,
  yellow: 0xb88623,
  blue: 0x2d6fa3,
};

interface BasketTarget {
  color: BasketColor;
  zone: Phaser.GameObjects.Zone;
  rim: Phaser.GameObjects.Ellipse;
  body: Phaser.GameObjects.Graphics;
  glow: Phaser.GameObjects.Ellipse;
  bodyY: number;
  scale: number;
  sorted: number;
}

interface DraggableItem {
  data: GardenObject;
  container: Phaser.GameObjects.Container;
  origin: Phaser.Math.Vector2;
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
  private stageWidth = 960;
  private stageHeight = 540;
  private uiScale = 1;

  constructor() {
    super("ColorBasketGarden");
  }

  create(): void {
    this.input.dragDistanceThreshold = 4;
    this.input.topOnly = false;
    this.registerDragHandlers();
    this.startRound();
  }

  private startRound(): void {
    this.stageWidth = this.scale.width;
    this.stageHeight = this.scale.height;
    this.uiScale = Phaser.Math.Clamp(Math.min(this.stageWidth / 520, this.stageHeight / 720), 0.72, 1.08);
    this.children.removeAll();
    this.baskets = [];
    this.items = [];
    this.objectQueue = [];
    this.sortedCount = 0;
    this.replayButton = undefined;

    this.drawGarden();
    this.createHelper(this.stageWidth * 0.85, this.stageHeight * 0.15, 0.85 * this.uiScale);
    this.createBaskets();
    this.createObjects();
    this.celebrationLayer = this.add.container(0, 0);
  }

  private drawGarden(): void {
    const w = this.stageWidth;
    const h = this.stageHeight;
    this.add.rectangle(w / 2, h / 2, w, h, 0xbceeff);

    const sky = this.add.graphics();
    sky.fillGradientStyle(0xbceeff, 0xbceeff, 0xe8f8ff, 0xe8f8ff, 1);
    sky.fillRect(0, 0, w, h * 0.62);

    const hills = this.add.graphics();
    hills.fillStyle(0xbde89d, 1);
    hills.fillEllipse(w * 0.24, h * 0.62, w * 0.58, h * 0.26);
    hills.fillEllipse(w * 0.73, h * 0.62, w * 0.64, h * 0.28);

    const grass = this.add.graphics();
    grass.fillStyle(0x8bd26c, 1);
    grass.fillRect(0, h * 0.56, w, h * 0.44);
    grass.fillStyle(0x6fbd55, 1);
    grass.fillEllipse(w / 2, h + 5, w * 1.14, h * 0.22);

    for (const x of [w * 0.09, w * 0.16, w * 0.73, w * 0.8]) {
      this.drawTinyFlower(x, h * 0.54 + Phaser.Math.Between(-12, 18), 0xf9f0a1, 0xeb6f8d, 0.55);
    }

    this.add.circle(w * 0.1, h * 0.12, 34 * this.uiScale, 0xffef8a, 0.9);
    this.add.circle(w * 0.1, h * 0.12, 48 * this.uiScale, 0xffef8a, 0.18);
  }

  private createHelper(x: number, y: number, scale: number): void {
    const body = this.add.ellipse(0, 16, 72, 58, 0xf1a65a);
    const head = this.add.circle(0, -22, 38, 0xf4b66d);
    const earLeft = this.add.triangle(-24, -48, 0, 24, 18, 0, 34, 32, 0xdf8d47);
    const earRight = this.add.triangle(24, -48, 0, 32, 16, 0, 34, 24, 0xdf8d47);
    const eyeLeft = this.add.circle(-13, -26, 4, 0x24432f);
    const eyeRight = this.add.circle(13, -26, 4, 0x24432f);
    const nose = this.add.circle(0, -13, 5, 0x7b4d35);
    const smile = this.add.arc(0, -9, 13, 25, 155, false).setStrokeStyle(3, 0x7b4d35);
    const tail = this.add.ellipse(44, 14, 44, 20, 0xdf8d47).setRotation(-0.35);

    this.helper = this.add.container(x, y, [tail, body, earLeft, earRight, head, eyeLeft, eyeRight, nose, smile]);
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
    const isPortrait = this.stageHeight > this.stageWidth * 1.15;
    const positions = [
      { color: "red" as const, x: this.stageWidth * 0.24 },
      { color: "yellow" as const, x: this.stageWidth * (isPortrait ? 0.46 : 0.5) },
      { color: "blue" as const, x: this.stageWidth * (isPortrait ? 0.68 : 0.76) },
    ];
    const rimY = this.stageHeight * 0.75;
    const basketScale = this.uiScale * (isPortrait ? 0.82 : 1);
    const bodyY = rimY + 46 * basketScale;
    const zoneWidth = 218 * basketScale;
    const zoneHeight = 156 * basketScale;

    for (const { color, x } of positions) {
      const glow = this.add.ellipse(x, rimY + 23 * basketScale, 180 * basketScale, 118 * basketScale, COLOR_HEX[color], 0).setDepth(4);
      const body = this.add.graphics().setDepth(5);
      this.drawBasketShape(body, x, bodyY, color, 0, basketScale);
      const rim = this.add.ellipse(x, rimY, 156 * basketScale, 54 * basketScale, COLOR_HEX[color], 1).setStrokeStyle(9 * basketScale, COLOR_DARK_HEX[color]).setDepth(6);
      const badge = this.add.star(x, rimY, 5, 13 * basketScale, 24 * basketScale, 0xffffff, 0.92).setStrokeStyle(4 * basketScale, COLOR_DARK_HEX[color]).setDepth(7);
      const zone = this.add.zone(x, rimY + 6 * basketScale, zoneWidth, zoneHeight).setRectangleDropZone(zoneWidth, zoneHeight);

      this.baskets.push({ color, zone, rim, body, glow, bodyY, scale: basketScale, sorted: 0 });
      this.tweens.add({
        targets: [body, rim, badge],
        y: "-=4",
        duration: 1900 + positions.findIndex((position) => position.color === color) * 160,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }
  }

  private drawBasketShape(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    color: BasketColor,
    fillBonus: number,
    scale = this.uiScale,
  ): void {
    const s = scale;
    graphics.clear();
    graphics.fillStyle(COLOR_HEX[color], 1);
    graphics.lineStyle(7 * s, COLOR_DARK_HEX[color], 1);
    graphics.beginPath();
    graphics.moveTo(x - 72 * s, y - 40 * s);
    graphics.lineTo(x + 72 * s, y - 40 * s);
    graphics.lineTo(x + 54 * s, y + 48 * s);
    graphics.lineTo(x - 54 * s, y + 48 * s);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    graphics.fillStyle(0xffffff, 0.2 + fillBonus);
    graphics.fillRoundedRect(x - 50 * s, y - 22 * s, 100 * s, 14 * s, 8 * s);
    graphics.fillRoundedRect(x - 44 * s, y + 8 * s, 88 * s, 14 * s, 8 * s);
  }

  private createObjects(): void {
    this.objectQueue = createRoundObjects();
    this.totalCount = this.objectQueue.length;
    const isPortrait = this.stageHeight > this.stageWidth * 1.15;

    const activePositions = [
      new Phaser.Math.Vector2(this.stageWidth * (isPortrait ? 0.25 : 0.24), this.stageHeight * 0.31),
      new Phaser.Math.Vector2(this.stageWidth * 0.5, this.stageHeight * 0.25),
      new Phaser.Math.Vector2(this.stageWidth * (isPortrait ? 0.65 : 0.76), this.stageHeight * 0.49),
    ];

    activePositions.slice(0, ACTIVE_OBJECT_LIMIT).forEach((position) => {
      this.spawnNextObject(position);
    });
  }

  private registerDragHandlers(): void {
    this.input.on("dragstart", (_pointer: Phaser.Input.Pointer, target: Phaser.GameObjects.Container) => {
      if (!this.items.some((item) => item.container === target)) {
        return;
      }

      target.setDepth(30);
      this.tweens.add({ targets: target, scale: 1.1, duration: 110, ease: "Sine.out" });
      this.setBasketDragState(undefined);
    });

    this.input.on(
      "drag",
      (_pointer: Phaser.Input.Pointer, target: Phaser.GameObjects.Container, dragX: number, dragY: number) => {
        if (!this.items.some((item) => item.container === target)) {
          return;
        }

        target.setPosition(dragX, dragY);
        this.setBasketDragState(this.findHoveredBasket(dragX, dragY, target));
      },
    );

    this.input.on("dragend", (_pointer: Phaser.Input.Pointer, target: Phaser.GameObjects.Container) => {
      const item = this.items.find((candidate) => candidate.container === target);
      if (!item) {
        return;
      }

      const basket = this.findHoveredBasket(target.x, target.y, target);
      this.setBasketDragState(undefined);

      if (basket && isCorrectBasket(item.data, basket)) {
        this.placeItem(item, basket);
        return;
      }

      this.returnItem(item);
    });
  }

  private spawnNextObject(origin: Phaser.Math.Vector2): void {
    const object = this.objectQueue.shift();
    if (!object) {
      return;
    }

    const container = this.createGardenObject(object, origin.x, origin.y);
    const draggable: DraggableItem = {
      data: object,
      container,
      origin: origin.clone(),
    };

    this.items.push(draggable);
    container.setInteractive(new Phaser.Geom.Circle(0, 0, 66), Phaser.Geom.Circle.Contains);
    this.input.setDraggable(container);
    this.tweens.add({
      targets: container,
      y: origin.y - 5,
      duration: 1500 + this.sortedCount * 80,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  private createGardenObject(object: GardenObject, x: number, y: number): Phaser.GameObjects.Container {
    const graphics = this.add.graphics();
    const color = COLOR_HEX[object.color];
    const dark = COLOR_DARK_HEX[object.color];

    if (object.kind === "flower") {
      graphics.fillStyle(color, 1);
      for (let i = 0; i < 6; i += 1) {
        const angle = Phaser.Math.DegToRad(i * 60);
        graphics.fillEllipse(Math.cos(angle) * 21, Math.sin(angle) * 21, 32, 42);
      }
      graphics.fillStyle(0xfff6c7, 1);
      graphics.fillCircle(0, 0, 18);
      graphics.lineStyle(5, dark, 1);
      graphics.strokeCircle(0, 0, 46);
    } else if (object.kind === "fruit") {
      graphics.fillStyle(color, 1);
      graphics.fillCircle(0, 5, 40);
      graphics.fillCircle(-17, -12, 28);
      graphics.fillCircle(18, -12, 28);
      graphics.fillStyle(0x6fbd55, 1);
      graphics.fillEllipse(15, -42, 30, 16);
      graphics.lineStyle(5, dark, 1);
      graphics.strokeCircle(0, 5, 42);
    } else {
      graphics.fillStyle(color, 1);
      graphics.fillEllipse(0, 2, 78, 50);
      graphics.lineStyle(5, dark, 1);
      graphics.strokeEllipse(0, 2, 78, 50);
      graphics.lineStyle(4, 0xffffff, 0.45);
      graphics.lineBetween(-24, 3, 25, 1);
    }

    const shadow = this.add.ellipse(0, 52, 72, 18, 0x24432f, 0.18);
    const container = this.add.container(x, y, [shadow, graphics]).setSize(112, 112).setDepth(20);
    container.setScale(this.uiScale);
    return container;
  }

  private findHoveredBasket(x: number, y: number, target: Phaser.GameObjects.Container): BasketTarget | undefined {
    if (!target.input?.enabled) {
      return undefined;
    }

    const objectRadius = 56 * this.uiScale;
    const objectBounds = new Phaser.Geom.Rectangle(
      x - objectRadius,
      y - objectRadius,
      objectRadius * 2,
      objectRadius * 2,
    );

    return this.baskets
      .filter((basket) => {
        const bounds = Phaser.Geom.Rectangle.Clone(basket.zone.getBounds());
        Phaser.Geom.Rectangle.Inflate(bounds, 28 * this.uiScale, 34 * this.uiScale);
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
      basket.glow.setAlpha(isActive ? 0.26 : 0);
      basket.rim.setScale(isActive ? 1.05 : 1);
    }
  }

  private placeItem(item: DraggableItem, basket: BasketTarget): void {
    const refillOrigin = item.origin.clone();
    item.container.disableInteractive();
    this.input.setDraggable(item.container, false);
    basket.sorted += 1;
    this.sortedCount += 1;

    const targetX = basket.zone.x + (basket.sorted - 2) * 26 * basket.scale;
    const targetY = basket.zone.y + (22 - Math.min(basket.sorted, 3) * 6) * basket.scale;

    this.tweens.killTweensOf(item.container);
    this.tweens.add({
      targets: item.container,
      x: targetX,
      y: targetY,
      scale: 0.64,
      duration: 160,
      ease: "Back.out",
      onComplete: () => {
        item.container.setDepth(8);
        this.sparkle(targetX, targetY - 18, COLOR_HEX[item.data.color], 5);
        this.tweens.add({ targets: basket.rim, scaleX: 1.1, scaleY: 1.1, duration: 120, yoyo: true });
        this.drawBasketShape(
          basket.body,
          basket.zone.x,
          basket.bodyY,
          basket.color,
          Math.min(basket.sorted * 0.08, 0.25),
          basket.scale,
        );
        this.spawnNextObject(refillOrigin);

        if (isRoundComplete(this.sortedCount, this.totalCount)) {
          this.completeRound();
        }
      },
    });
  }

  private returnItem(item: DraggableItem): void {
    this.tweens.killTweensOf(item.container);
    this.tweens.add({
      targets: item.container,
      x: item.origin.x,
      y: item.origin.y,
      scale: 1,
      duration: 230,
      ease: "Sine.inOut",
      onComplete: () => {
        item.container.setDepth(20);
      },
    });
  }

  private completeRound(): void {
    this.input.enabled = false;
    this.sparkle(this.stageWidth / 2, this.stageHeight * 0.38, 0xffffff, 18);

    for (const basket of this.baskets) {
      this.tweens.add({
        targets: [basket.body, basket.rim],
        y: "-=12",
        duration: 160,
        yoyo: true,
        repeat: 2,
        ease: "Sine.out",
      });
    }

    if (this.helper) {
      this.tweens.add({
        targets: this.helper,
        x: this.stageWidth / 2,
        y: this.stageHeight * 0.2,
        scale: 1.18,
        duration: 520,
        ease: "Back.out",
      });
    }

    this.time.delayedCall(1500, () => {
      this.createReplayButton();
      this.input.enabled = true;
    });
  }

  private createReplayButton(): void {
    const circle = this.add.circle(0, 0, 46, 0xffffff, 0.94).setStrokeStyle(6, 0x5aa85a);
    const arrow = this.add.graphics();
    arrow.lineStyle(8, 0x5aa85a, 1);
    arrow.beginPath();
    arrow.arc(0, 0, 24, Phaser.Math.DegToRad(40), Phaser.Math.DegToRad(310), false);
    arrow.strokePath();
    arrow.fillStyle(0x5aa85a, 1);
    arrow.fillTriangle(22, -20, 42, -18, 30, 0);

    this.replayButton = this.add.container(this.stageWidth / 2, this.stageHeight / 2, [circle, arrow]).setDepth(60);
    this.replayButton.setSize(104, 104);
    this.replayButton.setInteractive(new Phaser.Geom.Circle(0, 0, 52), Phaser.Geom.Circle.Contains);
    this.replayButton.on("pointerdown", () => this.startRound());
  }

  private sparkle(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i += 1) {
      const star = this.add.star(x, y, 5, 4, Phaser.Math.Between(11, 18), color, 0.95).setDepth(50);
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

  private drawTinyFlower(x: number, y: number, leafColor: number, petalColor: number, scale: number): void {
    const flower = this.add.graphics();
    flower.setScale(scale);
    flower.fillStyle(petalColor, 1);
    flower.fillCircle(x - 9, y, 8);
    flower.fillCircle(x + 9, y, 8);
    flower.fillCircle(x, y - 9, 8);
    flower.fillCircle(x, y + 9, 8);
    flower.fillStyle(leafColor, 1);
    flower.fillCircle(x, y, 7);
  }
}
