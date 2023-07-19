import type { DataFunctionArgs } from '@remix-run/server-runtime'
import { cutAddress, type AddressType } from '~/utils/address.ts'
import { getCommunityTokenBalance, getVotes } from '~/utils/token.ts'
import { json } from '@remix-run/node'
import { getAllProposals, getSetting } from '~/utils/governance.ts'
import {
	Form,
	Link,
	NavLink,
	useLoaderData,
	useNavigate,
} from '@remix-run/react'
import { ethers, isAddress } from 'ethers'
import { cn } from '~/utils/misc.ts'
import { Input } from '~/components/ui/input.tsx'
import { Button } from '~/components/ui/button.tsx'
import { getExecutorBalance } from '~/utils/executor.ts'
import * as Accordion from '@radix-ui/react-accordion'
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '~/components/ui/accordion.tsx'
import { formatTokenBalance } from '~/utils/formatter.ts'
import { Tooltip } from '~/components/ui/tooltip.tsx'
import {
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@radix-ui/react-tooltip'
import BalanceHeader from '~/components/balance-header.tsx'
import { redirect } from '@remix-run/router'

const navLinkDefaultClassName = 'line-clamp-2 rounded-l-md'

export async function loader({ request, params }: DataFunctionArgs) {
	const account = params.account as AddressType
	if (!isAddress(account)) {
		throw redirect('/dashboard')
	}
	const [balance, proposals, executorBalance, votes, threshold] =
		await Promise.all<
			[
				ReturnType<typeof getCommunityTokenBalance>,
				ReturnType<typeof getAllProposals>,
				ReturnType<typeof getExecutorBalance>,
				ReturnType<typeof getVotes>,
				ReturnType<typeof getSetting>,
			]
		>([
			getCommunityTokenBalance(account),
			getAllProposals(),
			getExecutorBalance(),
			getVotes(account),
			getSetting('proposalThreshold'),
		])
	return json({
		account: params.account,
		balance: balance.toString(),
		executorBalance: executorBalance.toString(),
		proposals: proposals,
		votes: votes.toString(),
		threshold: threshold.toString(),
	})
}

export default function Proposals() {
	const navigate = useNavigate()
	const { balance, proposals, votes, executorBalance, account, threshold } =
		useLoaderData<typeof loader>()
	const canPropose = BigInt(votes) >= BigInt(threshold)
	const thresholdFormatted = formatTokenBalance(threshold, 'CTK')
	return (
		<div>
			<div className="flex flex-row items-center justify-between">
				<h1 className="mb-4 text-center text-base font-bold md:text-lg lg:text-left lg:text-2xl">
					Proposals
				</h1>
				<div className="flex flex-col items-end">
					<BalanceHeader
						prefix="CommunityToken balance"
						value={balance}
						symbol="CTK"
					/>
					<BalanceHeader
						prefix="Your voting balance"
						value={votes}
						symbol="CTK"
					/>
					<BalanceHeader
						prefix="Executor balance"
						value={executorBalance}
						symbol="ETH"
					/>
				</div>
			</div>
			<hr />
			{BigInt(votes) < BigInt(balance) ? (
				<div className="py-2 ">
					<Accordion.Root
						className="w-full cursor-pointer rounded-md  bg-muted shadow-md"
						type="single"
						collapsible
					>
						<AccordionItem value="warning">
							<AccordionTrigger className="bg-destructive">
								Your vote weight is different from your CTK balance
							</AccordionTrigger>
							<AccordionContent>
								<div className="p-2">
									<p className="mb-2">
										We noticed that your CTK balance is different from your
										voting power.
									</p>
									<div className="flex flex-col items-start space-y-2 p-2">
										<BalanceHeader
											prefix="CommunityToken balance"
											value={balance}
											symbol="CTK"
										/>
										<BalanceHeader
											prefix="Your voting balance"
											value={votes}
											symbol="CTK"
										/>
									</div>
									<p className="mt-4 font-bold">
										In order to use your whole CTK balance as voting power, you
										need to delegate it{' '}
										<Link
											to={`/dashboard/${account}/manage/delegate`}
											className="hover:underline"
										>
											here
										</Link>
										.
									</p>
								</div>
							</AccordionContent>
						</AccordionItem>
					</Accordion.Root>
				</div>
			) : null}
			<div className="flex w-full flex-row items-center justify-between  py-8">
				<div className="mr-12 flex-1">
					<Form method="GET">
						<Input
							id="search"
							placeholder="Search by owner or lot number..."
							name="term"
						/>
					</Form>
				</div>
				<TooltipProvider delayDuration={100}>
					<Tooltip open={canPropose ? false : undefined}>
						<TooltipTrigger>
							<Button
								variant="default"
								type="button"
								disabled={!canPropose}
								onClick={() => navigate('new')}
							>
								New proposal
							</Button>
						</TooltipTrigger>
						<TooltipContent className="rounded-md bg-foreground p-2 text-accent">
							You can't create proposals until you have {thresholdFormatted} of
							voting balance.
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
			<div className="flex w-full flex-row p-4">
				<div className="flex-1 pr-4">
					<div className="border-gray grid grid-cols-5 gap-4 border-b">
						<span className="font-bold">Proposer</span>
						<span className="col-span-2 font-bold">Description</span>
						<span className="font-bold">Value</span>
						<span className="font-bold">Status</span>
					</div>
					{proposals.map(proposal => (
						<NavLink
							to={proposal.proposalId}
							key={proposal.proposalId}
							className={({ isActive }) =>
								cn(
									'grid cursor-pointer grid-cols-5 gap-4 p-2',
									navLinkDefaultClassName,
									'hover:bg-muted',
									isActive && 'bg-muted',
								)
							}
						>
							<span>{cutAddress(proposal.proposer)}</span>
							<span
								title={proposal.description}
								className="col-span-2 overflow-hidden text-ellipsis whitespace-nowrap break-all"
							>
								{proposal.description}
							</span>
							<span>{`${ethers.formatEther(proposal.value)} ETH`}</span>
							<span>{proposal.state}</span>
						</NavLink>
					))}
				</div>
			</div>
		</div>
	)
}
