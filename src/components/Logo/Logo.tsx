import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
  /** Logo image from the CMS. Falls back to the default logo when empty. */
  src?: string | null
  /** The CMS image's own size, for its shape. */
  width?: number | null
  height?: number | null
}

const DEFAULT_LOGO_SRC = '/ncx-logo.png'
const DEFAULT_LOGO_SIZE = { width: 142, height: 141 }
// Drawn 32px tall (the CSS below); width and height on the img give the browser its shape before it loads.
const LOGO_HEIGHT = 32

export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className, src } = props
  const size = src ? (props.width && props.height ? { width: props.width, height: props.height } : null) : DEFAULT_LOGO_SIZE

  const loading = loadingFromProps || 'eager'
  const priority = priorityFromProps || 'high'

  return (
    <span className={clsx('ncx-logo', className)}>
      <style>{`
        .ncx-logo{display:inline-flex;align-items:center;gap:10px;
          font-family:var(--font-display),Arial,sans-serif;font-weight:700;
          font-size:21px;letter-spacing:-.025em;color:currentColor;line-height:1}
        .ncx-logo img{width:auto;height:32px;display:block}
      `}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        loading={loading}
        fetchPriority={priority}
        decoding="async"
        src={src || DEFAULT_LOGO_SRC}
        {...(size ? { width: Math.round((LOGO_HEIGHT * size.width) / size.height), height: LOGO_HEIGHT } : {})}
      />
      NeuronCx
    </span>
  )
}
