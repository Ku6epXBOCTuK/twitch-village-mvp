import { AnimatedSprite, Text, TextStyle } from "pixi.js";
import { VIEWER_LABEL_FONT_SIZE } from "../config.js";
import type { Entity } from "../types.js";
import type { RenderSystemFactory, System } from "./types.js";

const LABEL_GAP = 4;
const PLAYER_ANIMATION_SPEED = 0.18;

export const createViewerRenderSystem: RenderSystemFactory = (ctx) => {
	const viewers = ctx.world.with("viewer", "position");
	const labelStyle = new TextStyle({
		fill: "#ffffff",
		fontSize: VIEWER_LABEL_FONT_SIZE,
	});

	const appliedDirection = new Map<Entity, 1 | -1>();

	const unsubscribeAdded = viewers.onEntityAdded.subscribe((entity) => {
		const direction = entity.walker?.direction ?? 1;
		const sprite = new AnimatedSprite(ctx.assets.player.walkRight);
		sprite.anchor.set(0.5);
		sprite.scale.set(
			direction * ctx.settings.viewerScale,
			ctx.settings.viewerScale,
		);
		sprite.animationSpeed = PLAYER_ANIMATION_SPEED;
		sprite.play();
		entity.sprite = sprite;
		appliedDirection.set(entity, direction);

		const label = new Text({ text: entity.viewer.user, style: labelStyle });
		label.anchor.set(0.5, 1);
		entity.view = label;

		ctx.app.stage.addChild(sprite, label);
	});

	const unsubscribeRemoved = viewers.onEntityRemoved.subscribe((entity) => {
		entity.sprite?.destroy();
		entity.sprite = undefined;
		appliedDirection.delete(entity);
		entity.view?.destroy();
		entity.view = undefined;
	});

	const system: System = () => {
		for (const entity of viewers) {
			const sprite = entity.sprite;
			if (!(sprite instanceof AnimatedSprite)) continue;

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
		for (const entity of viewers) {
			entity.sprite?.destroy();
			entity.sprite = undefined;
			entity.view?.destroy();
			entity.view = undefined;
		}
	};

	return system;
};
