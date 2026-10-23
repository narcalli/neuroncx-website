/**
 * The content collections the website renders, by CMS slug: where their
 * pages live and how their headings read. Mirrors the CMS registry
 * (neuroncx-cms src/content/registry.ts and the section definitions in
 * src/content/sections/); keep the two in step.
 */

export type ContentCollectionSlug = 'microApps'

export type ContentCollectionInfo = {
  /** Route base: the hub address, and entry pages below it. */
  route: string
  /** The hub's name in breadcrumbs. */
  hubLabel: string
  /** The field that holds an entry's grouping, and the Lists type it points at. */
  groupField: string
  listType: string
  /** This collection's default heading for a section, where it differs from the section's own. */
  headings: Record<string, string>
  /**
   * True once the hub record serves the route base itself. Until then the
   * route base is a CMS page, and the hub is only a preview.
   */
  hubAtRoute: boolean
}

export const CONTENT_COLLECTIONS: Record<ContentCollectionSlug, ContentCollectionInfo> = {
  microApps: {
    route: '/bot-swarm',
    hubLabel: 'Bot swarm',
    groupField: 'family',
    listType: 'agentFamily',
    headings: { related: 'Other agents in {family}' },
    hubAtRoute: false,
  },
}

/**
 * Each section's own default heading, by key (the block slug without
 * "Section"). {name} is the entry's name, or the hub's on a hub section;
 * {family} is the entry's grouping.
 */
export const SECTION_HEADINGS: Record<string, string> = {
  benefits: 'Why teams use {name}',
  useCases: 'Where teams use it',
  integrations: 'Works with',
  customers: 'Where {name} is live',
  faq: 'Questions about {name}',
  related: 'More like {name}',
  closing: 'See {name} at work',
  agentPanel: 'What {name} does, step by step',
  agentChain: 'Where it sits in the swarm',
  agentTeamControls: 'What your team controls',
  agentResult: 'What changes for your team',
  hubIntro: 'What {name} is',
  hubSteps: 'How it works',
  hubLayers: 'What sits underneath',
  hubWorksWith: 'Works with',
  hubIndustries: 'By industry',
  hubTrust: 'What you stay in control of',
  hubArticles: 'Read the latest',
}

/** The section key of a layout block, or null for a page block. */
export const sectionKeyOf = (blockType?: string | null): string | null =>
  blockType && blockType.endsWith('Section') ? blockType.slice(0, -'Section'.length) : null

/** Fills {name}, {family} and any other token it has a value for. */
export const fillHeading = (template: string, values: Record<string, string | null | undefined>): string =>
  template.replace(/\{(\w+)\}/g, (token, key: string) => values[key] ?? token)
