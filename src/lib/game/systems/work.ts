import { WORK_ARRIVE_DISTANCE, WORK_POINT_GROUPS } from "../config.js";
import type { GameContext } from "../context.js";
import { addItem } from "../inventory.js";
import type {
	Entity,
	JobRecipe,
	Worker,
	WorkPhase,
	WorkPointKind,
} from "../types.js";
import { JOB_RECIPES, supplyFor } from "../work/recipes.js";
import { resolveWorkTarget } from "../work/targets.js";
import type { SystemFactory } from "./types.js";

const phasesOf = (worker: Worker, recipe: JobRecipe): WorkPhase[] =>
	worker.subroutine?.phases ?? recipe.phases;

const indexOf = (worker: Worker): number =>
	worker.subroutine?.index ?? worker.phaseIndex;

const currentPhase = (
	worker: Worker,
	recipe: JobRecipe,
): WorkPhase | undefined => phasesOf(worker, recipe)[indexOf(worker)];

const nextPointKind: Partial<Record<JobRecipe["nextTarget"], WorkPointKind>> = {
	nextBed: "bed",
	nextQuarry: "quarry",
};

function applyEffects(entity: Entity, worker: Worker, phase: WorkPhase) {
	if (phase.reward && entity.inventory) {
		addItem(entity.inventory, phase.reward.resource, phase.reward.count);
	}
	if (phase.carry) {
		worker.carrying[phase.carry] = (worker.carrying[phase.carry] ?? 0) + 1;
	}
	if (phase.consume) {
		const remaining = (worker.carrying[phase.consume] ?? 0) - 1;
		if (remaining > 0) {
			worker.carrying[phase.consume] = remaining;
		} else {
			delete worker.carrying[phase.consume];
		}
	}
}

function advance(worker: Worker, recipe: JobRecipe) {
	const sub = worker.subroutine;
	if (sub) {
		if (sub.index + 1 < sub.phases.length) {
			sub.index++;
			return;
		}
		worker.subroutine = undefined;
		worker.phaseIndex = sub.resume;
		return;
	}
	if (worker.phaseIndex + 1 < recipe.phases.length) {
		worker.phaseIndex++;
		return;
	}
	worker.phaseIndex = 0;
	worker.targetRef = undefined;
	const pointKind = nextPointKind[recipe.nextTarget];
	if (pointKind) {
		worker.pointIndex =
			(worker.pointIndex + 1) % WORK_POINT_GROUPS[pointKind].length;
	}
}

function beginPhase(
	ctx: GameContext,
	entity: Entity,
	worker: Worker,
	recipe: JobRecipe,
) {
	const phase = currentPhase(worker, recipe);
	if (!phase || !entity.position || !entity.walker) return;

	if (
		phase.needs &&
		(worker.carrying[phase.needs.resource] ?? 0) < (phase.needs.charges ?? 1)
	) {
		worker.subroutine = {
			phases: supplyFor(recipe, phase.needs.resource),
			index: 0,
			resume: worker.phaseIndex,
		};
	}

	const active = currentPhase(worker, recipe);
	if (!active) return;
	worker.action = active.action;
	const target = resolveWorkTarget(ctx, entity, worker, active);
	worker.target = target?.position;
	worker.state = "walking";
	worker.timer = 0;
	entity.walker.target = worker.target;
	if (worker.target) {
		entity.walker.direction = worker.target.x < entity.position.x ? -1 : 1;
	}
}

export const createWorkSystem: SystemFactory = (ctx) => {
	const workers = ctx.world.with("worker", "position", "walker");

	return (dt) => {
		for (const entity of workers) {
			const worker = entity.worker;
			if (!worker || !entity.position || !entity.walker) continue;
			const recipe = JOB_RECIPES[worker.kind];
			const phase = currentPhase(worker, recipe);
			if (!phase) continue;

			if (worker.state === "walking") {
				if (!worker.target) {
					beginPhase(ctx, entity, worker, recipe);
					continue;
				}
				const distance = Math.hypot(
					worker.target.x - entity.position.x,
					worker.target.y - entity.position.y,
				);
				if (distance > WORK_ARRIVE_DISTANCE) continue;
				worker.state = "working";
				worker.timer = phase.duration;
				entity.walker.target = undefined;
				continue;
			}

			worker.timer -= dt;
			if (worker.timer > 0) continue;

			applyEffects(entity, worker, phase);
			advance(worker, recipe);
			beginPhase(ctx, entity, worker, recipe);
		}
	};
};
