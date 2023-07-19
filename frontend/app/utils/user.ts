import { useAccount } from 'wagmi'
import useNeighbors from './neighbors.ts'
import { useAdmin } from './admin-provider.ts'

export enum Role {
	ADMIN = 'ADMIN',
	LOT_OWNER = 'LOT_OWNER',
	GUEST = 'GUEST',
}

export const useOptionalUser = () => {
	return {} as any
}

export function useConnectedAccount() {
	const account = useAccount()
	if (!account || !account.isConnected) {
		return undefined
	}
	return account.address
}

export function useUser() {
	const { address: adminAddress } = useAdmin()
	const maybeOwner = useConnectedAccount()
	const { data: neighbors, isLoading } = useNeighbors()
	if (!maybeOwner) {
		return { account: undefined, userData: undefined, isLoading: false }
	}
	const userData = (neighbors || []).find(
		neighbor => neighbor.owner === maybeOwner,
	)
	const isAdmin = adminAddress === maybeOwner
	const role = isAdmin ? Role.ADMIN : userData ? Role.LOT_OWNER : Role.GUEST
	return { account: maybeOwner, userData, isLoading, role }
}
