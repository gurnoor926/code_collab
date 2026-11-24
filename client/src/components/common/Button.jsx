import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

const variantStyles = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 border-transparent",
  secondary:
    "bg-white/10 text-white hover:bg-white/15 border-white/10",
  outline:
    "border-white/15 text-zinc-300 hover:border-white/30 hover:bg-white/5 hover:text-white",
  danger:
    "bg-red-600/90 text-white hover:bg-red-500 shadow-md shadow-red-600/20 border-transparent",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 border-transparent",
  ghost:
    "text-zinc-400 hover:bg-white/5 hover:text-white border-transparent",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2.5",
};

const Button = forwardRef(function Button(
  {
    children,
    loading = false,
    loadingText,
    disabled = false,
    icon: Icon,
    iconPosition = "left",
    variant = "primary",
    size = "md",
    className = "",
    type = "button",
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;
  const currentVariant = variantStyles[variant] || variantStyles.primary;
  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={`relative inline-flex items-center justify-center font-semibold border transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${currentVariant} ${currentSize} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2
            size={size === "sm" ? 13 : size === "lg" ? 18 : 15}
            className="animate-spin shrink-0"
          />
          {loadingText ? <span>{loadingText}</span> : children}
        </>
      ) : (
        <>
          {Icon && iconPosition === "left" && (
            <Icon size={size === "sm" ? 13 : size === "lg" ? 18 : 15} className="shrink-0" />
          )}
          <span>{children}</span>
          {Icon && iconPosition === "right" && (
            <Icon size={size === "sm" ? 13 : size === "lg" ? 18 : 15} className="shrink-0" />
          )}
        </>
      )}
    </button>
  );
});

export default Button;
