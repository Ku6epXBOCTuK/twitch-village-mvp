import path from "node:path";
import js from "@eslint/js";
import { defineConfig, includeIgnoreFile } from "eslint/config";
import prettier from "eslint-config-prettier";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import ts from "typescript-eslint";

const gitignorePath = path.resolve(import.meta.dirname, ".gitignore");

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			"no-undef": "off",
			"no-console": "error",
		},
	},
	{
		files: ["src/lib/logger.ts"],
		rules: {
			"no-console": "off",
		},
	},
	{
		files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: [".svelte"],
				parser: ts.parser,
			},
		},
	},
	{
		rules: {},
	},
	{
		files: ["**/*.spec.ts", "**/*.test.ts"],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						{
							group: ["**/core.js", "**/core"],
							message:
								"Booting the whole game core belongs in tests/integration; test the system directly instead.",
						},
					],
					paths: [
						{
							name: "#lib/game",
							message:
								"Booting the whole game core belongs in tests/integration; test the system directly instead.",
						},
					],
				},
			],
		},
	},
	{
		files: ["tests/**/*.spec.ts", "tests/**/*.test.ts"],
		rules: {
			"no-restricted-imports": "off",
		},
	},
);
