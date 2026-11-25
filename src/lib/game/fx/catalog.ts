import * as campfire from "pixelfx/fx/fire/campfire";
import type { FxModule } from "./types.js";

export const effects: Record<string, FxModule> = {
	"fire/campfire": campfire,
};
