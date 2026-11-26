import * as campfire from "pixelfx/fx/fire/campfire";
import * as starIris from "pixelfx/fx/transitions/star-iris";
import type { FxModule } from "./types.js";

export const effects: Record<string, FxModule> = {
	"fire/campfire": campfire,
	"transitions/star-iris": starIris,
};
