import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { contentSecurityPolicy, securityHeaders } from '../../securityHeaders'
import { clientIp, cmsEnquiryHeaders, turnstileOn, verifyTurnstile } from '@/utilities/enquiryGuard'
import { siteIdentity } from '@/utilities/jsonLd'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { shareCard, shareCardTitle, SHARE_CARD_TITLE_MAX } from '@/utilities/siteDefaults'

/**
 * Share cards, the Organization data, the contact form's checks and the
 * security headers. Each of the first three stays off until its setting is in.
 */

vi.mock('next/headers', () => ({
  draftMode: async () => ({ isEnabled: false }),
  cookies: async () => ({ get: () => undefined }),
}))
// The customer page's body, not needed for its metadata.
vi.mock('@/components/RichText', () => ({ default: () => null }))
vi.mock('@/blocks/CaseStudyGrid/Component', () => ({ CaseStudyGridBlock: () => null }))
vi.mock('@/blocks/ClosingCTA/Component', () => ({ ClosingCtaBlock: () => null }))

const SITE = 'https://www.example.test'

type Reply = { status?: number; json: unknown }
const replies: Record<string, Reply | Error> = {}
const calls: { url: string; init?: RequestInit }[] = []

beforeEach(() => {
  calls.length = 0
  for (const k of Object.keys(replies)) delete replies[k]
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input)
      calls.push({ url, init })
      const key = Object.keys(replies).find((k) => url.includes(k))
      const reply = key ? replies[key] : { json: { docs: [] } }
      if (reply instanceof Error) throw reply
      const status = reply.status ?? 200
      return { ok: status < 400, status, json: async () => reply.json, text: async () => JSON.stringify(reply.json) }
    }),
  )
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('the share card', () => {
  it('draws the title without the brand suffix, cut to length', () => {
    expect(shareCardTitle('Fee collection for colleges | NeuronCx')).toBe('Fee collection for colleges')
    expect(shareCardTitle('A | B | NeuronCx')).toBe('A | B')
    expect(shareCardTitle('  spaced \n out  ')).toBe('spaced out')
    const long = shareCardTitle('word '.repeat(60))
    expect(long.length).toBe(SHARE_CARD_TITLE_MAX)
    expect(long.endsWith('…')).toBe(true)
    expect(shareCardTitle(null)).toBe('')
  })

  it('is a full address on this site, and absent until the site address is set', () => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', '')
    expect(shareCard('Anything')).toBeNull()
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', SITE)
    expect(shareCard('Fees & dues | NeuronCx')).toEqual({
      url: `${SITE}/og?title=Fees%20%26%20dues`,
      width: 1200,
      height: 630,
      alt: 'Fees & dues',
    })
    // The site name alone is no title.
    expect(shareCard('NeuronCx')?.url).toBe(`${SITE}/og`)
  })

  it("is used only when the page has no image of its own", () => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', SITE)
    expect(mergeOpenGraph({ title: 'Customers | NeuronCx' })?.images).toEqual([
      expect.objectContaining({ url: `${SITE}/og?title=Customers` }),
    ])
    const own = [{ url: 'https://cms.test/media/own.png' }]
    expect(mergeOpenGraph({ title: 'Customers', images: own })?.images).toBe(own)
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', '')
    expect(mergeOpenGraph({ title: 'Customers' })?.images).toBeUndefined()
  })
})

describe('page metadata', () => {
  it('a CMS page: canonical address, own image first, then Site Settings, then the card', async () => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', SITE)
    vi.stubEnv('CMS_URL', 'https://cms.test')
    const { generateMeta } = await import('@/utilities/generateMeta')
    const page = { slug: 'fees', title: 'Fees', meta: { title: 'Fees | NeuronCx' } }

    const card = await generateMeta({ doc: page, path: '/higher-education/fees' })
    expect(card.alternates?.canonical).toBe(`${SITE}/higher-education/fees`)
    expect((card.openGraph as any).images[0].url).toBe(`${SITE}/og?title=Fees`)

    replies['/api/globals/siteSettings'] = { json: { defaultShareImage: { url: 'https://cms.test/media/site.png' } } }
    const site = await generateMeta({ doc: page, path: '/fees' })
    expect((site.openGraph as any).images[0].url).toBe('https://cms.test/media/site.png')

    const own = await generateMeta({
      doc: { ...page, meta: { ...page.meta, image: { url: 'https://cms.test/media/own.png' } as any } },
      path: '/fees',
    })
    expect((own.openGraph as any).images[0].url).toBe('https://cms.test/media/own.png')
  })

  it("a customer's page: canonical address and the card with its title", async () => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', SITE)
    vi.stubEnv('CMS_URL', 'https://cms.test')
    replies['/api/customers'] = {
      json: { docs: [{ id: 'c1', slug: 'ovum', name: 'Ovum Hospitals', heroHeading: 'Ovum runs on NeuronCx', hasOwnPage: true, _status: 'published', status: 'live' }] },
    }
    const { generateMetadata } = await import('@/app/(frontend)/customers/[slug]/page')
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'ovum' }) } as any)
    expect(meta.alternates?.canonical).toBe(`${SITE}/customers/ovum`)
    expect((meta.openGraph as any).images[0].url).toBe(`${SITE}/og?title=Ovum%20runs%20on%20NeuronCx`)
  })
})

describe('Organization data', () => {
  const base = { siteUrl: SITE, name: 'NeuronCx' }

  it('links the company and the website, with the logo as a full address', () => {
    const graph = siteIdentity({
      ...base,
      legalName: ' NeuronCx Technologies Pvt Ltd ',
      description: 'An agentic CRM.',
      logo: '/ncx-logo.png',
      profiles: ['https://www.linkedin.com/company/neuroncx', 'https://www.linkedin.com/company/neuroncx'],
    })!
    expect(graph['@context']).toBe('https://schema.org')
    const [org, site] = graph['@graph'] as any[]
    expect(org).toEqual({
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'NeuronCx',
      url: `${SITE}/`,
      legalName: 'NeuronCx Technologies Pvt Ltd',
      logo: `${SITE}/ncx-logo.png`,
      sameAs: ['https://www.linkedin.com/company/neuroncx'],
    })
    expect(site).toMatchObject({ '@type': 'WebSite', url: `${SITE}/`, publisher: { '@id': `${SITE}/#organization` } })
  })

  it('leaves out empty values and links that are not full https addresses', () => {
    const [org] = siteIdentity({ ...base, legalName: '  ', profiles: ['linkedin.com/x', 'http://x.test', null] })![
      '@graph'
    ] as any[]
    expect(org).not.toHaveProperty('legalName')
    expect(org).not.toHaveProperty('sameAs')
    expect(org).not.toHaveProperty('logo')
  })

  it('is left out until the site address is set', () => {
    expect(siteIdentity({ ...base, siteUrl: '' })).toBeNull()
  })
})

describe("the contact form's checks", () => {
  it('Turnstile is on only with both keys', () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'site')
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    expect(turnstileOn()).toBe(false)
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret')
    expect(turnstileOn()).toBe(true)
  })

  it("asks Cloudflare about the widget's answer", async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret')
    replies['siteverify'] = { json: { success: true } }
    expect(await verifyTurnstile('token', '203.0.113.9')).toBe('passed')
    const sent = calls[0].init?.body as URLSearchParams
    expect([sent.get('secret'), sent.get('response'), sent.get('remoteip')]).toEqual(['secret', 'token', '203.0.113.9'])

    replies['siteverify'] = { json: { success: false, 'error-codes': ['timeout-or-duplicate'] } }
    expect(await verifyTurnstile('token', null)).toBe('failed')
    replies['siteverify'] = new Error('network down')
    expect(await verifyTurnstile('token', null)).toBe('unavailable')
    replies['siteverify'] = { status: 500, json: {} }
    expect(await verifyTurnstile('token', null)).toBe('unavailable')
  })

  it('refuses a missing answer without asking', async () => {
    expect(await verifyTurnstile(undefined, null)).toBe('failed')
    expect(await verifyTurnstile('', null)).toBe('failed')
    expect(calls).toHaveLength(0)
  })

  it("takes the visitor's address from Cloudflare first", () => {
    expect(clientIp(new Headers({ 'cf-connecting-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2, 3.3.3.3' }))).toBe('1.1.1.1')
    expect(clientIp(new Headers({ 'x-forwarded-for': '2.2.2.2, 3.3.3.3' }))).toBe('2.2.2.2')
    expect(clientIp(new Headers())).toBeNull()
  })

  it('sends the CMS secret only when it is set', () => {
    expect(cmsEnquiryHeaders()).toEqual({ 'Content-Type': 'application/json' })
    vi.stubEnv('ENQUIRY_SECRET', 'shared')
    expect(cmsEnquiryHeaders()['x-enquiry-secret']).toBe('shared')
  })
})

describe('the enquiry route', () => {
  const post = async (body: object) => {
    vi.stubEnv('CMS_URL', 'https://cms.test')
    const { POST } = await import('@/app/(frontend)/api/enquiry/route')
    return POST(
      new Request('https://www.example.test/api/enquiry', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'cf-connecting-ip': '203.0.113.9' },
      }) as any,
    )
  }
  const enquiry = { name: 'Asha', email: 'asha@example.com' }
  const toCms = () => calls.filter((c) => c.url.startsWith('https://cms.test/api/enquiries'))

  it('works as before while nothing is set', async () => {
    const res = await post(enquiry)
    expect(res.status).toBe(200)
    expect(calls.some((c) => c.url.includes('siteverify'))).toBe(false)
    expect((toCms()[0].init?.headers as Record<string, string>)['x-enquiry-secret']).toBeUndefined()
  })

  it('refuses a failed robot check and sends nothing to the CMS', async () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'site')
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret')
    replies['siteverify'] = { json: { success: false } }
    const res = await post({ ...enquiry, turnstileToken: 'bad' })
    expect(res.status).toBe(403)
    expect((await res.json()).error).toBe("Please confirm you're not a robot and try again.")
    expect(toCms()).toHaveLength(0)
  })

  it('passes a checked enquiry on with the secret', async () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'site')
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret')
    vi.stubEnv('ENQUIRY_SECRET', 'shared')
    replies['siteverify'] = { json: { success: true } }
    const res = await post({ ...enquiry, turnstileToken: 'good' })
    expect(res.status).toBe(200)
    const sent = toCms()[0]
    expect((sent.init?.headers as Record<string, string>)['x-enquiry-secret']).toBe('shared')
    expect(JSON.parse(String(sent.init?.body))).not.toHaveProperty('turnstileToken')
  })
})

describe('security headers', () => {
  const cmsUrls = ['https://cms.test/', 'https://cms.test', 'not a url']

  it('report the content policy first, and set the other headers', () => {
    const headers = Object.fromEntries(securityHeaders({ cmsUrls, isDev: false }).map((h) => [h.key, h.value]))
    expect(Object.keys(headers)).toEqual([
      'Content-Security-Policy-Report-Only',
      'Referrer-Policy',
      'X-Content-Type-Options',
      'Permissions-Policy',
    ])
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(headers).not.toHaveProperty('X-Frame-Options')
  })

  it('let the CMS frame the site for live preview, and allow Turnstile', () => {
    const csp = contentSecurityPolicy({ cmsUrls, isDev: false })
    expect(csp).toContain("frame-ancestors 'self' https://cms.test;")
    expect(csp).toContain('https://challenges.cloudflare.com')
    expect(csp).toContain("object-src 'none'")
    expect(csp).not.toContain('unsafe-eval')
    expect(contentSecurityPolicy({ cmsUrls, isDev: true })).toContain("'unsafe-eval'")
  })
})

describe('the error pages', () => {
  it('say what happened and offer a way on, with nothing technical', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { createElement } = await import('react')
    const PageError = (await import('@/app/(frontend)/error')).default
    const GlobalError = (await import('@/app/global-error')).default
    const error = Object.assign(new Error('secret stack detail'), { digest: 'abc123' })

    const page = renderToStaticMarkup(createElement(PageError, { error, reset: () => {} }))
    expect(page).toContain('Something went wrong on our side')
    expect(page).toContain('Try again')
    expect(page).toContain('href="/"')
    expect(page).not.toContain('secret stack detail')

    const whole = renderToStaticMarkup(createElement(GlobalError, { error, reset: () => {} }))
    expect(whole.replace('<head></head>', '')).toMatch(/^<html lang="en"><body/)
    expect(whole).toContain('Go home')
    expect(whole).not.toContain('secret stack detail')
  })
})
