import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm disabled:bg-brand-300",
  secondary:
    "bg-white text-ink-700 border border-ink-200 hover:bg-ink-50 active:bg-ink-100 shadow-sm disabled:text-ink-300",
  ghost: "bg-transparent text-ink-600 hover:bg-ink-100 active:bg-ink-200 disabled:text-ink-300",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm disabled:bg-red-300",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-2.5 text-xs gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", icon, loading, className, children, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 whitespace-nowrap disabled:cursor-not-allowed",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...rest}
      >
        {loading ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          icon
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
