import {
	VIEWER_WIDTH,
	WALK_MAX_SPEED,
	WALK_MAX_TURN_TIME,
	WALK_MIN_SPEED,
} from "./config.js";
import type { GameContext } from "./context.js";
import type { Entity, Viewer } from "./types.js";

export function spawnViewer(ctx: GameContext, viewer: Viewer) {
	const { world, settings, rng } = ctx;
	const width = VIEWER_WIDTH * settings.viewerScale;
	const x = width / 2 + rng() * Math.max(1, ctx.screen.width - width);

	return world.add({
		viewer,
		position: { x, y: 0 },
		walker: {
			direction: rng() < 0.5 ? -1 : 1,
			speed: WALK_MIN_SPEED + rng() * (WALK_MAX_SPEED - WALK_MIN_SPEED),
			timer: rng() * WALK_MAX_TURN_TIME,
		},
	} satisfies Partial<Entity>);
}
