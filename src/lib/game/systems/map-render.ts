import { Container, Sprite } from "pixi.js";
import { MAP_HEIGHT_CELLS, MAP_WIDTH_CELLS } from "../config.js";
import { autotile, generateMap, TILE_SIZE } from "../tiles/index.js";
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

	const forestLayer = new Container();
	forestLayer.sortableChildren = true;
	for (const tree of ctx.forest) {
		const texture =
			tree.kind === "large"
				? ctx.assets.trees.large
				: ctx.assets.trees.small[tree.frame];
		const sprite = new Sprite(texture);
		sprite.anchor.set(0.5, 1);
		sprite.position.set(tree.x, tree.y);
		sprite.scale.set(tree.scale);
		sprite.zIndex = tree.y;
		sprite.roundPixels = true;
		forestLayer.addChild(sprite);
	}
	ctx.worldLayer.addChildAt(forestLayer, 1);

	const system: System = () => {};

	system.dispose = () => {
		layer.destroy({ children: true });
		forestLayer.destroy({ children: true });
	};

	return system;
};
