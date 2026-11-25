import { AnimatedSprite } from "pixi.js";
import { ANIMAL_ANIMATION_SPEED } from "../animals.js";
import type { Entity } from "../types.js";
import type { RenderSystemFactory, System } from "./types.js";

export const createAnimalRenderSystem: RenderSystemFactory = (ctx) => {
	const animals = ctx.world.with("animal", "position");
	const appliedDirection = new Map<Entity, 1 | -1>();

	const unsubscribeAdded = animals.onEntityAdded.subscribe((entity) => {
		const direction = entity.walker?.direction ?? 1;
		const sprite = new AnimatedSprite(ctx.assets.animals[entity.animal]);
		sprite.anchor.set(0.5);
		sprite.scale.set(
			-direction * ctx.settings.viewerScale,
			ctx.settings.viewerScale,
		);
		sprite.animationSpeed = ANIMAL_ANIMATION_SPEED;
		sprite.play();
		entity.sprite = sprite;
		appliedDirection.set(entity, direction);

		ctx.worldLayer.addChild(sprite);
	});

	const unsubscribeRemoved = animals.onEntityRemoved.subscribe((entity) => {
		entity.sprite?.destroy();
		entity.sprite = undefined;
		appliedDirection.delete(entity);
	});

	const system: System = () => {
		for (const entity of animals) {
			const sprite = entity.sprite;
			if (!(sprite instanceof AnimatedSprite)) continue;

			const direction = entity.walker?.direction ?? 1;
			if (appliedDirection.get(entity) !== direction) {
				sprite.scale.x = -direction * ctx.settings.viewerScale;
				appliedDirection.set(entity, direction);
			}

			sprite.x = entity.position.x;
			sprite.y = entity.position.y;
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		appliedDirection.clear();
		for (const entity of animals) {
			entity.sprite?.destroy();
			entity.sprite = undefined;
		}
	};

	return system;
};
