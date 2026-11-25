import { World } from "miniplex";
import { describe, expect, it } from "vitest";
import { CHOP_ARRIVE_DISTANCE, CHOP_DURATION } from "../config.js";
import type { GameContext } from "../context.js";
import { createInventory } from "../inventory.js";
import { defaultSettings } from "../settings.js";
import type { Entity } from "../types.js";
import { createChopSystem } from "./chop.js";

function makeContext(entities: Entity[]): GameContext {
	const world = new World<Entity>();
	for (const entity of entities) world.add(entity);
	return {
		world,
		settings: defaultSettings(),
		rng: () => 0.5,
		screen: { width: 800, height: 600 },
	} as GameContext;
}

function chopperEntity(overrides: Partial<Entity> = {}): Entity {
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
		chopper: { state: "walking", timer: 0, speed: 30 },
		...overrides,
	};
}

describe("chop system", () => {
	it("keeps walking until the viewer reaches the tree", () => {
		const entity = chopperEntity();
		const system = createChopSystem(makeContext([entity]));

		system(0.016);

		expect(entity.chopper?.state).toBe("walking");
		expect(entity.walker?.target).toEqual({ x: 200, y: 100 });
	});

	it("starts the animation at the tree and stops the walk", () => {
		const entity = chopperEntity({
			position: { x: 200 - CHOP_ARRIVE_DISTANCE, y: 100 },
		});
		const system = createChopSystem(makeContext([entity]));

		system(0.016);

		expect(entity.chopper?.state).toBe("chopping");
		expect(entity.chopper?.timer).toBe(CHOP_DURATION);
		expect(entity.walker?.target).toBeUndefined();
	});

	it("returns the viewer to wandering after the animation", () => {
		const entity = chopperEntity({
			position: { x: 200, y: 100 },
			walker: {
				direction: 1,
				heading: 0,
				speed: 90,
				timer: 10,
			},
			chopper: { state: "chopping", timer: 0.1, speed: 30 },
		});
		const system = createChopSystem(makeContext([entity]));

		system(0.2);

		expect(entity.chopper).toBeUndefined();
		expect(entity.walker?.speed).toBe(30);
		expect(entity.inventory?.items).toEqual({ wood: 1 });
	});
});
