import type { bootstrapGame } from "#lib/game/index.js";
import type { ChatMessage, ChatPort } from "./port.js";
import { TwurpleChatAdapter } from "./twurple-adapter.js";

type Game = Awaited<ReturnType<typeof bootstrapGame>>;

const BOT_LIMIT = 20;

interface Command {
	name: string;
	modOnly?: boolean;
	aliases?: string[];
	run: (game: Game, message: ChatMessage, argument: string) => void;
}

const COMMANDS: Command[] = [
	{
		name: "!боты",
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
		name: "!боты-",
		modOnly: true,
		run: (game) => game.removeBots(),
	},
	{
		name: "!рубить",
		run: (game, message) => game.chop(message.userId),
	},
	{
		name: "!сажать",
		run: (game, message) => game.plant(message.userId),
	},
	{
		name: "!шахта",
		run: (game, message) => game.mine(message.userId),
	},
];

function matchCommand(
	text: string,
): { command: Command; argument: string } | null {
	for (const command of COMMANDS) {
		const names = [command.name, ...(command.aliases ?? [])];
		for (const name of names) {
			if (text === name) return { command, argument: "" };
			if (text.startsWith(`${name} `) || text.startsWith(`${name}\t`)) {
				return { command, argument: text.slice(name.length).trim() };
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

	const matched = matchCommand(message.text.trim());
	if (!matched || !game) return;
	if (matched.command.modOnly && !message.isMod) return;
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
