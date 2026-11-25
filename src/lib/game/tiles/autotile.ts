import type {
	Corner,
	Direction,
	TerrainGrid,
	TerrainId,
	TileId,
	TileResult,
} from "./types.js";

const DIRECTIONS: Direction[] = ["n", "e", "s", "w"];
const DELTA: Record<Direction, [number, number]> = {
	n: [0, -1],
	e: [1, 0],
	s: [0, 1],
	w: [-1, 0],
};
const BIT: Record<Direction, number> = { n: 1, e: 2, s: 4, w: 8 };
const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
	n: "s",
	e: "w",
	s: "n",
	w: "e",
};

const CORNER_DIRS: Record<Corner, [Direction, Direction]> = {
	nw: ["n", "w"],
	ne: ["n", "e"],
	se: ["s", "e"],
	sw: ["s", "w"],
};
const CORNER_MASK: Record<Corner, number> = {
	nw: BIT.n | BIT.w,
	ne: BIT.n | BIT.e,
	se: BIT.s | BIT.e,
	sw: BIT.s | BIT.w,
};
const OPPOSITE_CORNER: Record<Corner, Corner> = {
	nw: "se",
	ne: "sw",
	se: "nw",
	sw: "ne",
};

const PATH_EDGE: Record<Direction, TileId> = {
	n: "pathEdgeN",
	e: "pathEdgeE",
	s: "pathEdgeS",
	w: "pathEdgeW",
};
const PATH_CORNER: Record<Corner, TileId> = {
	nw: "pathCornerNW",
	ne: "pathCornerNE",
	se: "pathCornerSE",
	sw: "pathCornerSW",
};
const GRASS_CORNER: Record<Corner, TileId> = {
	nw: "grassCornerNW",
	ne: "grassCornerNE",
	se: "grassCornerSE",
	sw: "grassCornerSW",
};

const index = (grid: TerrainGrid, x: number, y: number) => y * grid.width + x;
const inside = (grid: TerrainGrid, x: number, y: number) =>
	x >= 0 && y >= 0 && x < grid.width && y < grid.height;

function neighbor(
	grid: TerrainGrid,
	x: number,
	y: number,
	direction: Direction,
	own: TerrainId,
): TerrainId {
	const [dx, dy] = DELTA[direction];
	const nx = x + dx;
	const ny = y + dy;
	if (!inside(grid, nx, ny)) return own;
	return grid.cells[index(grid, nx, ny)];
}

function cornerForMask(mask: number): Corner | undefined {
	return (Object.keys(CORNER_MASK) as Corner[]).find(
		(corner) => CORNER_MASK[corner] === mask,
	);
}

function externalGrassCorner(
	grid: TerrainGrid,
	x: number,
	y: number,
	grassCorners: Map<number, Corner>,
): Corner | undefined {
	for (const corner of Object.keys(CORNER_DIRS) as Corner[]) {
		const [first, second] = CORNER_DIRS[corner];
		if (
			neighbor(grid, x, y, first, "path") !== "path" ||
			neighbor(grid, x, y, second, "path") !== "path"
		) {
			continue;
		}
		const diagonal = diagonalIndex(grid, x, y, corner);
		if (
			diagonal !== undefined &&
			grid.cells[diagonal] === "grass" &&
			!grassCorners.has(diagonal)
		) {
			return corner;
		}
	}
	return undefined;
}

function diagonalIndex(
	grid: TerrainGrid,
	x: number,
	y: number,
	corner: Corner,
): number | undefined {
	const [first, second] = CORNER_DIRS[corner];
	const [fx, fy] = DELTA[first];
	const [sx, sy] = DELTA[second];
	const dx = x + fx + sx;
	const dy = y + fy + sy;
	if (!inside(grid, dx, dy)) return undefined;
	return index(grid, dx, dy);
}

function diagonalTerrain(
	grid: TerrainGrid,
	x: number,
	y: number,
	corner: Corner,
): TerrainId | undefined {
	const diagonal = diagonalIndex(grid, x, y, corner);
	return diagonal === undefined ? undefined : grid.cells[diagonal];
}

function findEnclosedGrass(grid: TerrainGrid): Set<number> {
	const visited = new Uint8Array(grid.cells.length);
	const enclosed = new Set<number>();

	for (let start = 0; start < grid.cells.length; start++) {
		if (grid.cells[start] !== "grass" || visited[start]) continue;

		const component: number[] = [];
		const stack = [start];
		visited[start] = 1;
		let touchesEdge = false;

		while (stack.length > 0) {
			const current = stack.pop() as number;
			component.push(current);
			const cx = current % grid.width;
			const cy = Math.floor(current / grid.width);
			if (
				cx === 0 ||
				cy === 0 ||
				cx === grid.width - 1 ||
				cy === grid.height - 1
			) {
				touchesEdge = true;
			}
			for (const direction of DIRECTIONS) {
				const [dx, dy] = DELTA[direction];
				const nx = cx + dx;
				const ny = cy + dy;
				if (!inside(grid, nx, ny)) continue;
				const next = index(grid, nx, ny);
				if (grid.cells[next] === "grass" && !visited[next]) {
					visited[next] = 1;
					stack.push(next);
				}
			}
		}

		if (touchesEdge) continue;
		for (const cell of component) enclosed.add(cell);
	}

	return enclosed;
}

export function findGrassCorners(grid: TerrainGrid): Map<number, Corner> {
	const corners = new Map<number, Corner>();
	for (const cell of findEnclosedGrass(grid)) {
		const cx = cell % grid.width;
		const cy = Math.floor(cell / grid.width);
		let pathMask = 0;
		for (const direction of DIRECTIONS) {
			if (neighbor(grid, cx, cy, direction, "grass") === "path") {
				pathMask |= BIT[direction];
			}
		}
		const pathCorner = cornerForMask(pathMask);
		if (pathCorner) corners.set(cell, OPPOSITE_CORNER[pathCorner]);
	}
	return corners;
}

export function autotile(grid: TerrainGrid): TileResult[] {
	const enclosedGrass = findEnclosedGrass(grid);
	const grassCorners = findGrassCorners(grid);
	const result: TileResult[] = [];

	for (let y = 0; y < grid.height; y++) {
		for (let x = 0; x < grid.width; x++) {
			const cell = index(grid, x, y);

			if (grid.cells[cell] === "grass") {
				const corner = grassCorners.get(cell);
				let tile: TileId = corner ? GRASS_CORNER[corner] : "grassMiddle";
				if (!corner && enclosedGrass.has(cell)) {
					const pathSides = DIRECTIONS.filter(
						(direction) => neighbor(grid, x, y, direction, "grass") === "path",
					);
					if (pathSides.length === 1) {
						tile = PATH_EDGE[OPPOSITE_DIRECTION[pathSides[0]]];
					}
				}
				result.push({ tile, invalid: false });
				continue;
			}

			let ownedMask = 0;
			let plainMask = 0;
			for (const direction of DIRECTIONS) {
				if (neighbor(grid, x, y, direction, "path") !== "grass") continue;
				const [dx, dy] = DELTA[direction];
				const grassNeighbor = index(grid, x + dx, y + dy);
				if (
					grassCorners.has(grassNeighbor) ||
					enclosedGrass.has(grassNeighbor)
				) {
					ownedMask |= BIT[direction];
				} else {
					plainMask |= BIT[direction];
				}
			}

			if (plainMask === 0) {
				const corner = externalGrassCorner(grid, x, y, grassCorners);
				result.push({
					tile: corner ? GRASS_CORNER[corner] : "pathMiddle",
					invalid: false,
				});
				continue;
			}

			if (ownedMask > 0) {
				result.push({ tile: "pathMiddle", invalid: true });
				continue;
			}

			const sides = DIRECTIONS.filter(
				(direction) => plainMask & BIT[direction],
			);
			if (sides.length === 1) {
				result.push({ tile: PATH_EDGE[sides[0]], invalid: false });
				continue;
			}

			const corner = cornerForMask(plainMask);
			if (!corner) {
				result.push({ tile: "pathMiddle", invalid: true });
				continue;
			}

			result.push({
				tile:
					diagonalTerrain(grid, x, y, OPPOSITE_CORNER[corner]) === "path"
						? PATH_CORNER[corner]
						: GRASS_CORNER[corner],
				invalid: false,
			});
		}
	}

	return result;
}

export function describeMask(mask: number): string {
	if (mask === 0) return "нет границы";
	const names: Record<Direction, string> = { n: "С", e: "В", s: "Ю", w: "З" };
	return DIRECTIONS.filter((direction) => mask & BIT[direction])
		.map((direction) => names[direction])
		.join("");
}
