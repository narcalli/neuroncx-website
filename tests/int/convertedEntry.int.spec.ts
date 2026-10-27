import React from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { IndustryEntryPage } from '@/components/industry/IndustryEntryPage'
import type { Sector } from '@/payload-types'

/**
 * An industry converted from field sections to page blocks draws the same
 * words: the by-team tabs, the record and the comparison, as the local
 * Higher education entry was converted (CMS scripts, run once).
 */

vi.mock('next/headers', () => ({ draftMode: async () => ({ isEnabled: true }) }))
vi.mock('@/blocks/Code/CopyButton', () => ({ CopyButton: () => null }))
vi.mock('@/components/LivePreviewListener', () => ({ LivePreviewListener: () => null }))

beforeEach(() => {
  vi.stubEnv('CMS_URL', 'http://cms.test')
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ docs: [], totalDocs: 0, totalPages: 1, page: 1 }), { status: 200 })))
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

const tabs = [
  { label: 'Admissions leadership', title: 'Admissions leadership', intro: 'Visibility of the whole intake.', points: [{ text: 'Leads compared by source.' }] },
  { label: 'Counsellors', title: 'Counsellors', intro: 'Qualified applicants first.', points: [{ text: 'Call scores for every counsellor.' }] },
]
const record = {
  recordLabel: 'Student record',
  fieldColumnLabel: 'Field',
  sourceColumnLabel: 'Filled by',
  entities: [
    { label: 'Student', description: 'The person applying.', fields: [{ name: 'Name', source: 'Qualification form' }] },
    { label: 'Fees', description: 'What is owed.', fields: [{ name: 'Balance', source: 'ERP' }] },
  ],
}
const table = {
  columns: [{ label: 'Lead management CRM' }, { label: 'NeuronCx', highlight: true }],
  rows: [{ label: 'What a record represents', cells: [{ text: 'A lead' }, { text: 'A student' }] }],
}

const base = { id: 'edu', name: 'Higher education', slug: 'higher-education', path: '/higher-education', status: 'live', hasOwnPage: true, heroDesign: 'conversation', summary: 'Admissions on one record.' }

const fromSections = {
  ...base,
  audiences: tabs,
  ...record,
  ...table,
  layout: [{ blockType: 'industryProblemsSection' }, { blockType: 'industryAudiencesSection' }, { blockType: 'industryRecordSection' }, { blockType: 'industryComparisonSection' }],
} as unknown as Sector

const fromBlocks = {
  ...base,
  // The field data stays, hidden; the page draws the blocks.
  audiences: tabs,
  ...record,
  ...table,
  layout: [
    { blockType: 'industryProblemsSection' },
    { blockType: 'audienceTabs', heading: 'What each team gets', tabs },
    { blockType: 'recordAnatomy', htmlId: 'record-anatomy', heading: 'What the record holds', ...record },
    { blockType: 'comparisonTable', heading: 'How it compares', ...table },
  ],
} as unknown as Sector

const render = async (entry: Sector) => {
  const stream = await renderToReadableStream(
    React.createElement(IndustryEntryPage, { collection: 'sectors', entry, trail: [{ label: 'Home', href: '/' }, { label: entry.name }], draft: true }),
  )
  await stream.allReady
  return new Response(stream).text()
}

/** The words a reader gets: tags, styles and React's markers removed. */
const words = (html: string) =>
  html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

describe('a converted industry', () => {
  it('draws the same words from its blocks as from its field sections', async () => {
    const before = words(await render(fromSections))
    const after = words(await render(fromBlocks))
    expect(after).toBe(before)
    for (const text of ['What each team gets', 'Call scores for every counsellor.', 'Student record', 'Qualification form', 'Fees', 'A student']) {
      expect(after).toContain(text)
    }
  })

  it('gives the record its anchor', async () => {
    expect(await render(fromBlocks)).toContain('id="record-anatomy"')
  })
})
