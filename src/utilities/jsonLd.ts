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
