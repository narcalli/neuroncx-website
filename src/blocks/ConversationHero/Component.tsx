import React from 'react'

type Props = {
  eyebrow?: string | null
  headline?: string | null
  subhead?: string | null
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

const ICONS: Record<string, React.ReactNode> = {
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  document: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 15l2 2 4-4" />
    </>
  ),
  message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </>
  ),
}

export const ConversationHeroBlock: React.FC<Props> = ({
  eyebrow,
  headline,
  subhead,
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
    <section className="ncx-chero">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-chero{--navy:#1A2035;--navy-2:#252D4A;--panel:#151C2E;--crimson:#C62828;
          --wa:#25D366;--line:rgba(255,255,255,.12);
          position:relative;background:var(--navy);color:#fff;overflow:hidden;
          padding:84px 0 64px;font-family:Inter,Arial,sans-serif}
        .ncx-chero .glow{position:absolute;border-radius:50%;filter:blur(120px);pointer-events:none}
        .ncx-chero .g1{width:620px;height:620px;right:-140px;top:-200px;opacity:.28;
          background:radial-gradient(circle,rgba(198,40,40,.85),transparent 65%)}
        .ncx-chero .g2{width:560px;height:560px;left:-160px;bottom:-220px;opacity:.20;
          background:radial-gradient(circle,rgba(47,56,96,1),transparent 65%)}
        .ncx-chero .inner{position:relative;z-index:2;max-width:1180px;margin:0 auto;padding:0 32px}
        .ncx-chero .grid{display:grid;grid-template-columns:1.02fr .98fr;gap:56px;align-items:center}

        .ncx-chero .eyebrow{font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:.82rem;
          letter-spacing:.04em;color:#FF8F8F;margin:0 0 14px}
        .ncx-chero h1{font-family:Poppins,Arial,sans-serif;font-weight:700;
          font-size:clamp(2.2rem,4.7vw,3.6rem);line-height:1.06;letter-spacing:-.02em;
          margin:0;max-width:16ch}
        .ncx-chero .sub{margin:22px 0 0;font-size:1.06rem;line-height:1.6;
          color:rgba(255,255,255,.78);max-width:52ch}
        .ncx-chero .cta{margin-top:32px;display:flex;gap:12px;flex-wrap:wrap}
        .ncx-chero .btn{display:inline-flex;align-items:center;gap:9px;
          font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:.98rem;
          padding:14px 26px;border-radius:10px;border:1px solid transparent;text-decoration:none;
          transition:transform .18s ease,box-shadow .18s ease,background .18s ease}
        .ncx-chero .btn-primary{background:var(--crimson);color:#fff;
          box-shadow:0 8px 22px -8px rgba(198,40,40,.6)}
        .ncx-chero .btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 28px -8px rgba(198,40,40,.7)}
        .ncx-chero .btn-ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.28)}
        .ncx-chero .btn-ghost:hover{background:rgba(255,255,255,.07)}
        .ncx-chero .btn:focus-visible{outline:2px solid #fff;outline-offset:3px}
        .ncx-chero .chips{margin-top:34px;display:flex;gap:10px;flex-wrap:wrap}
        .ncx-chero .chip{font-size:.8rem;font-weight:500;color:rgba(255,255,255,.82);
          border:1px solid rgba(255,255,255,.18);padding:7px 13px;border-radius:100px;
          background:rgba(255,255,255,.04)}

        .ncx-chero .panel{background:var(--panel);border:1px solid rgba(255,255,255,.08);
          border-radius:18px;padding:18px;box-shadow:0 40px 80px -30px rgba(0,0,0,.6)}
        .ncx-chero .chat-head{display:flex;align-items:center;gap:9px;padding-bottom:12px;
          border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:14px;
          font-size:.82rem;color:rgba(255,255,255,.55);font-weight:500}
        .ncx-chero .dots{display:flex;gap:5px;margin-right:2px}
        .ncx-chero .dots i{width:9px;height:9px;border-radius:50%;display:block}
        .ncx-chero .thread{display:flex;flex-direction:column;gap:9px;min-height:40px}
        .ncx-chero .bubble{max-width:82%;padding:9px 13px;border-radius:14px;font-size:.9rem;
          line-height:1.42;opacity:0;transform:translateY(14px);
          animation:ncxBubble .5s cubic-bezier(.22,.61,.36,1) forwards}
        .ncx-chero .them{align-self:flex-end;background:var(--wa);color:#06301A;font-weight:500;
          border-bottom-right-radius:4px}
        .ncx-chero .us{align-self:flex-start;background:#20304A;color:#EAF0F7;
          border-bottom-left-radius:4px}
        @keyframes ncxBubble{to{opacity:1;transform:translateY(0)}}

        .ncx-chero .tag{margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08);
          font-family:Poppins,Arial,sans-serif;font-size:.72rem;letter-spacing:.05em;
          color:rgba(255,255,255,.5);text-transform:uppercase;opacity:0;
          animation:ncxFade .5s ease forwards}
        @keyframes ncxFade{to{opacity:1}}

        .ncx-chero .wf{margin-top:16px}
        .ncx-chero .wf-title{font-family:Poppins,Arial,sans-serif;font-size:.68rem;font-weight:600;
          letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.4);margin:0 0 12px}
        .ncx-chero .nodes{position:relative;display:flex;align-items:flex-start;
          justify-content:space-between}
        .ncx-chero .track{position:absolute;left:20px;right:20px;top:19px;height:2px;
          background:rgba(255,255,255,.1);border-radius:2px}
        .ncx-chero .track span{position:absolute;inset:0 auto 0 0;width:0;background:var(--crimson);
          border-radius:2px;box-shadow:0 0 10px rgba(198,40,40,.8);
          animation:ncxRail 1.6s ease forwards}
        @keyframes ncxRail{to{width:100%}}
        .ncx-chero .node{position:relative;z-index:2;flex:1;display:flex;flex-direction:column;
          align-items:center;gap:8px;font-family:Poppins,Arial,sans-serif;font-size:.72rem;
          font-weight:600;color:rgba(255,255,255,.45);text-align:center;
          opacity:0;animation:ncxNode .45s ease forwards}
        .ncx-chero .ring{width:40px;height:40px;border-radius:50%;display:flex;
          align-items:center;justify-content:center;background:var(--panel);
          border:2px solid var(--crimson);color:#fff;
          box-shadow:0 0 0 4px var(--panel),0 0 14px -2px rgba(198,40,40,.7)}
        .ncx-chero .ring svg{width:18px;height:18px}
        @keyframes ncxNode{to{opacity:1;color:rgba(255,255,255,.82)}}

        .ncx-chero .stats{margin-top:56px;display:grid;
          grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:1px;
          background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden}
        .ncx-chero .stat{background:rgba(255,255,255,.03);padding:24px 18px}
        .ncx-chero .value{font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:2rem;
          letter-spacing:-.02em;color:#fff;line-height:1}
        .ncx-chero .slabel{font-size:.86rem;color:rgba(255,255,255,.62);margin-top:8px}

        @media(max-width:960px){
          .ncx-chero{padding:56px 0 48px}
          .ncx-chero .inner{padding:0 20px}
          .ncx-chero .grid{grid-template-columns:1fr;gap:36px}
          .ncx-chero h1{max-width:100%}
          .ncx-chero .glow{filter:blur(70px)}
          .ncx-chero .stats{margin-top:36px}
        }
        @media(prefers-reduced-motion:reduce){
          .ncx-chero .bubble,.ncx-chero .tag,.ncx-chero .node{animation:none;opacity:1;transform:none;
            color:rgba(255,255,255,.8)}
          .ncx-chero .rail span{animation:none;width:100%}
          .ncx-chero .btn{transition:none}
        }
      `}</style>

      <div className="glow g1" />
      <div className="glow g2" />

      <div className="inner">
        <div className="grid">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h1>{headline}</h1>
            {subhead ? <p className="sub">{subhead}</p> : null}

            {primaryButtonLabel || secondaryButtonLabel ? (
              <div className="cta">
                {primaryButtonLabel ? (
                  <a className="btn btn-primary" href={primaryButtonLink || '#'}>
                    {primaryButtonLabel}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                ) : null}
                {secondaryButtonLabel ? (
                  <a className="btn btn-ghost" href={secondaryButtonLink || '#'}>
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
                <span className="dots">
                  <i style={{ background: '#FF5F57' }} />
                  <i style={{ background: '#FEBC2E' }} />
                  <i style={{ background: '#28C840' }} />
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
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            {ICONS[s.icon || 'calendar'] || ICONS.calendar}
                          </svg>
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
                <div className="value">{s.value}</div>
                <div className="slabel">{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
