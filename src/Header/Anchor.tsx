import Link from 'next/link'
import React from 'react'

export const isExternal = (href?: string | null) => /^https?:\/\//.test(String(href || ''))

/** Internal addresses go through next/link, absolute ones stay plain anchors. */
export const Anchor: React.FC<{
  href?: string | null
  newTab?: boolean | null
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}> = ({ href, newTab, className, style, children }) => {
  const target = href || '/'
  if (isExternal(target) || newTab) {
    return (
      <a
        className={className}
        style={style}
        href={target}
        {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : { rel: 'noopener' })}
      >
        {children}
      </a>
    )
  }
  return (
    <Link className={className} style={style} href={target}>
      {children}
    </Link>
  )
}
