import { Assets, Rectangle, Texture } from "pixi.js";
import { asset } from "$app/paths";
import {
	PLAYER_CLIPS,
	PLAYER_COLUMNS,
	PLAYER_FRAME_SIZE,
	type PlayerClip,
} from "./player.js";

const PLAYER_PATH = "Cute_Fantasy_Free/Player/Player.png";

export interface GameAssets {
	player: Record<PlayerClip, Texture[]>;
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

export async function loadAssets(): Promise<GameAssets> {
	return { player: await loadPlayer() };
}
