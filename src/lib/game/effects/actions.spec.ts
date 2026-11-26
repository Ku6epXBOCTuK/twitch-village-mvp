import { Circle, Container, type Graphics, type Text } from "pixi.js";
import { describe, expect, it } from "vitest";
import type { RenderContext } from "../context.js";
import { makeGameContext } from "../testing.js";
import { shadeBackground } from "./actions.js";
import { createCamera } from "./camera.js";
import type { EffectRuntime } from "./types.js";

function runtime(label?: Text): EffectRuntime {
	const layer = new Container();
	const ctx = {
		...makeGameContext(),
		worldLayer: new Container(),
		app: { stage: new Container() },
	} as unknown as RenderContext;
	return {
		ctx,
		layer,
		camera: createCamera(ctx),
		target: { position: { x: 100, y: 100 }, view: label },
		channels: new Map(),
		resources: new Map(),
	};
}

describe("shadeBackground", () => {
	it("keeps the shade graphic between phases", () => {
		const rt = runtime();
		const fadeIn = shadeBackground(0.5, 0.5);
		fadeIn.enter?.(rt);
		fadeIn.update?.(0.5, rt);
		const graphic = rt.resources.get("shade.alpha");
		expect(graphic).toBeDefined();
		expect(rt.channels.get("shade.alpha")).toBeCloseTo(0.5);

		fadeIn.exit?.(rt);

		const fadeOut = shadeBackground(0, 0.5);
		fadeOut.enter?.(rt);
		expect(rt.resources.get("shade.alpha")).toBe(graphic);
		fadeOut.update?.(0.5, rt);
		expect(rt.channels.get("shade.alpha")).toBeCloseTo(0);
	});

	it("fits the label inside a single hole ring", () => {
		const label = {
			x: 100,
			y: 64,
			width: 40,
			height: 12,
		} as Text;
		const rt = runtime(label);
		const action = shadeBackground(0.5, 0.5);
		action.enter?.(rt);
		action.update?.(0.5, rt);

		const graphic = rt.resources.get("shade.alpha") as Graphics;
		const fill = graphic.context.instructions.find(
			(instruction) => instruction.action === "fill",
		);
		const hole = fill && "hole" in fill.data ? fill.data.hole : undefined;
		expect(hole?.instructions.some((part) => part.action === "addPath")).toBe(
			false,
		);

		const shape = hole?.shapePath.shapePrimitives[0]?.shape;
		expect(shape).toBeInstanceOf(Circle);
		const at = rt.camera.toScreen({ x: 100, y: 100 });
		const corner = rt.camera.toScreen({ x: 80, y: 52 });
		expect((shape as Circle).radius).toBeGreaterThanOrEqual(
			Math.hypot(corner.x - at.x, corner.y - at.y),
		);
	});
});
