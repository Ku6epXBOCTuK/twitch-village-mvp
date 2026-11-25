import type { Application } from "pixi.js";
import { expect, test, vi } from "vitest";
import { ViewerStore } from "#lib/features/persistence/viewer-store.js";
import { ANIMAL_KINDS } from "./animals.js";
import type { GameAssets } from "./assets.js";
import { createGameCore, type GameCoreRender } from "./core.js";

vi.mock("pixi.js", () => {
	class Graphics {
		clear() {
			return this;
		}
		roundRect() {
			return this;
		}
		fill() {
			return this;
		}
		destroy() {}
	}
	class AnimatedSprite {
		anchor = { set() {} };
		scale = { set() {} };
		animationSpeed = 0;
		textures: unknown[] = [];
		width = 32;
		height = 32;
		x = 0;
		y = 0;
		constructor(textures?: unknown[]) {
			this.textures = textures ?? [];
		}
		play() {}
		destroy() {}
	}
	class Text {
		anchor = { set() {} };
		width = 40;
		height = 12;
		text = "";
		constructor(props?: { text?: string }) {
			this.text = props?.text ?? "";
		}
		destroy() {}
	}
	class TextStyle {
		constructor(props?: unknown) {
			void props;
		}
	}
	class Container {
		x = 0;
		y = 0;
		scale = { x: 1, set() {} };
		addChild() {}
		addChildAt() {}
		removeFromParent() {}
		destroy() {}
	}
	class Sprite {
		position = { set() {} };
		anchor = { set() {} };
		scale = { set() {} };
		constructor(texture?: unknown) {
			void texture;
		}
		destroy() {}
	}
	return { Graphics, AnimatedSprite, Text, TextStyle, Container, Sprite };
});

function createGame() {
	const viewerStore = new ViewerStore({
		load: () => Promise.resolve([]),
		save: () => Promise.resolve(),
	});
	const render: GameCoreRender = {
		app: {
			stage: { addChild() {} },
			screen: { width: 800, height: 600 },
		} as unknown as Application,
		assets: {
			player: { walkRight: [], idleFront: [] },
			playerActions: { chop: [] },
			animals: {} as GameAssets["animals"],
			tiles: {} as GameAssets["tiles"],
			trees: { large: {}, small: [{}, {}] } as unknown as GameAssets["trees"],
		} as GameAssets,
	};

	return createGameCore(
		{
			screen: { width: 800, height: 600 },
			viewerStore,
			rng: () => 0.5,
			measureText: () => ({ width: 10, height: 10 }),
		},
		render,
	);
}

test("spawnAnimal adds a wandering animal with a sprite", () => {
	const game = createGame();

	const animal = game.spawnAnimal();
	game.step(0.016);

	expect(ANIMAL_KINDS).toContain(animal.animal);
	expect(animal.position?.x).toBeGreaterThan(0);
	expect(animal.walker).toBeDefined();
	expect(animal.sprite).toBeDefined();
	expect(animal.sprite?.x).toBe(animal.position?.x);
});

test("an animal follows the walker each step", () => {
	const game = createGame();

	const animal = game.spawnAnimal("pig");
	const startX = animal.position?.x ?? 0;
	game.step(0.5);

	expect(animal.position?.x).not.toBe(startX);
});
