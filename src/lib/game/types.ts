import type { Sprite, Text } from "pixi.js";
import type { Effect } from "./fx/types.js";

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
}

export interface EntityComponents {
	position: Position;
	size: Size;
	viewer: Viewer;
	walker: Walker;
	view: Text;
	sprite: Sprite;
	effect: Effect;
}

export type Entity = Partial<EntityComponents>;
