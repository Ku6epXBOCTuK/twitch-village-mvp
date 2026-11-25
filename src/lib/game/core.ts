import type { StoredViewer } from "#lib/features/persistence/viewer-store.js";
import type { ViewerStore } from "#lib/features/persistence/index.js";
import { logger } from "#lib/logger.js";
import { World } from "miniplex";
import { Container, type Application } from "pixi.js";
import type { GameAssets } from "./assets.js";
import { VIEWER_TIMEOUT_MS } from "./config.js";
import type { GameContext, RenderContext } from "./context.js";
import { spawnViewer } from "./spawn.js";
import { defaultSettings, type GameSettings } from "./settings.js";
import { logicGroups, renderGroups } from "./systems/index.js";
import type { System } from "./systems/types.js";
import type { Entity, Size, ViewerIdentity } from "./types.js";

export interface GameCoreOptions {
	screen: Size;
	settings?: GameSettings;
	viewerStore: ViewerStore;
	now?: () => number;
	rng?: () => number;
	measureText: (text: string, fontSize: number) => Size;
}

export interface GameCoreRender {
	app: Application;
	assets: GameAssets;
}

export function createGameCore(
	options: GameCoreOptions,
	render?: GameCoreRender,
) {
	const world = new World<Entity>();
	const viewers = world.with("viewer");

	const ctx: GameContext = {
		world,
		screen: options.screen,
		settings: options.settings ?? defaultSettings(),
		viewerStore: options.viewerStore,
		viewersDirty: false,
		viewerProfiles: new Map<string, StoredViewer>(),
		now: options.now ?? Date.now,
		rng: options.rng ?? Math.random,
		measureText: options.measureText,
	};

	const worldLayer = new Container();
	if (render) render.app.stage.addChild(worldLayer);

	const factoryCtx: RenderContext = render
		? Object.assign(ctx, {
				app: render.app,
				assets: render.assets,
				worldLayer,
			})
		: (ctx as RenderContext);

	const groupDefs = render
		? [...logicGroups(), ...renderGroups()]
		: logicGroups();
	const createGroups = (): System[][] =>
		groupDefs.map((group) =>
			group.factories.map((factory) => factory(factoryCtx)),
		);
	let groups = createGroups();

	const findViewer = (userId: string): Entity | undefined => {
		for (const entity of viewers) {
			if (entity.viewer.userId === userId) return entity;
		}
		return undefined;
	};

	const restoreViewers = async () => {
		const now = ctx.now();
		for (const profile of await ctx.viewerStore.load()) {
			ctx.viewerProfiles.set(profile.userId, profile);

			if (findViewer(profile.userId)) continue;

			if (now - profile.lastSeen < VIEWER_TIMEOUT_MS) {
				spawnViewer(ctx, profile);
			} else {
				logger.info(
					`[viewers] keep ${profile.user} (${profile.userId}) off-screen, idle ${Math.round((now - profile.lastSeen) / 3_600_000)}h`,
				);
			}
		}
	};
	void restoreViewers();

	const disposeGroups = () => {
		for (const group of groups) {
			for (const system of group) {
				system.dispose?.();
			}
		}
	};

	return {
		world,

		step(dt: number) {
			for (const group of groups) {
				for (const system of group) {
					system(dt);
				}
			}
		},

		joinViewer: (identity: ViewerIdentity) => {
			for (const entity of viewers) {
				if (entity.viewer.userId === identity.userId) {
					entity.viewer.user = identity.user;
					entity.viewer.login = identity.login;
					entity.viewer.lastSeen = ctx.now();
					ctx.viewersDirty = true;
					return;
				}
			}

			spawnViewer(ctx, {
				...identity,
				lastSeen: ctx.now(),
			});
			ctx.viewersDirty = true;
		},

		removeBots: () => {
			const toRemove: Entity[] = [];
			for (const entity of viewers) {
				if (entity.viewer.bot) toRemove.push(entity);
			}
			for (const entity of toRemove) {
				ctx.world.remove(entity);
			}
			if (toRemove.length > 0) ctx.viewersDirty = true;
		},

		reset() {
			world.clear();
			disposeGroups();
			groups = createGroups();
			void restoreViewers();
		},

		dispose() {
			world.clear();
			disposeGroups();
			worldLayer.removeFromParent();
			worldLayer.destroy({ children: false });
		},
	};
}

export type GameCore = ReturnType<typeof createGameCore>;
