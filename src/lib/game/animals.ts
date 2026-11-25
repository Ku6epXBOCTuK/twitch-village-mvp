export const ANIMAL_FRAME_SIZE = 32;
export const ANIMAL_COLUMNS = 2;
export const ANIMAL_FRAME_COUNT = 4;

export const ANIMAL_KINDS = ["chicken", "cow", "pig", "sheep"] as const;
export type AnimalKind = (typeof ANIMAL_KINDS)[number];

export const ANIMAL_PATHS = {
	chicken: "Cute_Fantasy_Free/Animals/Chicken/Chicken.png",
	cow: "Cute_Fantasy_Free/Animals/Cow/Cow.png",
	pig: "Cute_Fantasy_Free/Animals/Pig/Pig.png",
	sheep: "Cute_Fantasy_Free/Animals/Sheep/Sheep.png",
} as const satisfies Record<AnimalKind, string>;

export function randomAnimalKind(rng: () => number): AnimalKind {
	const index = Math.floor(rng() * ANIMAL_KINDS.length);
	return ANIMAL_KINDS[index] ?? "chicken";
}
