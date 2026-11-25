import { describe, expect, it } from "vitest";
import { autotile, findGrassCorners } from "./autotile.js";
import { PRESETS } from "./presets.js";
import type { TerrainGrid } from "./types.js";

function grid(rows: string[]): TerrainGrid {
	const width = rows[0].length;
	return {
		width,
		height: rows.length,
		cells: rows
			.join("")
			.split("")
			.map((cell) => (cell === "#" ? "path" : "grass")),
	};
}

describe("autotile", () => {
	it("builds a path blob from the upper 3x3 cells", () => {
		const result = autotile(
			grid([
				".......",
				".......",
				"..###..",
				"..###..",
				"..###..",
				".......",
				".......",
			]),
		);
		const at = (x: number, y: number) => result[y * 7 + x];

		expect(at(3, 3).tile).toBe("pathMiddle");
		expect(at(3, 2).tile).toBe("pathEdgeN");
		expect(at(4, 3).tile).toBe("pathEdgeE");
		expect(at(3, 4).tile).toBe("pathEdgeS");
		expect(at(2, 3).tile).toBe("pathEdgeW");
		expect(at(2, 2).tile).toBe("pathCornerNW");
		expect(at(4, 2).tile).toBe("pathCornerNE");
		expect(at(4, 4).tile).toBe("pathCornerSE");
		expect(at(2, 4).tile).toBe("pathCornerSW");
		expect(result.every((tile) => !tile.invalid)).toBe(true);
	});

	it("puts the external corner on a path tip whose diagonal is grass", () => {
		const result = autotile(
			grid([".....", ".....", "..##.", "..#..", "....."]),
		);
		expect(result[2 * 5 + 2].tile).toBe("grassCornerNW");
	});

	it("places the NW external corner on a diagonal grass joint", () => {
		const result = autotile(
			grid([".....", "..##.", ".###.", ".###.", "....."]),
		);
		expect(result[12].tile).toBe("grassCornerNW");
	});

	it("places the NE external corner on a diagonal grass joint", () => {
		const result = autotile(
			grid([".....", ".##..", ".###.", ".###.", "....."]),
		);
		expect(result[12].tile).toBe("grassCornerNE");
	});

	it("places the SW external corner on a diagonal grass joint", () => {
		const result = autotile(
			grid([".....", ".###.", ".###.", "..##.", "....."]),
		);
		expect(result[12].tile).toBe("grassCornerSW");
	});

	it("places the SE external corner on a diagonal grass joint", () => {
		const result = autotile(
			grid([".....", ".###.", ".###.", ".##..", "....."]),
		);
		expect(result[12].tile).toBe("grassCornerSE");
	});

	it("puts the four external corners on the diagonal joints of the path blob", () => {
		const preset = PRESETS.find(
			(item) => item.id === "blob",
		) as (typeof PRESETS)[number];
		const result = autotile(preset.grid);
		const at = (cell: number) => result[cell - 1].tile;

		expect(findGrassCorners(preset.grid).size).toBe(0);
		expect(at(29)).toBe("grassCornerNW");
		expect(at(31)).toBe("grassCornerNE");
		expect(at(53)).toBe("grassCornerSW");
		expect(at(55)).toBe("grassCornerSE");
		expect(
			result.filter((tile) => tile.tile.startsWith("grassCorner")),
		).toHaveLength(4);
		expect(result.every((tile) => !tile.invalid)).toBe(true);
	});

	it("uses the lower cells for a concave path corner in the background grass", () => {
		const result = autotile(
			grid([".....", "..#..", ".##..", "...##", "....."]),
		);
		expect(
			findGrassCorners(grid([".....", "..#..", ".##..", "...##", "....."]))
				.size,
		).toBe(0);
		expect(result[2 * 5 + 2].tile).toBe("grassCornerSE");
	});

	it("builds a 2x2 grass island and keeps its path neighbours plain", () => {
		const preset = PRESETS.find(
			(item) => item.id === "island",
		) as (typeof PRESETS)[number];
		const corners = findGrassCorners(preset.grid);
		const result = autotile(preset.grid);
		const at = (x: number, y: number) => result[y * preset.grid.width + x];

		expect(corners.size).toBe(4);
		expect(at(5, 3).tile).toBe("grassCornerSE");
		expect(at(6, 3).tile).toBe("grassCornerSW");
		expect(at(5, 4).tile).toBe("grassCornerNE");
		expect(at(6, 4).tile).toBe("grassCornerNW");
		expect(at(5, 2).tile).toBe("pathMiddle");
		expect(at(4, 3).tile).toBe("pathMiddle");
		expect(
			result.filter((tile) => tile.tile.startsWith("grassCorner")),
		).toHaveLength(4);
		expect(
			result.filter(
				(tile, cell) =>
					tile.tile.startsWith("grassCorner") &&
					preset.grid.cells[cell] !== "grass",
			),
		).toHaveLength(0);
		expect(result.every((tile) => !tile.invalid)).toBe(true);
	});

	it("puts island corners on a larger grass hole in a path field", () => {
		const preset = PRESETS.find(
			(item) => item.id === "hole",
		) as (typeof PRESETS)[number];
		const result = autotile(preset.grid);
		const at = (x: number, y: number) => result[y * preset.grid.width + x];

		expect(findGrassCorners(preset.grid).size).toBe(4);
		expect(at(4, 2).tile).toBe("grassCornerSE");
		expect(at(6, 2).tile).toBe("grassCornerSW");
		expect(at(4, 4).tile).toBe("grassCornerNE");
		expect(at(6, 4).tile).toBe("grassCornerNW");
		expect(at(5, 3).tile).toBe("grassMiddle");
		expect(at(4, 1).tile).toBe("pathMiddle");
		expect(at(3, 2).tile).toBe("pathMiddle");
		const atCell = (number: number) => result[number - 1];
		expect(atCell(18).tile).toBe("pathMiddle");
		expect(atCell(30).tile).toBe("pathEdgeS");
		expect(atCell(40).tile).toBe("pathMiddle");
		expect(atCell(41).tile).toBe("pathEdgeE");
		expect(atCell(44).tile).toBe("pathMiddle");
		expect(atCell(43).tile).toBe("pathEdgeW");
		expect(atCell(66).tile).toBe("pathMiddle");
		expect(atCell(54).tile).toBe("pathEdgeN");
		expect(
			result.filter((tile) => tile.tile.startsWith("grassCorner")),
		).toHaveLength(4);
		expect(
			result.filter(
				(tile, cell) =>
					tile.tile.startsWith("grassCorner") &&
					preset.grid.cells[cell] !== "grass",
			),
		).toHaveLength(0);
		expect(result.every((tile) => !tile.invalid)).toBe(true);
	});

	it("applies the diagonal rule next to an enclosed grass corner in the mixed preset", () => {
		const preset = PRESETS.find(
			(item) => item.id === "mixed",
		) as (typeof PRESETS)[number];
		const result = autotile(preset.grid);
		const at = (cell: number) => result[cell - 1].tile;

		expect(at(45)).toBe("grassCornerNW");
		expect(at(57)).toBe("grassCornerSW");
		expect(result.every((tile) => !tile.invalid)).toBe(true);
	});

	it("flags shapes the atlas cannot represent", () => {
		const preset = PRESETS.find(
			(item) => item.id === "corridor",
		) as (typeof PRESETS)[number];
		const result = autotile(preset.grid);
		const pathCells = result.filter(
			(_, index) => preset.grid.cells[index] === "path",
		);

		expect(pathCells.length).toBe(8);
		expect(pathCells.every((tile) => tile.invalid)).toBe(true);
	});

	it("never leaves a bare grass to path border", () => {
		const violations: string[] = [];
		let borders = 0;
		for (const preset of PRESETS) {
			const tiles = autotile(preset.grid);
			for (let y = 0; y < preset.grid.height; y++) {
				for (let x = 0; x < preset.grid.width; x++) {
					const current = y * preset.grid.width + x;
					if (tiles[current].invalid) continue;
					for (const [dx, dy] of [
						[1, 0],
						[0, 1],
					]) {
						const nx = x + dx;
						const ny = y + dy;
						if (nx >= preset.grid.width || ny >= preset.grid.height) continue;
						const next = ny * preset.grid.width + nx;
						if (tiles[next].invalid) continue;
						if (preset.grid.cells[current] === preset.grid.cells[next])
							continue;
						borders++;
						if (
							tiles[current].tile === "pathMiddle" &&
							tiles[next].tile === "grassMiddle"
						) {
							violations.push(`${preset.id} at ${x},${y}`);
						}
						if (
							tiles[current].tile === "grassMiddle" &&
							tiles[next].tile === "pathMiddle"
						) {
							violations.push(`${preset.id} at ${x},${y}`);
						}
					}
				}
			}
		}
		expect(borders).toBeGreaterThan(0);
		expect(violations).toEqual([]);
	});
});
