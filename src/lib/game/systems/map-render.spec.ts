import { Container, Sprite, Texture } from "pixi.js";
import { describe, expect, it, vi } from "vitest";
import {
	MAP_HEIGHT_CELLS,
	MAP_HEIGHT_PX,
	MAP_WIDTH_CELLS,
	MAP_WIDTH_PX,
} from "../config.js";
import type { RenderContext } from "../context.js";
import { makeGameContext } from "../testing.js";
import { createMapRenderSystem } from "./map-render.js";

interface RenderCall {
	container: Container;
	target: unknown;
	clearColor: unknown;
}

function context() {
	const tileCounts: number[] = [];
	const render = vi.fn((options: { container: Container }) => {
		tileCounts.push(options.container.children.length);
	});
	const ctx = {
		...makeGameContext(),
		worldLayer: new Container(),
		app: { renderer: { render } },
		assets: { tiles: new Proxy({}, { get: () => Texture.EMPTY }) },
	} as unknown as RenderContext;
	return { ctx, render, tileCounts };
}

describe("map render", () => {
	it("bakes the tile grid into a single nearest-filtered sprite", () => {
		const { ctx, render, tileCounts } = context();

		const system = createMapRenderSystem(ctx);

		expect(render).toHaveBeenCalledTimes(1);
		const options = render.mock.calls[0]?.[0] as RenderCall;
		expect(tileCounts).toEqual([MAP_WIDTH_CELLS * MAP_HEIGHT_CELLS]);
		expect(options.clearColor).toEqual([0, 0, 0, 0]);
		const baked = ctx.worldLayer.children[0] as Sprite;
		expect(baked).toBeInstanceOf(Sprite);
		expect(baked.texture).toBe(options.target);
		expect(baked.texture.width).toBe(MAP_WIDTH_PX);
		expect(baked.texture.height).toBe(MAP_HEIGHT_PX);
		expect(baked.texture.source.scaleMode).toBe("nearest");
		expect(options.container.children).toHaveLength(0);
		expect(ctx.worldLayer.children).toHaveLength(2);

		system.dispose?.();
	});

	it("releases the baked texture on dispose", () => {
		const { ctx } = context();
		const system = createMapRenderSystem(ctx);
		const texture = (ctx.worldLayer.children[0] as Sprite).texture;

		system.dispose?.();

		expect(texture.destroyed).toBe(true);
	});
});
