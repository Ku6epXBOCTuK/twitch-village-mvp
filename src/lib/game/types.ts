import type { Sprite, Text } from "pixi.js";
import type { AnimalKind } from "./animals.js";
import type { Effect } from "./fx/types.js";
import type { Inventory } from "./inventory.js";
import type { PlayerAction } from "./player.js";

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

export type WorkAction = Exclude<PlayerAction, "chop">;

export interface Worker {
	action: PlayerAction;
	next: WorkAction[];
	state: "walking" | "working";
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
