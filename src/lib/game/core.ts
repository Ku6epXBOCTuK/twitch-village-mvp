import { World } from "miniplex";
import { type Application, Container } from "pixi.js";
import type { ViewerStore } from "#lib/features/persistence/index.js";
import type { StoredViewer } from "#lib/features/persistence/viewer-store.js";
import { logger } from "#lib/logger.js";
import { randomAnimalKind } from "./animals.js";
import type { GameAssets } from "./assets.js";
import { VIEWER_TIMEOUT_MS, WORK_WALK_SPEED } from "./config.js";
import type { GameContext, RenderContext } from "./context.js";
import { createEffectRunner } from "./effects/runner.js";
import { defaultSettings, type GameSettings } from "./settings.js";
import { spawnAnimal as createAnimal, spawnViewer } from "./spawn.js";
import { logicGroups, renderGroups } from "./systems/index.js";
import type { System } from "./systems/types.js";
import { generateForest } from "./tiles/forest.js";
import { generateMap } from "./tiles/index.js";
import type {
	AnimalKind,
	Effect,
	Entity,
	Position,
	Size,
	ViewerIdentity,
	WorkKind,
} from "./types.js";
import { visibleBounds } from "./viewport.js";
import { JOB_RECIPES } from "./work/recipes.js";

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

	const view = visibleBounds(options.screen);
	const ctx: GameContext = {
		world,
		screen: options.screen,
		settings: options.settings ?? defaultSettings(),
		viewerStore: options.viewerStore,
		viewersDirty: false,
		viewerProfiles: new Map<string, StoredViewer>(),
		forest: generateForest(generateMap(), {
			x: view.minX,
			y: view.minY,
		}),
		now: options.now ?? Date.now,
		rng: options.rng ?? Math.random,
		measureText: options.measureText,
	};

	const worldLayer = new Container();
	if (render) render.app.stage.addChild(worldLayer);

	const factoryCtx = render
		? (Object.assign(ctx, {
				app: render.app,
				assets: render.assets,
				worldLayer,
			}) as RenderContext)
		: (ctx as RenderContext);
	if (render) factoryCtx.effects = createEffectRunner(factoryCtx);

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

	const assignJob = (userId: string, kind: WorkKind) => {
		const entity = findViewer(userId);
		if (!entity?.position || !entity.walker) return;
		const speed = entity.worker?.speed ?? entity.walker.speed;
		entity.walker.speed = WORK_WALK_SPEED;
		entity.walker.target = undefined;
		ctx.world.update(entity, "worker", {
			kind,
			action: JOB_RECIPES[kind].phases[0].action,
			phaseIndex: 0,
			state: "walking",
			target: undefined,
			targetRef: undefined,
			pointIndex: 0,
			carrying: {},
			subroutine: undefined,
			timer: 0,
			speed,
		});
	};

	const cancelJob = (userId: string) => {
		const entity = findViewer(userId);
		if (!entity?.worker) return;
		const speed = entity.worker.speed;
		if (entity.walker) {
			entity.walker.speed = speed;
			entity.walker.target = undefined;
		}
		ctx.world.removeComponent(entity, "worker");
	};

	return {
		world,

		assignJob,
		cancelJob,

		playEffect: (id: string, userId: string) => {
			if (!render) return false;
			const entity = findViewer(userId);
			if (!entity?.position) return false;
			return factoryCtx.effects.play(id, entity);
		},

		step(dt: number) {
			for (const group of groups) {
				for (const system of group) {
					system(dt);
				}
			}
		},

		spawnEffect: (effect: Effect, position: Position) =>
			factoryCtx.effects?.playAt(effect.id, position, effect) ?? false,

		spawnAnimal: (kind?: AnimalKind) =>
			createAnimal(ctx, kind ?? randomAnimalKind(ctx.rng)),

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

		chop: (userId: string) => assignJob(userId, "chop"),

		plant: (userId: string) => assignJob(userId, "plant"),

		mine: (userId: string) => assignJob(userId, "mine"),

		getInventory: (userId: string) => {
			const entity = findViewer(userId);
			return entity?.inventory ? { ...entity.inventory.items } : undefined;
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
			factoryCtx.effects?.stopAll();
			world.clear();
			disposeGroups();
			groups = createGroups();
			void restoreViewers();
		},

		dispose() {
			factoryCtx.effects?.dispose();
			world.clear();
			disposeGroups();
			worldLayer.removeFromParent();
			worldLayer.destroy({ children: false });
		},
	};
}

export type GameCore = ReturnType<typeof createGameCore>;
