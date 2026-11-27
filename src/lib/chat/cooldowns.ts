export type CooldownScope = "global" | "user";

export interface CooldownPolicy {
	scope: CooldownScope;
	durationMs: number;
	exemptMods?: boolean;
}

export interface CooldownCheck {
	ok: boolean;
	remainingMs: number;
}

export interface CommandGate {
	check(
		id: string,
		policy: CooldownPolicy,
		userId: string,
		isMod: boolean,
	): CooldownCheck;
	commit(
		id: string,
		policy: CooldownPolicy,
		userId: string,
		isMod: boolean,
	): void;
	reset(): void;
}

export function createCommandGate(now: () => number): CommandGate {
	const readyAt = new Map<string, number>();

	const keyFor = (id: string, policy: CooldownPolicy, userId: string) =>
		policy.scope === "global" ? `g\u0000${id}` : `u\u0000${id}\u0000${userId}`;

	const isExempt = (policy: CooldownPolicy, isMod: boolean) =>
		policy.exemptMods === true && isMod;

	return {
		check(id, policy, userId, isMod) {
			if (isExempt(policy, isMod)) return { ok: true, remainingMs: 0 };

			const current = now();
			const key = keyFor(id, policy, userId);
			const until = readyAt.get(key);
			if (until === undefined || until <= current) {
				readyAt.delete(key);
				return { ok: true, remainingMs: 0 };
			}
			return { ok: false, remainingMs: until - current };
		},

		commit(id, policy, userId, isMod) {
			if (isExempt(policy, isMod)) return;
			readyAt.set(keyFor(id, policy, userId), now() + policy.durationMs);
		},

		reset() {
			readyAt.clear();
		},
	};
}
