import React from 'react'

import type { HeroStackBlock as HeroStackProps } from '@/payload-types'
import { pickMedia, type MediaValue } from '@/utilities/media'

import { HeroStackClient, type HeroStackItem } from './Client'

/**
 * The Hero Stack block. Each product's screenshot is resolved here, on the
 * server, and handed to the browser half ready to use. Resolving it in the
 * browser needs the CMS address there (NEXT_PUBLIC_PAYLOAD_URL); without it
 * the browser found no screenshots, rendered no cards, and the hero lost its
 * stack after loading (React hydration error #418).
 */
export const HeroStackBlock: React.FC<HeroStackProps> = ({ products, ...rest }) => {
  const items: HeroStackItem[] = (products || []).flatMap((p) => {
    const pick = pickMedia(p?.screenshot as MediaValue, 'stack1600')
    return p?.label && pick ? [{ id: p.id, label: p.label, caption: p.caption, pick }] : []
  })
  return <HeroStackClient {...rest} items={items} />
}
