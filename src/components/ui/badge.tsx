import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
    {
        variants: {
            variant: {
                default:
                    "bg-[hsl(var(--primary)/0.2)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.3)]",
                secondary:
                    "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] border border-[hsl(var(--border))]",
                destructive:
                    "bg-[hsl(var(--destructive)/0.2)] text-[hsl(var(--destructive))] border border-[hsl(var(--destructive)/0.3)]",
                success:
                    "bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.3)]",
                warning:
                    "bg-[hsl(var(--warning)/0.2)] text-[hsl(var(--warning))] border border-[hsl(var(--warning)/0.3)]",
                outline: "border border-[hsl(var(--border))] text-[hsl(var(--foreground))]",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
