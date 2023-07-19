import type { DataFunctionArgs } from '@remix-run/server-runtime'
import { json } from '@remix-run/node'
import { Outlet, useLoaderData, useNavigate } from '@remix-run/react'
import { type LotOwner, getAllNeighbors } from '~/utils/neighbors.ts'
import { useAccount } from 'wagmi'
import { formatUnits, isAddress } from 'ethers'
import { Button } from '~/components/ui/button.tsx'
import * as Accordion from '@radix-ui/react-accordion'
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '~/components/ui/accordion.tsx'
import { redirect } from '@remix-run/router'
export async function loader({ request, params }: DataFunctionArgs) {
	const data = await getAllNeighbors()
	const account = params.account
	if (!isAddress(account)) {
		throw redirect('/dashboard')
	}
	const neighbor = data.find(({ owner }) => owner === account)
	return json({
		neighbor,
	})
}

export default function Expenses() {
	const { neighbor } = useLoaderData<{ neighbor: LotOwner }>()
	const navigate = useNavigate()
	const account = useAccount()
	if (neighbor?.owner !== account.address) {
		return <span>Please switch your wallet account to {neighbor?.owner}.</span>
	}
	const startPayment = () => {
		navigate('pay')
	}
	return (
		<div>
			<div className="flex flex-row items-start justify-between">
				<h1 className="mb-4 text-center text-base font-bold md:text-lg lg:text-left lg:text-2xl">
					Balance:{' '}
					{`${neighbor?.debt ? '-' : ''}${formatUnits(
						neighbor!.debt.toString(),
					)} ETH`}
				</h1>
				{neighbor!.debt > 0 && (
					<Button onClick={startPayment}>Pay expenses</Button>
				)}
			</div>
			<hr />
			<p className="mb-4 mt-4">
				Last granted tokens:{' '}
				{neighbor?.lastMint === 0
					? 'NEVER'
					: new Date(neighbor!.lastMint).toDateString()}
			</p>
			<Accordion.Root
				className="w-full cursor-pointer rounded-md bg-muted shadow-[0_2px_10px] shadow-black/5"
				type="single"
				defaultValue="information"
				collapsible
			>
				<AccordionItem value="information">
					<AccordionTrigger className="bg-muted">
						Payment Information
					</AccordionTrigger>
					<AccordionContent>
						<div className="p-2">
							<p className="mb-2">
								By paying the expenses, you will be granted Community tokens
								(CTK) for voting in the neighbourhood proposals improvements.
							</p>
							<p>The amount of tokens granted depends on your lot area:</p>
							<ul>
								<li>{'- Area < 500m2 = 1 CTK'}</li>
								<li>{'- Area < 1000m2 = 2 CTK'}</li>
								<li>{'- Area < 500m2 = 3 CTK'}</li>
							</ul>

							<p className="mt-4 font-bold">
								Be aware that tokens are granted once per 28 days. If you pay
								twice within the 28 days, you will be granted just ONCE.
							</p>
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion.Root>
			<Outlet />
		</div>
	)
}
