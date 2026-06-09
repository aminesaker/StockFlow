'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

type ActionResult = { success?: boolean; error?: Record<string, string[]> | string } | undefined

export function useFormAction(onSuccess?: () => void) {
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isPending, startTransition] = useTransition()

  async function run(action: () => Promise<ActionResult>, successMsg = 'Enregistré') {
    startTransition(async () => {
      const result = await action()
      if (!result) return

      if (result.error) {
        if (typeof result.error === 'string') {
          toast.error(result.error)
          setErrors({ _root: [result.error] })
        } else {
          setErrors(result.error)
          const firstMsg = Object.values(result.error).flat()[0]
          if (firstMsg) toast.error(firstMsg)
        }
      } else {
        toast.success(successMsg)
        setErrors({})
        onSuccess?.()
      }
    })
  }

  return { errors, setErrors, isPending, run }
}
