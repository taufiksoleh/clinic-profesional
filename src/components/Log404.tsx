'use client'
import { useEffect } from 'react'
export function Log404() {
  useEffect(() => {
    fetch('/api/not-found', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: location.pathname }),
    }).catch(() => {})
  }, [])
  return null
}
