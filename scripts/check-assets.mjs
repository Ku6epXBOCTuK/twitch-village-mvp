import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const required = [
	"static/Cute_Fantasy_Free/Player/Player.png",
	"static/Cute_Fantasy_Free/Tiles/Path_Tile.png",
	"static/Cute_Fantasy_Free/Tiles/Path_Middle.png",
	"static/Cute_Fantasy_Free/Tiles/Grass_Middle.png",
	"static/Cute_Fantasy_Free/Animals/Chicken/Chicken.png",
	"static/Cute_Fantasy_Free/Animals/Cow/Cow.png",
	"static/Cute_Fantasy_Free/Animals/Pig/Pig.png",
	"static/Cute_Fantasy_Free/Animals/Sheep/Sheep.png",
];
const missing = required.filter((path) => !existsSync(resolve(root, path)));

if (missing.length > 0) {
	process.stderr.write(`Нет файлов:\n${missing.map((path) => `  ${path}`).join("\n")}\n
Скачай бесплатный пак с https://kenmi-art.itch.io/cute-fantasy-rpg и распакуй его в static/.
Подробности: README.md, раздел «Ассеты».\n`);
	process.exit(1);
}
