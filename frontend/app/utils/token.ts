import { useAccount, useContractRead, useContractWrite } from 'wagmi'
import { useContractsAddresses } from './contracts-provider.ts'
import CommunityTokenContract from '../../../artifacts/contracts/CommunityToken.sol/CommunityToken.json'
import { readContract } from '@wagmi/core'
import type { AddressType } from './address.ts'
import React from 'react'
type AbiType = typeof CommunityTokenContract.abi

export function useDelegate() {
	const { communityTokenAddress } = useContractsAddresses()
	const { writeAsync, error, isLoading } = useContractWrite<
		AbiType,
		'delegate'
	>({
		abi: CommunityTokenContract.abi,
		functionName: 'delegate',
		address: communityTokenAddress,
	})
	const delegate = React.useCallback(
		(delegatee: AddressType) => {
			return writeAsync({
				args: [delegatee],
			})
		},
		[writeAsync],
	)
	return { execute: delegate, isLoading, error }
}

export function getCommunityTokenBalance(
	address: AddressType,
): Promise<bigint> {
	return readContract<AbiType, 'balanceOf'>({
		abi: CommunityTokenContract.abi,
		address: process.env.COMMUNITY_TOKEN_CONTRACT_ADDRESS as AddressType,
		functionName: 'balanceOf',
		args: [address],
	}) as Promise<bigint>
}

export function useGetCommunityTokenBalance() {
	const { communityTokenAddress } = useContractsAddresses()
	const account = useAccount()
	return useContractRead<AbiType, 'balanceOf'>({
		address: communityTokenAddress,
		abi: CommunityTokenContract.abi,
		functionName: 'balanceOf',
		args: [account.address],
	})
}

export function getPastVotes(address: AddressType) {
	return readContract({
		abi: CommunityTokenContract.abi,
		address: process.env.COMMUNITY_TOKEN_CONTRACT_ADDRESS as AddressType,
		functionName: 'getPastVotes',
		args: [address, 10],
	})
}

export function getVotes(
	account: AddressType,
	timepoint?: bigint,
): Promise<bigint> {
	const functionName = timepoint ? 'getPastVotes' : 'getVotes'
	const args = [account] as any[]
	if (timepoint) {
		args.push(timepoint)
	}
	return readContract<AbiType, any>({
		address: process.env.COMMUNITY_TOKEN_CONTRACT_ADDRESS as AddressType,
		functionName,
		abi: CommunityTokenContract.abi,
		args,
	}) as Promise<bigint>
}
