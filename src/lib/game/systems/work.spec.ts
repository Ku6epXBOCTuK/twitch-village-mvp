import { describe, expect, it } from "vitest";
import {
	BED_POINTS,
	CAMPFIRE_POSITION,
	CHOP_STANDOFF,
	QUARRY_POINTS,
	VIEWER_HEIGHT,
	WATER_SOURCE_POSITION,
	WORK_ARRIVE_DISTANCE,
	WORK_CAMPFIRE_DURATION,
	WORK_DURATION,
	WORK_FETCH_WATER_DURATION,
} from "../config.js";
import { makeGameContext } from "../testing.js";
import type { Entity, Position, WorkKind } from "../types.js";
import { JOB_RECIPES } from "../work/recipes.js";
import { createWorkSystem } from "./work.js";

function workerEntity(kind: WorkKind, overrides: Partial<Entity> = {}): Entity {
	return {
		viewer: {
			userId: "u1",
			user: "alice",
			login: "alice",
			lastSeen: 0,
		},
		position: { x: 100, y: 100 },
		walker: {
			direction: 1,
			heading: 0,
			speed: 90,
			timer: 10,
		},
		worker: {
			kind,
			action: JOB_RECIPES[kind].phases[0].action,
			phaseIndex: 0,
			state: "walking",
			timer: 0,
			speed: 30,
			pointIndex: 0,
			carrying: {},
		},
		...overrides,
	};
}

function arrive(entity: Entity, target: Position) {
	entity.position = { ...target };
}

describe("work system", () => {
	it("keeps walking until the viewer reaches the quarry point", () => {
		const entity = workerEntity("mine");
		const system = createWorkSystem(makeGameContext([entity]));

		system(0.016);

		expect(entity.worker?.state).toBe("walking");
		expect(entity.walker?.target).toEqual(QUARRY_POINTS[0]);
	});

	it("starts the phase at the target and stops the walk", () => {
		const entity = workerEntity("plant");
		const system = createWorkSystem(makeGameContext([entity]));
		system(0.016);
		arrive(entity, BED_POINTS[0]);

		system(0.016);

		expect(entity.worker?.state).toBe("working");
		expect(entity.worker?.action).toBe("farm");
		expect(entity.worker?.timer).toBe(WORK_DURATION.farm);
		expect(entity.walker?.target).toBeUndefined();
	});

	it("continues on a neighbouring quarry point after the phase is finished", () => {
		const entity = workerEntity("mine");
		const system = createWorkSystem(makeGameContext([entity]));
		system(0.016);
		arrive(entity, QUARRY_POINTS[0]);
		system(0.016);

		system(WORK_DURATION.mine + 1);

		expect(entity.worker).toBeDefined();
		expect(entity.worker?.pointIndex).toBe(1);
		expect(entity.worker?.state).toBe("walking");
		expect(entity.walker?.target).toEqual(QUARRY_POINTS[1]);
	});

	it("gives two miners different quarry points", () => {
		const first = workerEntity("mine");
		const second = workerEntity("mine", {
			viewer: {
				userId: "u2",
				user: "bob",
				login: "bob",
				lastSeen: 0,
			},
		});
		const system = createWorkSystem(makeGameContext([first, second]));

		system(0.016);

		expect(first.worker?.target).toEqual(QUARRY_POINTS[0]);
		expect(second.worker?.target).toEqual(QUARRY_POINTS[1]);
	});

	it("keeps bed and quarry point bookkeeping separate", () => {
		const miner = workerEntity("mine");
		const planter = workerEntity("plant", {
			viewer: {
				userId: "u2",
				user: "bob",
				login: "bob",
				lastSeen: 0,
			},
		});
		const system = createWorkSystem(makeGameContext([miner, planter]));

		system(0.016);

		expect(miner.worker?.target).toEqual(QUARRY_POINTS[0]);
		expect(planter.worker?.target).toEqual(BED_POINTS[0]);
	});

	it("fetches water before watering the same point and moves on", () => {
		const entity = workerEntity("plant");
		const system = createWorkSystem(makeGameContext([entity]));
		system(0.016);
		arrive(entity, BED_POINTS[0]);
		system(0.016);

		system(WORK_DURATION.farm + 1);

		expect(entity.worker?.state).toBe("walking");
		expect(entity.worker?.action).toBe("idle");
		expect(entity.walker?.target).toEqual(WATER_SOURCE_POSITION);

		arrive(entity, WATER_SOURCE_POSITION);
		system(0.016);
		expect(entity.worker?.state).toBe("working");
		expect(entity.worker?.timer).toBe(WORK_FETCH_WATER_DURATION);

		system(WORK_FETCH_WATER_DURATION + 1);

		expect(entity.worker?.carrying).toEqual({ water: 1 });
		expect(entity.worker?.action).toBe("water");
		expect(entity.walker?.target).toEqual(BED_POINTS[0]);

		arrive(entity, BED_POINTS[0]);
		system(0.016);
		expect(entity.worker?.timer).toBe(WORK_DURATION.water);

		system(WORK_DURATION.water + 1);

		expect(entity.worker?.carrying).toEqual({});
		expect(entity.worker?.pointIndex).toBe(1);
		expect(entity.walker?.target).toEqual(BED_POINTS[1]);
	});

	it("carries the log to the campfire, waits, then selects another tree", () => {
		const margin = (VIEWER_HEIGHT * 2) / 2;
		const firstTree = { x: 1000, y: 620 };
		const secondTree = { x: 1100, y: 660 };
		const entity = workerEntity("chop", { position: { x: 900, y: 620 } });
		const ctx = makeGameContext([entity], {
			forest: [
				{ ...firstTree, kind: "small", frame: 0, scale: 1 },
				{ ...secondTree, kind: "small", frame: 0, scale: 1 },
			],
		});
		const system = createWorkSystem(ctx);
		system(0.016);

		expect(entity.walker?.target).toEqual({
			x: firstTree.x - CHOP_STANDOFF,
			y: firstTree.y - margin,
		});
		arrive(entity, {
			x: firstTree.x - CHOP_STANDOFF,
			y: firstTree.y - margin,
		});
		system(0.016);
		expect(entity.worker?.timer).toBe(WORK_DURATION.chop);

		system(WORK_DURATION.chop + 1);

		expect(entity.worker?.carrying).toEqual({ log: 1 });
		expect(entity.walker?.target).toEqual(CAMPFIRE_POSITION);
		arrive(entity, CAMPFIRE_POSITION);
		system(0.016);
		expect(entity.worker?.timer).toBe(WORK_CAMPFIRE_DURATION);

		system(WORK_CAMPFIRE_DURATION + 1);

		expect(entity.worker?.carrying).toEqual({});
		expect(entity.walker?.target).toEqual({
			x: secondTree.x + CHOP_STANDOFF,
			y: secondTree.y - margin,
		});
		expect(entity.worker).toBeDefined();
	});

	it("runs a custom recipe without changing the system", () => {
		const customKind = "custom" as WorkKind;
		JOB_RECIPES[customKind] = {
			phases: [
				{ action: "farm", target: "bed", duration: 1 },
				{ action: "water", target: "bed", duration: 2 },
				{ action: "mine", target: "bed", duration: 3 },
			],
			supply: {},
			nextTarget: "nextBed",
		};
		try {
			const entity = workerEntity(customKind);
			const system = createWorkSystem(makeGameContext([entity]));
			system(0.016);
			arrive(entity, BED_POINTS[0]);

			system(0.016);
			expect(entity.worker?.action).toBe("farm");
			system(2);
			expect(entity.worker?.action).toBe("water");
			arrive(entity, BED_POINTS[0]);
			system(0.016);
			system(3);
			expect(entity.worker?.action).toBe("mine");
			arrive(entity, BED_POINTS[0]);
			system(0.016);
			system(4);
			expect(entity.worker?.phaseIndex).toBe(0);
			expect(entity.worker?.action).toBe("farm");
		} finally {
			delete JOB_RECIPES[customKind];
		}
	});

	it("arrives at the point inside the arrival distance", () => {
		const entity = workerEntity("mine", {
			position: {
				x: QUARRY_POINTS[0].x + WORK_ARRIVE_DISTANCE,
				y: QUARRY_POINTS[0].y,
			},
		});
		const system = createWorkSystem(makeGameContext([entity]));
		system(0.016);
		system(0.016);

		expect(entity.worker?.state).toBe("working");
	});
});
