import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Old-version preview: the CMS History tab's Preview link puts one version
 * in a cookie, and while draft mode is on that entry shows as it was.
 */

const state = { draft: true, cookie: undefined as string | undefined }
const jar = { set: vi.fn(), delete: vi.fn() }
vi.mock('next/headers', () => ({
  draftMode: async () => ({ isEnabled: state.draft, enable: vi.fn(), disable: vi.fn() }),
  cookies: async () => ({
    get: (name: string) => (name === 'ncx-version' && state.cookie ? { value: state.cookie } : undefined),
    set: jar.set,
    delete: jar.delete,
  }),
}))
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`)
  },
}))

const A = 'aaaaaaaaaaaaaaaaaaaaaaaa'
const B = 'bbbbbbbbbbbbbbbbbbbbbbbb'
const V = 'cccccccccccccccccccccccc'

type Cms = typeof import('@/utilities/cms')
type Cookie = typeof import('@/utilities/versionCookie')
let cms: Cms
let cookie: Cookie
let previewedVersionOf: typeof import('@/utilities/versionPreview').previewedVersionOf

const calls: string[] = []
const respond = (url: string) => {
  calls.push(url)
  if (url.includes(`/versions/${V}`)) {
    return { parent: A, version: { title: 'Then', slug: 'then-slug', _status: 'draft' } }
  }
  return { docs: [{ id: A, title: 'Now', slug: 'now-slug' }, { id: B, title: 'Other' }] }
}

beforeAll(async () => {
  vi.stubEnv('CMS_URL', 'https://cms.example')
  vi.stubEnv('CMS_PREVIEW_API_KEY', 'key')
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => ({ ok: true, status: 200, json: async () => respond(String(url)) })),
  )
  cms = await import('@/utilities/cms')
  cookie = await import('@/utilities/versionCookie')
  previewedVersionOf = (await import('@/utilities/versionPreview')).previewedVersionOf
})

beforeEach(() => {
  state.draft = true
  state.cookie = `pages|${V}|2026-11-03T10:00:00.000Z`
  calls.length = 0
  jar.set.mockClear()
  jar.delete.mockClear()
})

afterEach(() => vi.clearAllMocks())

describe('the version in a preview link', () => {
  it('accepts a known collection and a real version id, and keeps a valid date only', () => {
    expect(cookie.parseVersionParam(`pages:${V}`, '2026-11-03T10:00:00Z')).toEqual({
      collection: 'pages',
      id: V,
      at: '2026-11-03T10:00:00.000Z',
    })
    expect(cookie.parseVersionParam(`customers:${V}`, 'not a date')).toEqual({ collection: 'customers', id: V, at: null })
    expect(cookie.parseVersionParam(`users:${V}`, null)).toBeNull()
    expect(cookie.parseVersionParam('pages:../../x', null)).toBeNull()
    expect(cookie.parseVersionParam(null, null)).toBeNull()
  })

  it('round-trips through the cookie, and refuses a tampered one', () => {
    const t = { collection: 'hubs', id: V, at: '2026-11-03T10:00:00.000Z' }
    expect(cookie.decodeVersionTarget(cookie.encodeVersionTarget(t))).toEqual(t)
    expect(cookie.decodeVersionTarget('hubs|nope|')).toBeNull()
    expect(cookie.decodeVersionTarget(undefined)).toBeNull()
  })
})

describe('a draft request in an old-version preview', () => {
  it('shows the previewed entry as that version, keeping its id, and leaves the rest', async () => {
    const docs = await cms.getMany<any>('pages', { depth: 1 }, { draft: true })
    expect(docs[0]).toMatchObject({ id: A, title: 'Then' })
    expect(docs[1]).toEqual({ id: B, title: 'Other' })
    expect(calls.some((u) => u.startsWith(`https://cms.example/api/pages/versions/${V}?depth=1`))).toBe(true)
  })

  it('changes nothing for a published request, another collection, or outside draft mode', async () => {
    expect((await cms.getMany<any>('pages', {}, {}))[0].title).toBe('Now')
    expect((await cms.getMany<any>('posts', {}, { draft: true }))[0].title).toBe('Now')
    state.draft = false
    expect((await cms.getMany<any>('pages', {}, { draft: true }))[0].title).toBe('Now')
    expect(calls.some((u) => u.includes('/versions/'))).toBe(false)
  })
})

describe('pages that load only published entries', () => {
  it('get the version when its address matches, and nothing otherwise', async () => {
    state.cookie = `integrations|${V}|`
    expect(await previewedVersionOf<any>('integrations', 'then-slug')).toMatchObject({ id: A, title: 'Then' })
    expect(await previewedVersionOf<any>('integrations', 'now-slug')).toBeNull()
    expect(await previewedVersionOf<any>('customers', 'then-slug')).toBeNull()
    state.draft = false
    expect(await previewedVersionOf<any>('integrations', 'then-slug')).toBeNull()
  })
})

describe('the preview route', () => {
  const open = async (query: string) => {
    vi.stubEnv('PREVIEW_SECRET', 's')
    const { GET } = await import('@/app/(frontend)/next/preview/route')
    return GET(new Request(`https://neuroncx.in/next/preview?${query}`) as any).catch((e: Error) => e.message)
  }

  it('keeps the version from a History link in a private cookie', async () => {
    expect(await open(`path=/home&previewSecret=s&version=pages:${V}&versionAt=2026-11-03T10:00:00Z`)).toBe('redirect:/home')
    expect(jar.set).toHaveBeenCalledWith(
      'ncx-version',
      `pages|${V}|2026-11-03T10:00:00.000Z`,
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    )
  })

  it('clears it for an ordinary preview link or a version it does not know', async () => {
    await open('path=/home&previewSecret=s')
    await open('path=/home&previewSecret=s&version=users:abc')
    expect(jar.set).not.toHaveBeenCalled()
    expect(jar.delete).toHaveBeenCalledTimes(2)
  })

  it('still needs the preview secret', async () => {
    const res = (await open(`path=/home&previewSecret=wrong&version=pages:${V}`)) as Response
    expect(res.status).toBe(403)
    expect(jar.set).not.toHaveBeenCalled()
  })
})
