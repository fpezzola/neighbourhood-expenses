import { Role, useUser } from '~/utils/user.ts'
import { Outlet, useNavigate } from '@remix-run/react'
import { AdminSidebar, LotOwnerSidebar } from '~/components/sidebar.tsx'
import React, { useEffect } from 'react'
import { type ConnectorData, useAccount } from 'wagmi'

export default function Index() {
	const { connector: activeConnector } = useAccount()
	const navigate = useNavigate()

	const user = useUser()
	useEffect(() => {
		if (!user.account) {
			navigate('/')
		}
	}, [user.account, navigate])

	React.useEffect(() => {
		const handleConnectorUpdate = ({ account, chain }: ConnectorData) => {
			console.log('Account')
			if (account) {
				navigate('/dashboard')
			} else if (chain) {
				console.log('new chain', chain)
			}
		}

		if (activeConnector) {
			activeConnector.on('change', handleConnectorUpdate)
		}

		return () => activeConnector?.off('change', handleConnectorUpdate) as any
	}, [activeConnector, navigate])

	return (
		<main className="container min-h-screen sm:flex sm:justify-between">
			<div className="flex h-full w-full pb-12">
				<div className="mx-auto grid h-screen w-full w-full flex-grow grid-cols-4 bg-muted pl-2 md:container md:rounded-3xl md:pr-0">
					<div className="col-span-1 py-12">
						{user.role === Role.ADMIN && (
							<AdminSidebar account={user.account} />
						)}
						{user.role === Role.LOT_OWNER && user.userData && (
							<LotOwnerSidebar
								lotNumber={user.userData.lotNumber}
								account={user.account}
							/>
						)}
					</div>
					<main className="col-span-3 flex-1 flex-1 bg-accent px-10 py-12 md:rounded-r-3xl">
						<Outlet />
					</main>
				</div>
			</div>
		</main>
	)
}
