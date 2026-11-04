/**
 * schema.org structured data (JSON-LD), built in one place. Each builder
 * returns a plain object, or null when there is nothing valid to say; a
 * component renders it with:
 *
 *   <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(data)} />
 */

/** One step of a trail, as the Breadcrumbs component draws it. */
export type TrailStep = { label: string; href?: string }

/**
 * The script's contents. dangerouslySetInnerHTML keeps React from
 * HTML-escaping the JSON; "<" is escaped instead, so a value containing
 * "</script>" cannot end the tag early (Next.js's documented pattern).
 */
export const jsonLdHtml = (data: object): { __html: string } => ({
  __html: JSON.stringify(data).replace(/</g, '\\u003c'),
})

const resolve = (href: string, base: URL): string | null => {
  try {
    return new URL(href, base).toString()
  } catch {
    return null
  }
}

/**
 * A BreadcrumbList for Google (developers.google.com/search/docs/appearance/
 * structured-data/breadcrumb): every step but the last needs the address of a
 * page, so a step with none (a label parent, an integration's category, the
 * collapsed "…") is left out. The last step is the current page; without an
 * href it has no item, and Google uses the page's own address. Relative hrefs
 * resolve against siteUrl (NEXT_PUBLIC_SERVER_URL, via getServerSideURL).
 *
 * Null when siteUrl is not an absolute address, or fewer than two steps are
 * left, which is Google's minimum.
 */
export const breadcrumbList = (trail: TrailStep[], siteUrl: string) => {
  let base: URL
  try {
    base = new URL(siteUrl)
  } catch {
    return null
  }

  const last = trail.length - 1
  const steps = trail.flatMap((step, i) => {
    const item = step.href ? resolve(step.href, base) : null
    if (item) return [{ name: step.label, item }]
    return i === last ? [{ name: step.label }] : []
  })
  if (steps.length < 2) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: steps.map((step, i) => ({ '@type': 'ListItem', position: i + 1, ...step })),
  }
}

/** An FAQPage from questions and their answers as plain text. */
export const faqPage = (items: { question: string; answer: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
})

/** The @id of the site's Organization (siteIdentity), so other data can name it as maker or publisher. */
const organizationId = (base: URL): string => `${base.origin}/#organization`

/**
 * Who runs the site, for search engines: an Organization and the WebSite it
 * publishes, linked by @id, on every page (app/(frontend)/layout.tsx). The
 * values come from the CMS Site Settings (Site identity and Organisation).
 * Only full https profile links are kept, and a relative logo resolves against
 * siteUrl.
 *
 * Null when siteUrl is not an absolute address.
 */
export const siteIdentity = (args: {
  siteUrl: string
  name: string
  legalName?: string | null
  description?: string | null
  logo?: string | null
  profiles?: (string | null | undefined)[] | null
}) => {
  let base: URL
  try {
    base = new URL(args.siteUrl)
  } catch {
    return null
  }
  const url = base.toString()
  const logo = args.logo ? resolve(args.logo, base) : null
  const sameAs = [
    ...new Set(
      (args.profiles || []).filter((p): p is string => typeof p === 'string' && /^https:\/\/\S+$/.test(p.trim())),
    ),
  ].map((p) => p.trim())

  const organization = {
    '@type': 'Organization',
    '@id': organizationId(base),
    name: args.name,
    url,
    ...(args.legalName?.trim() ? { legalName: args.legalName.trim() } : {}),
    ...(logo ? { logo } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  }
  const webSite = {
    '@type': 'WebSite',
    '@id': `${url}#website`,
    name: args.name,
    url,
    ...(args.description?.trim() ? { description: args.description.trim() } : {}),
    publisher: { '@id': organization['@id'] },
  }
  return { '@context': 'https://schema.org', '@graph': [organization, webSite] }
}

const absoluteSite = (siteUrl: string): URL | null => {
  try {
    return new URL(siteUrl)
  } catch {
    return null
  }
}

const plain = (v?: string | null): string | undefined => (v?.trim() ? v.trim() : undefined)

/**
 * An integration or agent page as software (schema.org SoftwareApplication),
 * made by NeuronCx. Google shows a special result for software only with a
 * price or ratings, so this describes the page rather than changing how it
 * looks in results. Null when siteUrl is not absolute or there is no name.
 */
export const softwareApplication = (args: {
  siteUrl: string
  path: string
  name?: string | null
  description?: string | null
  image?: string | null
}) => {
  const base = absoluteSite(args.siteUrl)
  const name = plain(args.name)
  if (!base || !name) return null
  const image = args.image ? resolve(args.image, base) : null
  const description = plain(args.description)
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    url: resolve(args.path, base),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    publisher: { '@id': organizationId(base) },
  }
}

/**
 * A post (schema.org BlogPosting): headline, dates, authors by name (else
 * NeuronCx), and NeuronCx as publisher. Null when siteUrl is not absolute or
 * there is no headline.
 */
export const blogPosting = (args: {
  siteUrl: string
  path: string
  headline?: string | null
  description?: string | null
  image?: string | null
  datePublished?: string | null
  dateModified?: string | null
  authors?: (string | null | undefined)[] | null
}) => {
  const base = absoluteSite(args.siteUrl)
  const headline = plain(args.headline)
  if (!base || !headline) return null
  const url = resolve(args.path, base)
  const image = args.image ? resolve(args.image, base) : null
  const description = plain(args.description)
  const authors = (args.authors || []).map((a) => plain(a)).filter((a): a is string => Boolean(a))
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline,
    url,
    mainEntityOfPage: url,
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    ...(args.datePublished ? { datePublished: args.datePublished } : {}),
    ...(args.dateModified ? { dateModified: args.dateModified } : {}),
    author: authors.length
      ? authors.map((name) => ({ '@type': 'Person', name }))
      : { '@id': organizationId(base) },
    publisher: { '@id': organizationId(base) },
  }
}
