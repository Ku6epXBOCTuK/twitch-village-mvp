import { CanvasSource, DOMAdapter, Sprite, Texture } from "pixi.js";
import { clearFrame, composite, createFrame, createFx } from "pixelfx";
import type { Position } from "../types.js";
import type { Effect, FxModule } from "./types.js";

export interface FxSprite {
	sprite: Sprite;
	pixels: Uint8Array;
	update(dt: number, position: Position): void;
	done(): boolean;
	destroy(): void;
}

export function createFxSprite(module: FxModule, effect: Effect): FxSprite {
	const [w, h] = module.meta.size ?? [64, 64];
	const [ox, oy] = module.meta.origin ?? [w / 2, h];
	const frame = createFrame(w, h);
	const pixels = new Uint8Array(w * h * 4);
	const canvas = DOMAdapter.get().createCanvas(w, h);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("[pixelfx] 2D canvas context is unavailable");
	const imageData = context.createImageData(w, h);
	const source = new CanvasSource({
		resource: canvas,
		width: w,
		height: h,
		alphaMode: "no-premultiply-alpha",
		scaleMode: "nearest",
	});
	const texture = new Texture({ source });
	const sprite = new Sprite(texture);
	sprite.anchor.set(ox / w, oy / h);
	sprite.roundPixels = true;

	const { options, ...params } = effect;
	const fx = createFx(module, { ...params, ...options, x: ox, y: oy });

	return {
		sprite,
		pixels,

		update(dt, position) {
			fx.update(dt);
			clearFrame(frame);
			fx.draw(frame);
			composite(frame, pixels);
			imageData.data.set(pixels);
			context.putImageData(imageData, 0, 0);
			source.update();
			sprite.x = position.x;
			sprite.y = position.y;
		},

		done() {
			return fx.done();
		},

		destroy() {
			sprite.destroy();
			texture.destroy(true);
		},
	};
}
