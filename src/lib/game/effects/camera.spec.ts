import { Container } from "pixi.js";
import { describe, expect, it } from "vitest";
import { MAP_HEIGHT_PX, MAP_WIDTH_PX } from "../config.js";
import type { RenderContext } from "../context.js";
import { makeGameContext } from "../testing.js";
import { createCamera } from "./camera.js";

function context(): RenderContext {
	return {
		...makeGameContext(),
		worldLayer: new Container(),
		app: { stage: new Container() },
	} as unknown as RenderContext;
}

describe("camera", () => {
	it("keeps the map centered by default", () => {
		const ctx = context();
		const camera = createCamera(ctx);
		camera.apply();
		expect(ctx.worldLayer.scale.x).toBe(1);
		expect(ctx.worldLayer.x).toBe(-MAP_WIDTH_PX / 2 + ctx.screen.width / 2);
		expect(ctx.worldLayer.y).toBe(-MAP_HEIGHT_PX / 2 + ctx.screen.height / 2);
	});

	it("pans onto a target and zooms around it", () => {
		const ctx = context();
		const camera = createCamera(ctx);
		camera.panTo(() => ({ x: 1000, y: 500 }), 0.5);
		camera.update(0.5);
		expect(camera.toScreen({ x: 1000, y: 500 })).toEqual({
			x: ctx.screen.width / 2,
			y: ctx.screen.height / 2,
		});

		camera.zoomTo(4, 0.5);
		camera.update(0.5);
		camera.apply();
		expect(ctx.worldLayer.scale.x).toBe(4);
		expect(ctx.worldLayer.x).toBe(ctx.screen.width / 2 - 1000 * 4);
	});
});
