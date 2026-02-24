import { toast } from "sonner"

export const showError = (message: string) => {
  toast.error(message, {
    duration: 2500,
  })
}

export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 2500,
  })
}

export const showWarning = async (message: string): Promise<boolean> => {
  return window.confirm(message)
}

export const showConfirm = async (message: string): Promise<boolean> => {
  return window.confirm(message)
}

export const showCustomConfirm = async (message: string): Promise<boolean> => {
  return window.confirm(message)
}
