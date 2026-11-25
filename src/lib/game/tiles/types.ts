export const TILE_SIZE = 16;

export type TerrainId = "grass" | "path";
export type Direction = "n" | "e" | "s" | "w";
export type Corner = "nw" | "ne" | "se" | "sw";
export type TileSource = "atlas" | "grassMiddle" | "pathMiddle";

export type TileId =
	| "grassMiddle"
	| "pathMiddle"
	| "pathEdgeN"
	| "pathEdgeE"
	| "pathEdgeS"
	| "pathEdgeW"
	| "pathCornerNW"
	| "pathCornerNE"
	| "pathCornerSE"
	| "pathCornerSW"
	| "grassCornerNW"
	| "grassCornerNE"
	| "grassCornerSE"
	| "grassCornerSW"
	| "pathDecor0"
	| "pathDecor1"
	| "pathDecor2";

export interface TileDef {
	id: TileId;
	source: TileSource;
	col: number;
	row: number;
	label: string;
	role: string;
}

export interface TerrainGrid {
	width: number;
	height: number;
	cells: TerrainId[];
}

export interface TileResult {
	tile: TileId;
	invalid: boolean;
}
