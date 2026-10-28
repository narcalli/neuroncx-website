import React from 'react'
import { SplitHeading } from '@/motion/SplitHeading'
import { Reveal } from '@/motion/Reveal'

/**
 * The frame every content section uses, in the light theme of the
 * integration pages: a container, an H2 and the content. The page has one
 * H1, in its hero, so a section heading is always an H2.
 */
export const SectionShell: React.FC<{
  id: string
  heading: string
  /** The small line above the heading. */
  eyebrow?: string | null
  intro?: string | null
  children: React.ReactNode
}> = ({ id, heading, eyebrow, intro, children }) => (
  <section className="ncx-sec" aria-labelledby={id}>
    <div className="ncx-container">
      {eyebrow ? <Reveal as="p" from="left" className="ncx-sec__eyebrow">{eyebrow}</Reveal> : null}
      <SplitHeading as="h2" id={id}>{heading}</SplitHeading>
      {intro ? <Reveal as="p" className="ncx-sec__intro">{intro}</Reveal> : null}
      {children}
    </div>
  </section>
)

/** The styles every section shares. Rendered once per page, by RenderSections. */
export const SectionStyles: React.FC = () => (
  <style>{`
    .ncx-sec{padding-block:72px;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
    .ncx-sec h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
      font-size:clamp(28px,3.4vw,38px);line-height:1.15;letter-spacing:-.03em;margin:0 0 32px;
      color:var(--ncx-ink);text-wrap:balance;max-width:var(--ncx-heading-max)}
    .ncx-sec__eyebrow{font-family:var(--font-display),Arial,sans-serif;font-size:14px;
      color:var(--ncx-crimson-ink);margin:0 0 12px}
    .ncx-sec__intro{margin:-16px 0 32px;max-width:64ch;font-size:18px;line-height:1.6;color:var(--ncx-muted)}
    .ncx-sec__lead{margin:0 0 24px;max-width:68ch;font-size:18px;line-height:1.6;color:var(--ncx-ink)}
    .ncx-sec__lead b{font-weight:600}

    /* Cards: white on the page, a hairline, the panel radius. */
    .ncx-sec__grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));
      list-style:none;margin:0;padding:0}
    .ncx-sec__card{background:var(--ncx-white);border:1px solid var(--ncx-rule);
      border-radius:var(--ncx-r-panel);padding:22px}
    .ncx-sec__card h3{font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:18px;
      line-height:1.3;letter-spacing:-.01em;margin:0 0 8px;color:var(--ncx-ink)}
    .ncx-sec__card p{margin:0;font-size:16px;line-height:1.6;color:var(--ncx-muted)}
    .ncx-sec__card .icon{display:inline-flex;width:40px;height:40px;align-items:center;justify-content:center;
      border-radius:10px;background:var(--ncx-cloud);color:var(--ncx-ink);margin-bottom:14px}
    .ncx-sec__card .icon svg{width:22px;height:22px}
    .ncx-sec__card .more{display:inline-block;margin-top:12px;font-size:15px;font-weight:500;
      color:var(--ncx-crimson-ink);text-decoration:none}
    .ncx-sec__card .more:hover{text-decoration:underline}

    /* Chips: linked where the target has a page. */
    .ncx-sec__chips{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:0;padding:0}
    .ncx-sec__chips li > *{display:inline-block;font-size:14px;font-weight:500;color:var(--ncx-ink);
      background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:999px;padding:7px 14px;
      text-decoration:none}
    .ncx-sec__chips a:hover{border-color:var(--ncx-ink)}
    .ncx-sec__chips .is-here{background:var(--ncx-navy);color:var(--ncx-on-navy);border-color:var(--ncx-navy)}

    .ncx-sec a:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
    @media(max-width:960px){.ncx-sec{padding-block:56px}}
  `}</style>
)
