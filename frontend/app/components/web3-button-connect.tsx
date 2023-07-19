import { useConnect } from 'wagmi'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuPortal,
	DropdownMenuTrigger,
	DropdownMenuItem,
} from './ui/dropdown-menu.tsx'
import { Button } from './ui/button.tsx'
import { Link1Icon } from '@radix-ui/react-icons'

const Web3ButtonConnect = ({
	className,
	onConnectWallet,
}: {
	className?: string
	onConnectWallet?: (data: any) => void
}) => {
	const { connectors, pendingConnector } = useConnect()

	const onConnect = async (connector: any) => {
		try {
			const data = await connector.connect()
			if (onConnectWallet) {
				onConnectWallet(data)
			}
		} catch (e) {
			console.error('Canceled')
		}
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button className={className} disabled={!!pendingConnector?.id}>
					{pendingConnector?.id ? 'Connecting...' : 'Connect'}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuPortal>
				<DropdownMenuContent sideOffset={8} align="start">
					{connectors
						.filter(r => r.ready)
						.map(connector => {
							return (
								<DropdownMenuItem
									asChild
									key={connector.id}
									className="mt-2 w-full"
								>
									<span
										onClick={() => onConnect(connector)}
										className="flex cursor-pointer flex-row items-center space-x-2"
									>
										<Link1Icon />
										<span>{connector.name}</span>
									</span>
								</DropdownMenuItem>
							)
						})}
				</DropdownMenuContent>
			</DropdownMenuPortal>
		</DropdownMenu>
	)
}

export default Web3ButtonConnect
