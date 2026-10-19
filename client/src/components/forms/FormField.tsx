"use client";

import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";
import type { FieldError } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = ComponentProps<typeof Input> & {
  id: string;
  label: string;
  error?: FieldError;
  // Shown inside the field on the left; it turns the brand color while the field has focus
  icon?: LucideIcon;
};

// A labelled input with its error message. Password fields get a show/hide button.
export default function FormField({
  id,
  label,
  error,
  icon: Icon,
  type,
  className,
  ...inputProps
}: Props) {
  const errorId = `${id}-error`;
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="group relative">
        {Icon && (
          <Icon
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary",
              error && "text-destructive group-focus-within:text-destructive",
            )}
          />
        )}
        <Input
          id={id}
          type={isPassword && revealed ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(Icon && "pl-10", isPassword && "pr-11", className)}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error?.message && (
        <p id={errorId} className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}
