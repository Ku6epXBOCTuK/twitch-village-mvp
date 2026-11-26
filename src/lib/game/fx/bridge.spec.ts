import { describe, expect, it } from "vitest";
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

	it("registers the star iris transition", () => {
		expect(effects["transitions/star-iris"]).toBeDefined();
		expect(effects["transitions/star-iris"]?.meta.size).toEqual([320, 180]);
	});
});
