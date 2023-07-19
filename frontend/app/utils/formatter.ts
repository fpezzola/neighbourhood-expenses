import { ethers } from 'ethers'

export function formatTokenBalance(
	value: string | bigint,
	symbol: string,
): string {
	return `${ethers.formatUnits(value, 18)} ${symbol}`
}
