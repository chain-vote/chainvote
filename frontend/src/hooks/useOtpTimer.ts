import { useState, useEffect, useCallback, useRef } from 'react'

const OTP_DURATION_SECONDS = 600 // 10 minutes

/**
 * useOtpTimer: Manages OTP countdown (10 minutes), expiry detection, and resend logic.
 * Returns countdown string, expiry state, and a resend function.
 */
export function useOtpTimer(onResend: () => Promise<any>) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    setIsExpired(false)
    setSecondsLeft(OTP_DURATION_SECONDS)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalRef.current!)
          setIsExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const handleResend = useCallback(async () => {
    setIsResending(true)
    try {
      await onResend()
      start()
    } finally {
      setIsResending(false)
    }
  }, [onResend, start])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return {
    start,
    secondsLeft,
    isExpired,
    isResending,
    handleResend,
    formatted: secondsLeft !== null ? formatTime(secondsLeft) : null,
  }
}
