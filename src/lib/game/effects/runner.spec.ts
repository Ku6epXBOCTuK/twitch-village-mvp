import { Container, Sprite } from "pixi.js";
import { describe, expect, it, vi } from "vitest";
import { lastPublishedPixels } from "../../../../tests/setup/canvas.js";
import type { RenderContext } from "../context.js";
import { makeGameContext } from "../testing.js";
import type { Entity } from "../types.js";
import { mapScale } from "../viewport.js";
import { zoomTo } from "./actions.js";
import { CAMPFIRE_EFFECT_ID, effectDefinitions } from "./catalog.js";
import { createEffectRunner } from "./runner.js";

const effectId = "test-effect";

function context(entities: Entity[]): RenderContext {
	return {
		...makeGameContext(entities),
		worldLayer: new Container(),
		app: { stage: new Container() },
	} as unknown as RenderContext;
}

function register() {
	const enter = vi.fn();
	const update = vi.fn();
	const exit = vi.fn();
	effectDefinitions[effectId] = {
		phases: [
			{ duration: 0.5, actions: [{ enter, update, exit }] },
			{ duration: 0.5, actions: [{ enter, update, exit }] },
		],
	};
	return { enter, update, exit };
}

describe("effect runner", () => {
	it("runs phases in order and cleans up", () => {
		const { enter, update, exit } = register();
		const target: Entity = { position: { x: 0, y: 0 } };
		const ctx = context([target]);
		const runner = createEffectRunner(ctx);

		expect(runner.play(effectId, target)).toBe(true);
		expect(runner.play(effectId, target)).toBe(false);
		expect(enter).toHaveBeenCalledTimes(1);

		runner.update(0.5);
		expect(enter).toHaveBeenCalledTimes(2);
		expect(exit).toHaveBeenCalledTimes(1);
		expect(update).toHaveBeenCalled();

		runner.update(0.5);
		expect(exit).toHaveBeenCalledTimes(2);
		expect(runner.isPlaying(effectId)).toBe(false);
		expect(ctx.app.stage.children).toHaveLength(0);

		runner.dispose();
		delete effectDefinitions[effectId];
	});

	it("cancels an effect when its target leaves the world", () => {
		const { exit } = register();
		const target: Entity = { position: { x: 0, y: 0 } };
		const ctx = context([target]);
		const runner = createEffectRunner(ctx);
		runner.play(effectId, target);

		ctx.world.clear();
		runner.update(0.1);

		expect(exit).toHaveBeenCalledTimes(1);
		expect(runner.isPlaying(effectId)).toBe(false);
		runner.dispose();
		delete effectDefinitions[effectId];
	});

	it("ignores unknown effects", () => {
		const runner = createEffectRunner(context([]));
		expect(runner.play("missing", { position: { x: 0, y: 0 } })).toBe(false);
		runner.dispose();
	});

	it("animates an ambient effect at a world position until stopped", () => {
		const ctx = context([]);
		const runner = createEffectRunner(ctx);

		expect(runner.playAt(CAMPFIRE_EFFECT_ID, { x: 0, y: 0 })).toBe(true);
		expect(runner.playAt(CAMPFIRE_EFFECT_ID, { x: 0, y: 0 })).toBe(false);

		const layer = ctx.worldLayer.children[0] as Container;
		const sprite = layer.children[0] as Sprite;
		expect(sprite).toBeDefined();
		runner.update(0.5);
		const first = lastPublishedPixels()?.slice();
		runner.update(0.5);

		expect(lastPublishedPixels()).not.toEqual(first);
		expect(runner.isPlaying(CAMPFIRE_EFFECT_ID)).toBe(true);
		expect(ctx.app.stage.children).toHaveLength(0);

		runner.stop(CAMPFIRE_EFFECT_ID);
		expect(ctx.worldLayer.children).toHaveLength(0);
		runner.dispose();
	});

	it("keeps an ambient effect when its world is cleared", () => {
		const ctx = context([]);
		const runner = createEffectRunner(ctx);
		runner.playAt(CAMPFIRE_EFFECT_ID, { x: 0, y: 0 });
		ctx.world.clear();
		runner.update(0.1);

		expect(runner.isPlaying(CAMPFIRE_EFFECT_ID)).toBe(true);
		runner.dispose();
	});

	it("resets the camera when a focused effect ends during an ambient one", () => {
		const ctx = context([]);
		const target: Entity = { position: { x: 100, y: 100 } };
		ctx.world.add(target);
		effectDefinitions[effectId] = {
			phases: [
				{ duration: 0.5, actions: [zoomTo(4, 0.5)] },
				{ duration: 0.5, actions: [] },
			],
		};
		const runner = createEffectRunner(ctx);
		runner.playAt(CAMPFIRE_EFFECT_ID, { x: 0, y: 0 });
		runner.play(effectId, target);

		runner.update(0.25);
		runner.update(0.25);
		expect(ctx.worldLayer.scale.x).toBeCloseTo(4);
		expect(runner.isPlaying(CAMPFIRE_EFFECT_ID)).toBe(true);

		runner.update(0.5);
		expect(ctx.worldLayer.scale.x).toBeCloseTo(mapScale(ctx.screen));
		expect(runner.isPlaying(effectId)).toBe(false);

		runner.dispose();
		delete effectDefinitions[effectId];
	});
});
