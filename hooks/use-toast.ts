
import { useState } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: 'default' | 'destructive'
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = ({ id, ...props }: Omit<Toast, 'id'> & { id?: string }) => {
    const toastId = id || Math.random().toString(36).slice(2)
    const toast = { id: toastId, ...props }
    
    setToasts((prev) => [...prev, toast])
    
    if (toast.duration !== Infinity) {
      setTimeout(() => {
        dismiss(toastId)
      }, toast.duration || 5000)
    }
    
    return toastId
  }

  const dismiss = (toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId))
  }

  return {
    toast,
    dismiss,
    toasts,
  }
}
