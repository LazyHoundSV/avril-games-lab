import Phaser from "phaser";
import "./styles.css";
import { ColorBasketGardenScene } from "./game/ColorBasketGardenScene";

const parent = "game-root";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent,
  backgroundColor: "#bceeff",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
  input: {
    activePointers: 3,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
  scene: [ColorBasketGardenScene],
});

window.addEventListener("beforeunload", () => {
  game.destroy(true);
});
