import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/btn inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded border border-transparent font-medium text-sm outline-none transition-all duration-300 ease-[var(--ease-swift)] hover:cursor-pointer focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-foreground/60 [&_svg]:group-hover/btn:text-foreground",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white hover:bg-primary/85 hover:text-white [&_svg]:text-white/60 [&_svg]:group-hover/btn:text-white",
        destructive:
          "border-destructive/80 bg-destructive/10 text-destructive hover:border-destructive hover:bg-destructive/90 hover:text-white focus-visible:ring-destructive/20",
        outline:
          "border border-input bg-sheet hover:bg-background-100 hover:text-foreground",
        secondary:
          "bg-background-100 text-foreground hover:bg-background-300",
        ghost: "hover:bg-background-100 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2",
        xs: "h-7 gap-1.5 px-2.5 text-xs has-[>svg]:px-1.5",
        lg: "h-10 px-8 has-[>svg]:gap-3 has-[>svg]:px-10",
        icon: "size-9",
        "icon-small": "size-6 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      data-slot="button"
      {...props}
    />
  );
}

export { Button, buttonVariants };
