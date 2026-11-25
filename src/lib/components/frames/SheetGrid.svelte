<script lang="ts">
	import type { AssetPath } from "$app/types";
	import FrameImage from "./FrameImage.svelte";

	interface Props {
		path: AssetPath;
		columns: number;
		rows: number;
		size: number;
		stride?: number;
		scale?: number;
		selected?: number | null;
		clip?: readonly number[];
		onselect?: (index: number) => void;
	}

	let {
		path,
		columns,
		rows,
		size,
		stride = size,
		scale = 3,
		selected = null,
		clip = [],
		onselect,
	}: Props = $props();

	const frames = $derived(
		Array.from({ length: columns * rows }, (_, index) => index),
	);
	const gridColumns = $derived(`repeat(${columns}, max-content)`);
</script>

<div class="sheet" style:grid-template-columns={gridColumns}>
	{#each frames as index (index)}
		<button
			type="button"
			class="cell"
			class:in-clip={clip.includes(index)}
			class:chosen={selected === index}
			aria-label={`Кадр ${index}, столбец ${index % columns}, строка ${Math.floor(index / columns)}`}
			onclick={() => onselect?.(index)}
		>
			<FrameImage {path} {columns} {rows} {size} {stride} {index} {scale} />
			<span class="number">{index}</span>
		</button>
	{/each}
</div>

<style>
	.sheet {
		display: grid;
		gap: 2px;
		width: max-content;
	}
	.cell {
		position: relative;
		padding: 0;
		border: 1px solid #354034;
		background: #000;
		cursor: pointer;
		line-height: 0;
	}
	.cell:hover {
		border-color: #9ecb9e;
	}
	.cell.chosen {
		border-color: #e6ece5;
		box-shadow: 0 0 0 1px #e6ece5;
	}
	.cell.in-clip {
		outline: 2px solid #a7d9a7;
		outline-offset: -2px;
	}
	.number {
		position: absolute;
		top: 0;
		left: 0;
		padding: 0 2px;
		background: rgb(0 0 0 / 75%);
		color: #e6ece5;
		font-size: 10px;
		line-height: 12px;
	}
</style>
