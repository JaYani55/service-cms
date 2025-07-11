import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-normal ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "", // No color, just neutral
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        textlink: "text-[#2b3645] font-semibold underline hover:text-[#2b3645]/80 p-0 h-auto",
        newEvent: [
          "bg-[#5ba8a4] hover:bg-[#3b7a77] text-black",
          "dark:bg-[#5ba8a4] dark:hover:bg-[#3b7a77] dark:text-black",
        ],
        answer: [
          "bg-gradient-to-r from-amber-100 to-amber-200",
          "hover:from-amber-200 hover:to-amber-300",
          "shadow-[2px_2px_6px_-1px_rgba(0,0,0,0.2)]",
          "border border-amber-300/30",
          "dark:from-amber-700 dark:to-amber-600",
          "dark:text-amber-50",
          "dark:hover:from-amber-600 dark:hover:to-amber-500",
          "dark:shadow-[2px_2px_6px_-1px_rgba(0,0,0,0.4)]",
        ],
        request: [
          "bg-gradient-to-r from-[#7497C0] to-[#adcff8]",
          "text-black",
          "hover:from-[#adcff8] hover:to-[#7497C0]",
          "shadow-sm"
        ],
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        xl: "h-12 px-10 py-3 text-lg font-semibold", // wider, not higher
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, loadingText, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" aria-hidden="true" />
            <span className="sr-only">Loading</span>
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
