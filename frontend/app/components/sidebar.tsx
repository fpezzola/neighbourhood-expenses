import { Link, NavLink } from '@remix-run/react'
import { cn } from '~/utils/misc.ts'
import {
	FileTextIcon,
	GearIcon,
	PlusIcon,
	RocketIcon,
} from '@radix-ui/react-icons'

export function Item({ to, children }: { to: string; children: any }) {
	const navLinkDefaultClassName =
		'line-clamp-2 block rounded-l-md py-2 pl-8 pr-6 text-base lg:text-xl'
	return (
		<li>
			<NavLink
				to={to}
				className={({ isActive }) =>
					cn(
						navLinkDefaultClassName,
						isActive && 'bg-accent',
						'flex flex-row items-center space-x-2',
					)
				}
			>
				{children}
			</NavLink>
		</li>
	)
}

export function AdminSidebar({ account }: { account: string }) {
	return (
		<ul>
			<Link
				to={`/dashboard`}
				className="mb-4 flex flex-col items-center justify-center gap-2 pl-8 pr-4 lg:flex-row lg:justify-start lg:gap-4"
			>
				<h1 className="text-center text-base font-bold md:text-lg lg:text-left lg:text-2xl">
					Admin
				</h1>
			</Link>
			<Item to="admin/add">
				<PlusIcon height={20} width={20} />
				<span>Add neighbor</span>
			</Item>
			<Item to="admin/expenses">
				<FileTextIcon height={20} width={20} />
				<span>Expenses</span>
			</Item>
			<Item to="admin/settings">
				<GearIcon height={20} width={20} />
				<span>Settings</span>
			</Item>
		</ul>
	)
}

export function LotOwnerSidebar({
	lotNumber,
	account,
}: {
	lotNumber: number
	account: string
}) {
	return (
		<ul>
			<Link
				to={`/dashboard`}
				className="mb-4 flex flex-col items-center justify-center gap-2 pl-8 pr-4 lg:flex-row lg:justify-start lg:gap-4"
			>
				<h1 className="text-center text-base font-bold md:text-lg lg:text-left lg:text-2xl">
					Lot #{lotNumber}
				</h1>
			</Link>
			<hr />
			<Item to={`${account}/proposals`}>
				<RocketIcon height={20} width={20} />
				<span>Proposals</span>
			</Item>
			<Item to={`${account}/expenses`}>
				<FileTextIcon height={20} width={20} />
				<span>Expenses</span>
			</Item>
			<Item to={`${account}/manage`}>
				<GearIcon height={20} width={20} />
				<span>Manage</span>
			</Item>
		</ul>
	)
}
