import { useState, useEffect } from 'react'

export type Orientation = 'portrait' | 'landscape'

/**
 * useOrientation: High-precision hook for detecting device orientation rituals.
 * Syncs with CSS media queries to prevent element bleeding.
 */
export function useOrientation(): { orientation: Orientation; isLandscape: boolean } {
  const [orientation, setOrientation] = useState<Orientation>(
    window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape'
  )

  useEffect(() => {
    const portraitQuery = window.matchMedia('(orientation: portrait)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setOrientation(e.matches ? 'portrait' : 'landscape')
    }

    // Modern listener manifestation
    portraitQuery.addEventListener('change', handleChange)
    
    // In case the mode changed before the effect settled
    setOrientation(portraitQuery.matches ? 'portrait' : 'landscape')

    return () => portraitQuery.removeEventListener('change', handleChange)
  }, [])

  return {
    orientation,
    isLandscape: orientation === 'landscape'
  }
}
