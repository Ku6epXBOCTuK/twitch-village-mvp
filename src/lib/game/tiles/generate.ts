import { MAP_HEIGHT_CELLS, MAP_SEED, MAP_WIDTH_CELLS } from "../config.js";
import type { TerrainGrid, TerrainId } from "./types.js";

export function createRng(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state * 1664525 + 1013904223) >>> 0;
		return state / 0x100000000;
	};
}

interface Patch {
	x: number;
	y: number;
	width: number;
	height: number;
}

const index = (grid: TerrainGrid, x: number, y: number) => y * grid.width + x;

function stampRect(
	grid: TerrainGrid,
	x: number,
	y: number,
	width: number,
	height: number,
	terrain: TerrainId,
) {
	for (let cy = y; cy < y + height; cy++) {
		for (let cx = x; cx < x + width; cx++) {
			grid.cells[index(grid, cx, cy)] = terrain;
		}
	}
}

function stampPatch(grid: TerrainGrid, patch: Patch) {
	for (let cy = patch.y; cy < patch.y + patch.height; cy++) {
		for (let cx = patch.x; cx < patch.x + patch.width; cx++) {
			const corner =
				(cx === patch.x || cx === patch.x + patch.width - 1) &&
				(cy === patch.y || cy === patch.y + patch.height - 1);
			if (!corner) grid.cells[index(grid, cx, cy)] = "path";
		}
	}
}

function overlaps(a: Patch, b: Patch): boolean {
	return (
		a.x - 2 < b.x + b.width &&
		a.x + a.width + 2 > b.x &&
		a.y - 2 < b.y + b.height &&
		a.y + a.height + 2 > b.y
	);
}

export function generateMap(
	width = MAP_WIDTH_CELLS,
	height = MAP_HEIGHT_CELLS,
	rng: () => number = createRng(MAP_SEED),
): TerrainGrid {
	const grid: TerrainGrid = {
		width,
		height,
		cells: Array.from({ length: width * height }, () => "grass"),
	};

	const patches: Patch[] = [
		{
			x: Math.floor(width * 0.18),
			y: Math.floor(height * 0.16),
			width: Math.min(36, Math.floor(width * 0.46)),
			height: Math.min(24, Math.floor(height * 0.46)),
		},
	];

	const anchors = [
		[0.04, 0.04],
		[0.72, 0.06],
		[0.05, 0.66],
		[0.72, 0.68],
		[0.36, 0.74],
	];

	for (const [anchorX, anchorY] of anchors) {
		const patchWidth = 8 + Math.floor(rng() * 5);
		const patchHeight = 8 + Math.floor(rng() * 5);
		const x = Math.max(
			1,
			Math.min(
				width - patchWidth - 1,
				Math.floor(anchorX * width + (rng() - 0.5) * 4),
			),
		);
		const y = Math.max(
			1,
			Math.min(
				height - patchHeight - 1,
				Math.floor(anchorY * height + (rng() - 0.5) * 4),
			),
		);
		const patch = { x, y, width: patchWidth, height: patchHeight };
		if (patches.some((other) => overlaps(patch, other))) continue;
		patches.push(patch);
	}

	for (const patch of patches) {
		stampPatch(grid, patch);
		if (patch.width >= 11 && patch.height >= 11) {
			stampRect(grid, patch.x + 3, patch.y + 3, 3, 3, "grass");
			stampRect(
				grid,
				patch.x + patch.width - 6,
				patch.y + patch.height - 6,
				2,
				2,
				"grass",
			);
		}
	}

	return grid;
}
