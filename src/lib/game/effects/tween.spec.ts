import { describe, expect, it } from "vitest";
import { tweenNumber, tweenPosition } from "./tween.js";

describe("tween", () => {
	it("eases a number and reports completion", () => {
		const tween = tweenNumber(0, 10, 1);
		expect(tween.value).toBe(0);
		expect(tween.update(0.5)).toBe(5);
		expect(tween.done()).toBe(false);
		expect(tween.update(1)).toBe(10);
		expect(tween.done()).toBe(true);
		expect(tween.value).toBe(10);
	});

	it("follows a moving target position", () => {
		const target = { x: 20, y: 40 };
		const tween = tweenPosition({ x: 0, y: 0 }, () => target, 1);
		target.x = 40;
		expect(tween.update(1)).toEqual({ x: 40, y: 40 });
	});
});
