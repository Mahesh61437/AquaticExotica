"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
  registerDescription: () => void
  unregisterDescription: () => void
  registerMessage: () => void
  unregisterMessage: () => void
  hasDescription: boolean
  hasMessage: boolean
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()
  const [hasDescription, setHasDescription] = React.useState(false)
  const [hasMessage, setHasMessage] = React.useState(false)

  const registerDescription = React.useCallback(() => setHasDescription(true), [])
  const unregisterDescription = React.useCallback(() => setHasDescription(false), [])
  const registerMessage = React.useCallback(() => setHasMessage(true), [])
  const unregisterMessage = React.useCallback(() => setHasMessage(false), [])

  return (
    <FormItemContext.Provider
      value={{
        id,
        registerDescription,
        unregisterDescription,
        registerMessage,
        unregisterMessage,
        hasDescription,
        hasMessage,
      }}
    >
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  const itemContext = React.useContext(FormItemContext)

  // Build aria-describedby only when description or message exist
  let ariaDescribedBy: string | undefined
  const hasDesc = itemContext?.hasDescription
  const hasMsg = itemContext?.hasMessage

  if (!hasDesc && !hasMsg) {
    ariaDescribedBy = undefined
  } else if (!error) {
    ariaDescribedBy = hasDesc ? `${formDescriptionId}` : undefined
  } else {
    // when error, include both if available
    const parts: string[] = []
    if (hasDesc) parts.push(formDescriptionId)
    if (hasMsg) parts.push(formMessageId)
    ariaDescribedBy = parts.length > 0 ? parts.join(' ') : undefined
  }

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={ariaDescribedBy}
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()
  const itemContext = React.useContext(FormItemContext)

  React.useEffect(() => {
    itemContext?.registerDescription?.()
    return () => {
      itemContext?.unregisterDescription?.()
    }
  }, [itemContext])

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : children

  if (!body) {
    return null
  }
  const itemContext = React.useContext(FormItemContext)

  React.useEffect(() => {
    itemContext?.registerMessage?.()
    return () => {
      itemContext?.unregisterMessage?.()
    }
  }, [itemContext])

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
