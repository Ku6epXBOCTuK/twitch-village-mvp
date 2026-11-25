import { MAP_HEIGHT_PX, MAP_WIDTH_PX } from "./config.js";
import type { Size } from "./types.js";

export interface ViewBounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

export function mapScale(screen: Size): number {
	return Math.max(
		1,
		Math.ceil(
			Math.max(screen.width / MAP_WIDTH_PX, screen.height / MAP_HEIGHT_PX),
		),
	);
}

export function visibleBounds(screen: Size): ViewBounds {
	const scale = mapScale(screen);
	const width = screen.width / scale;
	const height = screen.height / scale;
	return {
		minX: (MAP_WIDTH_PX - width) / 2,
		minY: (MAP_HEIGHT_PX - height) / 2,
		maxX: (MAP_WIDTH_PX + width) / 2,
		maxY: (MAP_HEIGHT_PX + height) / 2,
	};
}
