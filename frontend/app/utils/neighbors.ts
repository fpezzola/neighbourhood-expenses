import { useContractRead, useContractWrite, useSendTransaction } from 'wagmi'
import NeighborsContract from '../../../artifacts/contracts/Neighbors.sol/Neighbors.json'
import { useContractsAddresses } from './contracts-provider.ts'
import React from 'react'
import { readContract } from '@wagmi/core'
import type { AddressType } from './address.ts'

export type LotOwner = {
	owner: string
	lotNumber: number
	area: number
	debt: number
	lastMint: number
}

export type NeighborContractSettings = {
	timeWithinTransfers: number
}

export type NeighborsContractAbiType = typeof NeighborsContract.abi

export async function getNeighborContractSettings(): Promise<NeighborContractSettings> {
	const timeWithinTransfers = (await readContract<
		NeighborsContractAbiType,
		'timeWithinTransfers'
	>({
		address: process.env.NEIGHBORS_CONTRACT_ADDRESS as AddressType,
		functionName: 'timeWithinTransfers',
		abi: NeighborsContract.abi,
	})) as Promise<bigint>
	return {
		timeWithinTransfers: Number(timeWithinTransfers),
	}
}

export function useUpdateTimeWithinTransfers() {
	const { neighborsContractAddress } = useContractsAddresses()
	const { writeAsync } = useContractWrite<
		NeighborsContractAbiType,
		'updateTimeWhitinTransfers'
	>({
		abi: NeighborsContract.abi,
		functionName: 'updateTimeWhitinTransfers',
		address: neighborsContractAddress,
	})
	const update = React.useCallback(
		(time: number) => {
			return writeAsync({
				args: [time],
			})
		},
		[writeAsync],
	)
	return update
}

export async function getAllNeighbors(): Promise<LotOwner[]> {
	let data: LotOwner[] = []
	try {
		data = (await readContract<NeighborsContractAbiType, 'neighbors'>({
			address: process.env.NEIGHBORS_CONTRACT_ADDRESS as AddressType,
			functionName: 'neighbors',
			abi: NeighborsContract.abi,
		})) as [LotOwner]
	} catch (e) {
		console.log(e)
	}

	return data.map(d => ({
		...d,
		debt: Number(d.debt),
		area: Number(d.area),
		lotNumber: Number(d.lotNumber),
		lastMint: Number(d.lastMint) * 1000,
	}))
}

function useNeighbors() {
	const { neighborsContractAddress } = useContractsAddresses()
	return useContractRead<NeighborsContractAbiType, 'neighbors', [LotOwner]>({
		address: neighborsContractAddress,
		functionName: 'neighbors',
		abi: NeighborsContract.abi,
	})
}

export function getAdminAddress(): Promise<AddressType> {
	const address = process.env.NEIGHBORS_CONTRACT_ADDRESS as AddressType
	return readContract<NeighborsContractAbiType, 'owner'>({
		address,
		functionName: 'owner',
		abi: NeighborsContract.abi,
	}) as Promise<AddressType>
}

export function useAddNeighbor() {
	const { neighborsContractAddress } = useContractsAddresses()
	const { writeAsync, isLoading, error } = useContractWrite({
		address: neighborsContractAddress,
		abi: NeighborsContract.abi,
		functionName: 'registerNeighbor',
	})
	const register = React.useCallback(
		async (account: string, lotNumber: number, area: number) => {
			return writeAsync({
				args: [account, lotNumber, area],
			})
		},
		[writeAsync],
	)

	return { execute: register, isLoading, error }
}

export function useAddDebt() {
	const { neighborsContractAddress } = useContractsAddresses()
	const { writeAsync, isLoading, error } = useContractWrite({
		address: neighborsContractAddress,
		abi: NeighborsContract.abi,
		functionName: 'loadDebt',
	})
	const add = React.useCallback(
		async (lotNumber: number, debt: string) => {
			return writeAsync({
				args: [lotNumber, debt],
			})
		},
		[writeAsync],
	)
	return { execute: add, isLoading, error }
}

export function usePayExpenses() {
	const { neighborsContractAddress } = useContractsAddresses()
	const { sendTransactionAsync, isLoading, error } = useSendTransaction({
		to: neighborsContractAddress,
	})
	const send = React.useCallback(
		async (amount: bigint) => {
			return sendTransactionAsync({
				value: amount,
				to: neighborsContractAddress,
				data: undefined,
			})
		},
		[sendTransactionAsync, neighborsContractAddress],
	)
	return { execute: send, isLoading, error }
}

export function useUpdateTimeWhitinTransfers() {
	const { neighborsContractAddress } = useContractsAddresses()
	const { writeAsync, isLoading } = useContractWrite<
		NeighborsContractAbiType,
		'updateTimeWhitinTransfers'
	>({
		abi: NeighborsContract.abi,
		functionName: 'updateTimeWhitinTransfers',
		address: neighborsContractAddress,
	})
	const updateTime = React.useCallback(
		(time: string) => {
			return writeAsync({
				args: [time],
			})
		},
		[writeAsync],
	)
	return { execute: updateTime, isLoading }
}

export function useTransferLotOwnership(debt: bigint) {
	const { neighborsContractAddress } = useContractsAddresses()
	const { writeAsync, error, isLoading } = useContractWrite<
		NeighborsContractAbiType,
		'transferLotOwnership'
	>({
		abi: NeighborsContract.abi,
		functionName: 'transferLotOwnership',
		address: neighborsContractAddress,
	})
	const trasnferTo = React.useCallback(
		(address: AddressType) => {
			return writeAsync({
				args: [address],
				value: debt,
			})
		},
		[writeAsync, debt],
	)
	return { exectue: trasnferTo, error, isLoading }
}

export default useNeighbors
