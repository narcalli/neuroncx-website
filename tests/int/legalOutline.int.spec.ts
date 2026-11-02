import { describe, expect, it } from 'vitest'

import { outlineLegal, slugify } from '@/blocks/Content/legalOutline'

/**
 * The legal document layout: headings move up so the highest level is h2,
 * each h2 gets a unique id and a contents entry, and the CMS data is left alone.
 */

const text = (t: string) => ({ type: 'text', text: t, version: 1 })
const heading = (tag: string, t: string) => ({ type: 'heading', tag, children: [text(t)], version: 1 })
const para = (t: string) => ({ type: 'paragraph', children: [text(t)], version: 1 })
const doc = (...children: object[]) => ({ root: { type: 'root', children, version: 1 } }) as any

describe('outlineLegal', () => {
  it('turns numbered h3 sections into h2 with ids and contents entries', () => {
    const { docs, outline } = outlineLegal([
      doc(para('Intro'), heading('h3', '1. Accepting these Terms'), para('a'), heading('h4', 'Detail'), heading('h3', '2. Fees')),
    ])
    const out = docs[0].root.children as any[]
    expect(out.map((n) => n.tag ?? n.type)).toEqual(['paragraph', 'h2', 'paragraph', 'h3', 'h2'])
    expect(out[1].anchorId).toBe('1-accepting-these-terms')
    expect(out[3].anchorId).toBeUndefined()
    expect(outline).toEqual([
      { id: '1-accepting-these-terms', label: '1. Accepting these Terms' },
      { id: '2-fees', label: '2. Fees' },
    ])
  })

  it('keeps h2 sections as they are', () => {
    const { docs, outline } = outlineLegal([doc(heading('h2', 'Scope'), heading('h3', 'Sub'))])
    expect((docs[0].root.children as any[]).map((n) => n.tag)).toEqual(['h2', 'h3'])
    expect(outline).toEqual([{ id: 'scope', label: 'Scope' }])
  })

  it('makes repeated headings unique across columns', () => {
    const { outline } = outlineLegal([doc(heading('h3', 'General')), doc(heading('h3', 'General'))])
    expect(outline.map((o) => o.id)).toEqual(['general', 'general-2'])
  })

  it('handles text with no headings and leaves the input unchanged', () => {
    const input = doc(heading('h3', 'Kept'))
    const before = JSON.stringify(input)
    outlineLegal([input])
    expect(JSON.stringify(input)).toBe(before)
    expect(outlineLegal([doc(para('Only text'))]).outline).toEqual([])
  })

  it('slugs curly quotes and accents', () => {
    expect(slugify('13. Children’s data')).toBe('13-children-s-data')
    expect(slugify('Café rules')).toBe('cafe-rules')
    expect(slugify('***')).toBe('section')
  })
})
