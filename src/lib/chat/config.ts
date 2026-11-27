import type { CooldownPolicy } from "./cooldowns.js";

export const DONOR_LOGINS = new Set<string>([
	"wiston2035",
	"alexnkdev",
	"nickname8billions",
]);

export function isDonorLogin(login: string): boolean {
	const normalized = login.toLowerCase();
	for (const donor of DONOR_LOGINS) {
		if (donor.toLowerCase() === normalized) return true;
	}
	return false;
}

export const COOLDOWNS = {
	"me:user": {
		scope: "user",
		durationMs: 30 * 60_000,
		exemptMods: true,
	},
} as const satisfies Record<string, CooldownPolicy>;

export type CooldownId = keyof typeof COOLDOWNS;
