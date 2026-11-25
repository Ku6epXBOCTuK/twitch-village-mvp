import { describe, expect, it } from "vitest";
import { addItem, countItem, createInventory } from "./inventory.js";

describe("inventory", () => {
	it("starts empty", () => {
		const inventory = createInventory();
		expect(countItem(inventory, "wood")).toBe(0);
	});

	it("accumulates items", () => {
		const inventory = createInventory();
		addItem(inventory, "wood", 2);
		addItem(inventory, "wood", 3);
		expect(inventory.items).toEqual({ wood: 5 });
	});

	it("ignores non-positive and invalid counts", () => {
		const inventory = createInventory();
		addItem(inventory, "wood", 0);
		addItem(inventory, "wood", Number.NaN);
		addItem(inventory, "wood", -1);
		expect(inventory.items).toEqual({});
	});
});
