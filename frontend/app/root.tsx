import { cssBundleHref } from '@remix-run/css-bundle'
import {
	json,
	type DataFunctionArgs,
	type HeadersFunction,
	type LinksFunction,
	type V2_MetaFunction,
} from '@remix-run/node'
import {
	Link,
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from '@remix-run/react'
import { withSentry } from '@sentry/remix'
import { ThemeSwitch, useTheme } from './routes/resources+/theme/index.tsx'
import { getTheme } from './routes/resources+/theme/theme-session.server.ts'
import fontStylestylesheetUrl from './styles/font.css'
import tailwindStylesheetUrl from './styles/tailwind.css'
import { ClientHintCheck, getHints } from './utils/client-hints.tsx'
import { getEnv } from './utils/env.server.ts'
import { getDomainUrl } from './utils/misc.server.ts'
import { useNonce } from './utils/nonce-provider.ts'
import { makeTimings } from './utils/timing.server.ts'
import { WagmiConfig } from 'wagmi'
import config from './utils/wagmi.ts'
import UserHeader from './components/user-header.tsx'
import { ContractsProvider } from './utils/contracts-provider.ts'
import { type AddressType } from './utils/address.ts'
import { getAdminAddress } from './utils/neighbors.ts'
import { AdminProvider } from './utils/admin-provider.ts'

export const links: LinksFunction = () => {
	return [
		// Preload svg sprite as a resource to avoid render blocking
		// Preload CSS as a resource to avoid render blocking
		{ rel: 'preload', href: fontStylestylesheetUrl, as: 'style' },
		{ rel: 'preload', href: tailwindStylesheetUrl, as: 'style' },
		cssBundleHref ? { rel: 'preload', href: cssBundleHref, as: 'style' } : null,
		{ rel: 'manifest', href: '/site.webmanifest' },
		{ rel: 'icon', type: 'image/svg+xml', href: '/favicons/favicon.svg' },
		{ rel: 'stylesheet', href: fontStylestylesheetUrl },
		{ rel: 'stylesheet', href: tailwindStylesheetUrl },
		cssBundleHref ? { rel: 'stylesheet', href: cssBundleHref } : null,
	].filter(Boolean)
}

export const meta: V2_MetaFunction = () => {
	return [
		{ title: 'Gated Community' },
		{
			name: 'description',
			content: 'Pay your expenses and vote for improvements',
		},
	]
}

export async function loader({ request }: DataFunctionArgs) {
	const timings = makeTimings('root loader')
	const admin = await getAdminAddress()
	return json(
		{
			requestInfo: {
				hints: getHints(request),
				origin: getDomainUrl(request),
				path: new URL(request.url).pathname,
				session: {
					theme: await getTheme(request),
				},
			},
			ENV: getEnv(),
			admin,
		},
		{
			headers: {
				'Server-Timing': timings.toString(),
			},
		},
	)
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	const headers = {
		'Server-Timing': loaderHeaders.get('Server-Timing') ?? '',
	}
	return headers
}

function App() {
	const data = useLoaderData<typeof loader>()
	const nonce = useNonce()
	const theme = useTheme()

	return (
		<html lang="en" className={`${theme} h-full`}>
			<head>
				<ClientHintCheck nonce={nonce} />
				<Meta />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<Links />
			</head>
			<WagmiConfig config={config}>
				<body className="flex h-full flex-col justify-between bg-background text-foreground">
					<ContractsProvider
						value={{
							communityTokenAddress: data.ENV
								.COMMUNITY_TOKEN_CONTRACT_ADDRESS as AddressType,
							governorContractAddress: data.ENV
								.GOVERNOR_CONTRACT_ADDRESS as AddressType,
							neighborsContractAddress: data.ENV
								.NEIGHBORS_CONTRACT_ADDRESS as AddressType,
							executorContractAddress: data.ENV
								.EXECUTOR_CONTRACT_ADDRESS as AddressType,
						}}
					>
						<AdminProvider value={{ address: data.admin }}>
							<header className="container mx-auto py-6">
								<nav className="flex justify-between">
									<Link to="/">
										<div className="font-light">gated</div>
										<div className="font-bold">community</div>
									</Link>
									<div className="flex items-center gap-10">
										<UserHeader />
									</div>
								</nav>
							</header>

							<div className="flex-1">
								<Outlet />
							</div>

							<div className="container mx-auto flex justify-between">
								<Link to="/">
									<div className="font-light">gated</div>
									<div className="font-bold">community</div>
								</Link>
								<ThemeSwitch userPreference={data.requestInfo.session.theme} />
							</div>
							<div className="h-5" />
							<ScrollRestoration nonce={nonce} />
							<Scripts nonce={nonce} />
							<script
								nonce={nonce}
								dangerouslySetInnerHTML={{
									__html: `window.ENV = ${JSON.stringify(data.ENV)}`,
								}}
							/>
							<LiveReload nonce={nonce} />
						</AdminProvider>
					</ContractsProvider>
				</body>
			</WagmiConfig>
		</html>
	)
}
export default withSentry(App)
