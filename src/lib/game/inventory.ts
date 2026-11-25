import type { ResourceId } from "./resources.js";

export interface Inventory {
	items: Partial<Record<ResourceId, number>>;
}

export function createInventory(): Inventory {
	return { items: {} };
}

export function addItem(
	inventory: Inventory,
	resource: ResourceId,
	count: number,
): void {
	if (!Number.isFinite(count) || count <= 0) return;
	inventory.items[resource] = countItem(inventory, resource) + count;
}

export function countItem(inventory: Inventory, resource: ResourceId): number {
	return inventory.items[resource] ?? 0;
}
