import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const asset = resolve(root, "static/Cute_Fantasy_Free/Player/Player.png");

if (!existsSync(asset)) {
	process.stderr.write(`Нет файла static/Cute_Fantasy_Free/Player/Player.png.
Скачай бесплатный пак с https://kenmi-art.itch.io/cute-fantasy-rpg и распакуй его в static/.
Подробности: README.md, раздел «Ассеты».\n`);
	process.exit(1);
}
