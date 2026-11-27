import { describe, expect, it } from "vitest";
import { type CooldownPolicy, createCommandGate } from "./cooldowns.js";

const USER_POLICY: CooldownPolicy = { scope: "user", durationMs: 1000 };
const GLOBAL_POLICY: CooldownPolicy = { scope: "global", durationMs: 1000 };

describe("command gate", () => {
	it("blocks the same user but not another for a user-scoped bucket", () => {
		let now = 0;
		const gate = createCommandGate(() => now);

		expect(gate.check("me:user", USER_POLICY, "u1", false).ok).toBe(true);
		gate.commit("me:user", USER_POLICY, "u1", false);

		now = 999;
		expect(gate.check("me:user", USER_POLICY, "u1", false)).toEqual({
			ok: false,
			remainingMs: 1,
		});
		expect(gate.check("me:user", USER_POLICY, "u2", false).ok).toBe(true);
	});

	it("shares one bucket between commands that use the same id", () => {
		const now = 0;
		const gate = createCommandGate(() => now);

		gate.commit("actions", USER_POLICY, "u1", false);
		expect(gate.check("actions", USER_POLICY, "u1", false).ok).toBe(false);
		expect(gate.check("other", USER_POLICY, "u1", false).ok).toBe(true);

		gate.commit("other", USER_POLICY, "u1", false);
		expect(gate.check("other", USER_POLICY, "u1", false).ok).toBe(false);
	});

	it("blocks every viewer for a global-scoped bucket", () => {
		let now = 0;
		const gate = createCommandGate(() => now);

		gate.commit("actions", GLOBAL_POLICY, "u1", false);
		expect(gate.check("actions", GLOBAL_POLICY, "u2", false).ok).toBe(false);

		now = 1000;
		expect(gate.check("actions", GLOBAL_POLICY, "u2", false).ok).toBe(true);
	});

	it("lets moderators bypass and avoids charging them", () => {
		const now = 0;
		const gate = createCommandGate(() => now);
		const policy: CooldownPolicy = { ...USER_POLICY, exemptMods: true };

		expect(gate.check("me:user", policy, "u1", true).ok).toBe(true);
		gate.commit("me:user", policy, "u1", true);
		expect(gate.check("me:user", USER_POLICY, "u1", false).ok).toBe(true);
	});

	it("clears all buckets on reset", () => {
		const gate = createCommandGate(() => 0);

		gate.commit("me:user", USER_POLICY, "u1", false);
		gate.reset();
		expect(gate.check("me:user", USER_POLICY, "u1", false).ok).toBe(true);
	});
});
