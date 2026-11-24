import { LocalStorageAdapter } from "./local-storage-adapter.js";
import type { StoragePort, StorageTransport } from "./port.js";
import { ViewerStore } from "./viewer-store.js";

export type { StoragePort, StorageTransport } from "./port.js";
export { mergeProfile, ViewerStore } from "./viewer-store.js";
export type { StoredViewer } from "./viewer-store.js";

export function createViewerStore(
	channel?: string,
	transport?: StorageTransport,
): ViewerStore {
	const storage: StoragePort =
		channel && transport ? transport(channel) : new LocalStorageAdapter();
	return new ViewerStore(storage);
}
