import { AnimatedSprite, Text, TextStyle, type Texture } from "pixi.js";
import { VIEWER_LABEL_FONT_SIZE } from "../config.js";
import {
	PLAYER_ACTION_ANIMATION_SPEED,
	PLAYER_ANIMATION_SPEED,
} from "../player.js";
import type { Entity } from "../types.js";
import type { RenderSystemFactory, System } from "./types.js";

const LABEL_GAP = 4;

export const createViewerRenderSystem: RenderSystemFactory = (ctx) => {
	const viewers = ctx.world.with("viewer", "position");
	const walkTextures = ctx.assets.player.walkRight;
	const workingAction = (entity: Entity) =>
		entity.worker?.state === "working" ? entity.worker.action : undefined;
	const texturesFor = (entity: Entity): Texture[] => {
		const action = workingAction(entity);
		return action ? ctx.assets.playerActions[action] : walkTextures;
	};
	const speedFor = (textures: Texture[]): number =>
		textures === walkTextures
			? PLAYER_ANIMATION_SPEED
			: PLAYER_ACTION_ANIMATION_SPEED;

	const labelStyle = new TextStyle({
		fill: "#ffffff",
		fontSize: VIEWER_LABEL_FONT_SIZE,
	});

	const appliedDirection = new Map<Entity, 1 | -1>();
	const appliedClip = new Map<Entity, Texture[]>();

	const unsubscribeAdded = viewers.onEntityAdded.subscribe((entity) => {
		const direction = entity.walker?.direction ?? 1;
		const textures = texturesFor(entity);
		const sprite = new AnimatedSprite(textures);
		sprite.anchor.set(0.5);
		sprite.scale.set(
			direction * ctx.settings.viewerScale,
			ctx.settings.viewerScale,
		);
		sprite.animationSpeed = speedFor(textures);
		sprite.play();
		entity.sprite = sprite;
		appliedDirection.set(entity, direction);
		appliedClip.set(entity, textures);

		const label = new Text({ text: entity.viewer.user, style: labelStyle });
		label.anchor.set(0.5, 1);
		entity.view = label;

		ctx.worldLayer.addChild(sprite, label);
	});

	const unsubscribeRemoved = viewers.onEntityRemoved.subscribe((entity) => {
		entity.sprite?.destroy();
		entity.sprite = undefined;
		appliedDirection.delete(entity);
		appliedClip.delete(entity);
		entity.view?.destroy();
		entity.view = undefined;
	});

	const system: System = () => {
		for (const entity of viewers) {
			const sprite = entity.sprite;
			if (!(sprite instanceof AnimatedSprite)) continue;

			const textures = texturesFor(entity);
			if (appliedClip.get(entity) !== textures) {
				sprite.textures = textures;
				sprite.animationSpeed = speedFor(textures);
				sprite.play();
				appliedClip.set(entity, textures);
			}

			const direction = entity.walker?.direction ?? 1;
			if (appliedDirection.get(entity) !== direction) {
				sprite.scale.x = direction * ctx.settings.viewerScale;
				appliedDirection.set(entity, direction);
			}

			sprite.x = entity.position.x;
			sprite.y = entity.position.y;

			if (entity.view) {
				entity.view.x = entity.position.x;
				entity.view.y = entity.position.y - sprite.height / 2 - LABEL_GAP;
			}
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		appliedDirection.clear();
		appliedClip.clear();
		for (const entity of viewers) {
			entity.sprite?.destroy();
			entity.sprite = undefined;
			entity.view?.destroy();
			entity.view = undefined;
		}
	};

	return system;
};
