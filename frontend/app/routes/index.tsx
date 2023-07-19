import type { V2_MetaFunction } from '@remix-run/node'
import { useUser } from '~/utils/user.ts'
import Web3ButtonConnect from '~/components/web3-button-connect.tsx'
import React, { useEffect } from 'react'
import { useNavigate } from '@remix-run/react'

export const meta: V2_MetaFunction = () => [{ title: 'Gated Community' }]

const Index = () => {
	const user = useUser()
	const navigate = useNavigate()
	useEffect(() => {
		if (user.account) {
			navigate('/dashboard')
		}
	}, [user.account, navigate])

	return (
		<main className="space-between relative min-h-screen flex-row pt-8 sm:flex sm:justify-center">
			<div className="relative sm:pb-16 sm:pt-8">
				<span className="flex flex-col space-y-12">
					<h3 className="text-h3">Welcome | Connect your wallet</h3>
					<Web3ButtonConnect
						className="m-auto w-20"
						onConnectWallet={() => window.location.reload()}
					/>
				</span>
			</div>
		</main>
	)
}

export default Index
