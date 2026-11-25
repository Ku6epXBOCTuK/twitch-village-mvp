import {
	VIEWER_WIDTH,
	WALK_EDGE_MARGIN,
	WALK_MAX_SPEED,
	WALK_MAX_TURN_TIME,
	WALK_MIN_SPEED,
} from "./config.js";
import type { GameContext } from "./context.js";
import type { Entity, Viewer } from "./types.js";
import { visibleBounds } from "./viewport.js";

export function spawnViewer(ctx: GameContext, viewer: Viewer) {
	const { world, settings, rng } = ctx;
	const width = VIEWER_WIDTH * settings.viewerScale;
	const bounds = visibleBounds(ctx.screen);
	const minX = bounds.minX + width / 2 + WALK_EDGE_MARGIN;
	const minY = bounds.minY + width / 2 + WALK_EDGE_MARGIN;
	const x = minX + rng() * Math.max(1, bounds.maxX - minX * 2);
	const y = minY + rng() * Math.max(1, bounds.maxY - minY * 2);
	const heading = rng() * Math.PI * 2;

	return world.add({
		viewer,
		position: { x, y },
		walker: {
			direction: Math.cos(heading) < 0 ? -1 : 1,
			heading,
			speed: WALK_MIN_SPEED + rng() * (WALK_MAX_SPEED - WALK_MIN_SPEED),
			timer: rng() * WALK_MAX_TURN_TIME,
		},
	} satisfies Partial<Entity>);
}
