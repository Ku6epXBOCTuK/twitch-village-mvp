import type { TileDef, TileId } from "./types.js";

export const PATH_ATLAS = "Cute_Fantasy_Free/Tiles/Path_Tile.png";
export const GRASS_MIDDLE = "Cute_Fantasy_Free/Tiles/Grass_Middle.png";
export const PATH_MIDDLE = "Cute_Fantasy_Free/Tiles/Path_Middle.png";

export const SOURCE_SIZE: Record<TileDef["source"], [number, number]> = {
	atlas: [48, 96],
	grassMiddle: [16, 16],
	pathMiddle: [16, 16],
};

export const TILE_DEFS: Record<TileId, TileDef> = {
	grassMiddle: {
		id: "grassMiddle",
		source: "grassMiddle",
		col: 0,
		row: 0,
		label: "Трава, середина",
		role: "Однородная трава",
	},
	pathMiddle: {
		id: "pathMiddle",
		source: "pathMiddle",
		col: 0,
		row: 0,
		label: "Дорожка, середина",
		role: "Однородная дорожка",
	},
	pathEdgeN: {
		id: "pathEdgeN",
		source: "atlas",
		col: 1,
		row: 0,
		label: "Ребро, трава сверху",
		role: "Переход в верхнем тайле дорожки",
	},
	pathEdgeE: {
		id: "pathEdgeE",
		source: "atlas",
		col: 2,
		row: 1,
		label: "Ребро, трава справа",
		role: "Переход в правом тайле дорожки",
	},
	pathEdgeS: {
		id: "pathEdgeS",
		source: "atlas",
		col: 1,
		row: 2,
		label: "Ребро, трава снизу",
		role: "Переход в нижнем тайле дорожки",
	},
	pathEdgeW: {
		id: "pathEdgeW",
		source: "atlas",
		col: 0,
		row: 1,
		label: "Ребро, трава слева",
		role: "Переход в левом тайле дорожки",
	},
	pathCornerNW: {
		id: "pathCornerNW",
		source: "atlas",
		col: 0,
		row: 0,
		label: "Угол, трава СЗ, выпуклый",
		role: "Дорожка заходит в диагональ",
	},
	pathCornerNE: {
		id: "pathCornerNE",
		source: "atlas",
		col: 2,
		row: 0,
		label: "Угол, трава СВ, выпуклый",
		role: "Дорожка заходит в диагональ",
	},
	pathCornerSE: {
		id: "pathCornerSE",
		source: "atlas",
		col: 2,
		row: 2,
		label: "Угол, трава ЮВ, выпуклый",
		role: "Дорожка заходит в диагональ",
	},
	pathCornerSW: {
		id: "pathCornerSW",
		source: "atlas",
		col: 0,
		row: 2,
		label: "Угол, трава ЮЗ, выпуклый",
		role: "Дорожка заходит в диагональ",
	},
	grassCornerNW: {
		id: "grassCornerNW",
		source: "atlas",
		col: 1,
		row: 4,
		label: "Угол, трава СЗ, вогнутый",
		role: "Трава внутри дорожки или вогнутый стык",
	},
	grassCornerNE: {
		id: "grassCornerNE",
		source: "atlas",
		col: 0,
		row: 4,
		label: "Угол, трава СВ, вогнутый",
		role: "Трава внутри дорожки или вогнутый стык",
	},
	grassCornerSE: {
		id: "grassCornerSE",
		source: "atlas",
		col: 0,
		row: 3,
		label: "Угол, трава ЮВ, вогнутый",
		role: "Трава внутри дорожки или вогнутый стык",
	},
	grassCornerSW: {
		id: "grassCornerSW",
		source: "atlas",
		col: 1,
		row: 3,
		label: "Угол, трава ЮЗ, вогнутый",
		role: "Трава внутри дорожки или вогнутый стык",
	},
	pathDecor0: {
		id: "pathDecor0",
		source: "atlas",
		col: 0,
		row: 5,
		label: "Декорация дорожки 1",
		role: "Не участвует в автотайлинге",
	},
	pathDecor1: {
		id: "pathDecor1",
		source: "atlas",
		col: 1,
		row: 5,
		label: "Декорация дорожки 2",
		role: "Не участвует в автотайлинге",
	},
	pathDecor2: {
		id: "pathDecor2",
		source: "atlas",
		col: 2,
		row: 5,
		label: "Декорация дорожки 3",
		role: "Не участвует в автотайлинге",
	},
};

export const ALL_TILES = Object.values(TILE_DEFS);
export const ATLAS_CELLS = ALL_TILES.filter((tile) => tile.source === "atlas");

export const TILE_NUMBERS = Object.fromEntries(
	ALL_TILES.map((tile, position) => [tile.id, position + 1]),
) as Record<TileDef["id"], number>;

export function tileNumber(tile: TileDef["id"]): number {
	return TILE_NUMBERS[tile];
}

export type TileAssetPath =
	| typeof PATH_ATLAS
	| typeof GRASS_MIDDLE
	| typeof PATH_MIDDLE;

export function sourceUrl(source: TileDef["source"]): TileAssetPath {
	if (source === "atlas") return PATH_ATLAS;
	return source === "grassMiddle" ? GRASS_MIDDLE : PATH_MIDDLE;
}
