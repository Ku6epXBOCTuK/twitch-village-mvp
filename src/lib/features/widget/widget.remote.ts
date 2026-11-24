import { command } from "$app/server";
import * as v from "valibot";
import { isStoredViewer } from "#lib/features/persistence/viewer-store.js";
import { viewers, type ViewerProfile } from "#lib/server/viewers/index.js";

const channelField = v.pipe(v.string(), v.minLength(1), v.maxLength(64));

export const viewersLoad = command(
	v.object({ channel: channelField }),
	({ channel }) => viewers.load(channel),
);

export const viewersSave = command(
	v.object({
		channel: channelField,
		viewers: v.array(v.unknown()),
	}),
	({ channel, viewers: entries }) => {
		const now = Date.now();
		const profiles: ViewerProfile[] = [];
		for (const entry of entries) {
			if (!isStoredViewer(entry)) continue;
			profiles.push({
				userId: entry.userId,
				data: entry,
				updatedAt: entry.updatedAt ?? now,
			});
		}
		viewers.upsert(channel, profiles);
	},
);
