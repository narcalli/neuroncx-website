import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { HubLayersStack } from '@/components/sections/HubLayersStack'

/**
 * Layers as a 3D stack (prompt 10 of the motion plan): the server HTML (and
 * motion off) is the settled, assembled stack, already carrying every row
 * card's crimson edge, since the pulled-apart entrance only plays once
 * mounted and in view.
 */
describe('HubLayersStack', () => {
  const layers = [
    { id: '1', title: 'One shared customer record', line: 'Every bot reads the same record.' },
    { id: '2', title: 'Work done in your own systems', line: 'Bookings and payments land where you work.' },
    { id: '3', title: 'Your team stays in charge', line: 'Decisions move to a person with full history.' },
  ]

  it('renders a slab per layer, labelled Layer <n>, already landed', () => {
    const html = renderToStaticMarkup(React.createElement(HubLayersStack, { layers }))
    expect(html).toContain('ncx-layers-stack')
    expect(html.match(/class="slab"/g)?.length).toBe(3)
    expect(html).toContain('Layer 1')
    expect(html).toContain('Layer 3')
    expect(html.match(/class="ncx-sec__card layer is-landed"/g)?.length).toBe(3)
  })

  it('shows the stack already landed with motion off', () => {
    const html = renderToStaticMarkup(React.createElement(HubLayersStack, { layers, motion: 'off' }))
    expect(html.match(/class="ncx-sec__card layer is-landed"/g)?.length).toBe(3)
  })

  it('links a row card when it has a link, else gives it a tab stop of its own', () => {
    const html = renderToStaticMarkup(
      React.createElement(HubLayersStack, { layers: [{ ...layers[0], href: '/microapps/booking' }, layers[1]] }),
    )
    expect(html).toContain('href="/microapps/booking"')
    expect(html).toContain('tabindex="0"')
  })
})
