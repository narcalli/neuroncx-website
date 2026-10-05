/**
 * Local mirror of the "integrationsMarquee" block shape returned by the
 * CMS's REST API. The CMS is a separate repo — these are hand-kept, not
 * generated — so if a field is added or renamed there, it has to be
 * updated here too.
 */

export interface MarqueeLogoImage {
  url: string
  alt?: string | null
  mimeType?: string | null
  width?: number | null
  height?: number | null
}

export interface MarqueeLogo {
  id?: string | null
  name: string
  /** A populated media doc, a bare id string when depth was too shallow, or nothing. */
  logo?: MarqueeLogoImage | string | null
}

export interface IntegrationsMarqueeBlockProps {
  blockType: 'integrationsMarquee'
  eyebrow?: string | null
  title?: string | null
  description?: string | null
  logos: MarqueeLogo[]
}
