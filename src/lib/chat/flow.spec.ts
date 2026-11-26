import { describe, expect, it, vi } from "vitest";
import { FOCUS_EFFECT_ID } from "#lib/game/effects/catalog.js";
import type { bootstrapGame } from "#lib/game/index.js";
import { DONOR_LOGINS } from "./config.js";
import { handleChatMessage } from "./flow.js";
import type { ChatMessage } from "./port.js";

type Game = Awaited<ReturnType<typeof bootstrapGame>>;

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

describe("chat flow", () => {
	it("ignores unrelated messages", () => {
		const chop = vi.fn();
		const plant = vi.fn();
		const mine = vi.fn();
		const game = { joinViewer: vi.fn(), chop, plant, mine } as unknown as Game;

		handleChatMessage(game, message("привет"));

		expect(chop).not.toHaveBeenCalled();
		expect(plant).not.toHaveBeenCalled();
		expect(mine).not.toHaveBeenCalled();
	});

	it("routes planting and mining to the sender", () => {
		const plant = vi.fn();
		const mine = vi.fn();
		const game = { joinViewer: vi.fn(), plant, mine } as unknown as Game;

		handleChatMessage(game, message("!сажать"));
		handleChatMessage(game, message("!шахта"));

		expect(plant).toHaveBeenCalledWith("u1");
		expect(mine).toHaveBeenCalledWith("u1");
	});

	it("routes English names and ignores letter case", () => {
		const chop = vi.fn();
		const plant = vi.fn();
		const game = { joinViewer: vi.fn(), chop, plant } as unknown as Game;

		handleChatMessage(game, message("!CHOP"));
		handleChatMessage(game, message("!plant"));

		expect(chop).toHaveBeenCalledWith("u1");
		expect(plant).toHaveBeenCalledWith("u1");
	});

	it("routes !me to the focus effect of the sender", () => {
		const playEffect = vi.fn();
		const game = { joinViewer: vi.fn(), playEffect } as unknown as Game;

		handleChatMessage(game, message("!ME", { isMod: true }));

		expect(playEffect).toHaveBeenCalledWith(FOCUS_EFFECT_ID, "u1");
	});

	it("allows only donors and moderators to use !me", () => {
		const playEffect = vi.fn();
		const game = { joinViewer: vi.fn(), playEffect } as unknown as Game;

		DONOR_LOGINS.add("donor");
		try {
			handleChatMessage(game, message("!me"));
			expect(playEffect).not.toHaveBeenCalled();

			handleChatMessage(game, message("!я", { login: "DONOR" }));
			expect(playEffect).toHaveBeenCalledWith(FOCUS_EFFECT_ID, "u1");
		} finally {
			DONOR_LOGINS.delete("donor");
		}
	});
});
