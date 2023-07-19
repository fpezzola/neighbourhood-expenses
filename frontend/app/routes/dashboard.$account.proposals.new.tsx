import { Form, useLoaderData, useNavigate } from '@remix-run/react'
import type { DataFunctionArgs } from '@remix-run/server-runtime'
import { json } from '@remix-run/node'
import z from 'zod'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { conform, useForm } from '@conform-to/react'
import {
	ErrorList,
	Field,
	SelectField,
	TextareaField,
} from '~/components/forms.tsx'
import type { Option } from '~/components/ui/select.tsx'
import { Button } from '~/components/ui/button.tsx'
import { getTargets, usePropose } from '~/utils/governance.ts'
import { ethers } from 'ethers'

const NewProposalSchema = z.object({
	amount: z
		.string()
		.or(z.string().regex(/\d+/).transform(Number))
		.refine(value => !Number.isNaN(value), { message: 'Invalid number' })
		.refine(
			value => Number(value) > 0 && Number(value) <= 1,
			`Proposal value should be between 0 and 1 ETH.`,
		),
	target: z.string().refine(value => {
		return !!value
	}, 'Please, select one target.'),
	description: z
		.string()
		.min(30, 'Description too short, please write at least 50 characters.')
		.max(200, 'Description too long, please limit it to 200 characters.'),
})

function toOptions(contractData: any[]): Option[] {
	return contractData.map(d => ({
		label: d.description,
		value: d.target,
	}))
}

export async function loader({ request, params }: DataFunctionArgs) {
	const targets = await getTargets()
	return json({
		targets,
	})
}

export default function NewProposal() {
	const { targets } = useLoaderData<typeof loader>()
	const { execute: propose, isLoading, error } = usePropose()
	const navigate = useNavigate()
	const [form, fields] = useForm({
		id: 'add-proposal',
		constraint: getFieldsetConstraint(NewProposalSchema),
		onValidate({ formData }) {
			return parse(formData, { schema: NewProposalSchema })
		},
		onSubmit: async event => {
			event.preventDefault()
			const { target, amount, description } = event.currentTarget
				.elements as any
			try {
				await propose(
					target.value,
					ethers.parseEther(amount.value).toString(),
					description.value,
				)
				navigate(-1)
			} catch (e: any) {
				console.error(e)
			}
		},
		shouldRevalidate: 'onBlur',
	})
	return (
		<div>
			<div className="flex flex-row items-center justify-between">
				<h1 className="mb-4 text-center text-base font-bold md:text-lg lg:text-left lg:text-2xl">
					New proposal
				</h1>
			</div>
			<hr />
			<div className="p-4">
				<Form {...form.props}>
					<SelectField
						className="flex flex-col space-y-2"
						labelProps={{ children: 'Target' }}
						selectProps={{
							...conform.select(fields.target),
							autoComplete: 'target',
							options: toOptions(targets!),
							placeholder: 'Select a target',
							className: 'w-72',
						}}
						errors={fields.target.errors}
					/>
					<Field
						labelProps={{ children: 'Amount' }}
						inputProps={{
							...conform.input(fields.amount),
							placeholder: 'Proposal budget...',
						}}
						errors={fields.amount.errors}
					/>
					<TextareaField
						labelProps={{ children: 'Description' }}
						textareaProps={{
							...conform.textarea(fields.description),
							placeholder: 'Write a suitable description',
						}}
						errors={fields.description.errors}
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
							{!isLoading ? '+ Propose' : 'Submitting...'}
						</Button>
					</div>
				</Form>
			</div>
		</div>
	)
}
