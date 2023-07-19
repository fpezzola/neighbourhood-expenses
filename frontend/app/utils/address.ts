export type AddressType = `0x${string}`

export function cutAddress(address: string): string {
	return address.substring(0, 6) + '...' + address.substring(38)
}
