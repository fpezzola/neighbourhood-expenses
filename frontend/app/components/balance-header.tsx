import { formatTokenBalance } from '~/utils/formatter.ts'

function BalanceHeader({
	value,
	symbol,
	prefix,
}: {
	prefix: string
	value: string
	symbol: string
}) {
	return (
		<span className="text-center text-sm font-bold">{`${prefix}: ${formatTokenBalance(
			value,
			symbol,
		)}`}</span>
	)
}

export default BalanceHeader
