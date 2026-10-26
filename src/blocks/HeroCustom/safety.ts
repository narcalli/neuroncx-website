/**
 * A second line of defence for Hero (custom CSS). The CMS refuses unsafe
 * visuals on save (neuroncx-cms src/blocks/HeroCustom/visualRules.ts); this
 * removes the same things again before the page is drawn, in case anything
 * reached the database another way. It removes rather than refuses, so the
 * rest of the visual still shows.
 */

export const safeVisualHtml = (html: unknown): string => {
  if (typeof html !== 'string' || !html.trim()) return ''
  return (
    html
      // Elements that run code, embed other pages, or could leave the box.
      .replace(/<(script|style|template|iframe|object|embed|frame|frameset|applet|form)\b[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<\/?(script|style|template|iframe|object|embed|frame|frameset|applet|form|link|meta|base)\b[^>]*>/gi, '')
      // Event attributes (onclick, onload ...) and srcdoc.
      .replace(/\s(on[a-z]+|srcdoc)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      // javascript: in any attribute.
      .replace(/javascript\s*:/gi, '')
      .trim()
  )
}

export const safeVisualCss = (css: unknown): string => {
  if (typeof css !== 'string') return ''
  return css
    .replace(/@import[^;]*;?/gi, '')
    .replace(/<\/?\s*(style|template|script)[^>]*>?/gi, '')
    .replace(/expression\s*\(|javascript\s*:|-moz-binding|behavior\s*:/gi, '')
}
