import React from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import { cn } from '~/utils/misc.ts'

interface Props extends React.PropsWithChildren {
	className?: string
}
export const AccordionItem = React.forwardRef<
	HTMLDivElement,
	Props & { value: string }
>(({ children, className, ...props }, forwardedRef) => (
	<Accordion.Item
		className={cn(
			'focus-within:shadow-mauve12 mt-px overflow-hidden first:mt-0 first:rounded-t last:rounded-b focus-within:relative focus-within:z-10 focus-within:shadow-[0_0_0_2px]',
			className,
		)}
		{...props}
		ref={forwardedRef}
	>
		{children}
	</Accordion.Item>
))

AccordionItem.displayName = 'AccordionItem'

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, Props>(
	({ children, className, ...props }, forwardedRef) => (
		<Accordion.Header className="flex">
			<Accordion.Trigger
				className={cn(
					'text-violet11 shadow-mauve6 hover:bg-mauve2 group flex h-[45px] flex-1 cursor-default items-center justify-between bg-white px-5 text-[15px] leading-none shadow-[0_1px_0] outline-none',
					className,
				)}
				{...props}
				ref={forwardedRef}
			>
				{children}
			</Accordion.Trigger>
		</Accordion.Header>
	),
)

AccordionTrigger.displayName = 'AccordionTrigger'

export const AccordionContent = React.forwardRef<HTMLDivElement, Props>(
	({ children, className, ...props }, forwardedRef) => (
		<Accordion.Content
			className={cn(
				'text-mauve11 bg-mauve2 data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden text-[15px]',
				className,
			)}
			{...props}
			ref={forwardedRef}
		>
			<div className="px-5 py-[15px]">{children}</div>
		</Accordion.Content>
	),
)
AccordionContent.displayName = 'AccordionContent'
