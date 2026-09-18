import { NextRequest, NextResponse } from 'next/server'

const CMS_URL = process.env.CMS_URL || 'http://localhost:3001'

/**
 * Receives the contact form and forwards it to the CMS.
 *
 * The browser never talks to the CMS directly, so the Enquiries write endpoint
 * can stay closed to the public internet. This is also the place to add rate
 * limiting or a captcha check later — one door rather than many.
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

  try {
    const res = await fetch(`${CMS_URL.replace(/\/?$/, '')}/api/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
