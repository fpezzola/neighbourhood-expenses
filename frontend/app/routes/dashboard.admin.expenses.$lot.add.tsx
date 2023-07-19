import {
	Form,
	Link,
	useLoaderData,
	useNavigate,
	useRevalidator,
} from '@remix-run/react'
import { type DataFunctionArgs, json } from '@remix-run/server-runtime'
import { ErrorList, Field } from '~/components/forms.tsx'
import { getAllNeighbors, useAddDebt } from '~/utils/neighbors.ts'
import z from 'zod'
import { ethers } from 'ethers'
import { useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { Button } from '~/components/ui/button.tsx'
import { cn } from '~/utils/misc.ts'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogTitle,
} from '~/components/ui/dialog.tsx'
import { Cross1Icon } from '@radix-ui/react-icons'

const BACK_ROUTE = '..'

export const AddDebtSchema = z.object({
	debt: z
		.string()
		.or(z.string().regex(/\d+/).transform(Number))
		.refine(value => !Number.isNaN(value), { message: 'Invalid number' })
		.refine(
			value => Number(value) > 0 && Number(value.toString()) <= 2,
			`Monthly expense cannot exceed 2 ETH.`,
		),
})

export async function loader({ params }: DataFunctionArgs) {
	const lot = params.lot
	const data = await getAllNeighbors()
	const lotData = data.find(d => Number(d.lotNumber) === Number(lot))
	if (!lotData) {
		throw new Response('Not found', { status: 404 })
	}
	return json({
		lotData: lotData,
	})
}

export default function AdminDebtsManagement() {
	const navigate = useNavigate()
	const { execute, isLoading, error } = useAddDebt()
	const { revalidate } = useRevalidator()
	const { lotData } = useLoaderData<typeof loader>()
	const [form, fields] = useForm({
		id: 'add-debt',
		constraint: getFieldsetConstraint(AddDebtSchema),
		onValidate({ formData }) {
			return parse(formData, { schema: AddDebtSchema })
		},
		onSubmit: async event => {
			event.preventDefault()
			const { debt } = event.currentTarget.elements as any
			try {
				await execute(
					lotData.lotNumber,
					ethers.parseUnits(debt.value, 18).toString(),
				)
				revalidate()
				navigate(BACK_ROUTE, { preventScrollReset: true, replace: true })
			} catch (e: any) {
				console.log(e)
			}
		},
		shouldRevalidate: 'onBlur',
	})
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
					Add Lot #{lotData.lotNumber} debt
				</DialogTitle>
				<hr />
				<span>
					{`Current Lot debt is: ${ethers.formatUnits(
						lotData.debt.toString(),
					)} ETH`}
				</span>
				<Form {...form.props} id="debt-form">
					<Field
						labelProps={{
							children: 'Debt (ETH)',
						}}
						inputProps={{
							name: 'debt',
							autoComplete: 'debt',
						}}
						errors={fields.debt.errors}
					/>
					{error && (
						<div className="mb-3">
							<ErrorList
								errors={[(error as unknown as { details: string }).details]}
							/>
						</div>
					)}
					<div className="flex gap-4">
						<Button disabled={isLoading} type="submit">
							{isLoading ? 'Submitting...' : 'Add debt'}
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
