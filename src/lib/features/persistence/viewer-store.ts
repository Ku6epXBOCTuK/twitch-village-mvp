import type { Viewer } from "../../game/types.js";
import type { StoragePort } from "./port.js";

const KEY = "viewers";

export type StoredViewer = Viewer & { updatedAt?: number };

export function isStoredViewer(value: unknown): value is StoredViewer {
	if (typeof value !== "object" || value === null) return false;
	const viewer = value as Record<string, unknown>;
	return (
		typeof viewer.userId === "string" &&
		typeof viewer.user === "string" &&
		typeof viewer.login === "string" &&
		typeof viewer.lastSeen === "number" &&
		(viewer.bot === undefined || typeof viewer.bot === "boolean") &&
		(viewer.updatedAt === undefined || typeof viewer.updatedAt === "number")
	);
}

const PROFILE_FIELDS = ["userId", "user", "login", "lastSeen", "bot"] as const;

function contentKey(viewer: StoredViewer): string {
	return JSON.stringify(
		PROFILE_FIELDS.map((field) => viewer[field] as unknown),
	);
}

export function mergeProfile(
	prev: StoredViewer | undefined,
	next: StoredViewer,
	now: number,
): StoredViewer {
	if (prev && contentKey(prev) === contentKey(next)) return prev;
	return { ...next, updatedAt: now };
}

export class ViewerStore {
	private loading: Promise<StoredViewer[]> | null = null;

	constructor(private readonly storage: StoragePort) {}

	load(): Promise<StoredViewer[]> {
		this.loading ??= this.fetch();
		return this.loading;
	}

	private async fetch(): Promise<StoredViewer[]> {
		let parsed: unknown;
		try {
			parsed = await this.storage.load(KEY);
		} catch {
			return [];
		}
		if (!Array.isArray(parsed)) return [];

		return parsed.filter(isStoredViewer);
	}

	async save(viewers: StoredViewer[]): Promise<void> {
		await this.load();
		await this.storage.save(KEY, viewers);
	}
}
