import * as React from "react"

const MOBILE_MEDIA_QUERY = "(max-width: 768px)"

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false
    }

    return window.matchMedia(MOBILE_MEDIA_QUERY).matches
  })

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY)

    const handleChange = () => {
      setIsMobile(mediaQuery.matches)
    }

    handleChange()

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange)
    } else {
      mediaQuery.addListener(handleChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  return isMobile
}
