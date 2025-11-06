import * as React from "react"
import { AlertCircleIcon } from "lucide-react"

import { cn } from "@/lib/utils/index"

/**
 * Form Error Component
 *
 * Displays validation errors for form fields.
 * Accessible with proper ARIA attributes.
 */

interface FormErrorProps extends React.ComponentProps<"p"> {
  /**
   * The error message to display
   */
  error?: string | null
  /**
   * Whether to show an icon
   */
  showIcon?: boolean
}

function FormError({
  error,
  showIcon = true,
  className,
  ...props
}: FormErrorProps) {
  if (!error) return null

  return (
    <p
      role="alert"
      aria-live="polite"
      data-slot="form-error"
      className={cn(
        "text-destructive flex items-center gap-1.5 text-sm font-medium",
        className
      )}
      {...props}
    >
      {showIcon && <AlertCircleIcon className="h-4 w-4 shrink-0" />}
      <span>{error}</span>
    </p>
  )
}

/**
 * Form Description Component
 *
 * Displays helper text for form fields.
 */

interface FormDescriptionProps extends React.ComponentProps<"p"> {
  /**
   * The description text to display
   */
  description?: string | null
}

function FormDescription({
  description,
  className,
  ...props
}: FormDescriptionProps) {
  if (!description) return null

  return (
    <p
      data-slot="form-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    >
      {description}
    </p>
  )
}

/**
 * Form Field Group Component
 *
 * Groups a label, input, description, and error together.
 */

interface FormFieldProps extends React.ComponentProps<"div"> {
  /**
   * Label for the field
   */
  label?: string
  /**
   * Helper text
   */
  description?: string
  /**
   * Error message
   */
  error?: string | null
  /**
   * Whether the field is required
   */
  required?: boolean
  /**
   * ID for the input element (for label association)
   */
  htmlFor?: string
}

function FormField({
  label,
  description,
  error,
  required,
  htmlFor,
  children,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div
      data-slot="form-field"
      className={cn("space-y-2", className)}
      {...props}
    >
      {label && (
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
      )}

      {children}

      {description && !error && (
        <FormDescription description={description} />
      )}

      {error && <FormError error={error} />}
    </div>
  )
}

export { FormError, FormDescription, FormField }
