<script lang="ts">
	import { startChatFlow } from "#lib/chat/flow.js";
	import { RemoteStorageAdapter } from "#lib/features/persistence/remote-adapter.js";
	import { bootstrapGame } from "#lib/game/index.js";
	import { parseSettings } from "#lib/game/settings.js";
	import { page } from "$app/state";
	import type { Application } from "pixi.js";
	import { onMount } from "svelte";
	import PixiOverlay from "./PixiOverlay.svelte";

	interface Props {
		channel: string;
	}

	let { channel }: Props = $props();

	type Game = Awaited<ReturnType<typeof bootstrapGame>>;
	let game = $state<Game | null>(null);
	const settings = parseSettings(page.url.searchParams);

	onMount(() => {
		document.documentElement.classList.add("game-page");
		document.body.classList.add("game-page");
		const stopChat = startChatFlow(() => game, channel);
		return () => {
			stopChat();
			game?.destroy();
			game = null;
			document.documentElement.classList.remove("game-page");
			document.body.classList.remove("game-page");
		};
	});

	function pixiOverlayReady(app: Application) {
		void bootstrapGame(
			app,
			channel,
			settings,
			(name) => new RemoteStorageAdapter(name),
		).then((instance) => {
			game = instance;
		});
	}
</script>

<PixiOverlay onReady={pixiOverlayReady} />
