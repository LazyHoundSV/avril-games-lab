import Phaser from "phaser";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import Confetti from "react-confetti-boom";
import "./styles.css";
import {
  COLOR_BASKET_GARDEN_LEVEL_COMPLETE_EVENT,
  ColorBasketGardenScene,
} from "./game/ColorBasketGardenScene";
import {
  KITTY_ROOM_BUILDER_LEVEL_COMPLETE_EVENT,
  KittyRoomBuilderScene,
} from "./game/KittyRoomBuilderScene";
import {
  LITTLE_BUILDER_BRIDGE_LEVEL_COMPLETE_EVENT,
  LittleBuilderBridgeScene,
} from "./game/LittleBuilderBridgeScene";

interface GameDefinition {
  id: string;
  title: string;
  description: string;
  colors: {
    background: string;
    accent: string;
    shadow: string;
  };
  icon: string;
  previewImage?: string;
  scene: typeof Phaser.Scene;
  completeEvent?: string;
}

const games: GameDefinition[] = [
  {
    id: "color-basket-garden",
    title: "Color Basket Garden",
    description: "Sort colorful garden toys into matching baskets.",
    colors: {
      background: "#d8f7c7",
      accent: "#e9544f",
      shadow: "#7fbe63",
    },
    icon: "flower",
    previewImage: "/assets/color-basket-garden/color_basket_garden_menu_preview.png",
    scene: ColorBasketGardenScene,
    completeEvent: COLOR_BASKET_GARDEN_LEVEL_COMPLETE_EVENT,
  },
  {
    id: "kitty-room-builder",
    title: "Kitty Room Builder",
    description: "Place cozy room pieces into matching shapes.",
    colors: {
      background: "#ffd9c8",
      accent: "#b98be8",
      shadow: "#d99b62",
    },
    icon: "room",
    previewImage: "/assets/kitty-room-builder/menu-preview.png",
    scene: KittyRoomBuilderScene,
    completeEvent: KITTY_ROOM_BUILDER_LEVEL_COMPLETE_EVENT,
  },
  {
    id: "little-builder-bridge",
    title: "Little Builder Bridge",
    description: "Build a cozy bridge so the puppy can cross.",
    colors: {
      background: "#d7f4ff",
      accent: "#f25757",
      shadow: "#75b66d",
    },
    icon: "bridge",
    previewImage: "/assets/little-builder-bridge/background.png",
    scene: LittleBuilderBridgeScene,
    completeEvent: LITTLE_BUILDER_BRIDGE_LEVEL_COMPLETE_EVENT,
  },
];

const app = document.querySelector<HTMLElement>("#app");
let activeGame: Phaser.Game | undefined;
let confettiRoot: Root | undefined;
let clearConfettiTimer: number | undefined;

const CONFETTI_COLORS = ["#e9544f", "#f4c84f", "#2f8de8", "#63bd34", "#9a58e8", "#ffffff"];
const BRAND_LOGO_PATH = "/assets/brand/avril-games-lab-logo.png";
const HOME_ICON_PATH = "/assets/color-basket-garden/home_icon_hq_248.png";

if (!app) {
  throw new Error("Missing #app root");
}

const getRequestedGame = (): GameDefinition | undefined => {
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game");

  return games.find((game) => game.id === gameId);
};

const drawIcon = (icon: string): string => {
  if (icon === "flower") {
    return `
      <svg class="game-card__icon" viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r="12" fill="#fff2a6" />
        <circle cx="48" cy="22" r="17" fill="#e9544f" />
        <circle cx="70" cy="35" r="17" fill="#f4c84f" />
        <circle cx="62" cy="64" r="17" fill="#4fa7e8" />
        <circle cx="34" cy="64" r="17" fill="#e9544f" />
        <circle cx="26" cy="35" r="17" fill="#4fa7e8" />
        <circle cx="48" cy="48" r="13" fill="#fff6c7" stroke="#24432f" stroke-width="4" />
      </svg>
    `;
  }

  if (icon === "bridge") {
    return `
      <svg class="game-card__icon" viewBox="0 0 96 96" aria-hidden="true">
        <rect x="8" y="54" width="80" height="16" rx="8" fill="#8c5b39" />
        <rect x="14" y="42" width="16" height="20" rx="5" fill="#f25757" />
        <path d="M34 62V46c0-9 7-16 16-16s16 7 16 16v16z" fill="#f4c84f" />
        <rect x="66" y="42" width="16" height="20" rx="5" fill="#62be5a" />
        <path d="M13 38h70" stroke="#6d4228" stroke-width="7" stroke-linecap="round" />
        <circle cx="20" cy="74" r="5" fill="#4f9ded" />
        <circle cx="76" cy="74" r="5" fill="#4f9ded" />
      </svg>
    `;
  }

  return "";
};

const drawGameCardVisual = (game: GameDefinition): string => {
  if (game.previewImage) {
    return `
      <span class="game-card__preview">
        <img src="${game.previewImage}" alt="" loading="eager" draggable="false" />
      </span>
    `;
  }

  return drawIcon(game.icon);
};

const renderLanding = (): void => {
  cleanupConfetti();
  activeGame?.destroy(true);
  activeGame = undefined;
  document.title = "Avril Games Lab";
  app.removeAttribute("data-screen");
  app.innerHTML = `
    <section class="landing-shell" aria-labelledby="landing-title">
      <div class="landing-header">
        <img
          class="landing-logo"
          src="${BRAND_LOGO_PATH}"
          alt="Avril Games Lab logo"
          draggable="false"
        />
        <p class="landing-kicker">Avril Games Lab</p>
        <h1 id="landing-title">Juegos para Avril</h1>
      </div>
      <div class="games-grid" aria-label="Available games">
        ${games
          .map(
            (game) => `
              <button
                class="game-card"
                type="button"
                data-game-id="${game.id}"
                style="--card-bg: ${game.colors.background}; --card-accent: ${game.colors.accent}; --card-shadow: ${game.colors.shadow};"
                aria-label="Open ${game.title}"
              >
                ${drawGameCardVisual(game)}
                <span class="game-card__title">${game.title}</span>
                <span class="game-card__copy">${game.description}</span>
                <span class="game-card__action">Play</span>
              </button>
            `,
          )
          .join("")}
      </div>
    </section>
  `;

  app.querySelectorAll<HTMLButtonElement>("[data-game-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const gameId = button.dataset.gameId;
      const nextGame = games.find((game) => game.id === gameId);

      if (nextGame) {
        window.history.pushState({}, "", `?game=${nextGame.id}`);
        startGame(nextGame);
      }
    });
  });
};

const startGame = (gameDefinition: GameDefinition): void => {
  cleanupConfetti();
  activeGame?.destroy(true);
  document.title = gameDefinition.title;
  app.dataset.screen = "game";
  app.innerHTML = `
    <button class="menu-button" type="button" aria-label="Back to games menu">
      <img src="${HOME_ICON_PATH}" alt="" aria-hidden="true" draggable="false" />
    </button>
    <div id="game-root"></div>
    <div id="confetti-root" aria-hidden="true"></div>
  `;

  app.querySelector<HTMLButtonElement>(".menu-button")?.addEventListener("click", () => {
    window.history.pushState({}, "", window.location.pathname);
    renderLanding();
  });

  activeGame = new Phaser.Game({
    type: Phaser.CANVAS,
    parent: "game-root",
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
    scene: [gameDefinition.scene],
  });

  const confettiRootElement = document.querySelector<HTMLElement>("#confetti-root");

  if (confettiRootElement && gameDefinition.completeEvent) {
    confettiRoot = createRoot(confettiRootElement);
    activeGame.events.on(gameDefinition.completeEvent, showLevelCompleteConfetti);
  }
};

const cleanupConfetti = (): void => {
  if (clearConfettiTimer !== undefined) {
    window.clearTimeout(clearConfettiTimer);
    clearConfettiTimer = undefined;
  }

  confettiRoot?.unmount();
  confettiRoot = undefined;
};

const showLevelCompleteConfetti = (): void => {
  if (!confettiRoot) {
    return;
  }

  if (clearConfettiTimer !== undefined) {
    window.clearTimeout(clearConfettiTimer);
  }

  confettiRoot.render(
    React.createElement(Confetti, {
      key: Date.now(),
      mode: "boom",
      x: 0.5,
      y: 0.38,
      particleCount: window.innerWidth < 560 ? 34 : 42,
      colors: CONFETTI_COLORS,
      effectCount: 1,
      spreadDeg: 46,
      launchSpeed: 1.05,
      shapeSize: window.innerWidth < 560 ? 9 : 11,
      opacityDeltaMultiplier: 0.78,
    }),
  );

  clearConfettiTimer = window.setTimeout(() => {
    confettiRoot?.render(null);
    clearConfettiTimer = undefined;
  }, 2500);
};

window.addEventListener("popstate", () => {
  const requestedGame = getRequestedGame();

  if (requestedGame) {
    startGame(requestedGame);
    return;
  }

  renderLanding();
});

window.addEventListener("beforeunload", () => {
  cleanupConfetti();
  activeGame?.destroy(true);
});

const initialGame = getRequestedGame();

if (initialGame) {
  startGame(initialGame);
} else {
  renderLanding();
}
