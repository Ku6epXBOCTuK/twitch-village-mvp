import { describe, expect, it, vi } from "vitest";
import type { bootstrapGame } from "#lib/game/index.js";
import { handleChatMessage } from "./flow.js";
import type { ChatMessage } from "./port.js";

type Game = Awaited<ReturnType<typeof bootstrapGame>>;

function message(text: string): ChatMessage {
	return {
		channel: "channel",
		userId: "u1",
		user: "alice",
		login: "alice",
		text,
		isMod: false,
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
});
