/**
 * The button field the hero blocks share (neuroncx-cms
 * src/fields/optionalCta.ts): either a reference to a page or post, or an
 * address typed out, and allowed to be entirely empty.
 */
export type CtaGroup = {
  type?: 'reference' | 'custom' | null
  reference?: {
    relationTo?: 'pages' | 'posts'
    value?: { slug?: string | null } | string | number | null
  } | null
  url?: string | null
  label?: string | null
  newTab?: boolean | null
} | null

/**
 * Resolves one of those into a real address, or null when there is nothing
 * to link to: no button set, a reference the query did not populate (it
 * comes back as an id rather than an object below depth 2), or a reference
 * to a page that has no slug yet.
 *
 * A caller should check this AND the label before drawing anything, since
 * either on its own is a half-filled button.
 */
export const ctaHref = (cta: CtaGroup | undefined): string | null => {
  if (!cta) return null
  if (cta.type === 'custom') return cta.url || null
  if (cta.type === 'reference' && cta.reference && typeof cta.reference.value === 'object') {
    const slug = cta.reference.value?.slug
    if (!slug) return null
    return cta.reference.relationTo === 'posts' ? `/posts/${slug}` : `/${slug}`
  }
  return null
}
