import { createAnimalRenderSystem } from "./animal-render.js";
import { createEffectRenderSystem } from "./effect-render.js";
import { createMapRenderSystem } from "./map-render.js";
import { createMeasureSystem } from "./measure.js";
import type { RenderSystemGroup, SystemGroup } from "./types.js";
import { createViewerPersistenceSystem } from "./viewer-persistence.js";
import { createViewerRenderSystem } from "./viewer-render.js";
import { createViewerTimeoutSystem } from "./viewer-timeout.js";
import { createWalkSystem } from "./walk.js";
import { createWorkSystem } from "./work.js";

export function logicGroups(): SystemGroup[] {
	return [
		{
			name: "viewers",
			factories: [
				createMeasureSystem,
				createWalkSystem,
				createWorkSystem,
				createViewerTimeoutSystem,
				createViewerPersistenceSystem,
			],
		},
	];
}

export function renderGroups(): RenderSystemGroup[] {
	return [
		{
			name: "render",
			factories: [
				createMapRenderSystem,
				createEffectRenderSystem,
				createAnimalRenderSystem,
				createViewerRenderSystem,
			],
		},
	];
}
