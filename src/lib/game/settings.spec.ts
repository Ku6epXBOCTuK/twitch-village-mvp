import { describe, expect, it } from "vitest";
import { defaultSettings, parseSettings } from "./settings.js";

describe("defaultSettings", () => {
	it("has the default viewer scale", () => {
		expect(defaultSettings().viewerScale).toBe(2);
	});
});

describe("parseSettings", () => {
	it("reads the scale from the url parameter", () => {
		expect(
			parseSettings(new URLSearchParams("viewer_scale=3.5")).viewerScale,
		).toBe(3.5);
	});

	it("clamps the value", () => {
		expect(
			parseSettings(new URLSearchParams("viewer_scale=99")).viewerScale,
		).toBe(6);
		expect(
			parseSettings(new URLSearchParams("viewer_scale=0")).viewerScale,
		).toBe(0.5);
	});

	it("ignores an invalid value", () => {
		expect(
			parseSettings(new URLSearchParams("viewer_scale=abc")).viewerScale,
		).toBe(defaultSettings().viewerScale);
	});

	it("keeps the base when the parameter is absent", () => {
		const base = { viewerScale: 4 };
		expect(parseSettings(new URLSearchParams(""), base).viewerScale).toBe(4);
	});
});
