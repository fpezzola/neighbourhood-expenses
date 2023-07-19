import invariant from 'tiny-invariant'

const requiredServerEnvs = [
	'NODE_ENV',
	'LITEFS_DIR',
	'SESSION_SECRET',
	'COMMUNITY_TOKEN_CONTRACT_ADDRESS',
	'GOVERNOR_CONTRACT_ADDRESS',
	'NEIGHBORS_CONTRACT_ADDRESS',
	'EXECUTOR_CONTRACT_ADDRESS',
] as const

declare global {
	namespace NodeJS {
		interface ProcessEnv
			extends Record<(typeof requiredServerEnvs)[number], string> {}
	}
}

export function init() {
	for (const env of requiredServerEnvs) {
		invariant(process.env[env], `${env} is required`)
	}
}

/**
 * This is used in both `entry.server.ts` and `root.tsx` to ensure that
 * the environment variables are set and globally available before the app is
 * started.
 *
 * NOTE: Do *not* add any environment variables in here that you do not wish to
 * be included in the client.
 * @returns all public ENV variables
 */
export function getEnv() {
	invariant(process.env.NODE_ENV, 'NODE_ENV should be defined')

	return {
		MODE: process.env.NODE_ENV,
		SENTRY_DSN: process.env.SENTRY_DSN,
		GOVERNOR_CONTRACT_ADDRESS: process.env.GOVERNOR_CONTRACT_ADDRESS,
		COMMUNITY_TOKEN_CONTRACT_ADDRESS:
			process.env.COMMUNITY_TOKEN_CONTRACT_ADDRESS,
		NEIGHBORS_CONTRACT_ADDRESS: process.env.NEIGHBORS_CONTRACT_ADDRESS,
		EXECUTOR_CONTRACT_ADDRESS: process.env.EXECUTOR_CONTRACT_ADDRESS,
	}
}

type ENV = ReturnType<typeof getEnv>

declare global {
	var ENV: ENV
	interface Window {
		ENV: ENV
	}
}
