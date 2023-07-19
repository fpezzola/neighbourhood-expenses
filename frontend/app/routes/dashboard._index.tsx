import { Role, useUser } from '~/utils/user.ts'

export default function Index() {
	const user = useUser()
	return (
		<div className="w-full text-center">
			<h1 className="m-auto text-5xl font-bold">Welcome!</h1>
			<div className="mt-6">
				{user.role === Role.ADMIN && 'Administrator'}
				{user.role === Role.LOT_OWNER &&
					`Your lot number is: ${user.userData?.lotNumber} `}
				{user.role === Role.GUEST &&
					'You don`t owe any lot. In order to access this system you should owe a lot.'}
			</div>
		</div>
	)
}
