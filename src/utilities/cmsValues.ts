/**
 * Small converters for values read straight from a CMS record rather than
 * from a block, used by the integrations pages.
 */

export type LinkValue =
  | {
      type?: 'reference' | 'custom' | null
      url?: string | null
      newTab?: boolean | null
      reference?: { relationTo?: string; value?: unknown } | null
    }
  | null
  | undefined

// The same rule as the site's CMSLink: a page or post reference, or a custom URL.
export const hrefOf = (link: LinkValue): string | null => {
  if (!link) return null
  const value = link.reference?.value as { slug?: string } | undefined
  if (link.type === 'reference' && value && typeof value === 'object' && value.slug) {
    return `${link.reference?.relationTo !== 'pages' ? `/${link.reference?.relationTo}` : ''}/${value.slug}`
  }
  return link.url || null
}

// FAQ answers are plain text in the CMS records; the FAQ block takes rich text.
export const paragraph = (text: string) =>
  ({
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children: [
        {
          type: 'paragraph',
          version: 1,
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          children: [
            { type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' },
          ],
        },
      ],
    },
  }) as any
