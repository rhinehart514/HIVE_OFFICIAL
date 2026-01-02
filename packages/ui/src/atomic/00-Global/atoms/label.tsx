import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "../../../lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "text-[#FAFAFA]",
        secondary: "text-[#A1A1A6]",
        destructive: "text-[#FF3737]",
        success: "text-[#00D46A]",
        warning: "text-[#FFB800]",
      },
      size: {
        default: "text-sm",
        sm: "text-xs",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, variant, size, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(labelVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </label>
  )
)
Label.displayName = "Label"

export { Label, labelVariants }
