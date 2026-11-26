import type { RenderSystemFactory } from "./types.js";

export const createEffectRunnerSystem: RenderSystemFactory = (ctx) => {
	return (dt) => ctx.effects.update(dt);
};
