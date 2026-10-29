import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { fromIntegration } from '@/components/cards/adapters/integration'
import { CardDesign } from '@/components/cards/registry'
import type { CardItem, CardLastRow } from '@/components/cards/types'
import { loadIntegrations } from '@/utilities/integrations'

/**
 * A preview of every card design with live integration data, for developers.
 *
 * Development only. The file ends in .dev.tsx, and next.config.ts treats
 * .dev.tsx as a page only while developing, so a production build never
 * includes this route. The notFound() below is a second guard. Never indexed.
 */

export const metadata: Metadata = {
  title: 'Card designs (development)',
  robots: { index: false, follow: false },
}

// Used only when the CMS has no live integrations to show.
const SAMPLE: CardItem[] = [
  {
    id: 's1',
    title: 'DocPulse',
    tagline: 'Bookings from WhatsApp',
    text: 'Appointments booked, moved and cancelled in the chat.',
    initial: 'D',
    badge: 'Healthcare systems',
    icon: 'stethoscope',
    href: '/integrations/docpulse',
  },
  {
    id: 's2',
    title: 'Razorpay',
    tagline: 'Payments in the chat',
    text: 'Payment links sent and confirmed without a call.',
    initial: 'R',
    badge: 'Payments',
    icon: 'card',
  },
  {
    id: 's3',
    title: 'Exotel',
    tagline: 'Calls on the record',
    text: 'Every call lands on the customer record with its recording.',
    initial: 'E',
    badge: 'Telephony',
    icon: 'phone',
  },
]

const Section: React.FC<{ title: string; note?: string; children: React.ReactNode }> = ({
  title,
  note,
  children,
}) => (
  <section className="ncx-devcards__section">
    <h2>{title}</h2>
    {note ? <p className="ncx-devcards__note">{note}</p> : null}
    {children}
  </section>
)

export default async function CardDesignsPreview() {
  if (process.env.NODE_ENV !== 'development') notFound()

  const live = (await loadIntegrations({ populateBy: 'all' }, 12)).map(fromIntegration)
  const items = live.length ? live : SAMPLE
  // Seven cards in rows of four leaves a short last row of three.
  const seven = items.slice(0, 7)
  const lastRows: CardLastRow[] = ['leave', 'stretch', 'center']
  const withLogos = items
    .slice(0, 3)
    .map((it) => ({
      ...it,
      logo: { src: '/ncx-logo.png', alt: '' },
      linkLabel: 'See the integration',
    }))

  return (
    <div className="ncx-devcards ncx-container">
      <style>{`
        .ncx-devcards{padding-block:calc(64px + 48px) 96px;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-devcards h1{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:36px;margin:0 0 8px;color:var(--ncx-ink)}
        .ncx-devcards__lead{margin:0 0 40px;color:var(--ncx-muted)}
        .ncx-devcards__section{padding-block:40px;border-top:1px solid var(--ncx-rule)}
        .ncx-devcards__section h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:26px;margin:0 0 6px;color:var(--ncx-ink)}
        .ncx-devcards__note{margin:0 0 24px;color:var(--ncx-muted);font-size:15px}
        .ncx-devcards__sub{margin:28px 0 12px;font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--ncx-muted)}
      `}</style>
      <h1>Card designs</h1>
      <p className="ncx-devcards__lead">
        {live.length
          ? `${live.length} live integrations from the CMS, through fromIntegration().`
          : 'Sample data: the CMS returned no live integrations.'}
      </p>

      <Section
        title="grid"
        note="The Integrations block cell. Seven cards in rows of four, with each lastRow setting."
      >
        {lastRows.map((lastRow) => (
          <React.Fragment key={lastRow}>
            <p className="ncx-devcards__sub">lastRow: {lastRow}</p>
            <CardDesign design="grid" items={seven} columns={4} lastRow={lastRow} />
          </React.Fragment>
        ))}
        <p className="ncx-devcards__sub">No columns (as the Integrations block uses it)</p>
        <CardDesign design="grid" items={seven} />
      </Section>

      <Section
        title="logoCard"
        note="The related integrations cards, without the All integrations end card."
      >
        <CardDesign design="logoCard" items={seven} columns={4} />
      </Section>

      <Section
        title="directory"
        note="The customer directory cards. The badge (category) is the tag and the filter."
      >
        <CardDesign design="directory" items={items} columns={3} />
      </Section>

      <Section
        title="feature"
        note="The Bento Grid and Card Grid card, with the logo in place of the icon tile."
      >
        <p className="ncx-devcards__sub">Default look (white)</p>
        <CardDesign design="feature" items={items.slice(0, 6)} columns={3} />
        <p className="ncx-devcards__sub">look: grey, gradient border, accent line</p>
        <CardDesign
          design="feature"
          items={items.slice(0, 4).map((it) => ({ ...it, logo: null }))}
          columns={4}
          look={{ cardColor: 'grey', border: 'gradient', accentLine: true }}
        />
      </Section>

      <Section
        title="story"
        note="The case study card. A logo frame, or a placeholder gradient when there is no logo."
      >
        <CardDesign
          design="story"
          items={items.slice(0, 6).map((it, i) => (i % 2 ? { ...it, logo: null } : it))}
          columns={3}
        />
      </Section>

      <Section title="pill" note="The marquee pill, as a still list.">
        <CardDesign design="pill" items={items} />
      </Section>

      <Section
        title="With logos"
        note="Three items given a logo (the site's own mark), to show each design's logo slot. The local integrations have no logos."
      >
        {(['grid', 'logoCard', 'feature', 'story', 'pill'] as const).map((design) => (
          <React.Fragment key={design}>
            <p className="ncx-devcards__sub">{design}</p>
            <CardDesign design={design} items={withLogos} columns={3} />
          </React.Fragment>
        ))}
      </Section>

      <Section title="Unknown design" note="An unknown design name falls back to the grid.">
        <CardDesign design="nope" items={items.slice(0, 3)} columns={3} />
      </Section>
    </div>
  )
}
