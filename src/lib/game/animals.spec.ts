import { expect, test } from "vitest";
import { ANIMAL_KINDS, randomAnimalKind } from "./animals.js";
import { spawnAnimal } from "./spawn.js";
import { createWalkSystem } from "./systems/walk.js";
import { makeGameContext } from "./testing.js";

test("a random animal kind is one of the known kinds", () => {
	expect(ANIMAL_KINDS).toContain(randomAnimalKind(() => 0.5));
});

test("spawnAnimal adds an animal with a walker", () => {
	const ctx = makeGameContext();
	const animal = spawnAnimal(ctx, "pig");

	expect(animal.animal).toBe("pig");
	expect(animal.position?.x).toBeGreaterThan(0);
	expect(animal.walker).toBeDefined();
});

test("the walk system moves an animal each step", () => {
	const ctx = makeGameContext();
	const animal = spawnAnimal(ctx, "pig");
	const startX = animal.position?.x ?? 0;
	animal.walker = { direction: 1, heading: 0, speed: 60, timer: 10 };

	createWalkSystem(ctx)(0.5);

	expect(animal.position?.x).toBeCloseTo(startX + 30);
});
