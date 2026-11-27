import { describe, expect, it, vi } from "vitest";
import { FOCUS_EFFECT_ID } from "#lib/game/effects/catalog.js";
import type { bootstrapGame } from "#lib/game/index.js";
import { DONOR_LOGINS } from "./config.js";
import { createCommandGate } from "./cooldowns.js";
import { handleChatMessage } from "./flow.js";
import type { ChatMessage } from "./port.js";

type Game = Awaited<ReturnType<typeof bootstrapGame>>;

const freshGate = () => createCommandGate(() => 0);

function message(
	text: string,
	overrides: Partial<ChatMessage> = {},
): ChatMessage {
	return {
		channel: "channel",
		userId: "u1",
		user: "alice",
		login: "alice",
		text,
		isMod: false,
		...overrides,
	};
}

function withDonor(login: string, run: () => void) {
	DONOR_LOGINS.add(login);
	try {
		run();
	} finally {
		DONOR_LOGINS.delete(login);
	}
}

describe("chat flow", () => {
	it("ignores unrelated messages", () => {
		const chop = vi.fn();
		const plant = vi.fn();
		const mine = vi.fn();
		const game = { joinViewer: vi.fn(), chop, plant, mine } as unknown as Game;

		handleChatMessage(game, message("привет"), freshGate());

		expect(chop).not.toHaveBeenCalled();
		expect(plant).not.toHaveBeenCalled();
		expect(mine).not.toHaveBeenCalled();
	});

	it("routes planting and mining to the sender", () => {
		const plant = vi.fn();
		const mine = vi.fn();
		const game = { joinViewer: vi.fn(), plant, mine } as unknown as Game;

		handleChatMessage(game, message("!сажать"), freshGate());
		handleChatMessage(game, message("!шахта"), freshGate());

		expect(plant).toHaveBeenCalledWith("u1");
		expect(mine).toHaveBeenCalledWith("u1");
	});

	it("routes English names and ignores letter case", () => {
		const chop = vi.fn();
		const plant = vi.fn();
		const game = { joinViewer: vi.fn(), chop, plant } as unknown as Game;

		handleChatMessage(game, message("!CHOP"), freshGate());
		handleChatMessage(game, message("!plant"), freshGate());

		expect(chop).toHaveBeenCalledWith("u1");
		expect(plant).toHaveBeenCalledWith("u1");
	});

	it("routes !me to the focus effect of the sender", () => {
		const playEffect = vi.fn();
		const game = { joinViewer: vi.fn(), playEffect } as unknown as Game;

		handleChatMessage(game, message("!ME", { isMod: true }), freshGate());

		expect(playEffect).toHaveBeenCalledWith(FOCUS_EFFECT_ID, "u1");
	});

	it("allows only donors and moderators to use !me", () => {
		const playEffect = vi.fn();
		const game = { joinViewer: vi.fn(), playEffect } as unknown as Game;

		withDonor("donor", () => {
			handleChatMessage(game, message("!me"), freshGate());
			expect(playEffect).not.toHaveBeenCalled();

			handleChatMessage(game, message("!я", { login: "DONOR" }), freshGate());
			expect(playEffect).toHaveBeenCalledWith(FOCUS_EFFECT_ID, "u1");
		});
	});

	it("blocks repeated !me from the same viewer for 30 minutes", () => {
		let now = 0;
		const gate = createCommandGate(() => now);
		const playEffect = vi.fn();
		const game = { joinViewer: vi.fn(), playEffect } as unknown as Game;

		withDonor("donor", () => {
			const fromDonor = () => message("!me", { login: "donor" });
			handleChatMessage(game, fromDonor(), gate);
			now = 30 * 60_000 - 1;
			handleChatMessage(game, fromDonor(), gate);
			now = 30 * 60_000;
			handleChatMessage(game, fromDonor(), gate);
		});

		expect(playEffect).toHaveBeenCalledTimes(2);
	});

	it("shares the !me cooldown with its alias and not other viewers", () => {
		const gate = freshGate();
		const playEffect = vi.fn();
		const game = { joinViewer: vi.fn(), playEffect } as unknown as Game;

		withDonor("donor", () => {
			handleChatMessage(game, message("!me", { login: "donor" }), gate);
			handleChatMessage(game, message("!я", { login: "donor" }), gate);
			handleChatMessage(
				game,
				message("!me", { login: "donor", userId: "u2" }),
				gate,
			);
		});

		expect(playEffect).toHaveBeenCalledTimes(2);
	});

	it("lets moderators bypass the !me cooldown", () => {
		const gate = freshGate();
		const playEffect = vi.fn();
		const game = { joinViewer: vi.fn(), playEffect } as unknown as Game;

		handleChatMessage(game, message("!me", { isMod: true }), gate);
		handleChatMessage(game, message("!я", { isMod: true }), gate);

		expect(playEffect).toHaveBeenCalledTimes(2);
	});

	it("does not charge a cooldown for a rejected !me", () => {
		const gate = freshGate();
		const playEffect = vi.fn();
		const game = { joinViewer: vi.fn(), playEffect } as unknown as Game;

		withDonor("donor", () => {
			handleChatMessage(game, message("!me"), gate);
			handleChatMessage(game, message("!me", { login: "donor" }), gate);
		});

		expect(playEffect).toHaveBeenCalledTimes(1);
	});
});
