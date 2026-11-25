import { describe, expect, it } from "vitest";
import { MAP_HEIGHT_PX, MAP_WIDTH_PX } from "./config.js";
import { mapScale, visibleBounds } from "./viewport.js";

describe("viewport", () => {
	it("keeps the scale at one for common screens", () => {
		expect(mapScale({ width: 800, height: 600 })).toBe(1);
		expect(mapScale({ width: 1920, height: 1080 })).toBe(1);
		expect(mapScale({ width: 4000, height: 2160 })).toBe(2);
	});

	it("centers the visible part of the map", () => {
		const screen = { width: 800, height: 600 };
		const bounds = visibleBounds(screen);
		expect(bounds.minX + bounds.maxX).toBe(MAP_WIDTH_PX);
		expect(bounds.minY + bounds.maxY).toBe(MAP_HEIGHT_PX);
		expect(bounds.maxX - bounds.minX).toBe(screen.width);
		expect(bounds.maxY - bounds.minY).toBe(screen.height);
	});
});
