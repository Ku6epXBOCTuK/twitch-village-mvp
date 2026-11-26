import {
	CAMPFIRE_POSITION,
	CHOP_STANDOFF,
	VIEWER_HEIGHT,
	WATER_SOURCE_POSITION,
	WORK_POINT_GROUPS,
} from "../config.js";
import type { GameContext } from "../context.js";
import type {
	Entity,
	Position,
	Worker,
	WorkPhase,
	WorkPointKind,
	WorkTarget,
} from "../types.js";
import { visibleBounds } from "../viewport.js";

function pointTarget(
	ctx: GameContext,
	entity: Entity,
	worker: Worker,
	kind: WorkPointKind,
): WorkTarget {
	if (worker.targetRef?.kind === kind) return worker.targetRef;

	const points = WORK_POINT_GROUPS[kind];
	const taken = new Set<number>();
	for (const other of ctx.world.with("worker")) {
		if (other === entity) continue;
		const ref = other.worker?.targetRef;
		if (ref?.kind === kind && ref.pointIndex !== undefined) {
			taken.add(ref.pointIndex);
		}
	}

	let index = worker.pointIndex % points.length;
	for (let offset = 0; offset < points.length; offset++) {
		const candidate = (index + offset) % points.length;
		if (!taken.has(candidate)) {
			index = candidate;
			break;
		}
	}

	const target: WorkTarget = {
		kind,
		position: points[index],
		pointIndex: index,
	};
	worker.pointIndex = index;
	worker.targetRef = target;
	return target;
}

function treeTarget(
	ctx: GameContext,
	entity: Entity,
	worker: Worker,
): WorkTarget | undefined {
	if (worker.targetRef?.kind === "tree") return worker.targetRef;

	const bounds = visibleBounds(ctx.screen);
	const margin = (VIEWER_HEIGHT * ctx.settings.viewerScale) / 2;
	let nearest: Position | undefined;
	let best = Infinity;
	for (const tree of ctx.forest) {
		if (
			tree.x < bounds.minX + margin ||
			tree.x > bounds.maxX - margin ||
			tree.y < bounds.minY + margin ||
			tree.y > bounds.maxY - margin
		) {
			continue;
		}
		if (
			worker.lastTree &&
			tree.x === worker.lastTree.x &&
			tree.y === worker.lastTree.y
		) {
			continue;
		}
		const distance = Math.hypot(
			tree.x - (entity.position?.x ?? 0),
			tree.y - (entity.position?.y ?? 0),
		);
		if (distance < best) {
			best = distance;
			nearest = { x: tree.x, y: tree.y };
		}
	}
	if (!nearest) return undefined;

	const side = (entity.position?.x ?? 0) < nearest.x ? -1 : 1;
	const target: WorkTarget = {
		kind: "tree",
		position: { x: nearest.x + side * CHOP_STANDOFF, y: nearest.y - margin },
	};
	worker.lastTree = nearest;
	worker.targetRef = target;
	return target;
}

export function resolveWorkTarget(
	ctx: GameContext,
	entity: Entity,
	worker: Worker,
	phase: WorkPhase,
): WorkTarget | undefined {
	switch (phase.target) {
		case "bed":
			return pointTarget(ctx, entity, worker, "bed");
		case "quarry":
			return pointTarget(ctx, entity, worker, "quarry");
		case "tree":
			return treeTarget(ctx, entity, worker);
		case "water":
			return { kind: "water", position: WATER_SOURCE_POSITION };
		case "campfire":
			return { kind: "campfire", position: CAMPFIRE_POSITION };
	}
}
