import type { Hub, List } from '@/payload-types'

/**
 * Whether a hub's layout places its grouping sections itself, with the
 * "Grouping sections" block (hubGroupingsSection in neuroncx-cms
 * src/content/sections/hub.ts). Without it they come right after the hero.
 */
export const groupingsPlaced = (layout: Hub['layout'] | null | undefined): boolean =>
  Array.isArray(layout) && layout.some((b) => b?.blockType === 'hubGroupingsSection')

type Row = NonNullable<Hub['groupingSections']>[number]

/**
 * A grouping section's copy: the hub row's own, else the grouping's
 * (Lists), else, for the heading, the grouping's name.
 */
export const groupingCopy = (
  row: Partial<Pick<Row, 'eyebrow' | 'heading' | 'intro'>>,
  group: Pick<List, 'name' | 'heading' | 'intro' | 'summary'>,
): { eyebrow: string; heading: string; intro: string | null } => ({
  eyebrow: row.eyebrow || group.name,
  heading: row.heading || group.heading || group.name,
  intro: row.intro || group.intro || group.summary || null,
})
