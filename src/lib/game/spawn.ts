import { ANIMAL_FRAME_SIZE, type AnimalKind } from "./animals.js";
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

function randomWalkStart(ctx: GameContext, extent: number) {
	const bounds = visibleBounds(ctx.screen);
	const minX = bounds.minX + extent / 2 + WALK_EDGE_MARGIN;
	const minY = bounds.minY + extent / 2 + WALK_EDGE_MARGIN;
	return {
		x: minX + ctx.rng() * Math.max(1, bounds.maxX - minX * 2),
		y: minY + ctx.rng() * Math.max(1, bounds.maxY - minY * 2),
		heading: ctx.rng() * Math.PI * 2,
	};
}

export function spawnViewer(ctx: GameContext, viewer: Viewer) {
	const { world, settings, rng } = ctx;
	const { x, y, heading } = randomWalkStart(
		ctx,
		VIEWER_WIDTH * settings.viewerScale,
	);

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

export function spawnAnimal(ctx: GameContext, animal: AnimalKind) {
	const { world, settings, rng } = ctx;
	const { x, y, heading } = randomWalkStart(
		ctx,
		ANIMAL_FRAME_SIZE * settings.viewerScale,
	);

	return world.add({
		animal,
		position: { x, y },
		walker: {
			direction: Math.cos(heading) < 0 ? -1 : 1,
			heading,
			speed: WALK_MIN_SPEED + rng() * (WALK_MAX_SPEED - WALK_MIN_SPEED),
			timer: rng() * WALK_MAX_TURN_TIME,
		},
	} satisfies Partial<Entity>);
}
