import { describe, expect, it } from 'vitest'

import { buildLlmsTxt } from '@/utilities/llmsTxt'

describe('llms.txt', () => {
  it('has the site name as the title, its description as the summary, and a section of links per kind of page', () => {
    const txt = buildLlmsTxt({
      name: 'NeuronCx',
      summary: 'An AI harness for CRM, CX and automations.',
      sections: [
        { heading: 'Pages', links: [{ title: 'CRM', url: 'https://x.test/crm', description: 'One customer record.' }] },
        { heading: 'Integrations', links: [{ title: 'DocPulse', url: 'https://x.test/integrations/docpulse' }] },
      ],
    })
    expect(txt).toBe(
      [
        '# NeuronCx',
        '',
        '> An AI harness for CRM, CX and automations.',
        '',
        '## Pages',
        '',
        '- [CRM](https://x.test/crm): One customer record.',
        '',
        '## Integrations',
        '',
        '- [DocPulse](https://x.test/integrations/docpulse)',
        '',
      ].join('\n'),
    )
  })

  it('leaves out links with no address or title, a page listed twice, and sections left empty', () => {
    const txt = buildLlmsTxt({
      name: 'NeuronCx',
      sections: [
        {
          heading: 'Pages',
          links: [
            { title: 'Home', url: 'https://x.test/' },
            { title: 'Hidden', url: '' },
            { title: '', url: 'https://x.test/untitled' },
          ],
        },
        { heading: 'Again', links: [{ title: 'Home again', url: 'https://x.test/' }] },
        { heading: 'Articles', links: [] },
      ],
    })
    expect(txt).toContain('- [Home](https://x.test/)')
    expect(txt).not.toContain('Hidden')
    expect(txt).not.toContain('untitled')
    expect(txt).not.toContain('## Again')
    expect(txt).not.toContain('## Articles')
    expect(txt).not.toContain('>')
  })

  it('keeps each link on one line and its text free of brackets', () => {
    const txt = buildLlmsTxt({
      name: 'NeuronCx',
      sections: [{ heading: 'Pages', links: [{ title: 'Bot [beta]\nswarm', url: 'https://x.test/b', description: 'Many\n  small   agents.' }] }],
    })
    expect(txt).toContain('- [Bot beta swarm](https://x.test/b): Many small agents.')
  })
})
