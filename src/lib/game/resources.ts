export const RESOURCES = {
	wood: { label: "Дерево", icon: "🪵" },
} as const;

export type ResourceId = keyof typeof RESOURCES;
