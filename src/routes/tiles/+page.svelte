<script lang="ts">
	import TileGrid from "#lib/components/tiles/TileGrid.svelte";
	import TileImage from "#lib/components/tiles/TileImage.svelte";
	import {
		ATLAS_CELLS,
		PRESETS,
		TILE_DEFS,
		autotile,
		describeMask,
		tileNumber,
		type TerrainGrid,
		type TileId,
	} from "#lib/game/tiles/index.js";

	const atlasByCell = new Map(
		ATLAS_CELLS.map((tile) => [`${tile.col},${tile.row}`, tile]),
	);
	const atlasPositions = Array.from({ length: 18 }, (_, index) => {
		const col = index % 3;
		const row = Math.floor(index / 3);
		return { col, row, def: atlasByCell.get(`${col},${row}`) };
	});

	const rules: { mask: number; tile: TileId | null; note: string }[] = [
		{ mask: 0, tile: "pathMiddle", note: "внутренняя клетка дорожки" },
		{ mask: 1, tile: "pathEdgeN", note: "переход сверху" },
		{ mask: 2, tile: "pathEdgeE", note: "переход справа" },
		{ mask: 4, tile: "pathEdgeS", note: "переход снизу" },
		{ mask: 8, tile: "pathEdgeW", note: "переход слева" },
		{ mask: 3, tile: "pathCornerNE", note: "диагональ дорожки, верхний угол" },
		{ mask: 6, tile: "pathCornerSE", note: "диагональ дорожки, верхний угол" },
		{ mask: 12, tile: "pathCornerSW", note: "диагональ дорожки, верхний угол" },
		{ mask: 9, tile: "pathCornerNW", note: "диагональ дорожки, верхний угол" },
		{ mask: 3, tile: "grassCornerNE", note: "диагональ травы, внешний угол" },
		{ mask: 6, tile: "grassCornerSE", note: "диагональ травы, внешний угол" },
		{ mask: 12, tile: "grassCornerSW", note: "диагональ травы, внешний угол" },
		{ mask: 9, tile: "grassCornerNW", note: "диагональ травы, внешний угол" },
		{ mask: 5, tile: null, note: "противоположные стороны" },
		{ mask: 10, tile: null, note: "противоположные стороны" },
		{ mask: 7, tile: null, note: "три стороны" },
		{ mask: 15, tile: null, note: "одиночная клетка" },
	];

	let selected = $state<TileId>("pathCornerNW");
	let sandbox = $state<TerrainGrid>(structuredClone(PRESETS[0].grid));
	let brush = $state<"grass" | "path">("path");
	let selectedCell = $state<number | null>(null);
	let showLabels = $state(true);

	const sandboxTiles = $derived(autotile(sandbox));
	const invalidCount = $derived(
		sandboxTiles.filter((tile) => tile.invalid).length,
	);
	const selectedTile = $derived(
		selectedCell === null ? null : sandboxTiles[selectedCell],
	);

	function paint(index: number) {
		sandbox.cells[index] = brush;
		selectedCell = index;
	}

	function loadPreset(id: string) {
		const preset = PRESETS.find((item) => item.id === id);
		if (!preset) return;
		sandbox = structuredClone(preset.grid);
		selectedCell = null;
	}
</script>

<svelte:head>
	<title>Тайлы карты</title>
</svelte:head>

<main>
	<header>
		<div>
			<h1>Конструктор тайлов</h1>
			<p>
				Карта собирается из целых клеток 16×16. Переход рисуется внутри одного
				из двух соседних тайлов.
			</p>
		</div>
		<div class="header-actions">
			<button type="button" onclick={() => (showLabels = !showLabels)}>
				{showLabels ? "Скрыть сетку и номера" : "Показать сетку и номера"}
			</button>
			<a href="/">К игре</a>
		</div>
	</header>

	<section>
		<h2>Атлас, ячейка за ячейкой</h2>
		<p class="hint">
			Path_Tile.png, 3 столбца на 6 строк, каждая ячейка 16×16. Нажми на ячейку,
			чтобы увидеть её крупно. № перед названием это номер тайла в этом списке,
			а ячейка 0,0 означает столбец 0, строка 0.
		</p>
		<div class="atlas-layout">
			<div class="atlas-grid">
				{#each atlasPositions as position (position.row * 3 + position.col)}
					{@const tile = position.def?.id ?? "pathMiddle"}
					<button
						type="button"
						class="atlas-cell"
						class:chosen={selected === tile}
						onclick={() => (selected = tile)}
					>
						<TileImage {tile} scale={3} />
						<span class="tile-badge">№{tileNumber(tile)}</span>
						<span>{position.def?.label ?? "Середина дорожки, дубль"}</span>
						<small>ячейка {position.col},{position.row}</small>
					</button>
				{/each}
			</div>
			<div class="detail">
				<TileImage tile={selected} scale={8} />
				<div>
					<h3>№{tileNumber(selected)} · {TILE_DEFS[selected].label}</h3>
					<p>{TILE_DEFS[selected].role}</p>
					<p class="mono">
						кадр {TILE_DEFS[selected].col},{TILE_DEFS[selected].row}
						· {TILE_DEFS[selected].source}
					</p>
				</div>
			</div>
		</div>
		<div class="middle-row">
			{#each ["grassMiddle", "pathMiddle"] as tile (tile)}
				<button
					type="button"
					class="atlas-cell"
					class:chosen={selected === tile}
					onclick={() => (selected = tile as TileId)}
				>
					<TileImage tile={tile as TileId} scale={3} />
					<span class="tile-badge">№{tileNumber(tile as TileId)}</span>
					<span>{TILE_DEFS[tile as TileId].label}</span>
					<small>отдельный файл 16×16</small>
				</button>
			{/each}
		</div>
	</section>

	<section>
		<h2>Как собирается граница</h2>
		<p class="hint">
			В картах сверху подписаны столбцы, слева строки, а в клетках стоит её
			номер по порядку. Номер тайла указан в подсказке при наведении.
		</p>
		<div class="examples">
			{#each PRESETS.filter(
				(preset) => preset.id !== "empty",
			) as preset, exampleNumber (preset.id)}
				<figure>
					<TileGrid grid={preset.grid} scale={2} {showLabels} />
					<figcaption>
						Пример {exampleNumber + 1}: {preset.name}
						{#if preset.id === "corridor"}
							<span class="bad">непредставимо атласом</span>
						{/if}
					</figcaption>
				</figure>
			{/each}
		</div>
		<p class="hint">
			В пятне дорожки переход лежит в дорожном тайле, а внешний угол на
			диагональном стыке с травой лежит в дорожной клетке. На углах травяной
			области в дорожке переход лежит в травяном тайле из нижнего пятна, а
			соседние дорожные клетки остаются серединой. Красная штриховка означает,
			что подходящего тайла нет.
		</p>
	</section>

	<section>
		<h2>Правила выбора тайла</h2>
		<p class="hint">
			Маска задана сторонами с травой вокруг клетки дорожки: С=1, В=2, Ю=4, З=8.
			Диагональ проверяется со стороны дорожки: если она дорожка, берётся
			верхний угол, иначе внешний из нижнего пятна.
		</p>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Маска</th>
						<th>Стороны</th>
						<th>Тайл</th>
						<th>Почему</th>
					</tr>
				</thead>
				<tbody>
					{#each rules as rule (rule.mask + rule.note)}
						<tr class:bad={rule.tile === null}>
							<td class="mono">{rule.mask}</td>
							<td>{describeMask(rule.mask)}</td>
							<td>
								{#if rule.tile}
									<div class="rule-tile">
										<TileImage tile={rule.tile} scale={2} />
										<span
											>№{tileNumber(rule.tile)}
											· {TILE_DEFS[rule.tile].label}</span
										>
									</div>
								{:else}
									<span class="bad">нет тайла</span>
								{/if}
							</td>
							<td>{rule.note}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="hint">
			Угол травы, окружённой дорожкой, берётся из нижнего пятна, по сторонам
			самой травы: grassCornerSE, SW, NE или NW. Соседние дорожные клетки
			остаются серединой, переход рисует травяный тайл. Трава снаружи пятна
			дорожки остаётся серединой, переход рисует дорожный тайл.
		</p>
	</section>

	<section>
		<h2>Песочница</h2>
		<p class="hint">
			Клик или протяжка переключает клетки. Автотайлер считается сразу.
		</p>
		<div class="toolbar">
			<div class="group" role="group" aria-label="Кисть">
				{#each ["grass", "path"] as kind (kind)}
					<button
						type="button"
						class:active={brush === kind}
						onclick={() => (brush = kind as "grass" | "path")}
					>
						{kind === "grass" ? "Трава" : "Дорожка"}
					</button>
				{/each}
			</div>
			<div class="group" role="group" aria-label="Примеры">
				{#each PRESETS as preset, presetNumber (preset.id)}
					<button type="button" onclick={() => loadPreset(preset.id)}>
						{presetNumber + 1}. {preset.name}
					</button>
				{/each}
			</div>
			<span class="counter" class:bad={invalidCount > 0}>
				{invalidCount === 0
					? "все клетки имеют тайл"
					: `${invalidCount} клеток без тайла`}
			</span>
		</div>
		<div class="sandbox">
			<TileGrid
				grid={sandbox}
				scale={2}
				selected={selectedCell}
				onpaint={paint}
				{showLabels}
			/>
			<div class="detail">
				{#if selectedTile && selectedCell !== null}
					<TileImage tile={selectedTile.tile} scale={8} />
					<div>
						<h3>
							№{tileNumber(selectedTile.tile)}
							· {TILE_DEFS[selectedTile.tile].label}
						</h3>
						<p class="mono">
							клетка №{selectedCell + 1}
							· столбец {selectedCell % sandbox.width} · строка
							{Math.floor(selectedCell / sandbox.width)}
						</p>
						{#if selectedTile.invalid}
							<p class="bad">Для этой формы тайла нет</p>
						{/if}
					</div>
				{:else}
					<p class="hint">Выбери клетку, чтобы увидеть её тайл.</p>
				{/if}
			</div>
		</div>
	</section>
</main>

<style>
	main {
		max-width: 1180px;
		margin: 0 auto;
		padding: 32px 24px 64px;
		color: #e6ece5;
		background: #111511;
		font-family: ui-sans-serif, system-ui, sans-serif;
	}
	:global(body) {
		margin: 0;
		background: #111511;
	}
	:focus-visible {
		outline: 2px solid #a7d9a7;
		outline-offset: 2px;
	}
	h1 {
		margin: 0 0 8px;
		font-size: 26px;
	}
	h2 {
		margin: 0 0 8px;
		font-size: 18px;
	}
	h3 {
		margin: 0 0 6px;
		font-size: 16px;
	}
	p {
		margin: 0 0 12px;
		line-height: 1.5;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		padding-bottom: 20px;
		border-bottom: 1px solid #354034;
	}
	header p {
		max-width: 720px;
		color: #b9c6b8;
	}
	.header-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.header-actions button {
		padding: 8px 12px;
		border: 1px solid #5c745b;
		background: #1b211b;
		color: #cfe8cf;
		font: inherit;
		cursor: pointer;
	}
	.header-actions button:hover {
		background: #263126;
	}
	a {
		color: #cfe8cf;
		border: 1px solid #5c745b;
		padding: 8px 12px;
		text-decoration: none;
	}
	section {
		margin-top: 32px;
	}
	.hint {
		color: #aebbab;
		font-size: 13px;
	}
	.mono {
		font-family: ui-monospace, monospace;
		font-size: 12px;
		color: #aebbab;
	}
	.bad {
		color: #ff9b9b;
	}
	.atlas-layout,
	.sandbox {
		display: flex;
		gap: 24px;
		align-items: flex-start;
		flex-wrap: wrap;
	}
	.atlas-grid {
		display: grid;
		grid-template-columns: repeat(3, max-content);
		gap: 6px;
	}
	.atlas-cell {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
		width: 132px;
		padding: 6px;
		background: #1b211b;
		border: 1px solid #354034;
		color: #e6ece5;
		text-align: left;
		cursor: pointer;
		font: inherit;
		font-size: 11px;
		line-height: 1.3;
	}
	.atlas-cell.chosen {
		border-color: #9ecb9e;
		background: #263126;
	}
	.atlas-cell small {
		color: #93a391;
	}
	.tile-badge {
		position: absolute;
		top: 6px;
		left: 6px;
		padding: 0 3px;
		background: rgb(0 0 0 / 70%);
		color: #e6ece5;
		font-size: 10px;
		line-height: 14px;
	}
	.middle-row {
		display: flex;
		gap: 6px;
		margin-top: 12px;
	}
	.detail {
		display: flex;
		gap: 16px;
		align-items: flex-start;
		min-width: 280px;
		padding: 14px;
		border: 1px solid #354034;
		background: #1b211b;
	}
	.detail p {
		margin: 0 0 4px;
		font-size: 13px;
	}
	.examples {
		display: flex;
		gap: 20px;
		flex-wrap: wrap;
	}
	figure {
		margin: 0;
		padding: 12px;
		border: 1px solid #354034;
		background: #1b211b;
	}
	figcaption {
		margin-top: 10px;
		font-size: 13px;
	}
	figcaption span {
		display: block;
	}
	.table-wrap {
		overflow-x: auto;
	}
	table {
		border-collapse: collapse;
		font-size: 13px;
		width: 100%;
	}
	th,
	td {
		text-align: left;
		padding: 8px 10px;
		border-bottom: 1px solid #354034;
	}
	th {
		color: #b9c6b8;
		font-weight: 600;
	}
	tr.bad {
		background: rgb(255 72 72 / 8%);
	}
	.rule-tile {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.toolbar {
		display: flex;
		gap: 16px;
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: 12px;
	}
	.group {
		display: flex;
		gap: 4px;
	}
	.group button {
		padding: 7px 10px;
		background: #1b211b;
		border: 1px solid #354034;
		color: #e6ece5;
		cursor: pointer;
		font: inherit;
		font-size: 12px;
	}
	.group button.active {
		border-color: #9ecb9e;
		background: #263126;
	}
	.counter {
		font-size: 13px;
		color: #a7d9a7;
	}
	@media (max-width: 720px) {
		main {
			padding: 20px 14px 48px;
		}
		header {
			flex-wrap: wrap;
		}
	}
</style>
