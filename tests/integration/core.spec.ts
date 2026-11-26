import { describe, expect, it } from "vitest";
import { ViewerStore } from "#lib/features/persistence/viewer-store.js";
import {
	BED_POINTS,
	CAMPFIRE_POSITION,
	QUARRY_POINTS,
	WATER_SOURCE_POSITION,
	WORK_CAMPFIRE_DURATION,
	WORK_DURATION,
	WORK_FETCH_WATER_DURATION,
	WORK_WALK_SPEED,
} from "#lib/game/config.js";
import { createGameCore } from "#lib/game/core.js";
import type { Entity } from "#lib/game/types.js";

function makeCore() {
	return createGameCore({
		screen: { width: 800, height: 600 },
		viewerStore: new ViewerStore({
			load: () => Promise.resolve([]),
			save: () => Promise.resolve(),
		}),
		rng: () => 0.5,
		measureText: () => ({ width: 0, height: 0 }),
	});
}

function findViewer(core: ReturnType<typeof makeCore>): Entity {
	const entity = core.world
		.with("viewer")
		.entities.find((candidate) => candidate.viewer?.userId === "u1");
	if (!entity) throw new Error("viewer not found");
	return entity;
}

function stepUntil(
	core: ReturnType<typeof makeCore>,
	check: () => boolean | undefined,
	label: string,
) {
	for (let i = 0; i < 20000 && !check(); i++) core.step(0.016);
	expect(check(), label).toBe(true);
}

describe("work commands", () => {
	it("chops a tree, carries the log to the campfire and looks for another tree", () => {
		const core = makeCore();
		core.joinViewer({ userId: "u1", user: "alice", login: "alice" });
		const entity = findViewer(core);

		core.chop("u1");
		expect(entity.worker?.kind).toBe("chop");
		stepUntil(
			core,
			() => entity.worker?.state === "working",
			"viewer reaches a tree",
		);
		expect(entity.worker?.action).toBe("chop");
		expect(entity.worker?.timer).toBe(WORK_DURATION.chop);
		const firstTreePosition = { ...entity.position };

		stepUntil(
			core,
			() =>
				entity.worker?.action === "idle" && entity.worker.state === "walking",
			"viewer carries the log to the campfire",
		);
		expect(core.getInventory("u1")).toEqual({ wood: 1 });
		expect(entity.worker?.carrying).toEqual({ log: 1 });
		expect(entity.walker?.target).toEqual(CAMPFIRE_POSITION);

		stepUntil(
			core,
			() =>
				entity.worker?.action === "idle" && entity.worker.state === "working",
			"viewer waits at the campfire",
		);
		expect(entity.worker?.timer).toBe(WORK_CAMPFIRE_DURATION);

		stepUntil(
			core,
			() =>
				entity.worker?.action === "chop" && entity.worker.state === "walking",
			"viewer selects another tree",
		);
		expect(entity.worker).toBeDefined();
		expect(entity.worker?.carrying).toEqual({});
		expect(entity.position).not.toEqual(firstTreePosition);
		core.cancelJob("u1");
		expect(entity.worker).toBeUndefined();
	});

	it("fetches water before watering a point, then moves to the next one", () => {
		const core = makeCore();
		core.joinViewer({ userId: "u1", user: "alice", login: "alice" });
		const entity = findViewer(core);

		core.plant("u1");
		stepUntil(
			core,
			() => entity.worker?.state === "working",
			"viewer reaches a point",
		);
		expect(entity.worker?.action).toBe("farm");
		expect(entity.worker?.timer).toBe(WORK_DURATION.farm);

		stepUntil(
			core,
			() =>
				entity.worker?.action === "idle" && entity.worker.state === "walking",
			"viewer goes for water",
		);
		expect(entity.walker?.target).toEqual(WATER_SOURCE_POSITION);
		stepUntil(
			core,
			() =>
				entity.worker?.action === "idle" && entity.worker.state === "working",
			"viewer draws water",
		);
		expect(entity.worker?.timer).toBe(WORK_FETCH_WATER_DURATION);

		stepUntil(
			core,
			() =>
				entity.worker?.action === "water" && entity.worker.state === "walking",
			"viewer returns to the same point",
		);
		expect(entity.worker?.carrying).toEqual({ water: 1 });
		expect(entity.walker?.target).toEqual(BED_POINTS[0]);

		stepUntil(
			core,
			() =>
				entity.worker?.action === "water" && entity.worker.state === "working",
			"viewer waters the point",
		);
		expect(entity.worker?.timer).toBe(WORK_DURATION.water);

		stepUntil(
			core,
			() =>
				entity.worker?.action === "farm" && entity.worker.state === "walking",
			"viewer starts the next point",
		);
		expect(entity.worker?.carrying).toEqual({});
		expect(entity.walker?.target).toEqual(BED_POINTS[1]);
	});

	it("keeps mining through several quarry points without awarding resources", () => {
		const core = makeCore();
		core.joinViewer({ userId: "u1", user: "alice", login: "alice" });
		const entity = findViewer(core);

		core.mine("u1");
		stepUntil(
			core,
			() => entity.worker?.state === "working",
			"viewer reaches the quarry",
		);
		expect(entity.worker?.action).toBe("mine");
		expect(entity.worker?.timer).toBe(WORK_DURATION.mine);
		expect(entity.worker?.target).toEqual(QUARRY_POINTS[0]);

		stepUntil(
			core,
			() => entity.worker?.pointIndex === 1,
			"viewer moves to the next quarry point",
		);
		expect(entity.worker).toBeDefined();
		expect(entity.walker?.target).toEqual(QUARRY_POINTS[1]);
		expect(core.getInventory("u1")).toEqual({});
	});

	it("replaces a job and restores the walking speed on cancel", () => {
		const core = makeCore();
		core.joinViewer({ userId: "u1", user: "alice", login: "alice" });
		const entity = findViewer(core);
		const walkingSpeed = entity.walker?.speed;
		expect(walkingSpeed).toBeDefined();

		core.assignJob("u1", "mine");
		expect(entity.worker?.kind).toBe("mine");
		expect(entity.walker?.speed).toBe(WORK_WALK_SPEED);

		core.plant("u1");
		expect(entity.worker?.kind).toBe("plant");
		expect(entity.worker?.phaseIndex).toBe(0);

		core.cancelJob("u1");
		expect(entity.worker).toBeUndefined();
		expect(entity.walker?.speed).toBe(walkingSpeed);
	});
});
