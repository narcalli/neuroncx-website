import type { CaseStudy, Sector } from '@/payload-types'

/**
 * Shared rules for public case studies. A case study whose client name is
 * still pending is never shown on the public site.
 */
export const publicCaseStudyQuery = {
  'where[clientPending][not_equals]': true,
  'where[_status][equals]': 'published',
} as const

/** Sector ids from a relationship field, whether populated or not. */
export const sectorIds = (sectors?: (string | Sector)[] | null): string[] =>
  (sectors || []).map((s) => (typeof s === 'object' && s ? s.id : s)).filter((id): id is string => Boolean(id))

/** Keeps only populated case studies that are safe to show publicly. */
export const publicCases = (docs: (CaseStudy | null | undefined)[]): CaseStudy[] =>
  docs.filter((c): c is CaseStudy => Boolean(c && typeof c === 'object' && c.slug && !c.clientPending))
