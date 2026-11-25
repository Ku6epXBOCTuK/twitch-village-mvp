declare module "pixelfx" {
	export interface FxFrame {
		w: number;
		h: number;
		ox: number;
		oy: number;
		color: Uint32Array;
		light: Uint32Array;
	}

	export interface FxInstance {
		update(dt: number): void;
		draw(frame: FxFrame, layer?: "back" | "front"): void;
		stop(): void;
		done(): boolean;
	}

	export function createFrame(
		w: number,
		h: number,
		ox?: number,
		oy?: number,
	): FxFrame;
	export function clearFrame(frame: FxFrame): FxFrame;
	export function composite(
		frame: FxFrame,
		out: Uint8Array | Uint8ClampedArray,
		bg?: number | Uint32Array | null,
		lightK?: number,
	): Uint8Array | Uint8ClampedArray;
	export function createFx(
		module: unknown,
		options?: Record<string, unknown>,
	): FxInstance;
}

declare module "pixelfx/fx/*" {
	export const meta: {
		size?: number[];
		origin?: number[];
		loop?: boolean;
		options?: Record<string, unknown>;
	};
}
