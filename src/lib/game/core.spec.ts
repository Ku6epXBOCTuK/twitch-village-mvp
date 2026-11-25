import { describe, expect, it } from "vitest";
import { ViewerStore } from "#lib/features/persistence/viewer-store.js";
import { CHOP_DURATION } from "./config.js";
import { createGameCore } from "./core.js";

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

describe("chop command", () => {
	it("walks the sender to a tree, chops and returns to wandering", () => {
		const core = makeCore();
		core.joinViewer({ userId: "u1", user: "alice", login: "alice" });
		const entity = core.world
			.with("viewer")
			.entities.find((candidate) => candidate.viewer?.userId === "u1");
		expect(entity).toBeDefined();

		core.chop("u1");
		expect(entity?.chopper?.state).toBe("walking");
		expect(entity?.walker?.target).toBeDefined();

		for (let i = 0; i < 1000 && entity?.chopper?.state === "walking"; i++) {
			core.step(0.016);
		}
		expect(entity?.chopper?.state).toBe("chopping");
		expect(entity?.walker?.target).toBeUndefined();

		for (
			let i = 0;
			i < Math.ceil(CHOP_DURATION / 0.016) + 1 && entity?.chopper;
			i++
		) {
			core.step(0.016);
		}
		expect(entity?.chopper).toBeUndefined();
		expect(core.getInventory("u1")).toEqual({ wood: 1 });
	});
});
