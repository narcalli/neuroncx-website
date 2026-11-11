import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * A CMS that does not answer must not turn pages into 404s, which the CDN
 * caches and shows to everyone: notFoundUnlessCmsDown (utilities/cms.ts)
 * throws instead, so the error page shows, uncached.
 */

// React memoizes cache() only inside a server render; here each test is one
// "request", numbered so a count never leaks into the next test.
const scope = vi.hoisted(() => ({ id: 0 }))
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  const cache = <T extends (...args: never[]) => unknown>(fn: T) => {
    const memo = new Map<string, unknown>()
    return ((...args: never[]) => {
      const key = `${scope.id}|${JSON.stringify(args)}`
      if (!memo.has(key)) memo.set(key, fn(...args))
      return memo.get(key)
    }) as T
  }
  return { ...actual, default: { ...actual, cache }, cache }
})
vi.mock('next/headers', () => ({
  draftMode: async () => ({ isEnabled: false }),
  cookies: async () => ({ get: () => undefined }),
}))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

type Reply = { status: number } | 'network'
let reply: Reply = { status: 200 }
let cms: typeof import('@/utilities/cms')

beforeAll(async () => {
  vi.stubEnv('CMS_URL', 'https://cms.example')
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      if (reply === 'network') throw new TypeError('fetch failed')
      const { status } = reply
      return { ok: status < 400, status, json: async () => ({ docs: [] }) }
    }),
  )
  cms = await import('@/utilities/cms')
})

beforeEach(() => {
  scope.id++
  reply = { status: 200 }
})

describe('a page the CMS does not have', () => {
  it('is a 404 when the CMS answered with nothing', async () => {
    expect(await cms.getBySlug('pages', 'missing')).toBeNull()
    expect(() => cms.notFoundUnlessCmsDown()).toThrow('NEXT_NOT_FOUND')
  })

  it('is a 404 when the CMS refused or did not know the request (4xx)', async () => {
    reply = { status: 404 }
    await cms.getBySlug('pages', 'missing')
    reply = { status: 403 }
    await cms.getMany('pages')
    expect(() => cms.notFoundUnlessCmsDown()).toThrow('NEXT_NOT_FOUND')
  })
})

describe('a page looked up while the CMS is down', () => {
  it.each([500, 502, 503, 504, 429, 408])('is an error, not a 404, after a %i', async (status) => {
    reply = { status }
    expect(await cms.getBySlug('pages', 'about')).toBeNull()
    expect(() => cms.notFoundUnlessCmsDown()).toThrow(cms.CmsUnavailableError)
  })

  it('is an error, not a 404, when the CMS cannot be reached', async () => {
    reply = 'network'
    await cms.getBySlug('pages', 'about')
    expect(() => cms.notFoundUnlessCmsDown()).toThrow(cms.CmsUnavailableError)
  })

  it('is an error when any lookup in the render failed, even if a later one answered', async () => {
    reply = { status: 503 }
    await cms.getBySlug('pages', 'about')
    reply = { status: 200 }
    await cms.getMany('redirects')
    expect(() => cms.notFoundUnlessCmsDown()).toThrow(cms.CmsUnavailableError)
  })

  it('does not carry over to the next request', async () => {
    reply = { status: 503 }
    await cms.getBySlug('pages', 'about')
    scope.id++
    reply = { status: 200 }
    await cms.getBySlug('pages', 'missing')
    expect(() => cms.notFoundUnlessCmsDown()).toThrow('NEXT_NOT_FOUND')
  })
})
