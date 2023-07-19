import React from 'react'
import * as RadixSelect from '@radix-ui/react-select'
import { cn } from '~/utils/misc.ts'
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons'

interface Props extends React.PropsWithChildren {
	className?: string
	value: string
}

export type Option = {
	label: string
	value: string
}

export interface SelectProps
	extends React.SelectHTMLAttributes<HTMLSelectElement> {
	options: Option[]
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
	(props, forwardedRef) => (
		<RadixSelect.Root name={props.name}>
			<RadixSelect.Trigger
				ref={forwardedRef}
				type="button"
				className={cn(
					props.className,
					'flex flex-row items-center justify-between rounded-md bg-muted py-2 pl-2 pr-2 text-sm opacity-100 outline-none hover:opacity-80 focus:opacity-80 radix-state-open:opacity-80',
				)}
			>
				<RadixSelect.Value placeholder={props.placeholder} />
				<RadixSelect.Icon>
					<ChevronDownIcon />
				</RadixSelect.Icon>
			</RadixSelect.Trigger>
			<RadixSelect.Content
				position="popper"
				align="start"
				className="overflow-hidden rounded-md bg-muted text-sm shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]"
			>
				<RadixSelect.Viewport className="p-[5px]">
					<RadixSelect.Group>
						{props.options.map(option => (
							<SelectItem value={option.value} key={option.value}>
								{option.label}
							</SelectItem>
						))}
					</RadixSelect.Group>
				</RadixSelect.Viewport>
				<RadixSelect.ScrollDownButton className="text-violet11 flex h-[25px] cursor-default items-center justify-center bg-white">
					<ChevronDownIcon />
				</RadixSelect.ScrollDownButton>
			</RadixSelect.Content>
		</RadixSelect.Root>
	),
)

Select.displayName = 'Select'

const SelectItem = React.forwardRef<HTMLDivElement, Props>(
	({ children, className, ...props }, forwardedRef) => {
		return (
			<RadixSelect.Item
				className={cn(
					'hover:bg-night-500 radix-highlighted:bg-night-500 cursor-pointer rounded-t-sm px-7 py-5 outline-none',
					className,
				)}
				{...props}
				ref={forwardedRef}
			>
				<RadixSelect.ItemText>{children}</RadixSelect.ItemText>
				<RadixSelect.ItemIndicator className="absolute left-0 inline-flex w-[25px] items-center justify-center">
					<CheckIcon />
				</RadixSelect.ItemIndicator>
			</RadixSelect.Item>
		)
	},
)

SelectItem.displayName = 'SelectItem'

export default Select
