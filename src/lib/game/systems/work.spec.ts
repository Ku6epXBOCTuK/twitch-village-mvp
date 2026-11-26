import { describe, expect, it } from "vitest";
import {
	WORK_ARRIVE_DISTANCE,
	WORK_DURATION,
	WORK_POSITIONS,
} from "../config.js";
import { createInventory } from "../inventory.js";
import { makeGameContext } from "../testing.js";
import type { Entity } from "../types.js";
import { createWorkSystem } from "./work.js";

function workerEntity(overrides: Partial<Entity> = {}): Entity {
	return {
		viewer: {
			userId: "u1",
			user: "alice",
			login: "alice",
			lastSeen: 0,
		},
		inventory: createInventory(),
		position: { x: 100, y: 100 },
		walker: {
			direction: 1,
			heading: 0,
			speed: 60,
			timer: 10,
			target: { x: 200, y: 100 },
		},
		worker: {
			action: "chop",
			next: [],
			state: "walking",
			timer: 0,
			speed: 30,
		},
		...overrides,
	};
}

describe("work system", () => {
	it("keeps walking until the viewer reaches the target", () => {
		const entity = workerEntity();
		const system = createWorkSystem(makeGameContext([entity]));

		system(0.016);

		expect(entity.worker?.state).toBe("walking");
		expect(entity.walker?.target).toEqual({ x: 200, y: 100 });
	});

	it("starts the action at the target and stops the walk", () => {
		const entity = workerEntity({
			position: { x: 200 - WORK_ARRIVE_DISTANCE, y: 100 },
			worker: {
				action: "mine",
				next: [],
				state: "walking",
				timer: 0,
				speed: 30,
			},
		});
		const system = createWorkSystem(makeGameContext([entity]));

		system(0.016);

		expect(entity.worker?.state).toBe("working");
		expect(entity.worker?.timer).toBe(WORK_DURATION.mine);
		expect(entity.walker?.target).toBeUndefined();
	});

	it("returns the viewer to wandering and awards wood only for chopping", () => {
		const entity = workerEntity({
			position: { x: 200, y: 100 },
			walker: {
				direction: 1,
				heading: 0,
				speed: 90,
				timer: 10,
			},
			worker: {
				action: "chop",
				next: [],
				state: "working",
				timer: 0.1,
				speed: 30,
			},
		});
		const system = createWorkSystem(makeGameContext([entity]));

		system(0.2);

		expect(entity.worker).toBeUndefined();
		expect(entity.walker?.speed).toBe(30);
		expect(entity.inventory?.items).toEqual({ wood: 1 });
	});

	it("walks to a new place between farming and watering", () => {
		const entity = workerEntity({
			position: { x: 200, y: 100 },
			worker: {
				action: "farm",
				next: ["water"],
				state: "working",
				timer: 0.1,
				speed: 30,
			},
		});
		const system = createWorkSystem(makeGameContext([entity]));

		system(0.2);

		expect(entity.worker?.action).toBe("water");
		expect(entity.worker?.state).toBe("walking");
		expect(entity.walker?.target).toEqual(WORK_POSITIONS.water);

		const waterTarget = entity.walker?.target;
		if (!waterTarget) throw new Error("water target not set");
		entity.position = { ...waterTarget };
		system(0.2);

		expect(entity.worker?.state).toBe("working");
		expect(entity.worker?.timer).toBe(WORK_DURATION.water);

		system(WORK_DURATION.water + 1);

		expect(entity.worker).toBeUndefined();
		expect(entity.inventory?.items).toEqual({});
	});
});
