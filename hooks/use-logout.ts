'use client'

import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

export function useLogout() {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const requestLogout = useCallback(() => {
    setConfirmOpen(true)
  }, [])

  const cancelLogout = useCallback(() => {
    if (pending) return
    setConfirmOpen(false)
  }, [pending])

  const confirmLogout = useCallback(async () => {
    if (pending) return
    setPending(true)

    try {
      await axios.post('/api/auth/logout')
    } finally {
      router.push('/login')
      router.refresh()
      setPending(false)
      setConfirmOpen(false)
    }
  }, [pending, router])

  return {
    confirmOpen,
    pending,
    requestLogout,
    cancelLogout,
    confirmLogout,
  }
}
