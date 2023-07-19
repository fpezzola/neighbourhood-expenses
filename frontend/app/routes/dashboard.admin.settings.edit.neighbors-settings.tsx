import {
	Form,
	Link,
	useLoaderData,
	useNavigate,
	useRevalidator,
} from '@remix-run/react'
import {
	getNeighborContractSettings,
	useUpdateTimeWhitinTransfers,
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
import { Field } from '~/components/forms.tsx'
export const UpdateSettingsSchema = z.object({
	timeWithinTransfers: z
		.string()
		.or(z.string().regex(/\d+/).transform(Number))
		.refine(value => !Number.isNaN(value), { message: 'Invalid number' }),
})

export async function loader({ request, params }: DataFunctionArgs) {
	const [neighborsContractSettings] = await Promise.all<
		[ReturnType<typeof getNeighborContractSettings>]
	>([getNeighborContractSettings()])

	return {
		neighborsContractSettings,
	}
}
export default function EditNeighborsSettings() {
	const user = useUser()
	const { revalidate } = useRevalidator()
	const navigate = useNavigate()
	const { execute, isLoading } = useUpdateTimeWhitinTransfers()
	const { neighborsContractSettings } = useLoaderData<typeof loader>()

	const [form, fields] = useForm({
		id: 'update-time',
		constraint: getFieldsetConstraint(UpdateSettingsSchema),
		defaultValue: {
			timeWithinTransfers: neighborsContractSettings.timeWithinTransfers,
		},
		onValidate({ formData }) {
			return parse(formData, { schema: UpdateSettingsSchema })
		},
		onSubmit: async event => {
			event.preventDefault()
			const { timeWithinTransfers } = event.currentTarget.elements as any
			try {
				await execute(timeWithinTransfers.value)
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
				<DialogTitle className="text-left">Edit neighbors settings</DialogTitle>
				<hr />
				<Form {...form.props}>
					<Field
						labelProps={{
							children: 'Time within transfers (seconds)',
						}}
						inputProps={{
							...conform.input(fields.timeWithinTransfers),
							type: 'number',
							autoComplete: 'timeWithinTransfers',
						}}
						errors={fields.timeWithinTransfers.errors}
					/>
					<div className="flex gap-4">
						<Button disabled={isLoading} type="submit">
							{isLoading ? 'Submitting...' : 'Update settings'}
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
