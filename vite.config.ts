import adapterNode from "@sveltejs/adapter-node";
import { sveltekit } from "@sveltejs/kit/vite";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapterNode({ out: "build-node" }),
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
				experimental: { async: true },
			},
			experimental: { remoteFunctions: true },
		}),
		Icons({ compiler: "svelte" }),
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: "./vite.config.ts",
				test: {
					name: "server",
					environment: "node",
					setupFiles: ["./tests/setup/canvas.ts"],
					include: [
						"src/**/*.{test,spec}.{js,ts}",
						"tests/**/*.{test,spec}.{js,ts}",
					],
					exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"],
				},
			},
		],
	},
});
