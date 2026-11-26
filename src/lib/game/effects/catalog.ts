import {
	EFFECT_PAN_DURATION,
	EFFECT_ZOOM_DURATION,
	FOCUS_SHADE_ALPHA,
	FOCUS_ZOOM,
	STAR_IRIS_DURATION,
} from "../config.js";
import {
	panHome,
	panToTarget,
	playPixelfx,
	shadeBackground,
	zoomTo,
} from "./actions.js";
import type { EffectDefinition } from "./types.js";

export const FOCUS_EFFECT_ID = "focus-viewer";

export const effectDefinitions: Record<string, EffectDefinition> = {
	[FOCUS_EFFECT_ID]: {
		phases: [
			{
				duration: EFFECT_PAN_DURATION,
				actions: [panToTarget(EFFECT_PAN_DURATION)],
			},
			{
				duration: EFFECT_ZOOM_DURATION,
				actions: [
					zoomTo(FOCUS_ZOOM, EFFECT_ZOOM_DURATION),
					shadeBackground(FOCUS_SHADE_ALPHA, EFFECT_ZOOM_DURATION),
				],
			},
			{
				duration: STAR_IRIS_DURATION,
				actions: [
					playPixelfx({
						id: "transitions/star-iris",
						fit: "screen",
						focusOnTarget: true,
					}),
				],
			},
			{
				duration: EFFECT_ZOOM_DURATION,
				actions: [
					zoomTo("home", EFFECT_ZOOM_DURATION),
					shadeBackground(0, EFFECT_ZOOM_DURATION),
				],
			},
			{
				duration: EFFECT_PAN_DURATION,
				actions: [panHome(EFFECT_PAN_DURATION)],
			},
		],
	},
};
