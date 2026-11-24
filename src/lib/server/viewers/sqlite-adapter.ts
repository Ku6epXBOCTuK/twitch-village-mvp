import type { StoredViewer } from "#lib/features/persistence/viewer-store.js";
import { logger } from "#lib/logger.js";
import type { DatabaseSync } from "node:sqlite";
import type { ViewerProfile, ViewersRepo } from "./port.js";

export const PROFILE_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

function parseProfile(raw: string): StoredViewer | null {
	try {
		const data = JSON.parse(raw) as unknown;
		if (typeof data !== "object" || data === null || Array.isArray(data)) {
			return null;
		}
		return data as StoredViewer;
	} catch {
		return null;
	}
}

export class SqliteViewersRepo implements ViewersRepo {
	constructor(
		private readonly db: DatabaseSync,
		private readonly now: () => number = Date.now,
	) {
		this.purge();
	}

	purge(): void {
		const rows = this.db
			.prepare("SELECT channel, user_id, data FROM viewers")
			.all() as { channel: string; user_id: string; data: string }[];
		const now = this.now();
		const stale = rows.filter((row) => {
			const profile = parseProfile(row.data);
			if (!profile) return true;
			if (profile.bot) return true;
			return (
				typeof profile.lastSeen !== "number" ||
				now - profile.lastSeen > PROFILE_RETENTION_MS
			);
		});
		if (stale.length === 0) return;

		const remove = this.db.prepare(
			"DELETE FROM viewers WHERE channel = ? AND user_id = ?",
		);
		this.db.exec("BEGIN");
		try {
			for (const row of stale) remove.run(row.channel, row.user_id);
			this.db.exec("COMMIT");
		} catch (error) {
			this.db.exec("ROLLBACK");
			throw error;
		}
		logger.info(
			`[viewers] purged ${stale.length} profiles: ${stale
				.map((row) => row.user_id)
				.join(", ")}`,
		);
	}

	load<T>(channel: string): T[] {
		const rows = this.db
			.prepare("SELECT data FROM viewers WHERE channel = ?")
			.all(channel) as { data: string }[];
		return rows.map((row) => JSON.parse(row.data) as T);
	}

	get<T>(channel: string, userId: string): T | null {
		const row = this.db
			.prepare("SELECT data FROM viewers WHERE channel = ? AND user_id = ?")
			.get(channel, userId) as { data: string } | undefined;
		return row ? (JSON.parse(row.data) as T) : null;
	}

	upsert(channel: string, profiles: ViewerProfile[]): void {
		if (profiles.length === 0) return;
		const insert = this.db.prepare(`
			INSERT INTO viewers (channel, user_id, data, updated_at)
			VALUES (?, ?, ?, ?)
			ON CONFLICT (channel, user_id) DO UPDATE SET
				data = excluded.data,
				updated_at = excluded.updated_at
			WHERE excluded.updated_at >= viewers.updated_at
		`);

		this.db.exec("BEGIN");
		try {
			for (const profile of profiles) {
				insert.run(
					channel,
					profile.userId,
					JSON.stringify(profile.data),
					profile.updatedAt,
				);
			}
			this.db.exec("COMMIT");
		} catch (error) {
			this.db.exec("ROLLBACK");
			throw error;
		}
	}
}
