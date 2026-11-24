import type { DatabaseSync } from "node:sqlite";
import { initSchema } from "./schema.js";

export function initDb(db: DatabaseSync): void {
	initSchema(db);
}
