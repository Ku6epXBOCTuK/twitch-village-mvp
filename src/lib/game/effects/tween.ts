import type { Position } from "../types.js";

export interface Tween<T> {
	readonly value: T;
	update(dt: number): T;
	done(): boolean;
}

function easeInOut(t: number): number {
	return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

export function tweenNumber(
	from: number,
	to: number,
	duration: number,
): Tween<number> {
	let elapsed = 0;
	let value = from;
	return {
		get value() {
			return value;
		},
		update(dt) {
			elapsed = Math.min(elapsed + dt, duration);
			const t = duration > 0 ? easeInOut(elapsed / duration) : 1;
			value = from + (to - from) * t;
			return value;
		},
		done() {
			return elapsed >= duration;
		},
	};
}

export function tweenPosition(
	from: Position,
	to: () => Position,
	duration: number,
): Tween<Position> {
	let elapsed = 0;
	let value = { ...from };
	return {
		get value() {
			return value;
		},
		update(dt) {
			elapsed = Math.min(elapsed + dt, duration);
			const t = duration > 0 ? easeInOut(elapsed / duration) : 1;
			const target = to();
			value = {
				x: from.x + (target.x - from.x) * t,
				y: from.y + (target.y - from.y) * t,
			};
			return value;
		},
		done() {
			return elapsed >= duration;
		},
	};
}
