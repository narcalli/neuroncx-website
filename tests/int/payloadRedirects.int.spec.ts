import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMany, notFoundUnlessCmsDown } = vi.hoisted(() => ({
  getMany: vi.fn(),
  notFoundUnlessCmsDown: vi.fn(() => {
    throw new Error('NOT_FOUND')
  }),
}))

vi.mock('next/navigation', () => ({
  permanentRedirect: (url: string) => {
    throw new Error(`308:${url}`)
  },
  redirect: (url: string) => {
    throw new Error(`307:${url}`)
  },
}))

vi.mock('@/utilities/cms', () => ({
  CMS_TAG: 'cms',
  getMany,
  notFoundUnlessCmsDown,
}))

import { PayloadRedirects } from '@/components/PayloadRedirects'

describe('PayloadRedirects', () => {
  beforeEach(() => {
    getMany.mockReset()
    notFoundUnlessCmsDown.mockClear()
  })

  it('sends a 308 permanent redirect when type is 308', async () => {
    getMany.mockResolvedValue([
      { from: '/crm', to: { url: '/b2c-crm-for-hub-and-spoke' }, type: '308' },
    ])

    await expect(PayloadRedirects({ url: '/crm' })).rejects.toThrow('308:/b2c-crm-for-hub-and-spoke')
  })

  it('defaults to a 308 permanent redirect when type is missing or null', async () => {
    getMany.mockResolvedValue([
      { from: '/e', to: { url: '/episodic-engagements' } },
      { from: '/r', to: { url: '/reports-and-analytics' }, type: null },
    ])

    await expect(PayloadRedirects({ url: '/e' })).rejects.toThrow('308:/episodic-engagements')
    await expect(PayloadRedirects({ url: '/r' })).rejects.toThrow('308:/reports-and-analytics')
  })

  it('sends a 307 temporary redirect only when type is 307', async () => {
    getMany.mockResolvedValue([
      { from: '/temp', to: { url: '/destination' }, type: '307' },
    ])

    await expect(PayloadRedirects({ url: '/temp' })).rejects.toThrow('307:/destination')
  })

  it('uses the document redirect type for page and post references', async () => {
    getMany.mockResolvedValue([
      {
        from: '/old-page',
        to: { reference: { relationTo: 'pages', value: { slug: 'new-page' } } },
        type: '308',
      },
      {
        from: '/old-post',
        to: { reference: { relationTo: 'posts', value: { slug: 'new-post' } } },
        type: '307',
      },
    ])

    await expect(PayloadRedirects({ url: '/old-page' })).rejects.toThrow('308:/new-page')
    await expect(PayloadRedirects({ url: '/old-post' })).rejects.toThrow('307:/posts/new-post')
  })
})
