import type { Container } from "pixi.js";
import type { RenderContext } from "../context.js";
import type { Entity } from "../types.js";
import type { Camera } from "./camera.js";

export interface EffectRuntime {
	ctx: RenderContext;
	camera: Camera;
	layer: Container;
	target: Entity;
	channels: Map<string, number>;
	resources: Map<string, Container>;
}

export interface EffectAction {
	enter?(runtime: EffectRuntime): void;
	update?(dt: number, runtime: EffectRuntime): void;
	exit?(runtime: EffectRuntime): void;
}

export interface EffectPhase {
	duration: number;
	actions: EffectAction[];
}

export interface EffectDefinition {
	phases: EffectPhase[];
}

export interface EffectRunner {
	play(id: string, target: Entity): boolean;
	stop(id: string): void;
	stopAll(): void;
	isPlaying(id: string): boolean;
	update(dt: number): void;
	dispose(): void;
}
