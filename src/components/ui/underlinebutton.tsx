import * as React from "react"
import { cn } from "@/lib/utils"

interface UnderlineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  variant?: 'default' | 'green' | 'blue' | 'gray';
  active?: boolean;
}

const UnderlineButton = React.forwardRef<HTMLButtonElement, UnderlineButtonProps>(
  ({ className, children, icon, variant = 'default', active = false, ...props }, ref) => {
    const variantStyles = {
      default: {
        text: "text-black dark:text-white",
        underline: "after:bg-black dark:after:bg-white"
      },
      green: {
        text: "text-green-700",
        underline: "after:bg-green-700"
      },
      blue: {
        text: "text-blue-700",
        underline: "after:bg-blue-700"
      },
      gray: {
        text: "text-gray-600",
        underline: "after:bg-gray-700"
      }
    }

    return (
      <button
        className={cn(
          "cta relative border-none bg-transparent cursor-pointer",
          className
        )}
        ref={ref}
        {...props}
      >
        <span className={cn(
          "flex items-center gap-2 pb-2 relative",
          "after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5",
          "after:transition-transform after:duration-300",
          active ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100",
          active ? "after:transform-none" : "after:origin-right hover:after:origin-left",
          variantStyles[variant].text,
          variantStyles[variant].underline,
          active && "font-semibold"
        )}>
          {icon}
          {children}
        </span>
      </button>
    )
  }
)

UnderlineButton.displayName = "UnderlineButton"

export { UnderlineButton }

