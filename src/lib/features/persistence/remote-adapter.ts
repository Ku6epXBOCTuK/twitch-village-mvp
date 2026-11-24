import { withRetry } from "#lib/features/remote/retry.js";
import {
	viewersLoad,
	viewersSave,
} from "#lib/features/widget/widget.remote.js";
import { QueuedStoragePort } from "./queued-port.js";

const VIEWERS_KEY = "viewers";

export class RemoteStorageAdapter extends QueuedStoragePort {
	constructor(private readonly channel: string) {
		super();
	}

	protected async read(key: string): Promise<unknown> {
		this.assertKey(key);
		return await viewersLoad({ channel: this.channel });
	}

	protected async write(key: string, value: unknown): Promise<void> {
		this.assertKey(key);
		await withRetry(() =>
			viewersSave({
				channel: this.channel,
				viewers: value as unknown[],
			}),
		);
	}

	private assertKey(key: string): void {
		if (key !== VIEWERS_KEY) throw new Error(`[storage] unknown key: ${key}`);
	}
}
