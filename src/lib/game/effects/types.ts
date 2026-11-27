import type { Container } from "pixi.js";
import type { RenderContext } from "../context.js";
import type { Effect } from "../fx/types.js";
import type { Entity, Position } from "../types.js";
import type { Camera } from "./camera.js";

export interface EffectRuntime {
	ctx: RenderContext;
	camera: Camera;
	layer: Container;
	target: Entity;
	params?: Effect;
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
	ambient?: boolean;
}

export interface EffectRunner {
	play(id: string, target: Entity): boolean;
	playAt(id: string, position: Position, params?: Effect): boolean;
	stop(id: string): void;
	stopAll(): void;
	isPlaying(id: string): boolean;
	update(dt: number): void;
	dispose(): void;
}
