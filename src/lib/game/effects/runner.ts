import { Container } from "pixi.js";
import type { RenderContext } from "../context.js";
import type { Effect } from "../fx/types.js";
import type { Entity } from "../types.js";
import { effectDefinitions } from "./catalog.js";
import { createCamera } from "./camera.js";
import type { EffectDefinition, EffectRuntime, EffectRunner } from "./types.js";

interface ActiveEffect {
	id: string;
	definition: EffectDefinition;
	phaseIndex: number;
	elapsed: number;
	tracked?: Entity;
	runtime: EffectRuntime;
}

export function createEffectRunner(ctx: RenderContext): EffectRunner {
	const camera = createCamera(ctx);
	const active: ActiveEffect[] = [];

	const phaseOf = (effect: ActiveEffect) =>
		effect.definition.phases[effect.phaseIndex];

	function enterPhase(effect: ActiveEffect) {
		for (const action of phaseOf(effect).actions) {
			action.enter?.(effect.runtime);
		}
	}

	function exitPhase(effect: ActiveEffect) {
		for (const action of phaseOf(effect).actions) {
			action.exit?.(effect.runtime);
		}
	}

	function removeLayer(effect: ActiveEffect) {
		effect.runtime.layer.removeFromParent();
		effect.runtime.layer.destroy({ children: true });
	}

	function cancel(effect: ActiveEffect) {
		exitPhase(effect);
		removeLayer(effect);
	}

	function resetCameraWhenIdle() {
		if (active.every((effect) => effect.definition.ambient)) camera.reset();
	}

	function clear() {
		for (const effect of active) cancel(effect);
		active.length = 0;
		resetCameraWhenIdle();
	}

	function start(
		id: string,
		definition: EffectDefinition,
		target: Entity,
		tracked: Entity | undefined,
		parent: Container,
		params?: Effect,
	) {
		const layer = new Container();
		parent.addChild(layer);
		const effect: ActiveEffect = {
			id,
			definition,
			phaseIndex: 0,
			elapsed: 0,
			tracked,
			runtime: {
				ctx,
				camera,
				layer,
				target,
				params,
				channels: new Map(),
				resources: new Map(),
			},
		};
		active.push(effect);
		enterPhase(effect);
		return true;
	}

	return {
		play(id, target) {
			const definition = effectDefinitions[id];
			if (!definition || definition.phases.length === 0) return false;
			if (active.some((effect) => effect.id === id)) return false;
			return start(id, definition, target, target, ctx.app.stage);
		},

		playAt(id, position, params) {
			const definition = effectDefinitions[id];
			if (!definition || definition.phases.length === 0) return false;
			if (active.some((effect) => effect.id === id)) return false;
			return start(
				id,
				definition,
				{ position },
				undefined,
				ctx.worldLayer,
				params,
			);
		},

		stop(id) {
			const index = active.findIndex((effect) => effect.id === id);
			if (index < 0) return;
			cancel(active[index]);
			active.splice(index, 1);
			resetCameraWhenIdle();
		},

		stopAll: clear,

		isPlaying(id) {
			return active.some((effect) => effect.id === id);
		},

		update(dt) {
			camera.update(dt);
			for (let i = active.length - 1; i >= 0; i--) {
				const effect = active[i];
				if (effect.tracked && !ctx.world.entities.includes(effect.tracked)) {
					cancel(effect);
					active.splice(i, 1);
					resetCameraWhenIdle();
					continue;
				}

				const phase = phaseOf(effect);
				for (const action of phase.actions) {
					action.update?.(dt, effect.runtime);
				}

				effect.elapsed += dt;
				if (effect.elapsed < phase.duration) continue;

				exitPhase(effect);
				effect.elapsed -= phase.duration;
				effect.phaseIndex++;
				if (effect.phaseIndex < effect.definition.phases.length) {
					enterPhase(effect);
					continue;
				}
				removeLayer(effect);
				active.splice(i, 1);
				resetCameraWhenIdle();
			}
			camera.apply();
		},

		dispose: clear,
	};
}
