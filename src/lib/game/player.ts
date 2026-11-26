export const PLAYER_PATH = "Cute_Fantasy_Free/Player/Player.png";
export const PLAYER_FRAME_SIZE = 32;
export const PLAYER_COLUMNS = 6;
export const PLAYER_SHEET_ROWS = 10;

const range = (from: number, to: number) =>
	Array.from({ length: to - from + 1 }, (_, i) => from + i);

export const PLAYER_CLIPS = {
	idleFront: range(0, 5),
	walkRight: range(24, 29),
} as const;

export type PlayerClip = keyof typeof PLAYER_CLIPS;

export const PLAYER_ANIMATION_SPEED = 0.18;

export const PLAYER_ACTION_FRAME_SIZE = 48;
export const PLAYER_ACTION_STRIDE_HEIGHT = 48;
export const PLAYER_ACTION_COLUMNS = 2;
export const PLAYER_ACTION_SHEET_ROWS = 12;
export const PLAYER_ACTION_PATH = "Cute_Fantasy_Free/Player/Player_Actions.png";

export const PLAYER_ACTION_CLIPS = {
	chop: [6, 6, 6, 7],
	mine: [0, 0, 0, 1],
	farm: [12, 12, 12, 13],
	water: [22, 22, 22, 23],
} as const;

export type PlayerAction = keyof typeof PLAYER_ACTION_CLIPS;

export const PLAYER_ACTION_ANIMATION_SPEED = 0.1;
