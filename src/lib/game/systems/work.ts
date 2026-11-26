import {
	WORK_ARRIVE_DISTANCE,
	WORK_DURATION,
	WORK_POSITIONS,
} from "../config.js";
import { addItem } from "../inventory.js";
import type { Entity } from "../types.js";
import type { SystemFactory } from "./types.js";

export const createWorkSystem: SystemFactory = (ctx) => {
	const workers = ctx.world.with("worker", "position", "walker");

	return (dt) => {
		const finished: Entity[] = [];
		for (const entity of workers) {
			const worker = entity.worker;
			if (!worker) continue;

			if (worker.state === "walking") {
				const target = entity.walker.target;
				if (!target) continue;
				const distance = Math.hypot(
					target.x - entity.position.x,
					target.y - entity.position.y,
				);
				if (distance > WORK_ARRIVE_DISTANCE) continue;
				worker.state = "working";
				worker.timer = WORK_DURATION[worker.action];
				entity.walker.target = undefined;
				continue;
			}

			worker.timer -= dt;
			if (worker.timer > 0) continue;

			const next = worker.next.shift();
			if (next) {
				worker.action = next;
				worker.state = "walking";
				worker.timer = 0;
				entity.walker.target = WORK_POSITIONS[next];
				entity.walker.direction =
					entity.walker.target.x < entity.position.x ? -1 : 1;
			} else {
				finished.push(entity);
			}
		}

		for (const entity of finished) {
			const worker = entity.worker;
			const walker = entity.walker;
			if (!worker || !walker) continue;
			walker.speed = worker.speed;
			if (worker.action === "chop" && entity.inventory) {
				addItem(entity.inventory, "wood", 1);
			}
			ctx.world.removeComponent(entity, "worker");
		}
	};
};
