import { describe, expect, it } from "vitest";
import { autotile } from "./autotile.js";
import { createRng, generateMap } from "./generate.js";

describe("generateMap", () => {
	it("repeats the same cells for the same seed", () => {
		const first = generateMap(48, 32, createRng(42));
		const second = generateMap(48, 32, createRng(42));
		expect(first).toEqual(second);
	});

	it("uses the configured size by default", () => {
		const grid = generateMap();
		expect(grid.width).toBe(160);
		expect(grid.height).toBe(100);
		expect(grid.cells).toHaveLength(16000);
		expect(autotile(grid).every((tile) => !tile.invalid)).toBe(true);
	});

	it("generates maps the atlas can draw", () => {
		for (let seed = 1; seed <= 12; seed++) {
			const grid = generateMap(48, 32, createRng(seed));
			const tiles = autotile(grid);
			expect(
				tiles.every((tile) => !tile.invalid),
				`seed ${seed}`,
			).toBe(true);
			expect(
				grid.cells.filter((cell) => cell === "path").length,
			).toBeGreaterThan(0);
			expect(
				tiles.filter(
					(tile, index) =>
						tile.tile.startsWith("grassCorner") &&
						grid.cells[index] === "grass",
				).length,
			).toBeGreaterThan(0);
		}
	});
});
