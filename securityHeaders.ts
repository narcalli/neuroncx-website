/**
 * Security headers for every response (next.config.ts headers()).
 *
 * The Content-Security-Policy is sent as Report-Only to start: browsers log
 * what it would block, in the developer console, and block nothing. Once a
 * walk through the site shows no reports, ENFORCE_CSP switches it on.
 *
 * What it allows, and why:
 *   - scripts: this site, Next's inline bootstrap scripts, Cloudflare Turnstile
 *   - styles: inline (blocks and the custom HTML/CSS visuals carry their own), Google Fonts
 *   - images and video: the CMS, and any https address (S3, editors' own picks)
 *   - frames: Turnstile; and this site may be framed by the CMS (live preview) only
 *
 * X-Frame-Options is not used: it cannot allow the CMS, so it would break
 * live preview. frame-ancestors does that job.
 */

export const ENFORCE_CSP = false

const TURNSTILE = 'https://challenges.cloudflare.com'

const originOf = (value: string): string | null => {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export const contentSecurityPolicy = ({ cmsUrls, isDev }: { cmsUrls: string[]; isDev: boolean }): string => {
  const cms = [...new Set(cmsUrls.map(originOf).filter((o): o is string => Boolean(o)))]
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // Next's dev server evaluates code and reloads over a websocket.
    'script-src': ["'self'", "'unsafe-inline'", TURNSTILE, ...(isDev ? ["'unsafe-eval'"] : [])],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'blob:', 'https:', ...cms],
    'media-src': ["'self'", 'blob:', 'https:', ...cms],
    'connect-src': ["'self'", TURNSTILE, ...cms, ...(isDev ? ['ws:'] : [])],
    'frame-src': ["'self'", TURNSTILE],
    'frame-ancestors': ["'self'", ...cms],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  }
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ')
}

export const securityHeaders = (args: { cmsUrls: string[]; isDev: boolean }): { key: string; value: string }[] => [
  {
    key: ENFORCE_CSP ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only',
    value: contentSecurityPolicy(args),
  },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
]
