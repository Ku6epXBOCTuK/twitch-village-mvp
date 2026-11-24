import { VIEWER_SCALE } from "./config.js";

export interface GameSettings {
	viewerScale: number;
}

export function defaultSettings(): GameSettings {
	return { viewerScale: VIEWER_SCALE };
}

export function parseSettings(
	params: Pick<URLSearchParams, "get">,
	base: GameSettings = defaultSettings(),
): GameSettings {
	const raw = params.get("viewer_scale");
	if (raw === null) return base;
	const value = Number(raw);
	if (!Number.isFinite(value)) return base;
	return { viewerScale: Math.min(6, Math.max(0.5, value)) };
}
