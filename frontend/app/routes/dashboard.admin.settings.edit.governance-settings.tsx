import {
	Form,
	Link,
	useLoaderData,
	useNavigate,
	useRevalidator,
} from '@remix-run/react'
import {
	getAllNeighbors,
	getNeighborContractSettings,
} from '~/utils/neighbors.ts'
import { type DataFunctionArgs } from '@remix-run/server-runtime'
import { Role, useUser } from '~/utils/user.ts'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogTitle,
} from '~/components/ui/dialog.tsx'
import z from 'zod'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { conform, useForm } from '@conform-to/react'
import { Button } from '~/components/ui/button.tsx'
import { cn } from '~/utils/misc.ts'
import { Cross1Icon } from '@radix-ui/react-icons'
import { ErrorList, Field } from '~/components/forms.tsx'
import { isAddress } from 'ethers'
import { useAddTarget } from '~/utils/governance.ts'
export const AddTargetSchema = (allNeighbors: string[]) =>
	z.object({
		address: z
			.string()
			.refine(value => isAddress(value), { message: 'Invalid address' })
			.refine(value => !allNeighbors.includes(value), {
				message: 'A neighbor cannot be a target',
			}),
		description: z.string(),
	})

export async function loader({ request, params }: DataFunctionArgs) {
	const [neighborsContractSettings, allNeighbors] = await Promise.all<
		[
			ReturnType<typeof getNeighborContractSettings>,
			ReturnType<typeof getAllNeighbors>,
		]
	>([getNeighborContractSettings(), getAllNeighbors()])

	return {
		neighborsContractSettings,
		allNeighbors,
	}
}
export default function AddGovernanceSetting() {
	const user = useUser()
	const { revalidate } = useRevalidator()
	const navigate = useNavigate()
	const { execute, isLoading, error: submitErr } = useAddTarget()
	const { neighborsContractSettings, allNeighbors } =
		useLoaderData<typeof loader>()

	const schema = AddTargetSchema(allNeighbors.map(({ owner }) => owner))

	const [form, fields] = useForm({
		id: 'add-target',
		constraint: getFieldsetConstraint(schema),
		defaultValue: {
			timeWithinTransfers: neighborsContractSettings.timeWithinTransfers,
		},
		onValidate({ formData }) {
			return parse(formData, { schema })
		},
		onSubmit: async event => {
			event.preventDefault()
			const { address, description } = event.currentTarget.elements as any
			try {
				await execute(address.value, description.value)
				revalidate()
				dismissModal()
			} catch (e: any) {
				console.log(e)
			}
		},
		shouldRevalidate: 'onBlur',
	})

	if (user.role !== Role.ADMIN) {
		return <p>Not found.</p>
	}

	const dismissModal = () =>
		navigate('..', { preventScrollReset: true, replace: true })
	return (
		<Dialog open={true}>
			<DialogContent
				onEscapeKeyDown={dismissModal}
				onPointerDownOutside={dismissModal}
				className="fixed left-1/2 top-1/2 w-[10vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 transform rounded-lg border-2 bg-background p-12 shadow-lg"
			>
				<DialogTitle className="text-left">
					Add new governance target
				</DialogTitle>
				<hr />
				<Form {...form.props}>
					<Field
						labelProps={{
							children: 'Target address',
						}}
						inputProps={{
							...conform.input(fields.address),
							autoComplete: 'address',
						}}
						errors={fields.address.errors}
					/>
					<Field
						labelProps={{
							children: 'Target name',
						}}
						inputProps={{
							...conform.input(fields.description),
							autoComplete: 'description',
						}}
						errors={fields.description.errors}
					/>
					{submitErr && (
						<div className="mb-3">
							<ErrorList
								errors={[(submitErr as unknown as { details: string }).details]}
							/>
						</div>
					)}
					<div className="flex gap-4">
						<Button disabled={isLoading} type="submit">
							{isLoading ? 'Submitting...' : 'Add target'}
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
						<Cross1Icon />
					</Link>
				</DialogClose>
			</DialogContent>
		</Dialog>
	)
}
