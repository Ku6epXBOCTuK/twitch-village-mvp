import {
	WORK_CAMPFIRE_DURATION,
	WORK_DURATION,
	WORK_FETCH_WATER_DURATION,
} from "../config.js";
import type { JobRecipe, WorkKind, WorkResource } from "../types.js";

export const JOB_RECIPES: Record<WorkKind, JobRecipe> = {
	mine: {
		phases: [
			{ action: "mine", target: "quarry", duration: WORK_DURATION.mine },
		],
		supply: {},
		nextTarget: "nextQuarry",
	},
	plant: {
		phases: [
			{ action: "farm", target: "bed", duration: WORK_DURATION.farm },
			{
				action: "water",
				target: "bed",
				duration: WORK_DURATION.water,
				needs: { resource: "water" },
				consume: "water",
			},
		],
		supply: {
			water: [
				{
					action: "idle",
					target: "water",
					duration: WORK_FETCH_WATER_DURATION,
					carry: "water",
				},
			],
		},
		nextTarget: "nextBed",
	},
	chop: {
		phases: [
			{
				action: "chop",
				target: "tree",
				duration: WORK_DURATION.chop,
				carry: "log",
				reward: { resource: "wood", count: 1 },
			},
			{
				action: "idle",
				target: "campfire",
				duration: WORK_CAMPFIRE_DURATION,
				consume: "log",
			},
		],
		supply: {},
		nextTarget: "nextTree",
	},
};

export function supplyFor(recipe: JobRecipe, resource: WorkResource) {
	const supply = recipe.supply[resource];
	if (!supply) throw new Error(`no supply phases for resource "${resource}"`);
	return supply;
}
