import { join } from 'path'
import type { Config } from 'tailwindcss'
import { skeleton } from '@skeletonlabs/tw-plugin';
import { proxy } from './src/proxy'
import { base } from './consts.mjs'

export default {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}', join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')],
	theme: {
		fontSize: {
			xs: ['0.625rem', '0.781rem'],
			sm: ['0.8rem', '1rem'],
			base: ['1rem', '1.25rem'],
			md: ['1.25rem', '1.563rem'],
			lg: ['1.563rem', '1.563rem'],
			xl: ['1.953rem', '2.441rem'],
			'2xl': ['2.441rem', '3.052rem'],
			'3xl': ['3.052rem', '3.815rem'],
			'4xl': ['3.815rem', '3.815rem'],
		  },
		extend: {
			backgroundImage: {
				magic: `url('${base}/bg.jpg')`,
			}
		},
	},
	plugins: [
		skeleton({
			themes: {
				custom: [
					proxy,
				],
			},
		}),
	],
} satisfies Config;
