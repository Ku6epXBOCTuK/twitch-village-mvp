import { captureProfile } from "../profiles.js";
import type { SystemFactory } from "./types.js";

export const createViewerPersistenceSystem: SystemFactory = (ctx) => {
	const viewers = ctx.world.with("viewer");

	return () => {
		if (!ctx.viewersDirty) return;
		ctx.viewersDirty = false;

		void ctx.viewerStore.load().then(() => {
			for (const entity of viewers) {
				captureProfile(ctx, entity);
			}
			void ctx.viewerStore.save([...ctx.viewerProfiles.values()]);
		});
	};
};
