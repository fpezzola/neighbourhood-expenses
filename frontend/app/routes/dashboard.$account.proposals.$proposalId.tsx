import type { DataFunctionArgs } from '@remix-run/server-runtime'
import type { AddressType } from '~/utils/address.ts'
import { json } from '@remix-run/node'
import { fetchBlockNumber } from '@wagmi/core'
import {
	getProposalDetailsForAccount,
	ProposalState,
	getTargets,
	ProposalSupport,
	type Support,
	useExecuteProposal,
	useCancelProposal,
} from '~/utils/governance.ts'
import {
	Outlet,
	useLoaderData,
	useNavigate,
	useRevalidator,
} from '@remix-run/react'
import { getExecutorBalance } from '~/utils/executor.ts'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { formatTokenBalance } from '~/utils/formatter.ts'
import { Button } from '~/components/ui/button.tsx'
import { cn } from '~/utils/misc.ts'
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons'
import { useUser } from '~/utils/user.ts'
import React from 'react'
import {
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	Tooltip,
} from '~/components/ui/tooltip.tsx'
import { ErrorList } from '~/components/forms.tsx'

export async function loader({ request, params }: DataFunctionArgs) {
	const proposalId = params.proposalId as string
	const account = params.account as AddressType
	const [proposalData, executorBalance, targets, currentBlock] =
		await Promise.all<
			[
				ReturnType<typeof getProposalDetailsForAccount>,
				Promise<bigint>,
				ReturnType<typeof getTargets>,
				Promise<bigint>,
			]
		>([
			getProposalDetailsForAccount(proposalId, account),
			getExecutorBalance(),
			getTargets(),
			fetchBlockNumber(),
		])

	if (!proposalData.proposal) {
		throw new Response('Not found', { status: 404 })
	}

	return json({
		executorBalance: executorBalance.toString(),
		proposalData: {
			...proposalData,
			proposal: proposalData.proposal!,
		},
		targets,
		currentBlock: currentBlock.toString(),
	})
}

export default function ProposalDetails() {
	const navigate = useNavigate()
	const { revalidate } = useRevalidator()
	const user = useUser()
	const { proposalData, targets, currentBlock, executorBalance } =
		useLoaderData<typeof loader>()
	const { proposal } = proposalData
	const state = Object.values(ProposalState)[proposalData.proposalState!]
	const resolvedTarget = targets.find(
		t => proposalData.proposal?.target === t.target,
	)
	const { execute, isLoading, error } = useExecuteProposal(
		[proposal.target],
		[BigInt(proposal.value)],
		proposal.description,
		{
			onSuccess: revalidate,
		},
	)
	const { cancel, isCanceling } = useCancelProposal(
		[proposal.target],
		[BigInt(proposal.value)],
		proposal.description,
		{
			onSuccess: revalidate,
		},
	)
	const hasBalanceToVote = BigInt(proposalData.votesAtTimepoint ?? '0') > 0
	const canVote = hasBalanceToVote && !proposalData.hasVoted
	const voteWeightBlockNumber =
		BigInt(currentBlock) > BigInt(proposal?.voteStart || '0')
			? proposal?.voteStart
			: currentBlock
	const blocksLeftAmount =
		BigInt(proposal?.voteEnd ?? 0) - BigInt(currentBlock) + BigInt(1) //(last block counts)

	const canceledOrPending = [
		ProposalState.PENDING,
		ProposalState.CANCELED,
	].includes(state)

	const isProposer = user.account === proposal.proposer
	const canExecute = BigInt(executorBalance) >= BigInt(proposal.value)
	return (
		<div>
			<div className="mb-4 flex flex-row items-center justify-between">
				<h1 className=" text-center text-base font-bold md:text-lg lg:text-left lg:text-2xl">
					Proposals / Details ({state})
				</h1>
				{proposal.proposer === user.account &&
					state === ProposalState.PENDING && (
						<Button
							variant="destructive"
							disabled={isCanceling}
							onClick={() => cancel()}
						>
							Cancel proposal
						</Button>
					)}
			</div>
			<hr />
			<div className="p-4">
				<DetailItem label="Description">{proposal?.description}</DetailItem>
				<DetailItem label="Budget holder">
					{resolvedTarget?.description}
				</DetailItem>
				<DetailItem label="Amount">
					{formatTokenBalance(proposal!.value, 'ETH')}
				</DetailItem>
				<DetailItem label="Proposer">{proposal.proposer}</DetailItem>
				<DetailItem label="Voting period (Block)">
					{proposal?.voteStart} block - {proposal?.voteEnd} block
				</DetailItem>
				<DetailItem
					label={`Your voting weight at block #${voteWeightBlockNumber}`}
				>
					{formatTokenBalance(proposalData.votesAtTimepoint ?? '', 'CTK')}
				</DetailItem>
				<DetailItem label={`Quorum needed (For votes + Abstain votes)`}>
					{formatTokenBalance(proposalData.quorum ?? '', 'CTK')}
				</DetailItem>
				<div className="mb-4 flex flex-col space-y-2">
					{canceledOrPending ? (
						<span className="mt-4 text-red-500">
							{state === ProposalState.PENDING
								? 'Voting period is not open yet.'
								: `Proposal canceled by ${proposal.proposer}.`}
						</span>
					) : (
						<div>
							<hr />
							<Results
								proposalVotes={proposalData.proposalVotes}
								state={state}
								vote={proposalData.support}
								blocksLeft={blocksLeftAmount.toString()}
							/>
						</div>
					)}
				</div>
				{state === ProposalState.ACTIVE && (
					<div className="mt-4">
						{proposalData.hasVoted && (
							<span className="font-bold text-foreground">
								You've already voted!
							</span>
						)}
						{!hasBalanceToVote && (
							<span className="font-bold text-red-500">
								You don't have enough voting power to vote.
							</span>
						)}
						{canVote && (
							<span className="font-bold text-foreground">
								<Button
									onClick={() => navigate('vote', { preventScrollReset: true })}
									className="w-72 cursor-pointer"
								>
									Emit your opinion here
								</Button>
							</span>
						)}
					</div>
				)}
				{error && (
					<div className="mb-2">
						<ErrorList
							errors={[(error as unknown as { details: string }).details]}
						/>
					</div>
				)}
				{state === ProposalState.SUCCEEDED && isProposer && (
					<TooltipProvider delayDuration={100}>
						<Tooltip open={canExecute ? false : undefined}>
							<TooltipTrigger>
								<Button
									className="mt-4 w-72"
									onClick={() => execute()}
									disabled={!canExecute}
								>
									{isLoading ? 'Executing...' : 'Execute proposal'}
								</Button>
							</TooltipTrigger>
							<TooltipContent className="w-52 rounded-md bg-foreground p-2 text-accent">
								Executor balance is lower than the proposal amount. You need to
								wait until the executor balance reaches{' '}
								{formatTokenBalance(proposal.value, 'ETH')}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</div>
			<Outlet />
		</div>
	)
}

export function Results({
	proposalVotes,
	state,
	vote,
	blocksLeft,
}: {
	proposalVotes?: Record<Support, string>
	state: ProposalState
	vote?: Support
	blocksLeft: string
}) {
	if (!proposalVotes || Object.keys(proposalVotes).length === 0) {
		return null
	}
	const resultsLabel =
		state === ProposalState.ACTIVE
			? `Partial results (votes ends in ${blocksLeft} blocks)`
			: 'Final results'
	const proposalVotesOptions = Object.keys(proposalVotes!).length
	return (
		<div className="mt-4 flex flex-col space-y-2">
			<span className="text-xl font-bold">{resultsLabel}</span>
			<div className="flex w-72 flex-col rounded-md border border-foreground">
				{Object.entries(proposalVotes).map(([support, votes], idx) => {
					const supportData = ProposalSupport[Number(support) as Support]
					const isYourVote = vote === Number(support)
					return (
						<div
							key={support}
							className={cn(
								`text-accent`,
								`bg-${supportData.color}`,
								'p-4',
								idx === 0 && 'rounded-t-md',
								idx === proposalVotesOptions - 1 && 'rounded-b-md',
								isYourVote && 'shadow-inner',
								'flex flex-row items-center space-x-2',
							)}
						>
							<span className="flex-1">{supportData.label}</span>
							<span className="flex-1">{formatTokenBalance(votes, 'CTK')}</span>
							{isYourVote ? (
								<CheckIcon className="flex-1" width={20} height={20} />
							) : (
								<Cross2Icon className=" flex-1" width={18} height={18} />
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
}

export function DetailItem({
	label,
	children,
}: {
	label: string
	children: React.ReactNode
}) {
	return (
		<div className="mt-2">
			<span className="text-base font-bold">{label}</span>
			<p className="text-sm">{children}</p>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => <p>Proposal not found</p>,
			}}
		/>
	)
}
