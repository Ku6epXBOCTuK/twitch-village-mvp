<script lang="ts">
	import { AnimatedSprite, Application, type Texture } from "pixi.js";
	import { onMount } from "svelte";

	interface Props {
		textures: Texture[];
		frames: readonly number[];
		speed: number;
	}

	let { textures, frames, speed }: Props = $props();

	let canvas: HTMLCanvasElement;
	let sprite = $state<AnimatedSprite | undefined>();
	let playing = $state(true);
	let loop = $state(true);
	let multiplier = $state(1);
	let current = $state(0);

	onMount(() => {
		let destroyed = false;
		const app = new Application();
		const previewSize = (textures[0]?.frame.width ?? 32) * 4;

		(async () => {
			await app.init({
				canvas,
				width: previewSize,
				height: previewSize,
				backgroundAlpha: 0,
				antialias: false,
			});
			if (destroyed) {
				app.destroy(true);
				return;
			}

			const animated = new AnimatedSprite(textures);
			animated.anchor.set(0.5);
			animated.scale.set(4);
			animated.position.set(previewSize / 2, previewSize / 2);
			animated.animationSpeed = speed * multiplier;
			animated.loop = loop;
			animated.onFrameChange = (frame) => (current = frame);
			animated.play();
			app.stage.addChild(animated);
			sprite = animated;
		})();

		return () => {
			destroyed = true;
			app.destroy(true);
		};
	});

	$effect(() => {
		if (!sprite) return;
		sprite.animationSpeed = speed * multiplier;
		sprite.loop = loop;
	});

	function toggle() {
		if (!sprite) return;
		playing = !playing;
		if (playing) sprite.play();
		else sprite.stop();
	}

	function step(delta: number) {
		if (!sprite) return;
		playing = false;
		sprite.stop();
		sprite.gotoAndStop(
			(sprite.currentFrame + delta + textures.length) % textures.length,
		);
		current = sprite.currentFrame;
	}
</script>

<div class="preview">
	<canvas bind:this={canvas}></canvas>
	<div class="controls">
		<button type="button" onclick={toggle}>{playing ? "Пауза" : "Play"}</button>
		<button type="button" aria-label="Предыдущий кадр" onclick={() => step(-1)}>
			‹
		</button>
		<button type="button" aria-label="Следующий кадр" onclick={() => step(1)}>
			›
		</button>
		<button type="button" class:active={loop} onclick={() => (loop = !loop)}>
			loop
		</button>
		<label>
			скорость
			<select bind:value={multiplier}>
				<option value={0.5}>0.5×</option>
				<option value={1}>1×</option>
				<option value={2}>2×</option>
			</select>
		</label>
	</div>
	<p class="mono">
		кадр {current} в клипе · лист №{frames[current]}
		· {speed * multiplier}
		кадр/тик ≈ {Math.round(speed * multiplier * 60)} fps
	</p>
</div>

<style>
	.preview {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	canvas {
		display: block;
		image-rendering: pixelated;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}
	button,
	select {
		padding: 4px 8px;
		background: #1b211b;
		border: 1px solid #5c745b;
		color: #cfe8cf;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}
	button.active {
		border-color: #9ecb9e;
		background: #263126;
	}
	label {
		display: flex;
		align-items: center;
		gap: 4px;
		color: #aebbab;
		font-size: 12px;
	}
	p {
		margin: 0;
	}
</style>
