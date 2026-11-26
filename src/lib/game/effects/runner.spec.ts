import { Container } from "pixi.js";
import { describe, expect, it, vi } from "vitest";
import type { RenderContext } from "../context.js";
import { makeGameContext } from "../testing.js";
import type { Entity } from "../types.js";
import { effectDefinitions } from "./catalog.js";
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
});
