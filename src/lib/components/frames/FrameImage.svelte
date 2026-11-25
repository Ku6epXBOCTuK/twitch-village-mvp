<script lang="ts">
	import { asset } from "$app/paths";
	import type { AssetPath } from "$app/types";

	interface Props {
		path: AssetPath;
		columns: number;
		rows: number;
		size: number;
		stride: number;
		index: number;
		scale?: number;
	}

	let { path, columns, rows, size, stride, index, scale = 1 }: Props = $props();

	const col = $derived(index % columns);
	const row = $derived(Math.floor(index / columns));
	const style = $derived(
		`width: ${size * scale}px; height: ${size * scale}px; ` +
			`background-image: url("${asset(path)}"); ` +
			`background-size: ${columns * size * scale}px ${rows * stride * scale}px; ` +
			`background-position: -${col * size * scale}px -${row * stride * scale}px;`,
	);
</script>

<div class="frame" {style}></div>

<style>
	.frame {
		flex: none;
		image-rendering: pixelated;
	}
</style>
