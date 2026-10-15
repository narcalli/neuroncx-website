import React from 'react'

/** One edgeCases row, as plain text from the page. */
export type EdgeRow = { id: string; situation: string; whatWeDo: string }

type Scene = 'merge' | 'time' | 'log' | 'alert' | 'check'

// The scene for a card, from words in its situation. First match wins.
const SCENES: [Scene, string[]][] = [
  ['merge', ['twice', 'again', 'more than once', 'duplicate']],
  ['time', ['time', 'zone', 'date']],
  ['log', ['fail', 'error', 'down']],
  ['alert', ['cannot', "can't", 'not saved', 'alert']],
]
const sceneOf = (situation: string): Scene => {
  const s = situation.toLowerCase()
  return SCENES.find(([, words]) => words.some((w) => s.includes(w)))?.[0] || 'check'
}

// The log line types out the situation itself, cut on a whole word to fit.
const LOG_MAX = 30
const logLine = (situation: string) => {
  const t = situation.trim()
  if (t.length <= LOG_MAX) return t
  const cut = t.slice(0, LOG_MAX + 1)
  const space = cut.lastIndexOf(' ')
  return space > 0 ? cut.slice(0, space) : t.slice(0, LOG_MAX)
}

const Tick = () => (
  <svg
    viewBox="0 0 16 16"
    width="12"
    height="12"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
  >
    <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Clock = () => (
  <svg
    viewBox="0 0 16 16"
    width="12"
    height="12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4.8V8l2.2 1.4" strokeLinecap="round" />
  </svg>
)
const Bell = () => (
  <svg
    viewBox="0 0 24 24"
    width="26"
    height="26"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" strokeLinejoin="round" />
    <path d="M10 20.5a2 2 0 0 0 4 0" strokeLinecap="round" />
  </svg>
)

// One of the two pieces that come together: a small card, or a time chip.
const Piece: React.FC<{ kind: 'merge' | 'time'; side: 'a' | 'b' }> = ({ kind, side }) =>
  kind === 'merge' ? (
    <span className={`ncx-iedge__mini is-${side}`}>
      <i />
      <i />
    </span>
  ) : (
    <span className={`ncx-iedge__chip is-${side}`}>
      <Clock />
      <i />
    </span>
  )

// Decoration only: every scene is aria-hidden, and the only words any scene
// shows are the row's own (the log line).
const SceneArt: React.FC<{ scene: Scene; situation: string }> = ({ scene, situation }) => {
  if (scene === 'merge' || scene === 'time') {
    return (
      <>
        <Piece kind={scene} side="b" />
        <Piece kind={scene} side="a" />
        <span className="ncx-iedge__badge">
          <Tick />
        </span>
      </>
    )
  }
  if (scene === 'log') {
    const line = logLine(situation)
    return (
      <span className="ncx-iedge__log">
        <span className="ncx-iedge__dot" />
        <span className="ncx-iedge__type" style={{ '--len': line.length } as React.CSSProperties}>
          {line}
        </span>
      </span>
    )
  }
  if (scene === 'alert') {
    return (
      <>
        <span className="ncx-iedge__bell">
          <Bell />
        </span>
        <span className="ncx-iedge__alert">
          <i />
          <i />
        </span>
      </>
    )
  }
  return (
    <span className="ncx-iedge__check">
      <Tick />
    </span>
  )
}

/**
 * Edge cases as cards, each with a small looping scene chosen from words in
 * its situation. Pure CSS: the scenes loop and the cards rise in as they
 * scroll into view; under reduced motion every scene shows its end state and
 * nothing moves.
 */
export const EdgeCases: React.FC<{ rows: EdgeRow[] }> = ({ rows }) => (
  <>
    <style>{`
      .ncx-iedge{list-style:none;margin:0;padding:0;display:grid;gap:20px;
        grid-template-columns:repeat(3,minmax(0,1fr))}
      .ncx-iedge__card{height:100%;background:var(--ncx-white);border:1px solid var(--ncx-rule);
        border-radius:var(--ncx-r-card);box-shadow:var(--ncx-shadow);padding:18px 18px 22px;
        display:flex;flex-direction:column;gap:10px}
      .ncx-iedge__card:hover{box-shadow:var(--ncx-lift);transform:translateY(-4px)}
      .ncx-iedge__card h3{margin:6px 0 0;font-family:var(--font-display),Arial,sans-serif;font-weight:600;
        font-size:17px;line-height:1.35;color:var(--ncx-ink)}
      .ncx-iedge__card p{margin:0;font-size:15px;line-height:1.6;color:var(--ncx-muted)}

      /* Scene stage. Every rule outside the motion block is a scene's end state. */
      .ncx-iedge__scene{position:relative;height:96px;border-radius:10px;background:var(--ncx-cloud);
        border:1px solid var(--ncx-rule-soft);overflow:hidden;display:flex;align-items:center;justify-content:center;gap:12px}
      .ncx-iedge__scene i{display:block;height:5px;border-radius:3px;background:var(--ncx-rule-strong)}

      /* merge and time: two pieces become one */
      .ncx-iedge__mini,.ncx-iedge__chip{position:absolute;left:50%;top:50%;background:var(--ncx-white);
        border:1px solid var(--ncx-rule-strong);box-shadow:0 2px 6px rgba(20,26,45,.08)}
      .ncx-iedge__mini{width:58px;height:40px;margin:-20px 0 0 -29px;border-radius:7px;padding:9px 8px;
        display:flex;flex-direction:column;gap:6px}
      .ncx-iedge__mini i:last-child{width:60%}
      .ncx-iedge__chip{width:76px;height:26px;margin:-13px 0 0 -38px;border-radius:999px;padding:0 10px;
        display:flex;align-items:center;gap:7px;color:var(--ncx-teal)}
      .ncx-iedge__chip i{flex:1}
      .ncx-iedge__mini.is-b,.ncx-iedge__chip.is-b{opacity:0}
      .ncx-iedge__badge{position:absolute;left:50%;top:50%;margin:-30px 0 0 22px;width:20px;height:20px;
        border-radius:50%;background:var(--ncx-teal);color:var(--ncx-on-navy);display:flex;align-items:center;justify-content:center}
      .ncx-iedge__badge svg{stroke:currentColor}

      /* log: the situation typed out */
      .ncx-iedge__log{max-width:calc(100% - 28px);display:flex;align-items:center;gap:8px;background:var(--ncx-navy);
        border-radius:8px;padding:9px 12px;font-family:var(--font-label),ui-monospace,monospace;font-size:11.5px;
        color:var(--ncx-on-navy)}
      .ncx-iedge__dot{flex:none;width:7px;height:7px;border-radius:50%;background:var(--ncx-crimson-on-navy)}
      .ncx-iedge__type{display:block;overflow:hidden;white-space:nowrap;width:calc(var(--len) * 1ch);max-width:100%}

      /* alert: the bell and the alert that dropped in */
      .ncx-iedge__bell{color:var(--ncx-navy);display:flex;transform-origin:50% 4px}
      .ncx-iedge__alert{width:78px;height:34px;border-radius:7px;background:var(--ncx-white);
        border:1px solid var(--ncx-rule-strong);border-left:3px solid var(--ncx-crimson);padding:8px 9px;
        display:flex;flex-direction:column;gap:6px}
      .ncx-iedge__alert i:last-child{width:55%}

      /* check: no loop */
      .ncx-iedge__check{width:40px;height:40px;border-radius:50%;background:var(--ncx-teal-tint);
        color:var(--ncx-teal);display:flex;align-items:center;justify-content:center}
      .ncx-iedge__check svg{width:20px;height:20px}

      /* Motion, only when the visitor has not asked for less. */
      @media(prefers-reduced-motion:no-preference){
        .ncx-iedge__card{transition:transform .25s ease,box-shadow .25s ease}
        .ncx-iedge__scene *{animation-duration:4.2s;animation-iteration-count:infinite;
          animation-timing-function:ease-in-out;animation-delay:var(--d,0s)}
        .ncx-iedge__mini.is-a,.ncx-iedge__chip.is-a{animation-name:ncxEdgeA}
        .ncx-iedge__mini.is-b,.ncx-iedge__chip.is-b{animation-name:ncxEdgeB}
        .ncx-iedge__badge{animation-name:ncxEdgeBadge}
        .ncx-iedge__type{animation-name:ncxEdgeType;animation-timing-function:steps(var(--len),end);
          border-right:2px solid transparent}
        .ncx-iedge__bell{animation-name:ncxEdgeBell}
        .ncx-iedge__alert{animation-name:ncxEdgeDrop}
        .ncx-iedge__check{animation:none}
        @supports (animation-timeline: view()){
          .ncx-iedge > li{animation:ncxEdgeRise linear both;animation-timeline:view();animation-range:entry 0% entry 60%}
        }
      }
      @keyframes ncxEdgeA{0%{opacity:0;transform:translateX(-34px)}12%{opacity:1;transform:translateX(-34px)}
        45%,88%{opacity:1;transform:none}100%{opacity:0;transform:none}}
      @keyframes ncxEdgeB{0%{opacity:0;transform:translateX(34px)}12%{opacity:1;transform:translateX(34px)}
        45%{opacity:1;transform:none}52%,100%{opacity:0;transform:none}}
      @keyframes ncxEdgeBadge{0%,50%{opacity:0;transform:scale(.4)}60%{opacity:1;transform:scale(1.15)}
        66%,88%{opacity:1;transform:none}100%{opacity:0;transform:none}}
      @keyframes ncxEdgeType{0%,8%{width:0;border-right-color:var(--ncx-on-navy)}
        62%,90%{width:calc(var(--len) * 1ch);border-right-color:var(--ncx-on-navy)}
        95%,100%{width:calc(var(--len) * 1ch);border-right-color:transparent}}
      @keyframes ncxEdgeBell{0%,8%{transform:none}12%{transform:rotate(16deg)}18%{transform:rotate(-14deg)}
        24%{transform:rotate(10deg)}30%{transform:rotate(-6deg)}36%,100%{transform:none}}
      @keyframes ncxEdgeDrop{0%,30%{opacity:0;transform:translateY(-16px)}42%{opacity:1;transform:translateY(2px)}
        48%,90%{opacity:1;transform:none}100%{opacity:0;transform:none}}
      @keyframes ncxEdgeRise{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}

      @media(max-width:1023.98px){.ncx-iedge{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:639.98px){.ncx-iedge{grid-template-columns:minmax(0,1fr)}}
      @media(prefers-reduced-motion:reduce){.ncx-iedge__card:hover{transform:none}}
    `}</style>
    <ul className="ncx-iedge">
      {rows.map((r, i) => {
        const scene = sceneOf(r.situation)
        return (
          <li key={r.id}>
            <article className="ncx-iedge__card">
              <div
                className={`ncx-iedge__scene is-${scene}`}
                aria-hidden="true"
                style={{ '--d': `${(i % 3) * 0.35}s` } as React.CSSProperties}
              >
                <SceneArt scene={scene} situation={r.situation} />
              </div>
              <h3>{r.situation}</h3>
              <p>{r.whatWeDo}</p>
            </article>
          </li>
        )
      })}
    </ul>
  </>
)
