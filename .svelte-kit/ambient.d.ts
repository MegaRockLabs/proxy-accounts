
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```bash
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const CARGO_REGISTRY_TOKEN: string;
	export const COMMAND_MODE: string;
	export const GOPATH: string;
	export const GOROOT: string;
	export const HOME: string;
	export const HOMEBREW_CELLAR: string;
	export const HOMEBREW_PREFIX: string;
	export const HOMEBREW_REPOSITORY: string;
	export const INFOPATH: string;
	export const JAVA_HOME: string;
	export const LESS: string;
	export const LOGNAME: string;
	export const LSCOLORS: string;
	export const LS_COLORS: string;
	export const LaunchInstanceID: string;
	export const MISE_SHELL: string;
	export const MallocNanoZone: string;
	export const NVM_CD_FLAGS: string;
	export const NVM_DIR: string;
	export const OLDPWD: string;
	export const ORIGINAL_XDG_CURRENT_DESKTOP: string;
	export const PAGER: string;
	export const PATH: string;
	export const PATH_TO_FX: string;
	export const PNPM_HOME: string;
	export const PWD: string;
	export const PYENV_ROOT: string;
	export const PYENV_SHELL: string;
	export const SECURITYSESSIONID: string;
	export const SHELL: string;
	export const SHLVL: string;
	export const SSH_AUTH_SOCK: string;
	export const TMPDIR: string;
	export const USER: string;
	export const VSCODE_CODE_CACHE_PATH: string;
	export const VSCODE_CRASH_REPORTER_PROCESS_TYPE: string;
	export const VSCODE_CWD: string;
	export const VSCODE_ESM_ENTRYPOINT: string;
	export const VSCODE_HANDLES_UNCAUGHT_ERRORS: string;
	export const VSCODE_IPC_HOOK: string;
	export const VSCODE_NLS_CONFIG: string;
	export const VSCODE_PID: string;
	export const XPC_FLAGS: string;
	export const XPC_SERVICE_NAME: string;
	export const ZSH: string;
	export const _: string;
	export const __CFBundleIdentifier: string;
	export const __CF_USER_TEXT_ENCODING: string;
	export const __MISE_ORIG_PATH: string;
	export const APPLICATION_INSIGHTS_NO_DIAGNOSTIC_CHANNEL: string;
	export const APPLICATIONINSIGHTS_CONFIGURATION_CONTENT: string;
	export const WALLABY_PRODUCTION: string;
	export const VSCODE_L10N_BUNDLE_LOCATION: string;
	export const WALLABY_USE_WSL: string;
	export const WALLABY_ENTRY: string;
	export const DEBUG: string;
	export const DEBUG_COLORS: string;
	export const quokka: string;
	export const WALLABY2: string;
	export const NODE_OPTIONS: string;
	export const WALLABY_ENV: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	export const PUBLIC_WALLETCONNECT_ID: string;
	export const PUBLIC_RELAYING_MNEMONIC: string;
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		CARGO_REGISTRY_TOKEN: string;
		COMMAND_MODE: string;
		GOPATH: string;
		GOROOT: string;
		HOME: string;
		HOMEBREW_CELLAR: string;
		HOMEBREW_PREFIX: string;
		HOMEBREW_REPOSITORY: string;
		INFOPATH: string;
		JAVA_HOME: string;
		LESS: string;
		LOGNAME: string;
		LSCOLORS: string;
		LS_COLORS: string;
		LaunchInstanceID: string;
		MISE_SHELL: string;
		MallocNanoZone: string;
		NVM_CD_FLAGS: string;
		NVM_DIR: string;
		OLDPWD: string;
		ORIGINAL_XDG_CURRENT_DESKTOP: string;
		PAGER: string;
		PATH: string;
		PATH_TO_FX: string;
		PNPM_HOME: string;
		PWD: string;
		PYENV_ROOT: string;
		PYENV_SHELL: string;
		SECURITYSESSIONID: string;
		SHELL: string;
		SHLVL: string;
		SSH_AUTH_SOCK: string;
		TMPDIR: string;
		USER: string;
		VSCODE_CODE_CACHE_PATH: string;
		VSCODE_CRASH_REPORTER_PROCESS_TYPE: string;
		VSCODE_CWD: string;
		VSCODE_ESM_ENTRYPOINT: string;
		VSCODE_HANDLES_UNCAUGHT_ERRORS: string;
		VSCODE_IPC_HOOK: string;
		VSCODE_NLS_CONFIG: string;
		VSCODE_PID: string;
		XPC_FLAGS: string;
		XPC_SERVICE_NAME: string;
		ZSH: string;
		_: string;
		__CFBundleIdentifier: string;
		__CF_USER_TEXT_ENCODING: string;
		__MISE_ORIG_PATH: string;
		APPLICATION_INSIGHTS_NO_DIAGNOSTIC_CHANNEL: string;
		APPLICATIONINSIGHTS_CONFIGURATION_CONTENT: string;
		WALLABY_PRODUCTION: string;
		VSCODE_L10N_BUNDLE_LOCATION: string;
		WALLABY_USE_WSL: string;
		WALLABY_ENTRY: string;
		DEBUG: string;
		DEBUG_COLORS: string;
		quokka: string;
		WALLABY2: string;
		NODE_OPTIONS: string;
		WALLABY_ENV: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		PUBLIC_WALLETCONNECT_ID: string;
		PUBLIC_RELAYING_MNEMONIC: string;
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
