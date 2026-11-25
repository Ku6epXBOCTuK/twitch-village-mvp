import { describe, expect, it } from "vitest";
import { generateForest } from "./forest.js";
import { createRng, generateMap } from "./generate.js";
import { TILE_SIZE } from "./types.js";

describe("generateForest", () => {
	it("fills the top-left corner with a repeatable forest", () => {
		const grid = generateMap();
		const first = generateForest(grid, { x: 0, y: 0 }, createRng(7));
		const second = generateForest(grid, { x: 0, y: 0 }, createRng(7));

		expect(first).toEqual(second);
		expect(first.length).toBeGreaterThan(40);
		expect(first.every((tree) => tree.x < 700 && tree.y < 560)).toBe(true);
	});

	it("shifts the forest into the visible part of the map", () => {
		const grid = generateMap();
		const origin = { x: 640, y: 440 };
		const trees = generateForest(grid, origin);

		expect(trees.length).toBeGreaterThan(30);
		expect(Math.min(...trees.map((tree) => tree.x))).toBeGreaterThan(origin.x);
		expect(Math.min(...trees.map((tree) => tree.y))).toBeGreaterThan(origin.y);
	});

	it("keeps every tree inside the map", () => {
		const grid = generateMap();
		const trees = generateForest(grid, { x: 640, y: 440 });

		expect(
			trees.every(
				(tree) =>
					Math.floor(tree.x / TILE_SIZE) >= 0 &&
					Math.floor(tree.x / TILE_SIZE) < grid.width &&
					Math.floor(tree.y / TILE_SIZE) >= 0 &&
					Math.floor(tree.y / TILE_SIZE) < grid.height,
			),
		).toBe(true);
	});
});
