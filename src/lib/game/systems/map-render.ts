import { Container, Sprite } from "pixi.js";
import {
	MAP_HEIGHT_CELLS,
	MAP_WIDTH_CELLS,
	MAP_HEIGHT_PX,
	MAP_WIDTH_PX,
} from "../config.js";
import { TILE_SIZE, autotile, generateMap } from "../tiles/index.js";
import { mapScale } from "../viewport.js";
import type { RenderSystemFactory, System } from "./types.js";

export const createMapRenderSystem: RenderSystemFactory = (ctx) => {
	const grid = generateMap(MAP_WIDTH_CELLS, MAP_HEIGHT_CELLS);
	const tiles = autotile(grid);

	const layer = new Container();
	for (let y = 0; y < grid.height; y++) {
		for (let x = 0; x < grid.width; x++) {
			const tile = tiles[y * grid.width + x];
			const sprite = new Sprite(ctx.assets.tiles[tile.tile]);
			sprite.position.set(x * TILE_SIZE, y * TILE_SIZE);
			sprite.roundPixels = true;
			layer.addChild(sprite);
		}
	}
	ctx.worldLayer.addChildAt(layer, 0);

	const system: System = () => {
		const scale = mapScale(ctx.screen);
		ctx.worldLayer.scale.set(scale);
		ctx.worldLayer.x = Math.round(
			ctx.screen.width / 2 - (MAP_WIDTH_PX / 2) * scale,
		);
		ctx.worldLayer.y = Math.round(
			ctx.screen.height / 2 - (MAP_HEIGHT_PX / 2) * scale,
		);
	};

	system.dispose = () => {
		layer.destroy({ children: true });
	};

	return system;
};
