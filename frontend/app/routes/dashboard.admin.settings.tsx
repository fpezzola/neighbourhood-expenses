import { Link, Outlet, useLoaderData } from '@remix-run/react'
import { getNeighborContractSettings } from '~/utils/neighbors.ts'
import { type DataFunctionArgs } from '@remix-run/server-runtime'
import { getGovernanceContractSettings } from '~/utils/governance.ts'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '~/components/ui/tooltip.tsx'
import { InfoCircledIcon, Pencil1Icon } from '@radix-ui/react-icons'
import { formatTokenBalance } from '~/utils/formatter.ts'
import { Role, useUser } from '~/utils/user.ts'

export async function loader({ request, params }: DataFunctionArgs) {
	const [neighborsContractSettings, governanceContractSettings] =
		await Promise.all<
			[
				ReturnType<typeof getNeighborContractSettings>,
				ReturnType<typeof getGovernanceContractSettings>,
			]
		>([getNeighborContractSettings(), getGovernanceContractSettings()])

	return {
		neighborsContractSettings,
		governanceContractSettings,
	}
}
export default function AdminContractSettings() {
	const user = useUser()
	const { neighborsContractSettings, governanceContractSettings } =
		useLoaderData<typeof loader>()
	if (user.role !== Role.ADMIN) {
		return <p>Not found.</p>
	}
	return (
		<div>
			<h1 className="mb-4 text-center text-base font-bold md:text-lg lg:text-left lg:text-2xl">
				Contracts settings
			</h1>
			<hr />
			<div className="flex flex-col space-y-2 p-4">
				<h3 className="mb-4 flex flex-row items-center space-x-2 text-center text-base font-bold md:text-lg lg:text-left lg:text-2xl">
					Neighbors contract
					<Link to="edit/neighbors-settings">
						<Pencil1Icon className=" ml-4 cursor-pointer" />
					</Link>
				</h3>
				<div className="flex flex-col">
					<SettingDisplay
						name="Time Within CTK mint"
						description="Time within CTK are mint to the user when the expenses are paid. Used to prevent multiple expenses payment in order to get more CTK."
					>
						{getTimeLabel(neighborsContractSettings.timeWithinTransfers)}
					</SettingDisplay>
				</div>
				<hr />
				<h3 className="mb-4 flex w-full flex-row items-baseline space-x-2 text-center text-base font-bold md:text-lg lg:text-left lg:text-2xl">
					Governance contract
					<Link to="edit/governance-settings">
						<Pencil1Icon className=" ml-4 cursor-pointer" />
					</Link>
				</h3>
				<div className="flex flex-col space-y-4">
					<SettingDisplay
						name="Proposal threshold"
						description="Amount of CTK the account must have in order to make a proposal"
					>
						{formatTokenBalance(
							governanceContractSettings.proposalThreshold,
							'CTK',
						)}
					</SettingDisplay>
					<SettingDisplay
						name="Voting delay"
						description="Number of blocks between the creation of the proposal and the start of voting."
					>
						{governanceContractSettings.votingDelay} Blocks
					</SettingDisplay>
					<SettingDisplay
						name="Voting period"
						description="Number of blocks where accounts can vote"
					>
						{governanceContractSettings.votingPeriod} Blocks
					</SettingDisplay>
					<SettingDisplay
						name="Targets"
						description="List of addresses that can be used as a proposal target."
					>
						<div className="flex flex-col space-y-1">
							{governanceContractSettings.targets.map(target => (
								<span key={target.target}>
									{target.target}: {target.description}
								</span>
							))}
						</div>
					</SettingDisplay>
				</div>
			</div>
			<Outlet />
		</div>
	)
}

export function SettingDisplay({
	name,
	description,
	children,
	isEditable,
	editPath,
}: {
	name: string
	children: React.ReactNode
	description: string
	isEditable?: boolean
	editPath?: string
}) {
	return (
		<div className="flex flex-col space-y-1">
			<div className="flex flex-row">
				<div className="flex flex-row items-center space-x-2">
					<span>{name}</span>
					<TooltipProvider delayDuration={100}>
						<Tooltip>
							<TooltipTrigger>
								<InfoCircledIcon height={14} width={14} />
							</TooltipTrigger>
							<TooltipContent className="w-52 rounded-md bg-foreground p-2 text-accent">
								{description}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
				<div>{isEditable ? <Link to={editPath || ''}>Edit</Link> : null}</div>
			</div>
			<div className="p-2 text-sm">{children}</div>
		</div>
	)
}

function getTimeLabel(time: number): string {
	const labels = [
		{ label: 'seconds', units: 60 },
		{ label: 'minutes', units: 60 },
		{ label: 'hours', units: 24 },
	]
	let reduced = time
	for (const lbl of labels) {
		if (!lbl.units || reduced < lbl.units) {
			return `${reduced} ${lbl.label}`
		}
		reduced = Math.ceil(reduced / lbl.units)
	}
	return `${reduced} days`
}
