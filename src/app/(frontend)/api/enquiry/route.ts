import { NextRequest, NextResponse } from 'next/server'

import {
  clientIp,
  cmsEnquiryHeaders,
  ROBOT_CHECK_FAILED,
  ROBOT_CHECK_UNAVAILABLE,
  turnstileOn,
  verifyTurnstile,
} from '@/utilities/enquiryGuard'
import { getPayloadURL } from '@/utilities/getURL'

/**
 * Receives the contact form and forwards it to the CMS.
 *
 * The browser never talks to the CMS directly. The checks live here, one door
 * rather than many: the honeypot, Cloudflare Turnstile, and ENQUIRY_SECRET,
 * which closes the CMS's own enquiry endpoint to anyone but this route
 * (utilities/enquiryGuard.ts). A Cloudflare rate-limit rule on this address
 * sits in front.
 */
export async function POST(req: NextRequest) {
  let body: any

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // The honeypot: a field no real person fills in. Accept it silently so a bot
  // gets a success response and does not retry, but save nothing.
  if (body?.website) {
    return NextResponse.json({ ok: true })
  }

  const name = String(body?.name || '').trim()
  const email = String(body?.email || '').trim()

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'That email address does not look right' }, { status: 400 })
  }

  // The Turnstile widget's answer (utilities/enquiryGuard.ts), once both keys are set.
  if (turnstileOn()) {
    const check = await verifyTurnstile(body?.turnstileToken, clientIp(req.headers))
    if (check === 'failed') return NextResponse.json({ error: ROBOT_CHECK_FAILED }, { status: 403 })
    if (check === 'unavailable') return NextResponse.json({ error: ROBOT_CHECK_UNAVAILABLE }, { status: 503 })
  }

  // Only the fields the collection expects — anything else the client sent is
  // dropped rather than passed through.
  const payload = {
    name,
    email,
    company: String(body?.company || '').trim(),
    mobile: String(body?.mobile || '').trim(),
    message: String(body?.message || '').trim(),
    sourcePage: String(body?.sourcePage || '').trim(),
  }

  const cms = getPayloadURL()
  if (!cms) {
    console.error('Enquiry not sent: no CMS address (NEXT_PUBLIC_PAYLOAD_URL or CMS_URL) is set.')
    return NextResponse.json({ error: 'Could not save your enquiry' }, { status: 502 })
  }

  try {
    const res = await fetch(`${cms}/api/enquiries`, {
      method: 'POST',
      // With ENQUIRY_SECRET, which the CMS then requires.
      headers: cmsEnquiryHeaders(),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error(`Enquiry rejected by CMS (${res.status}): ${detail.slice(0, 300)}`)
      return NextResponse.json({ error: 'Could not save your enquiry' }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Enquiry forward failed:', err)
    return NextResponse.json({ error: 'Could not save your enquiry' }, { status: 502 })
  }
}
