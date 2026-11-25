<script lang="ts">
	import { TILE_SIZE, tileNumber, autotile } from "#lib/game/tiles/index.js";
	import type { TerrainGrid } from "#lib/game/tiles/index.js";
	import TileImage from "./TileImage.svelte";

	interface Props {
		grid: TerrainGrid;
		scale?: number;
		selected?: number | null;
		onpaint?: (index: number) => void;
		showLabels?: boolean;
	}

	let {
		grid,
		scale = 2,
		selected = null,
		onpaint,
		showLabels = true,
	}: Props = $props();

	const tiles = $derived(autotile(grid));
	const cellSize = $derived(TILE_SIZE * scale);
	let painting = false;
</script>

<svelte:window onpointerup={() => (painting = false)} />

{#snippet cellContent(index: number)}
	<TileImage tile={tiles[index].tile} {scale} />
	{#if tiles[index].invalid}
		<span class="invalid"></span>
	{/if}
	{#if showLabels}
		<span class="cell-number">{index + 1}</span>
	{/if}
{/snippet}

<div
	class="grid-wrap"
	class:labeled={showLabels}
	style={`--cell: ${cellSize}px;`}
>
	{#if showLabels}
		<div class="corner"></div>
		<div
			class="col-heads"
			style={`grid-template-columns: repeat(${grid.width}, var(--cell));`}
		>
			{#each Array.from({ length: grid.width }, (_, x) => x) as x (x)}
				<span>{x}</span>
			{/each}
		</div>
		<div
			class="row-heads"
			style={`grid-template-rows: repeat(${grid.height}, var(--cell));`}
		>
			{#each Array.from({ length: grid.height }, (_, y) => y) as y (y)}
				<span>{y}</span>
			{/each}
		</div>
	{/if}
	<div
		class="tile-grid"
		style={`grid-template-columns: repeat(${grid.width}, var(--cell));`}
	>
		{#if onpaint}
			{#each tiles as tile, index (index)}
				<button
					type="button"
					class="cell interactive"
					class:selected={selected === index}
					title={`клетка ${index + 1}, строка ${Math.floor(index / grid.width)}, столбец ${index % grid.width}, тайл №${tileNumber(tile.tile)}`}
					onpointerdown={(event) => {
						if (event.button !== 0) return;
						painting = true;
						onpaint(index);
					}}
					onpointerenter={() => {
						if (painting) onpaint(index);
					}}
					onclick={() => onpaint(index)}
				>
					{@render cellContent(index)}
				</button>
			{/each}
		{:else}
			{#each tiles as tile, index (index)}
				<div
					class="cell"
					title={`клетка ${index + 1}, строка ${Math.floor(index / grid.width)}, столбец ${index % grid.width}, тайл №${tileNumber(tile.tile)}`}
				>
					{@render cellContent(index)}
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.grid-wrap {
		display: grid;
		grid-template-columns: max-content;
		grid-template-rows: max-content;
		width: max-content;
	}
	.labeled {
		grid-template-columns: 18px max-content;
		grid-template-rows: 15px max-content;
	}
	.corner {
		width: 18px;
		height: 15px;
	}
	.col-heads {
		display: grid;
	}
	.row-heads {
		display: grid;
	}
	.col-heads span,
	.row-heads span {
		font-size: 10px;
		line-height: 1;
		color: #93a391;
		text-align: center;
	}
	.row-heads span {
		width: 18px;
		align-self: center;
	}
	.tile-grid {
		display: grid;
		width: max-content;
		line-height: 0;
	}
	.cell {
		position: relative;
		box-sizing: border-box;
		width: var(--cell);
		height: var(--cell);
		border: 1px solid rgb(255 255 255 / 18%);
	}
	.grid-wrap:not(.labeled) .cell {
		border-color: transparent;
	}
	.interactive {
		padding: 0;
		background: none;
		cursor: pointer;
		touch-action: none;
	}
	.selected {
		outline: 2px solid #cfe8cf;
		outline-offset: -2px;
	}
	.cell-number {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		color: #fff;
		font-size: 10px;
		line-height: 1;
		text-shadow:
			0 1px 2px #000,
			0 0 3px #000;
		pointer-events: none;
	}
	.invalid {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			45deg,
			rgb(255 72 72 / 65%) 0 3px,
			transparent 3px 6px
		);
		outline: 2px solid #ff4848;
		outline-offset: -2px;
		pointer-events: none;
	}
</style>
