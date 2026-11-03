/**
 * The Custom Visual layouts and their anchor points: the centre of the hub
 * and of each card slot, as x% across and y% down the diagram, from its top
 * left. The editor's connector visual is drawn to meet these points (the
 * Layout field's guidance lists them), and the component places the hub and
 * the cards on them. Mirrors neuroncx-cms src/blocks/CustomVisual/layouts.ts:
 * the CMS is a separate repo, so change both together.
 */

export type Anchor = readonly [x: number, y: number]

export type CustomVisualLayout = 'hubSpoke2' | 'hubSpoke3' | 'hubSpoke4' | 'none'

export const CUSTOM_VISUAL_LAYOUTS: Record<CustomVisualLayout, { hub: Anchor | null; spokes: readonly Anchor[] }> = {
  hubSpoke2: {
    hub: [50, 50],
    spokes: [
      [15, 50],
      [85, 50],
    ],
  },
  hubSpoke3: {
    hub: [50, 50],
    spokes: [
      [50, 17],
      [15, 82],
      [85, 82],
    ],
  },
  hubSpoke4: {
    hub: [50, 50],
    spokes: [
      [15, 20],
      [85, 20],
      [15, 80],
      [85, 80],
    ],
  },
  none: { hub: null, spokes: [] },
}

export const DEFAULT_CUSTOM_VISUAL_LAYOUT: CustomVisualLayout = 'hubSpoke3'

/**
 * The diagram's shape when the editor leaves Shape on "As tall as its
 * content": the cards are placed absolutely, so they give the diagram no
 * height of their own. Each is tall enough that a card centred on the top
 * or bottom points stays inside the diagram at desktop widths.
 */
export const DEFAULT_DIAGRAM_ASPECT: Record<Exclude<CustomVisualLayout, 'none'>, string> = {
  hubSpoke2: '16/9',
  hubSpoke3: '1/1',
  hubSpoke4: '4/3',
}

export const layoutOf = (value: unknown): CustomVisualLayout =>
  typeof value === 'string' && value in CUSTOM_VISUAL_LAYOUTS ? (value as CustomVisualLayout) : DEFAULT_CUSTOM_VISUAL_LAYOUT
