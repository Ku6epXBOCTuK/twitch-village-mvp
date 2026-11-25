export const PLAYER_FRAME_SIZE = 32;
export const PLAYER_COLUMNS = 6;

const range = (from: number, to: number) =>
	Array.from({ length: to - from + 1 }, (_, i) => from + i);

export const PLAYER_CLIPS = {
	idleFront: range(0, 5),
	walkRight: range(24, 29),
} as const;

export type PlayerClip = keyof typeof PLAYER_CLIPS;

export const PLAYER_ACTION_FRAME_SIZE = 32;
export const PLAYER_ACTION_STRIDE_HEIGHT = 48;
export const PLAYER_ACTION_COLUMNS = 3;
export const PLAYER_ACTION_PATH = "Cute_Fantasy_Free/Player/Player_Actions.png";

export const PLAYER_ACTION_CLIPS = {
	chop: [0, 9, 18],
} as const;

export type PlayerActionClip = keyof typeof PLAYER_ACTION_CLIPS;
