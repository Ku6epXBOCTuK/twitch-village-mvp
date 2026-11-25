import { type Application, Text, TextStyle, type Ticker } from "pixi.js";
import {
	createViewerStore,
	type StorageTransport,
} from "#lib/features/persistence/index.js";
import { loadAssets } from "./assets.js";
import { ANIMAL_COUNT, CAMPFIRE_POSITION } from "./config.js";
import { createGameCore } from "./core.js";
import { defaultSettings, type GameSettings } from "./settings.js";

const MAX_FRAME_MS = 50;

export async function bootstrapGame(
	app: Application,
	channel: string,
	settings: GameSettings = defaultSettings(),
	transport?: StorageTransport,
) {
	const assets = await loadAssets();

	const measureStyles = new Map<number, TextStyle>();
	const measureText = (text: string, fontSize: number) => {
		let style = measureStyles.get(fontSize);
		if (!style) {
			style = new TextStyle({ fontSize });
			measureStyles.set(fontSize, style);
		}
		const probe = new Text({ text, style });
		const size = { width: probe.width, height: probe.height };
		probe.destroy();
		return size;
	};

	const core = createGameCore(
		{
			screen: app.screen,
			settings,
			viewerStore: createViewerStore(channel, transport),
			measureText,
		},
		{ app, assets },
	);

	core.spawnEffect({ id: "fire/campfire" }, CAMPFIRE_POSITION);
	for (let i = 0; i < ANIMAL_COUNT; i++) core.spawnAnimal();

	let timeScale = 1;
	let isDestroyed = false;

	const update = (ticker: Ticker) => {
		const dt = (Math.min(ticker.deltaMS, MAX_FRAME_MS) / 1000) * timeScale;
		core.step(dt);
	};

	app.ticker.add(update);

	return {
		world: core.world,

		spawnEffect: core.spawnEffect,
		spawnAnimal: core.spawnAnimal,
		joinViewer: core.joinViewer,
		removeBots: core.removeBots,
		reset() {
			core.reset();
			core.spawnEffect({ id: "fire/campfire" }, CAMPFIRE_POSITION);
			for (let i = 0; i < ANIMAL_COUNT; i++) core.spawnAnimal();
		},

		start() {
			if (isDestroyed) return;
			app.ticker.start();
		},

		stop() {
			app.ticker.stop();
		},

		isRunning() {
			return app.ticker.started;
		},

		setTimeScale(scale: number) {
			timeScale = scale;
		},

		destroy() {
			if (isDestroyed) return;
			isDestroyed = true;

			app.ticker?.remove(update);
			core.dispose();
		},
	};
}
