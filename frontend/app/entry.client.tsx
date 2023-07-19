import { RemixBrowser } from '@remix-run/react'
import { startTransition } from 'react'
import Buffer from 'buffer-polyfill'
import { hydrateRoot } from 'react-dom/client'

globalThis.Buffer = Buffer as unknown as BufferConstructor
if (ENV.MODE === 'development') {
	import('~/utils/devtools.tsx').then(({ init }) => init())
}
if (ENV.MODE === 'production' && ENV.SENTRY_DSN) {
	import('~/utils/monitoring.client.tsx').then(({ init }) => init())
}
startTransition(() => {
	hydrateRoot(document, <RemixBrowser />)
})
