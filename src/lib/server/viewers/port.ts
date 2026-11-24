export interface ViewerProfile {
	userId: string;
	data: unknown;
	updatedAt: number;
}

export interface ViewersRepo {
	load<T>(channel: string): T[];
	get<T>(channel: string, userId: string): T | null;
	upsert(channel: string, profiles: ViewerProfile[]): void;
}
