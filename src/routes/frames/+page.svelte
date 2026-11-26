<script lang="ts">
	import { onMount } from "svelte";
	import AnimationPreview from "#lib/components/frames/AnimationPreview.svelte";
	import FrameImage from "#lib/components/frames/FrameImage.svelte";
	import SheetGrid from "#lib/components/frames/SheetGrid.svelte";
	import {
		ANIMAL_ANIMATION_SPEED,
		ANIMAL_COLUMNS,
		ANIMAL_FRAME_COUNT,
		ANIMAL_FRAME_SIZE,
		ANIMAL_KINDS,
		ANIMAL_PATHS,
		type AnimalKind,
	} from "#lib/game/animals.js";
	import {
		loadAnimals,
		loadPlayer,
		loadPlayerActions,
	} from "#lib/game/assets.js";
	import {
		PLAYER_ACTION_ANIMATION_SPEED,
		PLAYER_ACTION_CLIPS,
		PLAYER_ACTION_COLUMNS,
		PLAYER_ACTION_FRAME_SIZE,
		PLAYER_ACTION_PATH,
		PLAYER_ACTION_SHEET_ROWS,
		PLAYER_ACTION_STRIDE_HEIGHT,
		PLAYER_ANIMATION_SPEED,
		PLAYER_CLIPS,
		PLAYER_COLUMNS,
		PLAYER_FRAME_SIZE,
		PLAYER_PATH,
		PLAYER_SHEET_ROWS,
	} from "#lib/game/player.js";
	import type { AssetPath } from "$app/types";

	type Assets = {
		player: Awaited<ReturnType<typeof loadPlayer>>;
		playerActions: Awaited<ReturnType<typeof loadPlayerActions>>;
		animals: Awaited<ReturnType<typeof loadAnimals>>;
	};

	interface Sheet {
		path: AssetPath;
		columns: number;
		rows: number;
		size: number;
		stride: number;
	}

	const playerSheet: Sheet = {
		path: PLAYER_PATH,
		columns: PLAYER_COLUMNS,
		rows: PLAYER_SHEET_ROWS,
		size: PLAYER_FRAME_SIZE,
		stride: PLAYER_FRAME_SIZE,
	};
	const actionSheet: Sheet = {
		path: PLAYER_ACTION_PATH,
		columns: PLAYER_ACTION_COLUMNS,
		rows: PLAYER_ACTION_SHEET_ROWS,
		size: PLAYER_ACTION_FRAME_SIZE,
		stride: PLAYER_ACTION_STRIDE_HEIGHT,
	};
	const animalSheet: Omit<Sheet, "path"> = {
		columns: ANIMAL_COLUMNS,
		rows: ANIMAL_FRAME_COUNT / ANIMAL_COLUMNS,
		size: ANIMAL_FRAME_SIZE,
		stride: ANIMAL_FRAME_SIZE,
	};
	const animalFrames = Array.from({ length: ANIMAL_FRAME_COUNT }, (_, i) => i);
	const playerClipFrames = [
		...PLAYER_CLIPS.idleFront,
		...PLAYER_CLIPS.walkRight,
	];
	const actionClipsText = Object.entries(PLAYER_ACTION_CLIPS)
		.map(([name, frames]) => `${name}: ${frames.join(", ")}`)
		.join("; ");

	let assets = $state<Assets | null>(null);
	let selectedPlayer = $state<number | null>(null);
	let selectedAction = $state<number | null>(null);
	let animalKind = $state<AnimalKind>("chicken");
	let selectedAnimal = $state<number | null>(null);

	onMount(() => {
		let cancelled = false;
		(async () => {
			const [player, playerActions, animals] = await Promise.all([
				loadPlayer(),
				loadPlayerActions(),
				loadAnimals(),
			]);
			if (!cancelled) assets = { player, playerActions, animals };
		})();
		return () => {
			cancelled = true;
		};
	});

	const clips = $derived.by(() => {
		const loaded = assets;
		if (!loaded) return [];
		return [
			{
				name: "idleFront",
				sheet: playerSheet,
				frames: PLAYER_CLIPS.idleFront,
				textures: loaded.player.idleFront,
				speed: PLAYER_ANIMATION_SPEED,
			},
			{
				name: "walkRight",
				sheet: playerSheet,
				frames: PLAYER_CLIPS.walkRight,
				textures: loaded.player.walkRight,
				speed: PLAYER_ANIMATION_SPEED,
			},
			...Object.keys(PLAYER_ACTION_CLIPS).map((name) => {
				const action = name as keyof typeof PLAYER_ACTION_CLIPS;
				return {
					name,
					sheet: actionSheet,
					frames: PLAYER_ACTION_CLIPS[action],
					textures: loaded.playerActions[action],
					speed: PLAYER_ACTION_ANIMATION_SPEED,
				};
			}),
			...ANIMAL_KINDS.map((kind) => ({
				name: kind,
				sheet: { ...animalSheet, path: ANIMAL_PATHS[kind] },
				frames: animalFrames,
				textures: loaded.animals[kind],
				speed: ANIMAL_ANIMATION_SPEED,
			})),
		];
	});
</script>

<svelte:head>
	<title>Кадры и анимации</title>
</svelte:head>

<main>
	<header>
		<div>
			<h1>Кадры и анимации</h1>
			<p>
				Спрайтлисты и клипы, из которых собраны персонажи. Номер на кадре —
				индекс в массиве текстур; зелёная рамка означает, что кадр входит в
				клип.
			</p>
		</div>
		<div class="header-actions">
			<a href="/">К игре</a>
			<a href="/tiles">К тайлам</a>
		</div>
	</header>

	{#if !assets}
		<p class="hint">Загрузка спрайтов…</p>
	{:else}
		<section>
			<h2>Player.png · {PLAYER_COLUMNS}×{PLAYER_SHEET_ROWS}</h2>
			<p class="hint">
				Кадр 32×32. В клипах: idleFront —
				{PLAYER_CLIPS.idleFront[0]}–{PLAYER_CLIPS.idleFront.at(-1)}, walkRight —
				{PLAYER_CLIPS.walkRight[0]}–{PLAYER_CLIPS.walkRight.at(-1)}.
			</p>
			<div class="atlas-layout">
				<SheetGrid
					{...playerSheet}
					scale={3}
					clip={playerClipFrames}
					selected={selectedPlayer}
					onselect={(index) => (selectedPlayer = index)}
				/>
				<div class="detail">
					{#if selectedPlayer !== null}
						<FrameImage {...playerSheet} index={selectedPlayer} scale={8} />
						<div>
							<h3>Кадр {selectedPlayer}</h3>
							<p class="mono">
								столбец {selectedPlayer % PLAYER_COLUMNS} · строка
								{Math.floor(selectedPlayer / PLAYER_COLUMNS)}
							</p>
						</div>
					{:else}
						<p class="hint">Выбери кадр, чтобы увидеть его крупно.</p>
					{/if}
				</div>
			</div>
		</section>

		<section>
			<h2>
				Player_Actions.png · {PLAYER_ACTION_COLUMNS}×{PLAYER_ACTION_SHEET_ROWS}
			</h2>
			<p class="hint">
				Кадр 48×48: ряд 96×48 делён на два кадра. Клипы: {actionClipsText}.
			</p>
			<div class="atlas-layout">
				<SheetGrid
					{...actionSheet}
					scale={3}
					clip={PLAYER_ACTION_CLIPS.chop}
					selected={selectedAction}
					onselect={(index) => (selectedAction = index)}
				/>
				<div class="detail">
					{#if selectedAction !== null}
						<FrameImage {...actionSheet} index={selectedAction} scale={8} />
						<div>
							<h3>Кадр {selectedAction}</h3>
							<p class="mono">
								столбец {selectedAction % PLAYER_ACTION_COLUMNS} · строка
								{Math.floor(selectedAction / PLAYER_ACTION_COLUMNS)}
							</p>
						</div>
					{:else}
						<p class="hint">Выбери кадр, чтобы увидеть его крупно.</p>
					{/if}
				</div>
			</div>
		</section>

		<section>
			<h2>Животные · {ANIMAL_COLUMNS}×{animalSheet.rows}</h2>
			<p class="hint">
				У каждого вида {ANIMAL_FRAME_COUNT} кадра подряд; в клип входят все.
			</p>
			<div class="animal-sheets">
				{#each ANIMAL_KINDS as kind (kind)}
					<figure>
						<figcaption>{kind}</figcaption>
						<SheetGrid
							{...animalSheet}
							path={ANIMAL_PATHS[kind]}
							scale={3}
							clip={animalFrames}
							selected={animalKind === kind ? selectedAnimal : null}
							onselect={(index) => {
								animalKind = kind;
								selectedAnimal = index;
							}}
						/>
					</figure>
				{/each}
			</div>
		</section>

		<section>
			<h2>Клипы</h2>
			<p class="hint">
				Проигрыватель использует те же текстуры и скорости, что и рендер игры.
				Пауза и стрелки позволяют посмотреть каждый кадр.
			</p>
			<div class="clips">
				{#each clips as clip (clip.name)}
					<article class="clip">
						<h3>{clip.name}</h3>
						<p class="mono">
							{clip.frames.join(", ")}
							· {clip.speed} кадр/тик ≈
							{Math.round(clip.speed * 60)}
							fps
						</p>
						<div class="strip">
							{#each clip.frames as frame, position (position)}
								<div class="thumb">
									<FrameImage
										path={clip.sheet.path}
										columns={clip.sheet.columns}
										rows={clip.sheet.rows}
										size={clip.sheet.size}
										stride={clip.sheet.stride}
										index={frame}
										scale={2}
									/>
									<span class="mono">#{frame}</span>
								</div>
							{/each}
						</div>
						<AnimationPreview
							textures={clip.textures}
							frames={clip.frames}
							speed={clip.speed}
						/>
					</article>
				{/each}
			</div>
		</section>
	{/if}
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
		gap: 8px;
	}
	a {
		color: #cfe8cf;
		border: 1px solid #5c745b;
		padding: 8px 12px;
		text-decoration: none;
	}
	a:hover {
		background: #263126;
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
	.atlas-layout {
		display: flex;
		gap: 24px;
		align-items: flex-start;
		flex-wrap: wrap;
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
		margin: 0;
		font-size: 13px;
	}
	.animal-sheets {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
	}
	figure {
		margin: 0;
		padding: 12px;
		border: 1px solid #354034;
		background: #1b211b;
	}
	figcaption {
		margin-bottom: 10px;
		font-size: 13px;
	}
	.clips {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: 16px;
	}
	.clip {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 14px;
		border: 1px solid #354034;
		background: #1b211b;
	}
	.clip .mono {
		margin: 0;
	}
	.strip {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}
	.thumb {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
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
