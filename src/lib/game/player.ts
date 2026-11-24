export const PLAYER_FRAME_SIZE = 32;
export const PLAYER_COLUMNS = 6;

const range = (from: number, to: number) =>
	Array.from({ length: to - from + 1 }, (_, i) => from + i);

export const PLAYER_CLIPS = {
	idleFront: range(0, 5),
	walkRight: range(24, 29),
} as const;

export type PlayerClip = keyof typeof PLAYER_CLIPS;
