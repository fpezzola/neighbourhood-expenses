import { useNavigate } from '@remix-run/react'
import { Button } from '~/components/ui/button.tsx'

export default function Manage() {
	const navigate = useNavigate()
	return (
		<div>
			<div className="flex flex-row items-center justify-between">
				<h1 className="mb-4 text-center text-base font-bold md:text-lg lg:text-left lg:text-2xl">
					Manage
				</h1>
			</div>
			<hr />
			<div className="p-4">
				<p>
					In this section you will be able to transfer the ownership of your lot
					and also delegate your voting power to someone else (including
					yourself)
				</p>
				<div className="flex flex-row items-center justify-center space-x-2 pt-4">
					<Button
						onClick={() => navigate('transfer')}
						className="w-52"
						variant="destructive"
					>
						Transfer lot ownership
					</Button>
					<Button
						onClick={() => navigate('delegate')}
						className="w-52"
						variant="default"
					>
						Delegate voting power
					</Button>
				</div>
			</div>
		</div>
	)
}
