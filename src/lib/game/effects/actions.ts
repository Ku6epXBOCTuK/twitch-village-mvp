import { Graphics } from "pixi.js";
import { VIEWER_WIDTH } from "../config.js";
import { createFxSprite, type FxSprite } from "../fx/bridge.js";
import { effects } from "../fx/catalog.js";
import { mapScale } from "../viewport.js";
import { tweenNumber, type Tween } from "./tween.js";
import type { EffectAction, EffectRuntime } from "./types.js";

const SHADE_CHANNEL = "shade.alpha";

function targetPosition(runtime: EffectRuntime) {
	return runtime.target.position ?? runtime.camera.center;
}

function frameFocus(
	runtime: EffectRuntime,
	width: number,
	height: number,
): number[] {
	const at = runtime.camera.toScreen(targetPosition(runtime));
	return [
		(at.x / runtime.ctx.screen.width) * width,
		(at.y / runtime.ctx.screen.height) * height,
	];
}

export function panToTarget(duration: number): EffectAction {
	return {
		enter(runtime) {
			runtime.camera.panTo(() => targetPosition(runtime), duration);
		},
	};
}

export function panHome(duration: number): EffectAction {
	return {
		enter(runtime) {
			runtime.camera.panHome(duration);
		},
	};
}

export function zoomTo(
	factor: number | "home",
	duration: number,
): EffectAction {
	return {
		enter(runtime) {
			runtime.camera.zoomTo(
				factor === "home" ? mapScale(runtime.ctx.screen) : factor,
				duration,
			);
		},
	};
}

export function shadeBackground(alpha: number, duration: number): EffectAction {
	let graphics: Graphics | undefined;
	let tween: Tween<number> | undefined;

	return {
		enter(runtime) {
			graphics = runtime.resources.get(SHADE_CHANNEL) as Graphics | undefined;
			if (!graphics) {
				graphics = new Graphics();
				runtime.resources.set(SHADE_CHANNEL, graphics);
				runtime.layer.addChild(graphics);
			}
			const from = runtime.channels.get(SHADE_CHANNEL) ?? 0;
			tween = tweenNumber(from, alpha, duration);
		},
		update(dt, runtime) {
			if (!graphics || !tween) return;
			const value = tween.update(dt);
			runtime.channels.set(SHADE_CHANNEL, value);
			graphics.clear();
			if (value <= 0) return;
			graphics
				.rect(0, 0, runtime.ctx.screen.width, runtime.ctx.screen.height)
				.fill({ color: 0x000000, alpha: value });
			const at = runtime.camera.toScreen(targetPosition(runtime));
			let radius = Math.max(
				48,
				VIEWER_WIDTH *
					runtime.ctx.settings.viewerScale *
					runtime.camera.zoom *
					0.7,
			);
			const label = runtime.target.view;
			if (label) {
				const half = label.width / 2;
				const topLeft = runtime.camera.toScreen({
					x: label.x - half,
					y: label.y - label.height,
				});
				const bottomRight = runtime.camera.toScreen({
					x: label.x + half,
					y: label.y,
				});
				const dx = Math.max(
					Math.abs(topLeft.x - at.x),
					Math.abs(bottomRight.x - at.x),
				);
				const dy = Math.max(
					Math.abs(topLeft.y - at.y),
					Math.abs(bottomRight.y - at.y),
				);
				radius = Math.max(radius, Math.hypot(dx, dy) + 4);
			}
			// NOTE: Pixi hands every cut() path to earcut as a separate hole ring; intersecting
			// rings break triangulation, so the label is covered by enlarging the single
			// circle hole instead of cutting a second rectangle.
			graphics.circle(at.x, at.y, radius).cut();
		},
		exit() {
			tween = undefined;
		},
	};
}

export function playPixelfx(options: {
	id: string;
	seed?: number;
	fit?: "screen" | "world";
	focusOnTarget?: boolean;
}): EffectAction {
	let instance: FxSprite | undefined;
	let width = 0;
	let height = 0;

	return {
		enter(runtime) {
			const module = effects[options.id];
			if (!module) return;
			[width, height] = module.meta.size ?? [64, 64];
			const focus = options.focusOnTarget
				? frameFocus(runtime, width, height)
				: undefined;
			instance = createFxSprite(module, {
				id: options.id,
				seed: options.seed,
				focus,
			});
			runtime.layer.addChild(instance.sprite);
		},
		update(dt, runtime) {
			if (!instance) return;
			if (options.fit === "world") {
				instance.sprite.scale.set(1);
				instance.update(dt, targetPosition(runtime));
				return;
			}
			instance.sprite.scale.set(
				runtime.ctx.screen.width / width,
				runtime.ctx.screen.height / height,
			);
			instance.update(dt, { x: 0, y: 0 });
		},
		exit() {
			instance?.destroy();
			instance = undefined;
		},
	};
}
