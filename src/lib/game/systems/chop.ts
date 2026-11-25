import { CHOP_ARRIVE_DISTANCE, CHOP_DURATION } from "../config.js";
import type { Entity, Walker } from "../types.js";
import type { SystemFactory } from "./types.js";

export const createChopSystem: SystemFactory = (ctx) => {
	const choppers = ctx.world.with("chopper", "position", "walker");

	return (dt) => {
		const finished: { entity: Entity; walker: Walker; speed: number }[] = [];
		for (const entity of choppers) {
			const chopper = entity.chopper;
			if (!chopper) continue;

			if (chopper.state === "walking") {
				const target = entity.walker.target;
				if (!target) continue;
				const distance = Math.hypot(
					target.x - entity.position.x,
					target.y - entity.position.y,
				);
				if (distance > CHOP_ARRIVE_DISTANCE) continue;
				chopper.state = "chopping";
				chopper.timer = CHOP_DURATION;
				entity.walker.target = undefined;
				continue;
			}

			chopper.timer -= dt;
			if (chopper.timer <= 0) {
				finished.push({
					entity,
					walker: entity.walker,
					speed: chopper.speed,
				});
			}
		}

		for (const { entity, walker, speed } of finished) {
			walker.speed = speed;
			ctx.world.removeComponent(entity, "chopper");
		}
	};
};
