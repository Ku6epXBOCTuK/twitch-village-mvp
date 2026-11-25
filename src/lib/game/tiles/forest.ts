import type { Position } from "../types.js";
import { createRng } from "./generate.js";
import { type TerrainGrid, TILE_SIZE } from "./types.js";

export interface ForestTree {
	x: number;
	y: number;
	kind: "large" | "small";
	frame: number;
	scale: number;
}

const COLUMNS = 12;
const ROWS = 8;
const STEP = 3.5 * TILE_SIZE;
const START_X = 3 * TILE_SIZE;
const START_Y = 7.5 * TILE_SIZE;
const JITTER = 0.6 * TILE_SIZE;
const SKIP_CHANCE = 0.12;
const EDGE_SKIP_CHANCE = 0.4;
const FOREST_SEED = 0x466f7265;

export function generateForest(
	grid: TerrainGrid,
	origin: Position = { x: 0, y: 0 },
	rng: () => number = createRng(FOREST_SEED),
): ForestTree[] {
	const trees: ForestTree[] = [];

	for (let row = 0; row < ROWS; row++) {
		for (let col = 0; col < COLUMNS; col++) {
			const edge = row >= ROWS - 2 || col >= COLUMNS - 2;
			if (rng() < (edge ? EDGE_SKIP_CHANCE : SKIP_CHANCE)) continue;

			const x = origin.x + START_X + col * STEP + (rng() - 0.5) * 2 * JITTER;
			const y = origin.y + START_Y + row * STEP + (rng() - 0.5) * 2 * JITTER;
			const cellX = Math.floor(x / TILE_SIZE);
			const cellY = Math.floor(y / TILE_SIZE);
			if (
				cellX < 0 ||
				cellX >= grid.width ||
				cellY < 0 ||
				cellY >= grid.height
			) {
				continue;
			}

			const large = rng() < 0.6;
			trees.push({
				x,
				y,
				kind: large ? "large" : "small",
				frame: !large && rng() < 0.5 ? 1 : 0,
				scale: (large ? 1 : 1.1) + rng() * 0.3,
			});
		}
	}

	return trees;
}
