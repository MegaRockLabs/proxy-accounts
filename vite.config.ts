import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { defineConfig } from 'vite';


export default defineConfig({
	plugins: [
		nodePolyfills({ 
			protocolImports: true,
		}),
		sveltekit(), 
		purgeCss(), 
	]
});
