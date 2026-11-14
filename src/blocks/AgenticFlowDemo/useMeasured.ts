import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * Reserves height so a block keeps its size as its content changes, instead of
 * moving everything below it. Measures after mount, again after a 150ms pause
 * on resize, and once fonts have loaded. While `measuring` is true the caller
 * draws what it needs to measure (hidden copies of content that is not on
 * screen, and nothing reserved, so heights come out natural); `read` then
 * returns the value, before the browser paints. Used by both Agentic Flow
 * Demo modes (FlowDemo, AgentFeatures).
 */
export const useMeasured = <T>(enabled: boolean, read: () => T | undefined, deps: unknown[] = []) => {
  const [value, setValue] = useState<T>()
  const [measuring, setMeasuring] = useState(false)
  const reader = useRef(read)
  useLayoutEffect(() => {
    reader.current = read
  })

  useEffect(() => {
    if (!enabled) return
    let wait: number | undefined
    const measure = () => setMeasuring(true)
    const onResize = () => {
      window.clearTimeout(wait)
      wait = window.setTimeout(measure, 150)
    }
    measure()
    window.addEventListener('resize', onResize)
    void document.fonts?.ready.then(measure)
    return () => {
      window.clearTimeout(wait)
      window.removeEventListener('resize', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  useLayoutEffect(() => {
    if (!measuring) return
    setValue(reader.current())
    setMeasuring(false)
  }, [measuring])

  return { value, measuring }
}

/** The tallest of these elements' heights, or undefined when there are none. */
export const tallest = (elements: Iterable<Element> | null | undefined): number | undefined => {
  const heights = [...(elements ?? [])].map((el) => (el as HTMLElement).offsetHeight)
  return heights.length ? Math.max(...heights) : undefined
}
