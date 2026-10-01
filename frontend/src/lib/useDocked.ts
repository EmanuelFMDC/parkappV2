import { useEffect, useState, type RefObject } from 'react'

/** Container width (px) from which the bottom sheet turns into a docked side column. */
export const DOCK_MIN_WIDTH = 768

export interface ContainerSize {
  width: number
  height: number
}

/** Size of the parent of `ref`. Layout reacts to its container, not to the viewport. */
export function useContainerSize(ref: RefObject<HTMLElement | null>): ContainerSize {
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 })

  useEffect(() => {
    const parent = ref.current?.parentElement
    if (!parent || typeof ResizeObserver === 'undefined') return
    const update = () => setSize({ width: parent.clientWidth, height: parent.clientHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(parent)
    return () => observer.disconnect()
  }, [ref])

  return size
}
