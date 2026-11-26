import { FOCUS_EFFECT_ID } from "#lib/game/effects/catalog.js";
import type { bootstrapGame } from "#lib/game/index.js";
import { isDonorLogin } from "./config.js";
import type { ChatMessage, ChatPort } from "./port.js";
import { TwurpleChatAdapter } from "./twurple-adapter.js";

type Game = Awaited<ReturnType<typeof bootstrapGame>>;

const BOT_LIMIT = 20;

interface Command {
	name: string;
	aliases?: string[];
	modOnly?: boolean;
	donorOnly?: boolean;
	run: (game: Game, message: ChatMessage, argument: string) => void;
}

const COMMANDS: Command[] = [
	{
		name: "!bots",
		aliases: ["!боты"],
		modOnly: true,
		run: (game, _message, argument) => {
			const parsed = Number.parseInt(argument, 10);
			const count = Math.min(
				BOT_LIMIT,
				Number.isNaN(parsed) ? 5 : Math.max(1, parsed),
			);
			for (let i = 0; i < count; i++) {
				const id = Math.random().toString(36).slice(2, 8);
				game.joinViewer({
					userId: `bot-${id}`,
					user: `бот-${id}`,
					login: `bot-${id}`,
					bot: true,
				});
			}
		},
	},
	{
		name: "!unbots",
		aliases: ["!боты-"],
		modOnly: true,
		run: (game) => game.removeBots(),
	},
	{
		name: "!chop",
		aliases: ["!рубить"],
		run: (game, message) => game.chop(message.userId),
	},
	{
		name: "!plant",
		aliases: ["!сажать"],
		run: (game, message) => game.plant(message.userId),
	},
	{
		name: "!mine",
		aliases: ["!шахта"],
		run: (game, message) => game.mine(message.userId),
	},
	{
		name: "!me",
		aliases: ["!я"],
		donorOnly: true,
		run: (game, message) => game.playEffect(FOCUS_EFFECT_ID, message.userId),
	},
];

function matchCommand(
	text: string,
): { command: Command; argument: string } | null {
	const trimmed = text.trim();
	const lowered = trimmed.toLowerCase();
	for (const command of COMMANDS) {
		const names = [command.name, ...(command.aliases ?? [])];
		for (const name of names) {
			if (lowered === name) return { command, argument: "" };
			if (lowered.startsWith(`${name} `) || lowered.startsWith(`${name}\t`)) {
				return { command, argument: trimmed.slice(name.length).trim() };
			}
		}
	}
	return null;
}

export function handleChatMessage(
	game: Game | null,
	message: ChatMessage,
): void {
	game?.joinViewer({
		userId: message.userId,
		user: message.user,
		login: message.login,
	});

	const matched = matchCommand(message.text);
	if (!matched || !game) return;
	if (matched.command.modOnly && !message.isMod) return;
	if (
		matched.command.donorOnly &&
		!message.isMod &&
		!isDonorLogin(message.login)
	) {
		return;
	}
	matched.command.run(game, message, matched.argument);
}

export function startChatFlow(
	getGame: () => Game | null,
	channel: string,
	adapter: ChatPort = new TwurpleChatAdapter(),
): () => void {
	adapter.onMessage((message) => handleChatMessage(getGame(), message));
	adapter.connect(channel);
	return () => adapter.disconnect();
}
