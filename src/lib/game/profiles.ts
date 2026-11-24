import {
	mergeProfile,
	type StoredViewer,
} from "#lib/features/persistence/viewer-store.js";
import type { With } from "miniplex";
import type { GameContext } from "./context.js";
import type { Entity } from "./types.js";

export function captureProfile(
	ctx: GameContext,
	entity: With<Entity, "viewer">,
): void {
	if (entity.viewer.bot) return;

	const profile: StoredViewer = { ...entity.viewer };
	ctx.viewerProfiles.set(
		entity.viewer.userId,
		mergeProfile(
			ctx.viewerProfiles.get(entity.viewer.userId),
			profile,
			ctx.now(),
		),
	);
}
