export interface FxMeta {
	size?: number[];
	origin?: number[];
	loop?: boolean;
}

export interface FxModule {
	meta: FxMeta;
}

export interface Effect {
	id: string;
	seed?: number;
	palette?: string[];
	light?: number;
}
