import { describe, expect, it } from "vitest";
import { ViewerStore } from "#lib/features/persistence/viewer-store.js";
import { WORK_DURATION, WORK_POSITIONS } from "#lib/game/config.js";
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

function targetOf(entity: Entity) {
	const target = entity.walker?.target;
	if (!target) throw new Error("work target not set");
	return target;
}

function walkToWork(core: ReturnType<typeof makeCore>, entity: Entity) {
	for (let i = 0; i < 1000 && entity.worker?.state === "walking"; i++) {
		core.step(0.016);
	}
	expect(entity.worker?.state).toBe("working");
	expect(entity.walker?.target).toBeUndefined();
}

function finishWork(
	core: ReturnType<typeof makeCore>,
	entity: Entity,
	duration: number,
) {
	for (let i = 0; i < Math.ceil(duration / 0.016) + 1 && entity.worker; i++) {
		core.step(0.016);
	}
}

describe("work commands", () => {
	it("walks the sender to a tree, chops and returns to wandering", () => {
		const core = makeCore();
		core.joinViewer({ userId: "u1", user: "alice", login: "alice" });
		const entity = findViewer(core);

		core.chop("u1");
		expect(entity.worker?.state).toBe("walking");
		expect(entity.walker?.target).toBeDefined();

		walkToWork(core, entity);
		finishWork(core, entity, WORK_DURATION.chop);

		expect(entity.worker).toBeUndefined();
		expect(core.getInventory("u1")).toEqual({ wood: 1 });
	});

	it("farms and then waters at different places", () => {
		const core = makeCore();
		core.joinViewer({ userId: "u1", user: "alice", login: "alice" });
		const entity = findViewer(core);

		core.plant("u1");
		expect(entity.worker?.action).toBe("farm");
		expect(entity.worker?.next).toEqual(["water"]);

		walkToWork(core, entity);
		expect(entity.worker?.timer).toBe(WORK_DURATION.farm);
		const farmPosition = { ...entity.position };

		finishWork(core, entity, WORK_DURATION.farm);
		expect(entity.worker?.action).toBe("water");
		expect(entity.worker?.state).toBe("walking");
		expect(entity.walker?.target).toEqual(WORK_POSITIONS.water);

		walkToWork(core, entity);
		expect(entity.worker?.timer).toBe(WORK_DURATION.water);
		expect(entity.position).not.toEqual(farmPosition);

		finishWork(core, entity, WORK_DURATION.water);
		expect(entity.worker).toBeUndefined();
		expect(core.getInventory("u1")).toEqual({});
	});

	it("sends planting and digging to fixed places away from the trees", () => {
		const core = makeCore();
		core.joinViewer({ userId: "u1", user: "alice", login: "alice" });
		const entity = findViewer(core);

		core.chop("u1");
		const chop = targetOf(entity);
		core.plant("u1");
		const farm = targetOf(entity);
		core.dig("u1");
		const mine = targetOf(entity);

		expect(farm).toEqual(WORK_POSITIONS.farm);
		expect(mine).toEqual(WORK_POSITIONS.mine);
		expect(chop).not.toEqual(WORK_POSITIONS.farm);
		expect(chop).not.toEqual(WORK_POSITIONS.mine);
	});

	it("mines for a minute without producing wood", () => {
		const core = makeCore();
		core.joinViewer({ userId: "u1", user: "alice", login: "alice" });
		const entity = findViewer(core);

		core.dig("u1");
		expect(entity.worker?.action).toBe("mine");

		walkToWork(core, entity);
		expect(entity.worker?.timer).toBe(WORK_DURATION.mine);

		finishWork(core, entity, WORK_DURATION.mine);
		expect(entity.worker).toBeUndefined();
		expect(core.getInventory("u1")).toEqual({});
	});
});
