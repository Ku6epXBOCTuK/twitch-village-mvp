import type { StoredViewer } from "#lib/features/persistence/viewer-store.js";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { initDb } from "../db-test-utils.js";
import { PROFILE_RETENTION_MS, SqliteViewersRepo } from "./sqlite-adapter.js";

const NOW = 1_700_000_000_000;

const profile = (overrides: Partial<StoredViewer> = {}): StoredViewer => ({
	userId: "u1",
	user: "alice",
	login: "alice",
	lastSeen: NOW - 1_000,
	...overrides,
});

const entry = (data: StoredViewer, updatedAt = NOW) => ({
	userId: data.userId,
	data,
	updatedAt,
});

const openRepo = (db = new DatabaseSync(":memory:")) => {
	initDb(db);
	return { db, repo: new SqliteViewersRepo(db, () => NOW) };
};

describe("SqliteViewersRepo", () => {
	it("merges by userId and keeps profiles missing from the payload", () => {
		const { repo } = openRepo();
		repo.upsert("c1", [
			entry(profile()),
			entry(profile({ userId: "u2", user: "bob", login: "bob" })),
		]);

		repo.upsert("c1", [entry(profile({ user: "carol" }), NOW + 1)]);

		expect(repo.load("c1")).toHaveLength(2);
		expect(repo.get<StoredViewer>("c1", "u1")?.user).toBe("carol");
		expect(repo.get<StoredViewer>("c1", "u2")?.user).toBe("bob");
	});

	it("rejects a write with an older version and accepts a newer one", () => {
		const { repo } = openRepo();
		repo.upsert("c1", [entry(profile({ user: "carol" }), NOW + 10)]);

		repo.upsert("c1", [entry(profile({ user: "dave" }), NOW)]);
		expect(repo.get<StoredViewer>("c1", "u1")?.user).toBe("carol");

		repo.upsert("c1", [entry(profile({ user: "erin" }), NOW + 11)]);
		expect(repo.get<StoredViewer>("c1", "u1")?.user).toBe("erin");
	});

	it("isolates channels", () => {
		const { repo } = openRepo();
		repo.upsert("c1", [entry(profile({ user: "carol" }))]);
		repo.upsert("c2", [entry(profile({ user: "dave" }))]);

		expect(repo.get<StoredViewer>("c1", "u1")?.user).toBe("carol");
		expect(repo.get<StoredViewer>("c2", "u1")?.user).toBe("dave");
		expect(repo.load("c3")).toEqual([]);
	});

	it("purges bots, broken rows and expired profiles on open", () => {
		const db = new DatabaseSync(":memory:");
		const { repo } = openRepo(db);
		repo.upsert("c1", [
			entry(profile({ userId: "fresh" })),
			entry(
				profile({
					userId: "old",
					lastSeen: NOW - PROFILE_RETENTION_MS - 1,
				}),
			),
			entry(profile({ userId: "bot-1", bot: true })),
		]);
		db.prepare(
			"INSERT INTO viewers (channel, user_id, data) VALUES (?, ?, ?)",
		).run("c1", "broken", "not json");

		const reopened = new SqliteViewersRepo(db, () => NOW);

		expect(reopened.load("c1")).toEqual([
			expect.objectContaining({ userId: "fresh" }),
		]);
	});
});
