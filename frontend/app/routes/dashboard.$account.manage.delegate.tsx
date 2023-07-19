import { Form, useLoaderData, useNavigate } from '@remix-run/react'
import type { DataFunctionArgs } from '@remix-run/server-runtime'
import type { AddressType } from '~/utils/address.ts'
import { formatTokenBalance } from '~/utils/formatter.ts'
import {
	getCommunityTokenBalance,
	getVotes,
	useDelegate,
} from '~/utils/token.ts'
import z from 'zod'
import { ethers, isAddress } from 'ethers'
import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { ErrorList, Field } from '~/components/forms.tsx'
import { Button } from '~/components/ui/button.tsx'
import { redirect } from '@remix-run/router'
import { json } from '@remix-run/node'

export const DelegateSchema = (delegator: string, canSelfDelegate: boolean) =>
	z.object({
		delegatee: z
			.string()
			.refine(value => ethers.isAddress(value), {
				message:
					'Provided address is invalid. Please insure you have typed correctly.',
			})
			.refine(value => canSelfDelegate || delegator !== value, {
				message:
					"You can't self delegate as all the tokens are already delegated.",
			}),
	})

export async function loader({ request, params }: DataFunctionArgs) {
	const account = params.account as AddressType
	if (!isAddress(account)) {
		throw redirect('/dashboard')
	}
	const [balance, votes] = await Promise.all<
		[Promise<bigint>, Promise<bigint>]
	>([getCommunityTokenBalance(account), getVotes(account)])

	return json({
		balance: balance.toString(),
		votes: votes.toString(),
		account,
	})
}

export default function Delegate() {
	const { balance, votes, account } = useLoaderData<typeof loader>()
	const navigate = useNavigate()
	const { execute, isLoading, error } = useDelegate()
	const canSelfDelegate = votes !== balance
	const schema = DelegateSchema(account!, canSelfDelegate)
	const [form, fields] = useForm({
		id: 'delegate-votes',
		constraint: getFieldsetConstraint(schema),
		defaultValue: {
			delegatee: canSelfDelegate ? account : '',
		},
		onValidate({ formData }) {
			return parse(formData, { schema })
		},
		onSubmit: async event => {
			event.preventDefault()
			const { delegatee } = event.currentTarget.elements as any
			try {
				await execute(delegatee.value)
				navigate(-1)
			} catch (e: any) {
				console.error(e)
			}
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onBlur',
	})

	function onSelfDelegate() {
		;(form.ref.current!.elements as any).delegatee.value = account
	}

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
					/ Delegate
				</h1>
			</div>
			<hr />
			<div className="p-4">
				<span className="text-sm font-bold">
					Token balance: {formatTokenBalance(balance, 'CTK')}
				</span>
				<br />
				<span className="items-center text-sm font-bold">
					Voting power: {formatTokenBalance(votes, 'CTK')}
				</span>
				<div className="mt-6 w-full rounded-md border border-card bg-card p-4 shadow-lg">
					<Form {...form.props}>
						<div className="flex flex-row items-center">
							<Field
								labelProps={{
									children: canSelfDelegate
										? 'Delegate to yourself or somewone else'
										: 'Delegate to someone else',
								}}
								inputProps={{
									...conform.input(fields.delegatee),
									autoComplete: 'delegatee',
								}}
								className="flex-1"
								errors={fields.delegatee.errors}
							/>
							{canSelfDelegate && (
								<Button type="button" variant="link" onClick={onSelfDelegate}>
									Self delegate
								</Button>
							)}
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
								{isLoading ? 'Delegating...' : ' => Delegate'}
							</Button>
						</div>
					</Form>
				</div>
			</div>
		</div>
	)
}
