import { ethers, keccak256, toUtf8Bytes } from 'ethers'
import type { AddressType } from './address.ts'
import { readContract, fetchBlockNumber } from '@wagmi/core'
import GovernorContract from '../../../artifacts/contracts/CommunityGovernance.sol/CommunityGovernance.json'
import { useContractWrite } from 'wagmi'
import { useContractsAddresses } from './contracts-provider.ts'
import React from 'react'

import { getVotes } from './token.ts'

const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545', 31337)

type AbiType = typeof GovernorContract.abi

export type ProposalTarget = {
	target: AddressType
	description: string
}

export type GovernorContractSettings = {
	targets: ProposalTarget[]
	votingPeriod: string
	votingDelay: string
	proposalThreshold: string
}

export type Support = 0 | 1 | 2

export const ProposalSupport: Record<
	Support,
	{ label: string; color: string }
> = {
	0: {
		label: 'Against',
		color: 'red-300',
	},
	1: {
		label: 'For',
		color: 'green-300',
	},
	2: {
		label: 'Abstain',
		color: 'yellow-300',
	},
}

export enum ProposalState {
	PENDING = 'Pending',
	ACTIVE = 'Active',
	CANCELED = 'Canceled',
	DEFEATED = 'Defeated',
	SUCCEEDED = 'Succeeded',
	QUEUED = 'Queued',
	EXPIRED = 'Expired',
	EXECUTED = 'Executed',
}

export function getProposalStateFromIndex(stateIndex: number): ProposalState {
	const stateStr = Object.keys(ProposalState)[stateIndex]
	return ProposalState[stateStr as keyof typeof ProposalState] as ProposalState
}

export type Proposal = {
	proposalId: string
	proposer: string
	target: string
	value: string
	voteStart: string
	voteEnd: string
	description: string
	state?: ProposalState
}

export type VoteCast = {
	proposalId: string
	support: number
}

export type ProposalDetails = {
	proposal: Proposal | null
	votesAtTimepoint: string | null
	hasVoted: boolean
	support?: Support
	proposalState?: number
	quorum?: string
	proposalVotes?: Record<Support, string>
}

function getContract() {
	return new ethers.Contract(
		process.env.GOVERNOR_CONTRACT_ADDRESS as AddressType,
		GovernorContract.abi,
		provider,
	)
}

async function getProposalCreatedEvents() {
	const governance = getContract()
	const filters = governance.filters.ProposalCreated()
	const logs = await governance.queryFilter(filters, 0, 'latest')
	return logs.map(log =>
		governance.interface.parseLog({ ...log, topics: [...log.topics] }),
	)
}

async function getVoteCastEvents(
	voter: AddressType,
	voteStart: bigint,
	voteEnd: bigint,
	proposalId?: string,
): Promise<VoteCast[]> {
	const governance = getContract()
	const filters = governance.filters.VoteCast(voter)
	const logs = await governance.queryFilter(
		filters,
		voteStart ?? 0,
		voteEnd ?? 'latest',
	)
	const castedVotes = (logs || []).map(log => {
		const parsedLog = governance.interface.parseLog({
			...log,
			topics: [...log.topics],
		})
		return {
			proposalId: parsedLog?.args[1],
			support: Number(parsedLog?.args[2]),
		} as VoteCast
	})

	if (proposalId) {
		return castedVotes.filter(vote => vote.proposalId.toString() === proposalId)
	}

	return castedVotes
}

export async function getAllProposals(): Promise<Proposal[]> {
	const events = await getProposalCreatedEvents()
	const proposals = new Array<Proposal>()
	for (const event of events) {
		const voteStart = event?.args[6] as bigint
		const voteEnd = event?.args[7] as bigint
		const proposalId = (event?.args[0] as bigint).toString()
		const state = await getState(proposalId)
		proposals.push({
			proposalId,
			proposer: event?.args[1],
			target: event?.args[2][0],
			value: event?.args[3][0].toString(),
			voteStart: voteStart.toString(),
			voteEnd: voteEnd.toString(),
			state: getProposalStateFromIndex(state),
			description: event?.args[8],
		})
	}

	//sort by state idx
	proposals.sort((a, b) => {
		const stateA = Object.values(ProposalState).indexOf(a.state!)
		const stateB = Object.values(ProposalState).indexOf(b.state!)
		return stateA - stateB
	})

	return proposals
}

export function usePropose() {
	const { governorContractAddress } = useContractsAddresses()
	const { writeAsync, isLoading, error } = useContractWrite({
		abi: GovernorContract.abi,
		address: governorContractAddress,
		functionName: 'propose',
	})
	const propose = React.useCallback(
		(target: string, amount: string, description: string) => {
			return writeAsync({
				args: [
					[target],
					[amount.toString()],
					[ethers.toUtf8Bytes('')],
					description,
				],
			})
		},
		[writeAsync],
	)
	return { execute: propose, isLoading, error }
}

export function getState(proposalId: string): Promise<number> {
	return readContract<AbiType, 'state'>({
		address: process.env.GOVERNOR_CONTRACT_ADDRESS as AddressType,
		functionName: 'state',
		abi: GovernorContract.abi,
		args: [proposalId],
	}) as Promise<number>
}

export function getProposalVotes(
	proposalId: string,
): Promise<[bigint, bigint, bigint]> {
	return readContract<AbiType, 'proposalVotes'>({
		address: process.env.GOVERNOR_CONTRACT_ADDRESS as AddressType,
		functionName: 'proposalVotes',
		abi: GovernorContract.abi,
		args: [proposalId],
	}) as Promise<[bigint, bigint, bigint]>
}

export function getQuorum(timepoint: bigint) {
	return readContract<AbiType, 'quorum'>({
		address: process.env.GOVERNOR_CONTRACT_ADDRESS as AddressType,
		functionName: 'quorum',
		abi: GovernorContract.abi,
		args: [timepoint],
	}) as Promise<bigint>
}

export async function getProposalDetailsForAccount(
	proposalId: string,
	account: AddressType,
): Promise<ProposalDetails> {
	const blockNumber = await fetchBlockNumber()
	const blockNumberTimepoint = blockNumber - BigInt(1)
	const proposals = await getAllProposals()
	const proposal = proposals.find(
		proposal => proposal.proposalId === proposalId,
	)
	if (!proposal) {
		return {
			proposal: null,
			hasVoted: false,
			votesAtTimepoint: null,
		}
	}
	const voteStart = BigInt(proposal.voteStart)
	const timepoint =
		voteStart > blockNumberTimepoint ? blockNumberTimepoint : voteStart
	const [proposalState, votes, voteCast, proposalVotes, quorum] =
		await Promise.all<
			[
				ReturnType<typeof getState>,
				ReturnType<typeof getVotes>,
				ReturnType<typeof getVoteCastEvents>,
				ReturnType<typeof getProposalVotes>,
				ReturnType<typeof getQuorum>,
			]
		>([
			getState(proposalId),
			getVotes(account, timepoint),
			getVoteCastEvents(account, timepoint, blockNumber, proposalId),
			getProposalVotes(proposalId),
			getQuorum(timepoint),
		])
	const hasVoted = voteCast.length > 0
	return {
		proposal,
		hasVoted,
		support: hasVoted ? (voteCast[0].support as Support) : undefined,
		votesAtTimepoint: votes.toString(),
		proposalState,
		quorum: quorum ? quorum.toString() : undefined,
		proposalVotes:
			proposalVotes.length > 0
				? {
						0: proposalVotes[0].toString(),
						1: proposalVotes[1].toString(),
						2: proposalVotes[2].toString(),
				  }
				: undefined,
	}
}

export function useCastVote(proposalId: string) {
	const { governorContractAddress } = useContractsAddresses()
	const { writeAsync, error, isLoading } = useContractWrite<
		AbiType,
		'castVote'
	>({
		abi: GovernorContract.abi,
		address: governorContractAddress,
		functionName: 'castVote',
	})

	const cast = React.useCallback(
		(support: Support) => {
			return writeAsync({
				args: [proposalId, Number(support)],
			})
		},
		[writeAsync, proposalId],
	)
	return { execute: cast, error, isLoading }
}

export function useExecuteProposal(
	targets: string[],
	values: bigint[],
	description: string,
	callbacks: { onSuccess?: () => void },
) {
	const { governorContractAddress } = useContractsAddresses()
	const descriptionHash = keccak256(toUtf8Bytes(description))
	const { writeAsync, isLoading, error } = useContractWrite({
		abi: GovernorContract.abi,
		address: governorContractAddress,
		args: [targets, values, [ethers.toUtf8Bytes('')], descriptionHash],
		functionName: 'execute',
		...callbacks,
	})
	return { execute: writeAsync, isLoading, error }
}

export function useAddTarget() {
	const { governorContractAddress } = useContractsAddresses()
	const { writeAsync, isLoading, error } = useContractWrite({
		abi: GovernorContract.abi,
		address: governorContractAddress,
		functionName: 'addTarget',
	})
	const onAdd = React.useCallback(
		(target: string, description: string) => {
			return writeAsync({
				args: [target, description],
			})
		},
		[writeAsync],
	)
	return { execute: onAdd, isLoading, error }
}

export function useCancelProposal(
	targets: string[],
	values: bigint[],
	description: string,
	callbacks: { onSuccess?: () => void },
) {
	const { governorContractAddress } = useContractsAddresses()
	const descriptionHash = keccak256(toUtf8Bytes(description))
	const { writeAsync, isLoading } = useContractWrite({
		abi: GovernorContract.abi,
		address: governorContractAddress,
		args: [targets, values, [ethers.toUtf8Bytes('')], descriptionHash],
		functionName: 'cancel',
		...callbacks,
	})
	return { cancel: writeAsync, isCanceling: isLoading }
}

type Setting = 'proposalThreshold' | 'votingDelay' | 'votingPeriod'
export async function getSetting(functionName: Setting): Promise<bigint> {
	const setting = (await readContract<AbiType, typeof functionName>({
		address: process.env.GOVERNOR_CONTRACT_ADDRESS as AddressType,
		functionName,
		abi: GovernorContract.abi,
	})) as bigint
	return setting
}

export async function getTargets(): Promise<ProposalTarget[]> {
	return readContract<AbiType, 'allowedTargets'>({
		address: process.env.GOVERNOR_CONTRACT_ADDRESS as AddressType,
		functionName: 'allowedTargets',
		abi: GovernorContract.abi,
	}) as Promise<ProposalTarget[]>
}

export async function getGovernanceContractSettings(): Promise<GovernorContractSettings> {
	const [targets, proposalThreshold, votingDelay, votingPeriod] =
		await Promise.all<
			[
				ReturnType<typeof getTargets>,
				ReturnType<typeof getSetting>,
				ReturnType<typeof getSetting>,
				ReturnType<typeof getSetting>,
			]
		>([
			getTargets(),
			getSetting('proposalThreshold'),
			getSetting('votingDelay'),
			getSetting('votingPeriod'),
		])

	return {
		targets,
		proposalThreshold: proposalThreshold.toString(),
		votingDelay: votingDelay.toString(),
		votingPeriod: votingPeriod.toString(),
	}
}
