import type { PlayerAction } from "./player.js";
import { TILE_SIZE } from "./tiles/types.js";
import type { Position, WorkPointKind } from "./types.js";

export const TWITCH_CHANNEL = "Ku6epXBOCTuK";

export const VIEWER_LABEL_FONT_SIZE = 12;

export const VIEWER_WIDTH = 32;
export const VIEWER_HEIGHT = 32;
export const VIEWER_SCALE = 2;
export const VIEWER_GROUND_MARGIN = 16;

export const WALK_EDGE_MARGIN = 8;
export const WALK_MIN_SPEED = 20;
export const WALK_MAX_SPEED = 70;
export const WALK_MIN_TURN_TIME = 1;
export const WALK_MAX_TURN_TIME = 4;

export const WORK_WALK_SPEED = 90;
export const WORK_ARRIVE_DISTANCE = 4;
// NOTE: work points are outside the generated forest area
export const BED_POINTS: Position[] = [
	{ x: 1500, y: 620 },
	{ x: 1560, y: 620 },
	{ x: 1620, y: 620 },
	{ x: 1500, y: 680 },
	{ x: 1560, y: 680 },
	{ x: 1620, y: 680 },
];
export const QUARRY_POINTS: Position[] = [
	{ x: 1500, y: 960 },
	{ x: 1560, y: 960 },
	{ x: 1620, y: 960 },
	{ x: 1500, y: 1020 },
	{ x: 1560, y: 1020 },
	{ x: 1620, y: 1020 },
];
export const WORK_POINT_GROUPS: Record<WorkPointKind, Position[]> = {
	bed: BED_POINTS,
	quarry: QUARRY_POINTS,
};
export const WATER_SOURCE_POSITION: Position = { x: 1740, y: 820 };
export const WORK_FETCH_WATER_DURATION = 5;
export const WORK_CAMPFIRE_DURATION = 10;
export const WORK_DURATION: Record<PlayerAction, number> = {
	chop: 60,
	mine: 60,
	farm: 30,
	water: 30,
};
export const CHOP_STANDOFF = 24;

export const VIEWER_TIMEOUT_MS = 12 * 60 * 60 * 1000;

export const ANIMAL_COUNT = 6;

export const MAP_WIDTH_CELLS = 160;
export const MAP_HEIGHT_CELLS = 100;
export const MAP_SEED = 20261125;
export const MAP_WIDTH_PX = MAP_WIDTH_CELLS * TILE_SIZE;
export const MAP_HEIGHT_PX = MAP_HEIGHT_CELLS * TILE_SIZE;

export const CAMPFIRE_POSITION = {
	x: MAP_WIDTH_PX / 2,
	y: MAP_HEIGHT_PX / 2,
};

export const EFFECT_PAN_DURATION = 0.5;
export const EFFECT_ZOOM_DURATION = 0.5;
export const FOCUS_ZOOM = 4;
export const FOCUS_SHADE_ALPHA = 0.65;
export const STAR_IRIS_DURATION = 2.2;
