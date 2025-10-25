import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({ 
    plugins: [sveltekit(), tailwindcss()], 
    resolve: { alias: { 'use-sync-external-store/shim/index.js': 'react' }} 
});
