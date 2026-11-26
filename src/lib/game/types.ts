import type { Sprite, Text } from "pixi.js";
import type { AnimalKind } from "./animals.js";
import type { Effect } from "./fx/types.js";
import type { Inventory } from "./inventory.js";
import type { PlayerAction } from "./player.js";
import type { ResourceId } from "./resources.js";

export type { AnimalKind } from "./animals.js";
export type { Effect } from "./fx/types.js";

export interface Position {
	x: number;
	y: number;
}

export interface Size {
	width: number;
	height: number;
}

export interface Viewer {
	userId: string;
	user: string;
	login: string;
	lastSeen: number;
	bot?: boolean;
}

export type ViewerIdentity = Pick<Viewer, "userId" | "user" | "login" | "bot">;

export interface Walker {
	direction: 1 | -1;
	heading: number;
	speed: number;
	timer: number;
	target?: Position;
}

export type WorkKind = "mine" | "plant" | "chop";
export type WorkTargetKind = "bed" | "quarry" | "tree" | "water" | "campfire";
export type WorkPointKind = "bed" | "quarry";
export type WorkResource = "water" | "log";

export interface WorkPhase {
	action: PlayerAction | "idle";
	target: WorkTargetKind;
	duration: number;
	needs?: { resource: WorkResource; charges?: number };
	carry?: WorkResource;
	consume?: WorkResource;
	reward?: { resource: ResourceId; count: number };
}

export interface JobRecipe {
	phases: WorkPhase[];
	supply: Partial<Record<WorkResource, WorkPhase[]>>;
	nextTarget: "nextBed" | "nextQuarry" | "nextTree";
}

export interface WorkTarget {
	kind: WorkTargetKind;
	position: Position;
	pointIndex?: number;
}

export interface WorkSubroutine {
	phases: WorkPhase[];
	index: number;
	resume: number;
}

export interface Worker {
	kind: WorkKind;
	action: PlayerAction | "idle";
	phaseIndex: number;
	state: "walking" | "working";
	target?: Position;
	targetRef?: WorkTarget;
	pointIndex: number;
	lastTree?: Position;
	carrying: Partial<Record<WorkResource, number>>;
	subroutine?: WorkSubroutine;
	timer: number;
	speed: number;
}

export interface EntityComponents {
	position: Position;
	size: Size;
	viewer: Viewer;
	inventory: Inventory;
	animal: AnimalKind;
	walker: Walker;
	worker: Worker;
	view: Text;
	sprite: Sprite;
	effect: Effect;
}

export type Entity = Partial<EntityComponents>;
