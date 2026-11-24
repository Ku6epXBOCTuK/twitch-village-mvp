<script lang="ts">
	import GameWidget from "#lib/components/game/GameWidget.svelte";
	import { TWITCH_CHANNEL } from "#lib/game/config.js";
</script>

<GameWidget channel={TWITCH_CHANNEL} />
