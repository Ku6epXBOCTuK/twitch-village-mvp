import {
	ViewerStore,
	type StoredViewer,
} from "#lib/features/persistence/viewer-store.js";
import type { Application } from "pixi.js";
import { expect, test, vi } from "vitest";
import type { GameAssets } from "./assets.js";
import { VIEWER_TIMEOUT_MS } from "./config.js";
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
		width = 10;
		height = 10;
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
	return { Graphics, AnimatedSprite, Text, TextStyle };
});

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const storedViewer = (overrides: Partial<StoredViewer> = {}): StoredViewer => ({
	userId: "u1",
	user: "alice",
	login: "alice",
	lastSeen: 1_000_000,
	...overrides,
});

function createRenderedGame(options: { load?: Promise<StoredViewer[]> } = {}) {
	const saved: StoredViewer[][] = [];
	const viewerStore = new ViewerStore({
		load: vi.fn(() => options.load ?? Promise.resolve([])),
		save: (_key, viewers) => {
			saved.push(viewers as StoredViewer[]);
			return Promise.resolve();
		},
	});
	let now = 1_000_000;
	const render: GameCoreRender = {
		app: {
			stage: { addChild() {} },
			screen: { width: 800, height: 600 },
		} as unknown as Application,
		assets: {
			player: { walkRight: [], idleFront: [] },
		} as GameAssets,
	};

	const game = createGameCore(
		{
			screen: { width: 800, height: 600 },
			viewerStore,
			now: () => now,
			rng: () => 0.5,
			measureText: () => ({ width: 10, height: 10 }),
		},
		render,
	);

	return { game, saved, setNow: (value: number) => (now = value) };
}

test("a chat message persists the viewer", async () => {
	const { game, saved } = createRenderedGame();

	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
	game.step(0.1);
	await flush();

	expect(saved).toEqual([
		[expect.objectContaining({ userId: "u1", user: "alice" })],
	]);
	game.dispose();
});

test("a timed-out viewer leaves the screen but keeps the profile", async () => {
	const { game, saved, setNow } = createRenderedGame();

	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
	game.step(0.1);
	await flush();
	saved.length = 0;

	setNow(1_000_000 + VIEWER_TIMEOUT_MS + 60_000);
	game.step(1.1);
	await flush();

	expect([...game.world.with("viewer")]).toHaveLength(0);
	expect(saved.at(-1)).toEqual([
		expect.objectContaining({ userId: "u1", user: "alice" }),
	]);
	game.dispose();
});

test("a stored viewer returns on a new chat message", async () => {
	const { game } = createRenderedGame({
		load: Promise.resolve([
			storedViewer({ lastSeen: 1_000_000 - VIEWER_TIMEOUT_MS * 2 }),
		]),
	});
	await flush();

	expect([...game.world.with("viewer")]).toHaveLength(0);

	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
	expect([...game.world.with("viewer")]).toHaveLength(1);
	game.dispose();
});

test("a chat message during the initial load neither duplicates nor wipes viewers", async () => {
	let release: (value: StoredViewer[]) => void = () => {};
	const load = new Promise<StoredViewer[]>((resolve) => {
		release = resolve;
	});
	const { game, saved } = createRenderedGame({ load });

	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
	game.step(0.1);
	await flush();
	expect(saved).toHaveLength(0);

	release([storedViewer()]);
	await flush();
	game.step(0.1);
	await flush();

	expect([...game.world.with("viewer")]).toHaveLength(1);
	expect(saved.at(-1)).toEqual([
		expect.objectContaining({ userId: "u1", user: "alice" }),
	]);
	game.dispose();
});
