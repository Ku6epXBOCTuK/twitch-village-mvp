import { createFxSprite, type FxSprite } from "../fx/bridge.js";
import { effects } from "../fx/catalog.js";
import type { Entity } from "../types.js";
import type { RenderSystemFactory, System } from "./types.js";

export const createEffectRenderSystem: RenderSystemFactory = (ctx) => {
	const entities = ctx.world.with("effect", "position");
	const instances = new Map<Entity, FxSprite>();

	const unsubscribeAdded = entities.onEntityAdded.subscribe((entity) => {
		if (!entity.effect || !entity.position) return;
		const module = effects[entity.effect.id];
		if (!module) return;
		const instance = createFxSprite(module, entity.effect);
		instances.set(entity, instance);
		ctx.worldLayer.addChild(instance.sprite);
	});

	const unsubscribeRemoved = entities.onEntityRemoved.subscribe((entity) => {
		instances.get(entity)?.destroy();
		instances.delete(entity);
	});

	const system: System = (dt) => {
		const finished: Entity[] = [];
		for (const entity of entities) {
			const instance = instances.get(entity);
			if (!instance || !entity.position) continue;
			if (instance.done()) {
				finished.push(entity);
				continue;
			}
			instance.update(dt, entity.position);
		}
		for (const entity of finished) ctx.world.remove(entity);
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		for (const instance of instances.values()) instance.destroy();
		instances.clear();
	};

	return system;
};
