import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function F() {
  const router = useRouter()

  useEffect(() => {
    // Unknown request to /F - redirect to home
    router.replace('/')
  }, [router])

  return null
}
