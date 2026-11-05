import { execFileSync } from 'child_process'
import { mkdtempSync } from 'fs'
import { createRequire } from 'module'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { redirects } from '../../redirects'

/** The move to neuroncx.in: old addresses, the Netlify subdomain and the site address at build time. */

const require = createRequire(import.meta.url)
const root = path.resolve(__dirname, '../..')

const to = async (source: string) => (await redirects!()).find((r) => r.source === source)

afterEach(() => vi.unstubAllEnvs())

describe('old neuroncx.in addresses', () => {
  it('go to the new page for good', async () => {
    expect(await to('/knowledge-base/ncx_articlegenerate-generative-content-augmentation-workflows/7')).toEqual({
      source: '/knowledge-base/ncx_articlegenerate-generative-content-augmentation-workflows/7',
      destination: '/knowledge-base',
      permanent: true,
    })
    expect((await to('/neuroncx-integrations/fbcloud-whatsapp-doctor-appointment-booking-with-docpulse-integration/16'))?.destination).toBe(
      '/integrations/docpulse',
    )
  })

  it('send a blog address to its post', async () => {
    expect((await to('/omnichannel-cx/four-essential-whatsapp-flows-for-healthcare/28'))?.destination).toBe(
      '/posts/four-essential-whatsapp-flows-for-healthcare',
    )
  })

  it('check the exact addresses before the catch-alls, which need a number at the end', async () => {
    const sources = (await redirects!()).map((r) => r.source)
    expect(sources.indexOf('/omnichannel-cx/three-whatsapp-flows-for-d2c-and-retail/29')).toBeLessThan(
      sources.indexOf('/omnichannel-cx/:slug/:id(\\d+)'),
    )
    expect(sources).toContain('/knowledge-base/:slug/:id(\\d+)')
  })
})

describe('the Netlify subdomain', () => {
  const hostRule = async () => (await redirects!()).find((r) => 'has' in r && r.has?.some((h) => h.type === 'host'))

  it('stays open until the site address is neuroncx.in', async () => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://neuroncx.netlify.app')
    expect(await hostRule()).toBeUndefined()
  })

  it('then redirects that one host only', async () => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://neuroncx.in')
    expect(await hostRule()).toEqual({
      source: '/:path*',
      has: [{ type: 'host', value: 'neuroncx.netlify.app' }],
      destination: 'https://neuroncx.in/:path*',
      permanent: true,
    })
  })
})

describe('the site address at build time', () => {
  it('fails with a clear message when it is missing', () => {
    const empty = mkdtempSync(path.join(tmpdir(), 'site-url-'))
    const env = { ...process.env }
    delete env.NEXT_PUBLIC_SERVER_URL
    expect(() =>
      execFileSync(process.execPath, [path.join(root, 'scripts/site-url.cjs')], { cwd: empty, env, stdio: 'pipe' }),
    ).toThrow(/NEXT_PUBLIC_SERVER_URL must be the site's full address/)
  })

  it('writes robots.txt with no Host line, and only real sitemaps', async () => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://neuroncx.in/')
    const config = require(path.join(root, 'next-sitemap.config.cjs'))
    expect(config.siteUrl).toBe('https://neuroncx.in')
    expect(config.robotsTxtOptions.additionalSitemaps).toEqual([
      'https://neuroncx.in/pages-sitemap.xml',
      'https://neuroncx.in/content-sitemap.xml',
    ])
    const out = await config.robotsTxtOptions.transformRobotsTxt(
      {},
      '# *\nUser-agent: *\n\n# Host\nHost: https://neuroncx.in\n\n# Sitemaps\nSitemap: https://neuroncx.in/sitemap.xml\n',
    )
    expect(out).toBe('# *\nUser-agent: *\n\n# Sitemaps\nSitemap: https://neuroncx.in/sitemap.xml\n')
  })

  it('keeps preview and API addresses out of search, and leaves the share card open', () => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://neuroncx.in')
    const config = require(path.join(root, 'next-sitemap.config.cjs'))
    const disallow: string[] = config.robotsTxtOptions.policies[0].disallow
    expect(disallow).toEqual(['/admin/*', '/next/', '/api/'])
    expect(disallow.some((rule) => '/og'.startsWith(rule.replace('*', '')))).toBe(false)
  })
})
