// You can also use the generator at https://skeleton.dev/docs/generator to create these values for you
import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';
export const proxy: CustomThemeConfig = {
	name: 'proxy',
	properties: {
		 // =~= Theme Properties =~=
		"--theme-font-family-base": "Inter",
		"--theme-font-family-heading": "Inter",
		"--theme-font-color-base": "0 0 0",
		"--theme-font-color-dark": "255 255 255",
		"--theme-rounded-base": "6px",
		"--theme-rounded-container": "8px",
		"--theme-border-base": "1px",
		 // =~= Theme On-X Colors =~=
		 "--on-primary": "255 255 255",
		 "--on-secondary": "255 255 255",
		 "--on-tertiary": "0 0 0",
		 "--on-success": "255 255 255",
		 "--on-warning": "255 255 255",
		 "--on-error": "255 255 255",
		 "--on-surface": "255 255 255",
		 // =~= Theme Colors  =~=
		 // primary | #9d4dff 
		 "--color-primary-50": "247 217 239", // #f7d9ef
		 "--color-primary-100": "245 204 233", // #f5cce9
		 "--color-primary-200": "242 192 228", // #f2c0e4
		 "--color-primary-300": "234 154 211", // #ea9ad3
		 "--color-primary-400": "219 78 178", // #db4eb2
		 "--color-primary-500": "203 2 145", // #cb0291
		 "--color-primary-600": "183 2 131", // #b70283
		 "--color-primary-700": "152 2 109", // #98026d
		 "--color-primary-800": "122 1 87", // #7a0157
		 "--color-primary-900": "99 1 71", // #630147
		 // secondary | #17a4a6 
		 "--color-secondary-50": "220 241 242", // #dcf1f2
		 "--color-secondary-100": "209 237 237", // #d1eded
		 "--color-secondary-200": "197 232 233", // #c5e8e9
		 "--color-secondary-300": "162 219 219", // #a2dbdb
		 "--color-secondary-400": "93 191 193", // #5dbfc1
		 "--color-secondary-500": "23 164 166", // #17a4a6
		 "--color-secondary-600": "21 148 149", // #159495
		 "--color-secondary-700": "17 123 125", // #117b7d
		 "--color-secondary-800": "14 98 100", // #0e6264
		 "--color-secondary-900": "11 80 81", // #0b5051
		 // tertiary | #8c92ff 
		"--color-tertiary-50": "217 233 248", // #d9e9f8
		"--color-tertiary-100": "205 226 246", // #cde2f6
		"--color-tertiary-200": "192 219 244", // #c0dbf4
		"--color-tertiary-300": "155 197 237", // #9bc5ed
		"--color-tertiary-400": "79 154 224", // #4f9ae0
		"--color-tertiary-500": "4 110 210", // #046ed2
		"--color-tertiary-600": "4 99 189", // #0463bd
		"--color-tertiary-700": "3 83 158", // #03539e
		"--color-tertiary-800": "2 66 126", // #02427e
		"--color-tertiary-900": "2 54 103", // #023667
		 // success | #17a4a6 
		 "--color-success-50": "220 241 242", // #dcf1f2
		 "--color-success-100": "209 237 237", // #d1eded
		 "--color-success-200": "197 232 233", // #c5e8e9
		 "--color-success-300": "162 219 219", // #a2dbdb
		 "--color-success-400": "93 191 193", // #5dbfc1
		 "--color-success-500": "23 164 166", // #17a4a6
		 "--color-success-600": "21 148 149", // #159495
		 "--color-success-700": "17 123 125", // #117b7d
		 "--color-success-800": "14 98 100", // #0e6264
		 "--color-success-900": "11 80 81", // #0b5051
		 // warning | #9d4dff 
		 "--color-warning-50": "240 228 255", // #f0e4ff
		 "--color-warning-100": "235 219 255", // #ebdbff
		 "--color-warning-200": "231 211 255", // #e7d3ff
		 "--color-warning-300": "216 184 255", // #d8b8ff
		 "--color-warning-400": "186 130 255", // #ba82ff
		 "--color-warning-500": "157 77 255", // #9d4dff
		 "--color-warning-600": "141 69 230", // #8d45e6
		 "--color-warning-700": "118 58 191", // #763abf
		 "--color-warning-800": "94 46 153", // #5e2e99
		 "--color-warning-900": "77 38 125", // #4d267d
		 // error | #301a6d 
		 "--color-error-50": "224 221 233", // #e0dde9
		 "--color-error-100": "214 209 226", // #d6d1e2
		 "--color-error-200": "203 198 219", // #cbc6db
		 "--color-error-300": "172 163 197", // #aca3c5
		 "--color-error-400": "110 95 153", // #6e5f99
		 "--color-error-500": "48 26 109", // #301a6d
		 "--color-error-600": "43 23 98", // #2b1762
		 "--color-error-700": "36 20 82", // #241452
		 "--color-error-800": "29 16 65", // #1d1041
		 "--color-error-900": "24 13 53", // #180d35
		 // surface | #669fe1 
		 "--color-surface-50": "232 241 251", // #e8f1fb
		 "--color-surface-100": "224 236 249", // #e0ecf9
		 "--color-surface-200": "217 231 248", // #d9e7f8
		 "--color-surface-300": "194 217 243", // #c2d9f3
		 "--color-surface-400": "148 188 234", // #94bcea
		"--color-surface-500": "102 159 225", // #669fe1
		"--color-surface-600": "92 143 203", // #5c8fcb
		"--color-surface-700": "77 119 169", // #4d77a9
		"--color-surface-800": "61 95 135", // #3d5f87
		"--color-surface-900": "50 78 110", // #324e6e
	}
}