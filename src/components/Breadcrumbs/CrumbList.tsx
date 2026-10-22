'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'

import type { Crumb } from './buildTrail'

/** A step of the trail. The collapsed "…" step may carry the steps it stands for. */
export type Step = Crumb & { collapsed?: Crumb[] }

/**
 * The trail as a list: links for linked ancestors, plain text for the rest,
 * and the current page last. A "…" step that carries its collapsed steps is
 * a button that shows them in place; focus then moves to the first of them.
 * The separators are hidden from screen readers.
 */
export const CrumbList: React.FC<{ items: Step[] }> = ({ items }) => {
  const [expanded, setExpanded] = useState(false)
  const list = useRef<HTMLOListElement>(null)
  const steps: Step[] = expanded
    ? items.flatMap((s) => (s.collapsed?.length ? s.collapsed : [s]))
    : items
  const last = steps.length - 1
  const firstHidden = items.findIndex((s) => s.collapsed?.length)

  useEffect(() => {
    if (!expanded || firstHidden < 0) return
    list.current?.querySelectorAll('li')[firstHidden]?.querySelector<HTMLElement>('a')?.focus()
  }, [expanded, firstHidden])

  return (
    <ol className="ncx-crumbs__list" ref={list}>
      {steps.map((step, i) => (
        <li key={`${i}-${step.label}`} className={i === last ? 'is-current' : undefined}>
          {i > 0 ? (
            <ChevronRight
              className="ncx-crumbs__sep"
              size={14}
              strokeWidth={2.2}
              aria-hidden="true"
            />
          ) : null}
          {i === last ? (
            <span className="ncx-crumbs__current" aria-current="page" title={step.label}>
              {step.label}
            </span>
          ) : step.collapsed?.length ? (
            <button
              type="button"
              className="ncx-crumbs__more"
              aria-label="Show full path"
              onClick={() => setExpanded(true)}
            >
              {step.label}
            </button>
          ) : step.href ? (
            <Link href={step.href}>{step.label}</Link>
          ) : (
            <span className="ncx-crumbs__label">{step.label}</span>
          )}
        </li>
      ))}
    </ol>
  )
}
