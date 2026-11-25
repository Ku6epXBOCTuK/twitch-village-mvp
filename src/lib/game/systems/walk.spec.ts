import { World } from "miniplex";
import { describe, expect, it } from "vitest";
import { MAP_HEIGHT_PX, MAP_WIDTH_PX, VIEWER_WIDTH } from "../config.js";
import type { GameContext } from "../context.js";
import { defaultSettings } from "../settings.js";
import type { Entity } from "../types.js";
import { visibleBounds } from "../viewport.js";
import { createWalkSystem } from "./walk.js";

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

function walkerEntity(overrides: Partial<Entity> = {}): Entity {
	return {
		viewer: {
			userId: "u1",
			user: "alice",
			login: "alice",
			lastSeen: 0,
		},
		position: { x: MAP_WIDTH_PX / 2, y: MAP_HEIGHT_PX / 2 },
		size: { width: VIEWER_WIDTH, height: VIEWER_WIDTH },
		walker: {
			direction: 1,
			heading: Math.PI / 2,
			speed: 60,
			timer: 10,
		},
		...overrides,
	};
}

describe("walk system", () => {
	it("moves a viewer across both axes of the map", () => {
		const entity = walkerEntity();
		const system = createWalkSystem(makeContext([entity]));
		const startX = entity.position?.x ?? 0;
		const startY = entity.position?.y ?? 0;

		system(0.5);

		expect(entity.position?.x).toBeCloseTo(startX);
		expect(entity.position?.y).toBeCloseTo(startY + 30);
	});

	it("keeps a viewer inside the map and turns at the edge", () => {
		const maxX =
			visibleBounds({ width: 800, height: 600 }).maxX - VIEWER_WIDTH / 2 - 8;
		const entity = walkerEntity({
			position: { x: maxX - 1, y: MAP_HEIGHT_PX / 2 },
			walker: {
				direction: 1,
				heading: 0,
				speed: 60,
				timer: 10,
			},
		});
		const system = createWalkSystem(makeContext([entity]));

		system(1);

		expect(entity.position?.x).toBe(maxX);
		expect(entity.walker?.direction).toBe(-1);
		expect(entity.walker?.heading).toBeCloseTo(Math.PI);
	});
});
