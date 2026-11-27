import {
	type ICanvas,
	type ICanvasRenderingContext2D,
	DOMAdapter,
} from "pixi.js";

export interface PublishedFrame {
	data: Uint8ClampedArray;
}

export const publishedFrames: PublishedFrame[] = [];

export function lastPublishedPixels(): Uint8Array | undefined {
	const last = publishedFrames.at(-1);
	return last && new Uint8Array(last.data.buffer);
}

const originalAdapter = DOMAdapter.get();

const createCanvas = (width = 0, height = 0): ICanvas => {
	const context = {
		createImageData: (w: number, h: number) => ({
			width: w,
			height: h,
			data: new Uint8ClampedArray(w * h * 4),
		}),
		putImageData: (image: PublishedFrame) => {
			publishedFrames.push(image);
		},
	} as unknown as ICanvasRenderingContext2D;
	return {
		width,
		height,
		getContext: (id: string) => (id === "2d" ? context : null),
	} as unknown as ICanvas;
};

DOMAdapter.set({ ...originalAdapter, createCanvas });
