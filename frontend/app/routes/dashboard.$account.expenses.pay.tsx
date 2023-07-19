import {
	Form,
	Link,
	useNavigate,
	useRevalidator,
	useRouteLoaderData,
} from '@remix-run/react'
import { usePayExpenses, type LotOwner } from '~/utils/neighbors.ts'
import { useAccount, useBalance } from 'wagmi'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogTitle,
} from '~/components/ui/dialog.tsx'
import z from 'zod'
import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { ethers, formatUnits } from 'ethers'
import { ErrorList, Field } from '~/components/forms.tsx'
import { Button } from '~/components/ui/button.tsx'
import { cn } from '~/utils/misc.ts'
import { Cross1Icon } from '@radix-ui/react-icons'

const ExpensesPaymentSchema = (debt: string) =>
	z.object({
		amount: z
			.string()
			.or(z.string().regex(/\d+/).transform(Number))
			.refine(value => !Number.isNaN(value), { message: 'Invalid number' })
			.refine(
				value =>
					Number(value) > 0 &&
					Number(value.toString()) <= Number(debt.toString()),
				`Payment should be greater than 0 and lower than ${debt}ETH.`,
			),
	})

export default function PayExpenses() {
	const navigate = useNavigate()
	const { revalidate } = useRevalidator()
	const { neighbor } = useRouteLoaderData(
		`routes/dashboard.$account.expenses`,
	) as {
		neighbor: LotOwner
	}
	const account = useAccount()
	const balance = useBalance({ address: account.address })
	const { execute, isLoading, error } = usePayExpenses()
	const dismissModal = () => navigate('..', { preventScrollReset: true })

	const formattedDebt = formatUnits(neighbor!.debt.toString())
	const schema = ExpensesPaymentSchema(formattedDebt)

	const [form, fields] = useForm({
		id: 'pay-debt',
		constraint: getFieldsetConstraint(schema),
		onValidate({ formData }) {
			return parse(formData, { schema })
		},
		onSubmit: async event => {
			event.preventDefault()
			const { amount } = event.currentTarget.elements as any
			try {
				await execute(ethers.parseEther(amount.value))
				revalidate()
				dismissModal()
			} catch (e: any) {
				console.log(e)
			}
		},
		shouldRevalidate: 'onBlur',
	})

	if (neighbor?.owner !== account.address) {
		return <span>Please switch your wallet account to {neighbor?.owner}.</span>
	}

	function onFullPayment() {
		//not sure this is the correct way (don't think so...)
		;(form.ref.current!.elements as any).amount.value = formattedDebt
	}
	return (
		<Dialog open={true}>
			<DialogContent
				onEscapeKeyDown={dismissModal}
				onPointerDownOutside={dismissModal}
				className="fixed left-1/2 top-1/2 w-[10vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 transform rounded-lg border-2 bg-background p-12 shadow-lg"
			>
				<DialogTitle asChild className="text-left">
					<h2 className="text-h2">Payment</h2>
				</DialogTitle>
				<hr />
				<span>Current debt is: {`${formattedDebt} ETH`}</span>
				<Form {...form.props}>
					<div className="flex flex-row items-center">
						<Field
							labelProps={{
								children: 'Amount (ETH)',
							}}
							className="w-3/4"
							inputProps={{
								...conform.input(fields.amount),
							}}
							errors={fields.amount.errors}
						/>
						{balance.data ? (
							<Button
								type="button"
								variant="link"
								disabled={balance.data.value <= neighbor.debt}
								onClick={onFullPayment}
							>
								Full payment
							</Button>
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
							{isLoading ? 'Submitting...' : 'Pay'}
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
