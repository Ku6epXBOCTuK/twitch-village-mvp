import type { RenderSystemGroup, SystemGroup } from "./types.js";
import { createEffectRenderSystem } from "./effect-render.js";
import { createMapRenderSystem } from "./map-render.js";
import { createMeasureSystem } from "./measure.js";
import { createViewerPersistenceSystem } from "./viewer-persistence.js";
import { createViewerRenderSystem } from "./viewer-render.js";
import { createViewerTimeoutSystem } from "./viewer-timeout.js";
import { createWalkSystem } from "./walk.js";

export function logicGroups(): SystemGroup[] {
	return [
		{
			name: "viewers",
			factories: [
				createMeasureSystem,
				createWalkSystem,
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
				createViewerRenderSystem,
			],
		},
	];
}
