import { Container } from "pixi.js";
import type { RenderContext } from "../context.js";
import { effectDefinitions } from "./catalog.js";
import { createCamera } from "./camera.js";
import type { EffectDefinition, EffectRuntime, EffectRunner } from "./types.js";

interface ActiveEffect {
	id: string;
	definition: EffectDefinition;
	phaseIndex: number;
	elapsed: number;
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
		if (active.length === 0) camera.reset();
	}

	function clear() {
		for (const effect of active) cancel(effect);
		active.length = 0;
		resetCameraWhenIdle();
	}

	return {
		play(id, target) {
			const definition = effectDefinitions[id];
			if (!definition || definition.phases.length === 0) return false;
			if (active.some((effect) => effect.id === id)) return false;

			const layer = new Container();
			ctx.app.stage.addChild(layer);
			const effect: ActiveEffect = {
				id,
				definition,
				phaseIndex: 0,
				elapsed: 0,
				runtime: {
					ctx,
					camera,
					layer,
					target,
					channels: new Map(),
					resources: new Map(),
				},
			};
			active.push(effect);
			enterPhase(effect);
			return true;
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
				if (!ctx.world.entities.includes(effect.runtime.target)) {
					cancel(effect);
					active.splice(i, 1);
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
