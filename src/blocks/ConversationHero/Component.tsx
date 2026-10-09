import React from 'react'
import { StatValue } from '@/utilities/statValue'
import { BlockIcon } from '@/components/BlockIcon'

// An in-page anchor (e.g. #how-it-works) should stay on this page. Anything
// else, like a demo booking link, opens in a new tab so the visitor doesn't
// lose their place on the page.
const externalAttrs = (href?: string | null) =>
  href && href.startsWith('#') ? {} : { target: '_blank', rel: 'noopener noreferrer' }

type Props = {
  eyebrow?: string | null
  headline?: string | null
  subhead?: string | null
  headingSize?: number | null
  primaryButtonLabel?: string | null
  primaryButtonLink?: string | null
  secondaryButtonLabel?: string | null
  secondaryButtonLink?: string | null
  chips?: { label?: string | null; id?: string | null }[] | null
  conversationLabel?: string | null
  conversation?: string | null
  workflowSteps?: { label?: string | null; icon?: string | null; id?: string | null }[] | null
  stats?: { value?: string | null; label?: string | null; id?: string | null }[] | null
}

type Line = { kind: 'them' | 'us' | 'tag'; text: string }

const parse = (raw?: string | null): Line[] =>
  (raw || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^(them|us|tag)\s*:\s*(.*)$/i)
      if (!m) return { kind: 'them' as const, text: l }
      return { kind: m[1].toLowerCase() as Line['kind'], text: m[2] }
    })

// Each bubble lands 0.6s after the one before it, as in the reference.
const STEP = 0.6

// Heroes saved before the size field existed have no value, so they get 44.
// Anything outside the field's 24 to 64 range is pulled back inside it.
const headingPx = (size?: number | null) =>
  typeof size === 'number' && Number.isFinite(size) ? Math.min(64, Math.max(24, size)) : 44

export const ConversationHeroBlock: React.FC<Props> = ({
  eyebrow,
  headline,
  subhead,
  headingSize,
  primaryButtonLabel,
  primaryButtonLink,
  secondaryButtonLabel,
  secondaryButtonLink,
  chips,
  conversationLabel,
  conversation,
  workflowSteps,
  stats,
}) => {
  const lines = parse(conversation)
  const messages = lines.filter((l) => l.kind !== 'tag')
  const tags = lines.filter((l) => l.kind === 'tag')
  const pills = chips || []
  const steps = workflowSteps || []
  const figures = stats || []

  // The rail and the workflow nodes start once the last message has landed.
  const afterChat = messages.length * STEP + 0.3

  return (
    <section
      className="ncx-chero"
      style={{ '--chero-h': `${headingPx(headingSize)}px` } as React.CSSProperties}
    >
      <style>{`
        .ncx-chero{--wa:#25D366;--line:rgba(255,255,255,.12);
          /* The stage spans the viewport, like the header above and the
             sections below. The reference insets and rounds it because every
             section there is an inset card; this site is not built that way, and
             the inset left the logo pill hanging off the corner. The header
             already carries margin-bottom:-64px, which is what pulls the page
             under it — the reference does that job with margin-top:-64px here,
             and doing both would pull twice. */
          position:relative;overflow:hidden;isolation:isolate;
          background:var(--wash);color:var(--ncx-ink);
          font-family:var(--font-body),Arial,sans-serif}
        /* Four blooms on one composited layer, drifting as a single element. */
        .ncx-chero::before{
          content:"";position:absolute;inset:-35%;z-index:0;
          background:
            radial-gradient(38% 46% at 18% 28%, var(--g1), transparent 66%),
            radial-gradient(44% 52% at 78% 16%, var(--g2), transparent 66%),
            radial-gradient(46% 54% at 62% 88%, var(--g3), transparent 66%),
            radial-gradient(42% 50% at 8% 86%, var(--g4), transparent 66%);
          animation:ncxDrift 26s ease-in-out infinite alternate;
          will-change:transform}
        @keyframes ncxDrift{
          0%{transform:translate3d(0,0,0) scale(1) rotate(0deg)}
          50%{transform:translate3d(5%,-4%,0) scale(1.16) rotate(4deg)}
          100%{transform:translate3d(-4%,5%,0) scale(1.06) rotate(-3deg)}
        }
        /* Static field, not a hidden one. */
        @media(prefers-reduced-motion:reduce){.ncx-chero::before{animation:none}}
        .ncx-chero .inner{position:relative;z-index:1;
          padding-block:calc(64px + clamp(44px,6vw,76px)) clamp(36px,4.5vw,56px)}
        .ncx-chero .grid{display:grid;grid-template-columns:1.02fr .98fr;gap:56px;align-items:center}

        .ncx-chero .eyebrow{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.82rem;
          letter-spacing:.04em;color:var(--ncx-crimson-ink);margin:0 0 14px}
        /* The size comes from the editor's "Heading size" field. */
        .ncx-chero h1{font-family:var(--font-display),Arial,sans-serif;font-weight:700;
          font-size:var(--chero-h);line-height:1.06;letter-spacing:-.02em;
          margin:0;max-width:16ch}
        /* On phones a large size would run off the screen, so it stops at 36px. */
        @media(max-width:699px){.ncx-chero h1{font-size:min(var(--chero-h),36px)}}
        .ncx-chero .sub{margin:22px 0 0;font-size:1.06rem;line-height:1.6;
          color:var(--ncx-muted);max-width:52ch}
        .ncx-chero .cta{margin-top:32px;display:flex;gap:12px;flex-wrap:wrap}
        .ncx-chero .btn{display:inline-flex;align-items:center;gap:9px;
          font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.98rem;
          padding:14px 26px;border-radius:10px;border:1px solid transparent;text-decoration:none;
          transition:transform .18s ease,box-shadow .18s ease,background .18s ease}
        .ncx-chero .btn-primary{background:var(--ncx-crimson);color:var(--ncx-on-navy);
          box-shadow:0 8px 22px -8px rgba(198,40,40,.6)}
        .ncx-chero .btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 28px -8px rgba(198,40,40,.7)}
        .ncx-chero .btn-ghost{background:var(--ncx-white);color:var(--ncx-ink);border-color:var(--ncx-rule)}
        .ncx-chero .btn-ghost:hover{border-color:var(--ncx-muted)}
        .ncx-chero .btn:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
        .ncx-chero .chips{margin-top:34px;display:flex;gap:10px;flex-wrap:wrap}
        .ncx-chero .chip{font-size:.8rem;font-weight:500;color:var(--ncx-muted);
          border:1px solid var(--ncx-rule);padding:7px 13px;border-radius:100px;
          background:var(--ncx-white)}

        .ncx-chero .panel{background:var(--ncx-white);border:1px solid var(--ncx-rule);
          border-radius:var(--ncx-r-panel);padding:18px;box-shadow:var(--ncx-shadow)}
        .ncx-chero .chat-head{display:flex;align-items:center;gap:9px;padding-bottom:12px;
          border-bottom:1px solid var(--ncx-rule-soft);margin-bottom:14px;
          font-size:.82rem;color:var(--ncx-muted);font-weight:500}
        /* The only WhatsApp green left: a channel marker, not a ground. */
        .ncx-chero .dots{display:flex;align-items:center;margin-right:2px}
        .ncx-chero .dots i{width:9px;height:9px;border-radius:50%;display:block;background:var(--wa)}
        .ncx-chero .thread{display:flex;flex-direction:column;gap:9px;min-height:40px}
        .ncx-chero .bubble{max-width:82%;padding:9px 13px;border-radius:14px;font-size:.9rem;
          line-height:1.42;opacity:0;transform:translateY(14px);
          animation:ncxBubble .5s cubic-bezier(.22,.61,.36,1) forwards}
        /* The assistant carries the tint: its replies are what the page is
           demonstrating, so they lead the eye down the thread. */
        .ncx-chero .them{align-self:flex-end;background:var(--ncx-cloud);color:var(--ncx-body);
          border:1px solid var(--ncx-rule-soft);border-bottom-right-radius:4px}
        .ncx-chero .us{align-self:flex-start;background:var(--ncx-teal-tint);color:var(--ncx-ink);
          font-weight:500;border-bottom-left-radius:4px}
        @keyframes ncxBubble{to{opacity:1;transform:translateY(0)}}

        .ncx-chero .tag{margin-top:14px;padding-top:12px;border-top:1px solid var(--ncx-rule-soft);
          font-family:var(--font-display),Arial,sans-serif;font-size:.72rem;letter-spacing:.05em;
          color:var(--ncx-muted);text-transform:uppercase;opacity:0;
          animation:ncxFade .5s ease forwards}
        @keyframes ncxFade{to{opacity:1}}

        .ncx-chero .wf{margin-top:16px}
        .ncx-chero .wf-title{font-family:var(--font-display),Arial,sans-serif;font-size:.68rem;font-weight:600;
          letter-spacing:.08em;text-transform:uppercase;color:var(--ncx-faint);margin:0 0 12px}
        .ncx-chero .nodes{position:relative;display:flex;align-items:flex-start;
          justify-content:space-between}
        .ncx-chero .track{position:absolute;left:20px;right:20px;top:19px;height:2px;
          background:var(--ncx-rule);border-radius:2px}
        .ncx-chero .track span{position:absolute;inset:0 auto 0 0;width:0;background:var(--ncx-crimson);
          border-radius:2px;
          animation:ncxRail 1.6s ease forwards}
        @keyframes ncxRail{to{width:100%}}
        .ncx-chero .node{position:relative;z-index:2;flex:1;display:flex;flex-direction:column;
          align-items:center;gap:8px;font-family:var(--font-display),Arial,sans-serif;font-size:.72rem;
          font-weight:600;color:var(--ncx-muted);text-align:center;
          opacity:0;animation:ncxNode .45s ease forwards}
        .ncx-chero .ring{width:40px;height:40px;border-radius:50%;display:flex;
          align-items:center;justify-content:center;background:var(--ncx-white);
          border:2px solid var(--ncx-crimson);color:var(--ncx-crimson);
          box-shadow:0 0 0 4px var(--ncx-white)}
        .ncx-chero .ring svg{width:18px;height:18px}
        @keyframes ncxNode{to{opacity:1;color:var(--ncx-body)}}

        .ncx-chero .stats{margin-top:56px;display:grid;
          grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:1px;
          background:var(--ncx-rule);border:1px solid var(--ncx-rule);
          border-radius:var(--ncx-r-card);overflow:hidden}
        .ncx-chero .stat{background:var(--ncx-white);padding:24px 18px}
        .ncx-chero .value{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:2rem;
          letter-spacing:-.02em;color:var(--ncx-ink);line-height:1}
        .ncx-chero .slabel{font-size:.86rem;color:var(--ncx-muted);margin-top:8px}

        @media(max-width:960px){
          .ncx-chero .grid{grid-template-columns:1fr;gap:36px}
          .ncx-chero h1{max-width:100%}
          .ncx-chero .stats{margin-top:36px}
        }
        @media(prefers-reduced-motion:reduce){
          .ncx-chero .bubble,.ncx-chero .tag,.ncx-chero .node{animation:none;opacity:1;transform:none}
          .ncx-chero .rail span{animation:none;width:100%}
          .ncx-chero .btn{transition:none}
        }
              .ncx-chero .ncx-unit{font-style:normal;color:var(--ncx-crimson-ink)}
      `}</style>

      
      

      <div className="inner ncx-container">
        <div className="grid">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h1>{headline}</h1>
            {subhead ? <p className="sub">{subhead}</p> : null}

            {primaryButtonLabel || secondaryButtonLabel ? (
              <div className="cta">
                {primaryButtonLabel ? (
                  <a
                    className="btn btn-primary"
                    href={primaryButtonLink || '#'}
                    {...externalAttrs(primaryButtonLink)}
                  >
                    {primaryButtonLabel}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                ) : null}
                {secondaryButtonLabel ? (
                  <a
                    className="btn btn-ghost"
                    href={secondaryButtonLink || '#'}
                    {...externalAttrs(secondaryButtonLink)}
                  >
                    {secondaryButtonLabel}
                  </a>
                ) : null}
              </div>
            ) : null}

            {pills.length ? (
              <div className="chips">
                {pills.map((c, i) => (
                  <span className="chip" key={c.id || i}>
                    {c.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {messages.length ? (
            <div className="panel">
              <div className="chat-head">
                <span className="dots" aria-hidden="true">
                  <i />
                </span>
                {conversationLabel}
              </div>

              <div className="thread">
                {messages.map((l, i) => (
                  <div
                    className={`bubble ${l.kind}`}
                    key={i}
                    style={{ animationDelay: `${0.3 + i * STEP}s` }}
                  >
                    {l.text}
                  </div>
                ))}
              </div>

              {tags.map((l, i) => (
                <div className="tag" key={i} style={{ animationDelay: `${afterChat}s` }}>
                  {l.text}
                </div>
              ))}

              {steps.length ? (
                <div className="wf">
                  <p className="wf-title">Workflows firing</p>
                  <div className="nodes">
                    <div className="track">
                      <span style={{ animationDelay: `${afterChat + 0.2}s` }} />
                    </div>
                    {steps.map((s, i) => (
                      <div
                        className="node"
                        key={s.id || i}
                        style={{
                          animationDelay: `${afterChat + 0.3 + (i * 1.4) / Math.max(steps.length, 1)}s`,
                        }}
                      >
                        <span className="ring">
                          <BlockIcon name={s.icon} fallback="calendar" />
                        </span>
                        {s.label}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {figures.length ? (
          <div className="stats">
            {figures.map((s, i) => (
              <div className="stat" key={s.id || i}>
                <div className="value"><StatValue value={s.value} /></div>
                <div className="slabel">{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
