import * as Sentry from '@sentry/remix'

export function init() {
	Sentry.init({
		dsn: ENV.SENTRY_DSN,
		tracesSampleRate: 1,
	})
}
