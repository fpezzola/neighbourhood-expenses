import type { DataFunctionArgs } from '@remix-run/server-runtime'
import type { AddressType } from '~/utils/address.ts'
import { json } from '@remix-run/node'
import {
	getProposalDetailsForAccount,
	ProposalState,
	useCastVote,
} from '~/utils/governance.ts'
import {
	Form,
	Link,
	useLoaderData,
	useNavigate,
	useRevalidator,
} from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import z from 'zod'
import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import * as RadioGroup from '@radix-ui/react-radio-group'
import { formatTokenBalance } from '~/utils/formatter.ts'

import { Button } from '~/components/ui/button.tsx'
import { ErrorList } from '~/components/forms.tsx'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogTitle,
} from '~/components/ui/dialog.tsx'
import { cn } from '~/utils/misc.ts'
import { redirect } from '@remix-run/router'
import { Cross1Icon } from '@radix-ui/react-icons'

const VoteSchema = z.object({
	support: z.string({ required_error: 'You need to indicate your position.' }),
})

export async function loader({ request, params }: DataFunctionArgs) {
	const proposalId = params.proposalId as string
	const account = params.account as AddressType
	const [proposalData] = await Promise.all<
		[ReturnType<typeof getProposalDetailsForAccount>]
	>([getProposalDetailsForAccount(proposalId, account)])

	if (!proposalData.proposal) {
		throw redirect('..')
	}

	if (
		Object.values(ProposalState)[proposalData.proposalState!] !==
		ProposalState.ACTIVE
	) {
		throw redirect('..?error=not_active')
	}

	if (proposalData.support !== undefined) {
		throw redirect('..?error=already_voted')
	}

	return json({
		proposalData,
	})
}

export default function ProposalDetails() {
	const navigate = useNavigate()
	const { revalidate } = useRevalidator()
	const { proposalData } = useLoaderData<typeof loader>()
	const { proposal } = proposalData
	const {
		execute: castVote,
		isLoading,
		error,
	} = useCastVote(proposalData.proposal!.proposalId)
	const [form, fields] = useForm({
		id: 'vote',
		constraint: getFieldsetConstraint(VoteSchema),
		defaultValue: {
			support:
				proposalData.support !== undefined
					? proposalData.support.toString()
					: undefined,
		},
		onValidate({ formData }) {
			return parse(formData, { schema: VoteSchema })
		},
		onSubmit: async event => {
			event.preventDefault()
			const { support } = event.currentTarget.elements as any
			try {
				await castVote(support.value)
				revalidate()
				navigate(-1)
			} catch (e: any) {
				console.log(e)
			}
		},
		shouldRevalidate: 'onInput',
	})
	const canVote =
		BigInt(proposalData.votesAtTimepoint ?? '0') > 0 &&
		proposalData.support === undefined
	const dismissModal = () =>
		navigate('..', { preventScrollReset: true, replace: true })
	return (
		<Dialog open={true}>
			<DialogContent
				onEscapeKeyDown={dismissModal}
				onPointerDownOutside={dismissModal}
				className="fixed left-1/2 top-1/2 w-[10vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 transform rounded-lg border-2 bg-background p-12 shadow-lg"
			>
				<DialogTitle className="text-left">Vote proposal</DialogTitle>
				<hr />
				<span>{proposal?.description}</span>
				<Form {...form.props} className="flex flex-col space-y-1">
					<div className="w-72 p-4">
						<RadioGroup.Root
							className="flex flex-col gap-2.5"
							{...conform.input(fields.support)}
							aria-label="Vote support"
							name="support"
							disabled={!canVote || isLoading}
						>
							<RadioItem id="against" value="0">
								{`Against (${formatTokenBalance(
									proposalData.proposalVotes?.[0] ?? '0',
									'CTK',
								)})`}
							</RadioItem>
							<RadioItem id="for" value="1">
								{`For (${formatTokenBalance(
									proposalData.proposalVotes?.[1] ?? '0',
									'CTK',
								)})`}
							</RadioItem>
							<RadioItem id="abstain" value="2">
								{`Abstain (${formatTokenBalance(
									proposalData.proposalVotes?.[2] ?? '0',
									'CTK',
								)})`}
							</RadioItem>
						</RadioGroup.Root>
					</div>

					<div className="px-4 pb-3 pt-1">
						{fields.support.errors?.length ? (
							<ErrorList id={'support-err'} errors={fields.support.errors} />
						) : null}
					</div>
					{error && (
						<div className="mb-3">
							<ErrorList
								errors={[(error as unknown as { details: string }).details]}
							/>
						</div>
					)}
					<div className="flex gap-4">
						<Button disabled={isLoading} type="submit">
							{isLoading ? 'Voting...' : 'Vote'}
						</Button>
						<Button
							disabled={isLoading}
							type="button"
							variant="secondary"
							onClick={dismissModal}
						>
							Cancel
						</Button>
					</div>
				</Form>
				<DialogClose asChild>
					<Link
						to=".."
						preventScrollReset
						aria-label="Close"
						className={cn(
							'absolute right-10 top-10',
							isLoading && 'pointer-events-none',
						)}
					>
						<Cross1Icon height={20} width={20} />
					</Link>
				</DialogClose>
			</DialogContent>
		</Dialog>
	)
}

export function RadioItem({
	activeColor,
	id,
	value,
	children,
}: {
	activeColor?: string
	id: string
	value: string
	children: React.ReactNode
}) {
	return (
		<div className="flex items-center">
			<RadioGroup.Item
				className="disabled:bg-gray hover:opicity-80 h-[25px] w-[25px] cursor-default rounded-full  bg-foreground outline-none hover:cursor-pointer focus:shadow-[0_0_0_2px] focus:shadow-black"
				value={value}
				id={id}
				type="button"
			>
				<RadioGroup.Indicator className="relative flex h-full w-full items-center justify-center after:block after:h-[11px] after:w-[11px] after:rounded-[50%] after:bg-accent after:content-['']" />
			</RadioGroup.Item>
			<label
				className="pl-[15px] text-[15px] leading-none text-foreground"
				htmlFor={id}
			>
				{children}
			</label>
		</div>
	)
}

export function DetailItem({
	label,
	children,
}: {
	label: string
	children: React.ReactNode
}) {
	return (
		<div className="mt-2">
			<span className="text-base font-bold">{label}</span>
			<p className="text-sm">{children}</p>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No proposal with id {params.proposalId} found</p>
				),
			}}
		/>
	)
}
