import { Form } from '@remix-run/react'
import { ErrorList, Field } from '~/components/forms.tsx'
import z from 'zod'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { conform, useForm } from '@conform-to/react'
import { ethers } from 'ethers'
import { Button } from '~/components/ui/button.tsx'
import { useAddNeighbor } from '~/utils/neighbors.ts'

const MAX_LOT_NUMBER = 2 ** 16 - 1

export const AddNeighborSchema = z.object({
	owner: z.string().refine(value => ethers.isAddress(value), {
		message:
			'Provided address is invalid. Please insure you have typed correctly.',
	}),
	area: z
		.string()
		.or(z.string().regex(/\d+/).transform(Number))
		.refine(value => !Number.isNaN(value), { message: 'Invalid number' })
		.refine(value => Number(value) > 0, {
			message: 'Area should be greater than 0',
		}),
	lotNumber: z
		.string()
		.or(z.string().regex(/\d+/).transform(Number))
		.refine(value => !Number.isNaN(value), { message: 'Invalid number' })
		.refine(
			value => Number(value) > 0 && Number(value) < 2 ** 16 - 1,
			`Lot number should be between ${1} and ${MAX_LOT_NUMBER}`,
		),
})

export default function AdminManagement() {
	const { execute, isLoading, error } = useAddNeighbor()
	const [form, fields] = useForm({
		id: 'add-neighbor',
		constraint: getFieldsetConstraint(AddNeighborSchema),
		onValidate({ formData }) {
			return parse(formData, { schema: AddNeighborSchema })
		},
		onSubmit: async event => {
			event.preventDefault()
			const { area, lotNumber, owner } = event.currentTarget.elements as any
			try {
				await execute(owner.value, lotNumber.value, area.value)
				form.ref.current?.reset()
			} catch (e: any) {
				console.error(e)
			}
		},
		shouldRevalidate: 'onBlur',
	})
	return (
		<div>
			<h1 className="mb-4 text-center text-base font-bold md:text-lg lg:text-left lg:text-2xl">
				Add neighbor
			</h1>
			<hr />
			<div className="p-4">
				<Form {...form.props}>
					<Field
						labelProps={{ children: 'Lot owner' }}
						inputProps={{
							...conform.input(fields.owner),
							autoComplete: 'owner',
						}}
						errors={fields.owner.errors}
					/>
					<Field
						labelProps={{ children: 'Lot number' }}
						inputProps={{
							...conform.input(fields.lotNumber),
							autoComplete: 'lotNumber',
							type: 'number',
						}}
						errors={fields.lotNumber.errors}
					/>
					<Field
						labelProps={{ children: 'Lot area' }}
						inputProps={{
							...conform.input(fields.area),
							autoComplete: 'area',
							type: 'number',
						}}
						errors={fields.area.errors}
					/>
					{error && (
						<div className="mb-3">
							<ErrorList
								errors={[(error as unknown as { details: string }).details]}
							/>
						</div>
					)}
					<div className="flex flex-row justify-end">
						<Button type="submit" disabled={isLoading}>
							{!isLoading ? '+ Add' : 'Submitting...'}
						</Button>
					</div>
				</Form>
			</div>
		</div>
	)
}
