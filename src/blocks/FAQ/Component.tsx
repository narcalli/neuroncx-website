import React from 'react'
import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'

import type { FAQBlock as FAQBlockProps } from '@/payload-types'

type Item = FAQBlockProps['items'][number]

/** The question's accessible name must be the question text alone — no icon or extra element inside <summary>. */
function QuestionAnswer({ item }: { item: Item }) {
  const answerData = item.answer as unknown as DefaultTypedEditorState

  return (
    <details className="faq-item" open={item.defaultOpen || undefined}>
      <summary>{item.question}</summary>
      <div className="faq-answer">
        <RichText data={answerData} enableGutter={false} enableProse={false} />
      </div>
    </details>
  )
}

export const FAQBlock: React.FC<FAQBlockProps> = ({ heading, intro, items, background, anchorId, emitSchema }) => {
  const list = (items || []).filter((item) => item && item.question)
  if (!list.length) return null

  const bg = background === 'white' ? 'white' : 'cloud'

  // schema.org FAQPage structured data. No page-level JSON-LD assembler exists
  // in this repo yet (checked), so this is the only script tag for it.
  const schema = emitSchema
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: list.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: convertLexicalToPlaintext({ data: item.answer as unknown as DefaultTypedEditorState }),
          },
        })),
      }
    : null

  return (
    <section className="ncx-faq" id={anchorId || undefined} data-bg={bg}>
      <style>{`

        .ncx-faq{padding:76px 0;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body);
          scroll-margin-top:96px}
        .ncx-faq[data-bg="white"]{background:var(--ncx-white)}
        .ncx-faq[data-bg="cloud"]{background:var(--ncx-cloud)}


        .ncx-faq h2{font-family:var(--font-display),Arial,sans-serif;font-weight:600;
          font-size:clamp(26px,3.2vw,36px);letter-spacing:-.02em;line-height:1.15;margin:0;color:var(--ncx-ink)}
        .ncx-faq .intro{color:var(--ncx-muted);margin:14px 0 0;max-width:62ch;font-size:16px;line-height:1.65}

        .ncx-faq .list{margin-top:34px}

        .ncx-faq .faq-item{border-bottom:1px solid var(--ncx-rule)}
        .ncx-faq .faq-item:first-of-type{border-top:1px solid var(--ncx-rule)}

        .ncx-faq summary{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:1.06rem;
          padding:20px 40px 20px 0;cursor:pointer;list-style:none;position:relative;color:var(--ncx-ink)}
        .ncx-faq summary::-webkit-details-marker{display:none}
        .ncx-faq summary::after{content:"+";position:absolute;right:6px;top:18px;
          font-size:1.5rem;font-weight:400;color:var(--ncx-link);transition:color .15s ease}
        .ncx-faq details[open] summary::after{content:"\\2013"}
        .ncx-faq summary:focus-visible{outline:2px solid var(--ncx-crimson);outline-offset:2px}

        .ncx-faq .faq-answer{padding:0 0 22px;max-width:66ch;font-size:.98rem;line-height:1.6;
          font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-faq .faq-answer p{margin:0 0 .75em}
        .ncx-faq .faq-answer p:last-child{margin-bottom:0}
        .ncx-faq .faq-answer a{color:var(--ncx-link)}
        .ncx-faq .faq-answer ul{margin:.5em 0;padding-left:1.25em}

        @media(prefers-reduced-motion:reduce){
          .ncx-faq summary::after{transition:none}
        }
        @media(max-width:860px){
          .ncx-faq{padding:60px 0}
        }
      `}</style>

      <div className="inner ncx-container">
        {heading ? <h2>{heading}</h2> : null}
        {intro ? <p className="intro">{intro}</p> : null}

        <div className="list">
          {list.map((item) => (
            <QuestionAnswer item={item} key={item.id} />
          ))}
        </div>
      </div>

      {schema ? (
        // Next.js's documented pattern for JSON-LD: dangerouslySetInnerHTML avoids
        // React HTML-escaping characters inside the JSON string, which would
        // otherwise corrupt it. This is JSON.stringify output, not user HTML —
        // unrelated to the richText answer above, which goes through RichText.
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ) : null}
    </section>
  )
}
