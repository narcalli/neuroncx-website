/**
 * /llms.txt (app/(frontend)/llms.txt/route.ts): a plain Markdown map of the site for AI tools, in the
 * llmstxt.org layout. The site's name as the title, its description as the summary, then one section per
 * kind of page, each page a link with its one-line description. The route gathers the same pages as the
 * two sitemaps, so anything hidden from search engines is left out here too.
 */

export type LlmsLink = { title: string; url: string; description?: string | null }
export type LlmsSection = { heading: string; links: LlmsLink[] }

/** One line: no line breaks or runs of spaces, which would break the Markdown list. */
const oneLine = (s: string | null | undefined): string => (s || '').replace(/\s+/g, ' ').trim()

/** Brackets in a title would end the link text early. */
const linkText = (s: string): string => oneLine(s).replace(/[[\]]/g, '')

export const buildLlmsTxt = ({
  name,
  summary,
  sections,
}: {
  name: string
  summary?: string | null
  sections: LlmsSection[]
}): string => {
  const seen = new Set<string>()
  const out = [`# ${oneLine(name)}`, '']
  if (oneLine(summary)) out.push(`> ${oneLine(summary)}`, '')
  for (const section of sections) {
    const links = section.links.filter((l) => l.url && oneLine(l.title) && !seen.has(l.url))
    if (!links.length) continue
    out.push(`## ${section.heading}`, '')
    for (const l of links) {
      seen.add(l.url)
      const about = oneLine(l.description)
      out.push(`- [${linkText(l.title)}](${l.url})${about ? `: ${about}` : ''}`)
    }
    out.push('')
  }
  return out.join('\n')
}
