import { DropdownMenu, DropdownMenuTrigger } from './ui/dropdown-menu.tsx'
import { Button } from './ui/button.tsx'
import Web3ButtonConnect from './web3-button-connect.tsx'
import { useUser } from '~/utils/user.ts'
import { cutAddress } from '~/utils/address.ts'
import { useState } from 'react'
function UserHeader() {
	const user = useUser()

	if (!user.account) {
		return <Web3ButtonConnect />
	}

	return <UserDropdown {...user} />
}

function UserDropdown({ account }: { account: string }) {
	const [active, setActive] = useState<boolean>(false)
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button onClick={() => setActive(prev => !prev)}>
					{active ? account : cutAddress(account)}
				</Button>
			</DropdownMenuTrigger>
		</DropdownMenu>
	)
}

export default UserHeader
