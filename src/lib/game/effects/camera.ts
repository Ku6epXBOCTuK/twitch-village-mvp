import { MAP_HEIGHT_PX, MAP_WIDTH_PX } from "../config.js";
import type { RenderContext } from "../context.js";
import type { Position } from "../types.js";
import { mapScale } from "../viewport.js";
import { tweenNumber, tweenPosition, type Tween } from "./tween.js";

export interface Camera {
	readonly zoom: number;
	readonly center: Position;
	panTo(target: () => Position, duration: number): void;
	panHome(duration: number): void;
	zoomTo(factor: number, duration: number): void;
	toScreen(position: Position): Position;
	update(dt: number): void;
	apply(): void;
	reset(): void;
}

export function createCamera(ctx: RenderContext): Camera {
	const home = (): Position => ({ x: MAP_WIDTH_PX / 2, y: MAP_HEIGHT_PX / 2 });
	let center = home();
	let zoom = mapScale(ctx.screen);
	let pan: Tween<Position> | undefined;
	let zoomTween: Tween<number> | undefined;
	let follow: (() => Position) | undefined;

	return {
		get zoom() {
			return zoom;
		},
		get center() {
			return center;
		},
		panTo(target, duration) {
			follow = target;
			pan = tweenPosition(center, target, duration);
		},
		panHome(duration) {
			follow = undefined;
			pan = tweenPosition(center, home, duration);
		},
		zoomTo(factor, duration) {
			zoomTween = tweenNumber(zoom, factor, duration);
		},
		toScreen(position) {
			return {
				x: ctx.screen.width / 2 + (position.x - center.x) * zoom,
				y: ctx.screen.height / 2 + (position.y - center.y) * zoom,
			};
		},
		update(dt) {
			if (pan) {
				center = pan.update(dt);
				if (pan.done()) pan = undefined;
			} else if (follow) {
				center = follow();
			}
			if (zoomTween) {
				zoom = zoomTween.update(dt);
				if (zoomTween.done()) zoomTween = undefined;
			}
		},
		apply() {
			ctx.worldLayer.scale.set(zoom);
			ctx.worldLayer.x = Math.round(ctx.screen.width / 2 - center.x * zoom);
			ctx.worldLayer.y = Math.round(ctx.screen.height / 2 - center.y * zoom);
		},
		reset() {
			follow = undefined;
			pan = undefined;
			zoomTween = undefined;
			center = home();
			zoom = mapScale(ctx.screen);
		},
	};
}
