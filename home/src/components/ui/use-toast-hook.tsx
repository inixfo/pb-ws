import * as React from "react"

export type ToastProps = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: "default" | "destructive"
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const toast = React.useCallback(
    ({ title, description, variant = "default", ...props }: Omit<ToastProps, "id" | "open" | "onOpenChange">) => {
      const id = Math.random().toString(36).substring(2)
      const newToast = {
        id,
        title,
        description,
        variant,
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) {
            setToasts(toasts => toasts.filter(t => t.id !== id))
          }
        },
        ...props,
      }

      setToasts(toasts => [...toasts, newToast])

      return {
        id,
        dismiss: () => setToasts(toasts => toasts.filter(t => t.id !== id)),
      }
    },
    []
  )

  return {
    toast,
    toasts,
    dismiss: (id: string) => setToasts(toasts => toasts.filter(t => t.id !== id)),
  }
} 