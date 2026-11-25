import {
	VIEWER_HEIGHT,
	VIEWER_WIDTH,
	WALK_EDGE_MARGIN,
	WALK_MAX_SPEED,
	WALK_MAX_TURN_TIME,
	WALK_MIN_SPEED,
	WALK_MIN_TURN_TIME,
} from "../config.js";
import { visibleBounds } from "../viewport.js";
import type { SystemFactory } from "./types.js";

export const createWalkSystem: SystemFactory = (ctx) => {
	const walkers = ctx.world.with("walker", "position");

	return (dt) => {
		const bounds = visibleBounds(ctx.screen);
		for (const entity of walkers) {
			if (entity.chopper?.state === "chopping") continue;

			if (entity.walker.target) {
				const target = entity.walker.target;
				const dx = target.x - entity.position.x;
				const dy = target.y - entity.position.y;
				const distance = Math.hypot(dx, dy);
				const step = entity.walker.speed * dt;
				if (!entity.chopper) entity.walker.direction = dx < 0 ? -1 : 1;
				entity.walker.heading = Math.atan2(dy, dx);
				if (distance > step) {
					entity.position.x += (dx / distance) * step;
					entity.position.y += (dy / distance) * step;
				} else {
					entity.position.x = target.x;
					entity.position.y = target.y;
				}
				continue;
			}

			entity.walker.timer -= dt;

			if (entity.walker.timer <= 0) {
				entity.walker.heading = ctx.rng() * Math.PI * 2;
				entity.walker.direction = Math.cos(entity.walker.heading) < 0 ? -1 : 1;
				entity.walker.speed =
					WALK_MIN_SPEED + ctx.rng() * (WALK_MAX_SPEED - WALK_MIN_SPEED);
				entity.walker.timer =
					WALK_MIN_TURN_TIME +
					ctx.rng() * (WALK_MAX_TURN_TIME - WALK_MIN_TURN_TIME);
			}

			entity.position.x +=
				Math.cos(entity.walker.heading) * entity.walker.speed * dt;
			entity.position.y +=
				Math.sin(entity.walker.heading) * entity.walker.speed * dt;

			const halfWidth =
				(entity.size?.width ?? VIEWER_WIDTH * ctx.settings.viewerScale) / 2;
			const minX = bounds.minX + halfWidth + WALK_EDGE_MARGIN;
			const maxX = Math.max(minX, bounds.maxX - halfWidth - WALK_EDGE_MARGIN);
			if (entity.position.x < minX) {
				entity.position.x = minX;
				entity.walker.heading = Math.PI - entity.walker.heading;
				entity.walker.direction = 1;
			} else if (entity.position.x > maxX) {
				entity.position.x = maxX;
				entity.walker.heading = Math.PI - entity.walker.heading;
				entity.walker.direction = -1;
			}

			const halfHeight =
				(entity.size?.height ?? VIEWER_HEIGHT * ctx.settings.viewerScale) / 2;
			const minY = bounds.minY + halfHeight + WALK_EDGE_MARGIN;
			const maxY = Math.max(minY, bounds.maxY - halfHeight - WALK_EDGE_MARGIN);
			if (entity.position.y < minY) {
				entity.position.y = minY;
				entity.walker.heading = -entity.walker.heading;
			} else if (entity.position.y > maxY) {
				entity.position.y = maxY;
				entity.walker.heading = -entity.walker.heading;
			}
		}
	};
};
