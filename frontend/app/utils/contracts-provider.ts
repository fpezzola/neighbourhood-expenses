import * as React from 'react'
import type { AddressType } from './address.ts'

type ContractsProviderState = {
	neighborsContractAddress: AddressType
	governorContractAddress: AddressType
	communityTokenAddress: AddressType
	executorContractAddress: AddressType
}

const defaultState: ContractsProviderState = {
	communityTokenAddress: '0x0',
	governorContractAddress: '0x0',
	neighborsContractAddress: '0x0',
	executorContractAddress: '0x0',
}

export const ContractsContext =
	React.createContext<ContractsProviderState>(defaultState)
export const ContractsProvider = ContractsContext.Provider
export const useContractsAddresses = () => React.useContext(ContractsContext)
