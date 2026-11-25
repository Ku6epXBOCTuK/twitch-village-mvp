<script lang="ts">
	import {
		SOURCE_SIZE,
		sourceUrl,
		TILE_DEFS,
		TILE_SIZE,
		type TileId,
	} from "#lib/game/tiles/index.js";
	import { asset } from "$app/paths";

	interface Props {
		tile: TileId;
		scale?: number;
		class?: string;
	}

	let { tile, scale = 1, class: className = "" }: Props = $props();

	const def = $derived(TILE_DEFS[tile]);
	const sheet = $derived(SOURCE_SIZE[def.source]);
	const style = $derived(
		`width: ${TILE_SIZE * scale}px; height: ${TILE_SIZE * scale}px; ` +
			`background-image: url("${asset(sourceUrl(def.source))}"); ` +
			`background-size: ${sheet[0] * scale}px ${sheet[1] * scale}px; ` +
			`background-position: -${def.col * TILE_SIZE * scale}px -${def.row * TILE_SIZE * scale}px;`,
	);
</script>

<div class={`tile ${className}`} {style}></div>

<style>
	.tile {
		flex: none;
		image-rendering: pixelated;
	}
</style>
