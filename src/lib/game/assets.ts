import { Assets, Rectangle, Texture } from "pixi.js";
import { asset } from "$app/paths";
import {
	PLAYER_CLIPS,
	PLAYER_COLUMNS,
	PLAYER_FRAME_SIZE,
	type PlayerClip,
} from "./player.js";
import {
	TILE_DEFS,
	TILE_SIZE,
	type TileDef,
	type TileId,
	sourceUrl,
} from "./tiles/index.js";

const PLAYER_PATH = "Cute_Fantasy_Free/Player/Player.png";

export interface GameAssets {
	player: Record<PlayerClip, Texture[]>;
	tiles: Record<TileId, Texture>;
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

export async function loadAssets(): Promise<GameAssets> {
	const [player, tiles] = await Promise.all([loadPlayer(), loadTiles()]);
	return { player, tiles };
}
