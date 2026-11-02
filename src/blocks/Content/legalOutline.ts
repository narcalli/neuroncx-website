import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

export type OutlineItem = { id: string; label: string }

type Node = { type?: string; tag?: string; text?: string; children?: Node[]; anchorId?: string }

const isHeading = (n: Node) => n.type === 'heading' && /^h[1-6]$/.test(n.tag || '')
const levelOf = (n: Node) => Number(n.tag!.slice(1))
const textOf = (n: Node): string => n.text ?? (n.children || []).map(textOf).join('')

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section'

/**
 * Prepares rich text for the legal document layout. The highest heading level
 * used becomes h2, under the page's h1, and lower levels move up by the same
 * step (editors often number sections as h3). Each h2 gets an id, read by the
 * heading converter in components/RichText, and an entry in the contents list.
 * Returns copies, so the CMS data is never changed.
 */
export const outlineLegal = (docs: DefaultTypedEditorState[]) => {
  const levels = docs.flatMap((d) => (d.root.children as Node[]).filter(isHeading).map(levelOf))
  const shift = levels.length ? Math.min(...levels) - 2 : 0
  const used = new Set<string>()
  const outline: OutlineItem[] = []

  const prepared = docs.map((d) => ({
    ...d,
    root: {
      ...d.root,
      children: (d.root.children as Node[]).map((n) => {
        if (!isHeading(n)) return n
        const level = Math.min(Math.max(levelOf(n) - shift, 2), 6)
        if (level !== 2) return { ...n, tag: `h${level}` }
        const label = textOf(n).trim()
        const base = slugify(label)
        let id = base
        for (let i = 2; used.has(id); i++) id = `${base}-${i}`
        used.add(id)
        if (label) outline.push({ id, label })
        return { ...n, tag: 'h2', anchorId: id }
      }),
    },
  }))

  return { docs: prepared as DefaultTypedEditorState[], outline }
}
