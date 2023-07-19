import {
	Form,
	Link,
	NavLink,
	Outlet,
	useLoaderData,
	useSubmit,
} from '@remix-run/react'
import { getAllNeighbors } from '~/utils/neighbors.ts'
import { type DataFunctionArgs, json } from '@remix-run/node'
import { cutAddress } from '~/utils/address.ts'
import { Input } from '~/components/ui/input.tsx'
import { cn } from '~/utils/misc.ts'
import { formatUnits } from 'ethers'

export async function loader({ request }: DataFunctionArgs) {
	const data = await getAllNeighbors()
	const url = new URL(request.url)
	const query = url.searchParams.get('term')
	return json({
		neighbors: data.filter(
			d =>
				d.owner.match(query ?? '') || d.lotNumber.toString().match(query ?? ''),
		),
	})
}

export default function AdminDebtsManagement() {
	const submit = useSubmit()
	const data = useLoaderData<typeof loader>()
	function handleChange(event: any) {
		submit(event.currentTarget, { replace: true })
	}
	const navLinkDefaultClassName = 'line-clamp-2 rounded-l-md'
	return (
		<div>
			<h1 className="mb-4 text-center text-base font-bold md:text-lg lg:text-left lg:text-2xl">
				Expenses managment
			</h1>
			<hr />
			{data.neighbors.length > 0 ? (
				<>
					<div className="w-full p-4">
						<Form method="GET" onChange={handleChange}>
							<Input
								id="search"
								placeholder="Search by owner or lot number..."
								name="term"
							/>
						</Form>
					</div>
					<div className="flex w-full flex-row p-4">
						<div className="flex-1 pr-4">
							<div className="border-gray grid grid-cols-4 gap-4 border-b">
								<span className="font-bold">Owner</span>
								<span className="font-bold">Lot Number</span>
								<span className="font-bold">Area (m2)</span>
								<span className="font-bold">Debt</span>
							</div>
							{data.neighbors.map(neighbor => (
								<NavLink
									to={`${neighbor.lotNumber}/add`}
									key={neighbor.owner}
									className={({ isActive }) =>
										cn(
											'grid cursor-pointer grid-cols-4 gap-4 p-2',
											navLinkDefaultClassName,
											`hover:bg-muted`,
											isActive && 'bg-muted',
										)
									}
								>
									<span>{cutAddress(neighbor.owner)}</span>
									<span>{neighbor.lotNumber}</span>
									<span>{neighbor.area}</span>
									<span className="flex flex-row justify-between">
										<span>{`${formatUnits(
											neighbor.debt.toString(),
										)} ETH`}</span>
									</span>
								</NavLink>
							))}
						</div>
						<Outlet />
					</div>{' '}
				</>
			) : (
				<div className="flex flex-row justify-center py-12">
					<h5 className="text-h5">
						You don't have neighbors loaded yet.{' '}
						<Link
							className="text-link hover:underline"
							to="/dashboard/admin/add"
						>
							Add the first one here
						</Link>
					</h5>
				</div>
			)}
		</div>
	)
}
