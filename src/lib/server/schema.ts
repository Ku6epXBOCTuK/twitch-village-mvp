import type { DatabaseSync } from "node:sqlite";

export function initSchema(db: DatabaseSync): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS viewers (
			channel TEXT NOT NULL,
			user_id TEXT NOT NULL,
			data TEXT NOT NULL,
			updated_at INTEGER NOT NULL DEFAULT 0,
			PRIMARY KEY (channel, user_id)
		)
	`);
}
