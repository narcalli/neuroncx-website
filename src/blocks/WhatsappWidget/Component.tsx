import React from 'react'

import type { WhatsappWidgetBlock as Props } from '@/payload-types'
import { getSiteSettings, whatsappButtonOn } from '@/utilities/siteSettings'

import { WhatsappButton } from './Button'

/**
 * The older, per-page way to show the button. The site-wide one in Site
 * Settings wins: while it is on, this block shows nothing, so a page never has
 * two buttons.
 */
export const WhatsappWidgetBlock = async ({ enabled, phone, label, prefill, includeRef }: Props) => {
  if (whatsappButtonOn(await getSiteSettings())) return null
  if (!enabled || !phone) return null
  return <WhatsappButton phone={phone} label={label} message={prefill} includeRef={includeRef} />
}
