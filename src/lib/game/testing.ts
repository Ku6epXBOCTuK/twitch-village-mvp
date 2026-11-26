import { World } from "miniplex";
import { ViewerStore } from "#lib/features/persistence/viewer-store.js";
import type { GameContext } from "./context.js";
import { defaultSettings } from "./settings.js";
import type { Entity } from "./types.js";

export function makeGameContext(
	entities: Entity[] = [],
	overrides: Partial<GameContext> = {},
): GameContext {
	const world = new World<Entity>();
	for (const entity of entities) world.add(entity);

	return {
		world,
		screen: { width: 800, height: 600 },
		settings: defaultSettings(),
		viewerStore: new ViewerStore({
			load: () => Promise.resolve([]),
			save: () => Promise.resolve(),
		}),
		viewersDirty: false,
		viewerProfiles: new Map(),
		forest: [],
		now: () => 0,
		rng: () => 0.5,
		measureText: () => ({ width: 10, height: 10 }),
		...overrides,
	};
}
