import { fetchBalance } from '@wagmi/core'
import type { AddressType } from './address.ts'

export async function getExecutorBalance(): Promise<bigint> {
	const balance = await fetchBalance({
		address: process.env.EXECUTOR_CONTRACT_ADDRESS as AddressType,
	})
	return balance.value
}
