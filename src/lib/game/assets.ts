import { Assets, Rectangle, Texture } from "pixi.js";
import { asset } from "$app/paths";
import {
	ANIMAL_COLUMNS,
	ANIMAL_FRAME_COUNT,
	ANIMAL_FRAME_SIZE,
	ANIMAL_KINDS,
	ANIMAL_PATHS,
	type AnimalKind,
} from "./animals.js";
import {
	PLAYER_CLIPS,
	PLAYER_COLUMNS,
	PLAYER_FRAME_SIZE,
	type PlayerClip,
} from "./player.js";
import {
	sourceUrl,
	TILE_DEFS,
	TILE_SIZE,
	type TileDef,
	type TileId,
} from "./tiles/index.js";

const PLAYER_PATH = "Cute_Fantasy_Free/Player/Player.png";
const TREE_PATH = "Cute_Fantasy_Free/Outdoor decoration/Oak_Tree.png";
const SMALL_TREE_PATH =
	"Cute_Fantasy_Free/Outdoor decoration/Oak_Tree_Small.png";
const SMALL_TREE_WIDTH = 32;
const SMALL_TREE_HEIGHT = 48;

export interface GameAssets {
	player: Record<PlayerClip, Texture[]>;
	animals: Record<AnimalKind, Texture[]>;
	tiles: Record<TileId, Texture>;
	trees: { large: Texture; small: Texture[] };
}

export async function loadPlayer(): Promise<GameAssets["player"]> {
	const base = await Assets.load<Texture>(asset(PLAYER_PATH));
	base.source.scaleMode = "nearest";

	const clips = {} as Record<PlayerClip, Texture[]>;
	for (const clip of Object.keys(PLAYER_CLIPS) as PlayerClip[]) {
		clips[clip] = PLAYER_CLIPS[clip].map((frame) => {
			const col = frame % PLAYER_COLUMNS;
			const row = Math.floor(frame / PLAYER_COLUMNS);
			return new Texture({
				source: base.source,
				frame: new Rectangle(
					col * PLAYER_FRAME_SIZE,
					row * PLAYER_FRAME_SIZE,
					PLAYER_FRAME_SIZE,
					PLAYER_FRAME_SIZE,
				),
			});
		});
	}
	return clips;
}

export async function loadAnimals(): Promise<GameAssets["animals"]> {
	const animals = {} as GameAssets["animals"];
	for (const kind of ANIMAL_KINDS) {
		const base = await Assets.load<Texture>(asset(ANIMAL_PATHS[kind]));
		base.source.scaleMode = "nearest";
		animals[kind] = Array.from({ length: ANIMAL_FRAME_COUNT }, (_, frame) => {
			const col = frame % ANIMAL_COLUMNS;
			const row = Math.floor(frame / ANIMAL_COLUMNS);
			return new Texture({
				source: base.source,
				frame: new Rectangle(
					col * ANIMAL_FRAME_SIZE,
					row * ANIMAL_FRAME_SIZE,
					ANIMAL_FRAME_SIZE,
					ANIMAL_FRAME_SIZE,
				),
			});
		});
	}
	return animals;
}

export async function loadTiles(): Promise<GameAssets["tiles"]> {
	const sources = new Map<TileDef["source"], Texture>();
	for (const source of ["atlas", "grassMiddle", "pathMiddle"] as const) {
		const texture = await Assets.load<Texture>(asset(sourceUrl(source)));
		texture.source.scaleMode = "nearest";
		sources.set(source, texture);
	}

	const tiles = {} as GameAssets["tiles"];
	for (const def of Object.values(TILE_DEFS)) {
		const base = sources.get(def.source);
		if (!base) continue;
		tiles[def.id] = new Texture({
			source: base.source,
			frame: new Rectangle(
				def.col * TILE_SIZE,
				def.row * TILE_SIZE,
				TILE_SIZE,
				TILE_SIZE,
			),
		});
	}
	return tiles;
}

export async function loadTrees(): Promise<GameAssets["trees"]> {
	const large = await Assets.load<Texture>(asset(TREE_PATH));
	large.source.scaleMode = "nearest";

	const base = await Assets.load<Texture>(asset(SMALL_TREE_PATH));
	base.source.scaleMode = "nearest";
	const small = [1, 2].map(
		(col) =>
			new Texture({
				source: base.source,
				frame: new Rectangle(
					col * SMALL_TREE_WIDTH,
					0,
					SMALL_TREE_WIDTH,
					SMALL_TREE_HEIGHT,
				),
			}),
	);

	return { large, small };
}

export async function loadAssets(): Promise<GameAssets> {
	const [player, animals, tiles, trees] = await Promise.all([
		loadPlayer(),
		loadAnimals(),
		loadTiles(),
		loadTrees(),
	]);
	return { player, animals, tiles, trees };
}
