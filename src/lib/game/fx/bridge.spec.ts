import { describe, expect, it } from "vitest";
import { publishedFrames } from "../../../../tests/setup/canvas.js";
import { createFxSprite } from "./bridge.js";
import { effects } from "./catalog.js";

describe("pixelfx sprite bridge", () => {
	it("draws the campfire deterministically at the effect origin", () => {
		const module = effects["fire/campfire"];
		expect(module).toBeDefined();
		if (!module) return;

		const first = createFxSprite(module, { id: "fire/campfire", seed: 3 });
		const second = createFxSprite(module, { id: "fire/campfire", seed: 3 });
		first.update(0.5, { x: 10, y: 20 });
		second.update(0.5, { x: 10, y: 20 });

		expect(first.pixels).toEqual(second.pixels);
		expect(
			first.pixels.some((value, index) => index % 4 === 3 && value > 0),
		).toBe(true);
		expect(first.sprite.x).toBe(10);
		expect(first.sprite.y).toBe(20);
		expect(first.sprite.anchor.x).toBeCloseTo(0.5);
		expect(first.sprite.anchor.y).toBeCloseTo(112 / 128);

		first.destroy();
		second.destroy();
	});

	it("advances campfire frames as time passes", () => {
		const module = effects["fire/campfire"];
		expect(module).toBeDefined();
		if (!module) return;

		const instance = createFxSprite(module, { id: "fire/campfire" });
		instance.update(0.5, { x: 10, y: 20 });
		const first = instance.pixels.slice();
		instance.update(0.5, { x: 10, y: 20 });

		expect(instance.pixels).not.toEqual(first);
		expect(instance.done()).toBe(false);
		instance.destroy();
	});

	it("publishes every frame into the canvas texture", () => {
		const module = effects["fire/campfire"];
		expect(module).toBeDefined();
		if (!module) return;

		const instance = createFxSprite(module, { id: "fire/campfire" });
		instance.update(0.5, { x: 10, y: 20 });
		const first = publishedFrames.at(-1)?.data.slice();

		instance.update(0.5, { x: 10, y: 20 });

		const last = publishedFrames.at(-1);
		expect(last && new Uint8Array(last.data.buffer)).toEqual(instance.pixels);
		expect(last?.data).not.toEqual(first);
		instance.destroy();
	});

	it("registers the star iris transition", () => {
		expect(effects["transitions/star-iris"]).toBeDefined();
		expect(effects["transitions/star-iris"]?.meta.size).toEqual([320, 180]);
	});
});
