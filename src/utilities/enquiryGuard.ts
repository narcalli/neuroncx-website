/**
 * The contact form's checks before an enquiry goes to the CMS
 * (app/(frontend)/api/enquiry/route.ts). Each one is off until its settings
 * are in place, so the form keeps working while they are being set up:
 *
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY  Cloudflare Turnstile widget on the form (fixed into the build)
 *   TURNSTILE_SECRET_KEY            checks the widget's answer, server only
 *   ENQUIRY_SECRET                  sent to the CMS, which then accepts enquiries from this site only
 *
 * Turnstile is checked only when both of its keys are set: with one alone,
 * every enquiry would be refused.
 */

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const TIMEOUT_MS = 5000

export const turnstileOn = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY)

/** The visitor's address, as Cloudflare or Netlify pass it on; null when neither does. */
export const clientIp = (headers: Headers): string | null =>
  headers.get('cf-connecting-ip') ||
  headers.get('x-nf-client-connection-ip') ||
  headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  null

export type TurnstileResult = 'passed' | 'failed' | 'unavailable'

/**
 * Asks Cloudflare whether the widget's token is good: 'failed' for a missing,
 * wrong, used or expired token, 'unavailable' when Cloudflare could not be
 * asked.
 */
export const verifyTurnstile = async (token: unknown, ip: string | null): Promise<TurnstileResult> => {
  if (typeof token !== 'string' || !token || token.length > 2048) return 'failed'
  const form = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY || '', response: token })
  if (ip) form.set('remoteip', ip)
  try {
    const res = await fetch(SITEVERIFY, {
      method: 'POST',
      body: form,
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) return 'unavailable'
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }
    if (data.success === true) return 'passed'
    console.warn(`Enquiry refused by Turnstile: ${(data['error-codes'] || []).join(', ') || 'no reason given'}`)
    return 'failed'
  } catch (err) {
    console.error('Turnstile check failed:', err)
    return 'unavailable'
  }
}

/** Headers for the enquiry sent to the CMS: with ENQUIRY_SECRET when it is set. */
export const cmsEnquiryHeaders = (): Record<string, string> => {
  const secret = process.env.ENQUIRY_SECRET
  return {
    'Content-Type': 'application/json',
    ...(secret ? { 'x-enquiry-secret': secret } : {}),
  }
}

export const ROBOT_CHECK_FAILED = "Please confirm you're not a robot and try again."
export const ROBOT_CHECK_UNAVAILABLE = 'We could not check the form just now. Please try again in a moment.'
