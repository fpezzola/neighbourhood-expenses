import { Form, useLoaderData, useNavigate } from '@remix-run/react'
import z from 'zod'
import { ethers, isAddress } from 'ethers'
import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { useState } from 'react'
import { ErrorList, Field } from '~/components/forms.tsx'
import { Button } from '~/components/ui/button.tsx'
import {
	useTransferLotOwnership,
	getAllNeighbors,
	type LotOwner,
} from '~/utils/neighbors.ts'
import { type DataFunctionArgs } from '@remix-run/server-runtime'
import { formatTokenBalance } from '~/utils/formatter.ts'
import { json } from '@remix-run/node'
import { redirect } from '@remix-run/router'
export const TransferSchema = z.object({
	destination: z.string().refine(value => ethers.isAddress(value), {
		message:
			'Provided address is invalid. Please insure you have typed correctly.',
	}),
})

export async function loader({ request, params }: DataFunctionArgs) {
	const data = await getAllNeighbors()
	const account = params.account
	if (!isAddress(account)) {
		return redirect('/dashboard')
	}
	const neighbor = data.find(({ owner }) => owner === account)
	return json({
		neighbor,
	})
}

export default function Transfer() {
	const navigate = useNavigate()
	const { neighbor } = useLoaderData<{ neighbor: LotOwner }>()
	const [submitErr, setSubmitErr] = useState<string>()
	const debt = BigInt(neighbor!.debt)
	const { exectue, isLoading, error } = useTransferLotOwnership(debt)

	const [form, fields] = useForm({
		id: 'delegate-votes',
		constraint: getFieldsetConstraint(TransferSchema),
		onValidate({ formData }) {
			return parse(formData, { schema: TransferSchema })
		},
		onSubmit: async event => {
			event.preventDefault()
			const { destination } = event.currentTarget.elements as any
			try {
				await exectue(destination.value)
				navigate(-1)
			} catch (e: any) {
				setSubmitErr(e.details)
			}
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onBlur',
	})
	return (
		<div>
			<div className="flex flex-row items-center justify-between">
				<h1 className="mb-4 text-center text-base font-bold md:text-lg lg:text-left lg:text-2xl">
					<span
						onClick={() => navigate(-1)}
						className="cursor-pointer hover:underline"
					>
						Manage
					</span>{' '}
					/ Transfer
				</h1>
			</div>
			<hr />
			<div className="p-4">
				<p className="text-base font-bold text-red-500">
					Be aware that this operation cannot be undone
				</p>
				{debt > 0 ? (
					<span className="font-bold text-red-500">
						{`You owe ${formatTokenBalance(
							debt,
							'ETH',
						)}. You have to settle it up in the same lot ownership transaction transfer.`}
					</span>
				) : null}

				<div className="mt-6 w-full rounded-md border border-card bg-card p-4 shadow-lg">
					<Form {...form.props}>
						<div className="flex flex-row items-center">
							<Field
								labelProps={{
									children: 'Transfer to',
								}}
								inputProps={{
									...conform.input(fields.destination),
									autoComplete: 'destination',
								}}
								className="flex-1"
								errors={
									fields.destination.errors || submitErr
										? [submitErr]
										: undefined
								}
							/>
						</div>
						{error && (
							<div className="mb-3">
								<ErrorList
									errors={[(error as unknown as { details: string }).details]}
								/>
							</div>
						)}
						<div className="flex flex-row justify-end">
							<Button type="submit" disabled={isLoading}>
								{isLoading ? 'Transferring...' : ' <=> Transfer'}
							</Button>
						</div>
					</Form>
				</div>
			</div>
		</div>
	)
}
