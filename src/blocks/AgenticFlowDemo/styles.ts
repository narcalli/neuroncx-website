/**
 * The Agentic Flow Demo's styles, shared by its two modes: Flow
 * (FlowDemo.tsx) and Agent features (AgentFeatures.tsx).
 *
 * The Design tab's options arrive as custom properties and classes on the
 * section (design.ts). Every property falls back to the block's look from
 * before the tab existed, so a block with nothing set draws as it always has.
 */
export const flowCss = `
        .ncx-flow{padding:84px 0;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-flow h2{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:clamp(1.55rem,3.4vw,2.2rem);
          max-width:var(--ncx-heading-max);letter-spacing:-.01em;margin:0;color:var(--ncx-ink)}
        .ncx-flow .sec-eyebrow{font-family:var(--font-display),Arial,sans-serif;font-size:14px;margin:0 0 12px;color:var(--ncx-crimson-ink)}
        .ncx-flow .sec-sub{max-width:62ch;margin-top:18px;color:var(--ncx-muted)}
        .ncx-flow .lab-box{margin-top:44px;border-radius:18px;padding:22px;background:var(--fd-panel-bg,var(--ncx-cloud));
          border:var(--fd-panel-border,1px solid var(--ncx-rule))}
        .ncx-flow.fd-bare .lab-box{padding-left:0;padding-right:0}
        .ncx-flow .lab-q{margin:0 0 14px;color:var(--ncx-muted);font-size:.92rem}
        .ncx-flow .trig{display:flex;flex-wrap:wrap;gap:10px}
        .ncx-flow .tb{color:var(--ncx-body);background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:999px;
          padding:9px 16px;cursor:pointer;font-weight:500;font-size:.92rem;font-family:inherit}
        .ncx-flow .tb[aria-pressed="true"]{background:var(--fd-sel-bg,var(--ncx-crimson));border-color:var(--fd-sel-border,var(--ncx-crimson));
          color:var(--fd-sel-text,var(--ncx-on-navy));box-shadow:var(--fd-sel-ring,none)}
        .ncx-flow.fd-compact .tb{padding:6px 12px;font-size:.84rem}
        .ncx-flow .stage{position:relative;display:grid;grid-template-columns:1fr 1fr 1fr;gap:clamp(28px,6vw,80px);margin-top:26px;align-items:stretch}
        .ncx-flow.fd-top .stage{align-items:start}
        .ncx-flow .stage-svg{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;overflow:visible}
        .ncx-flow.fd-line-none .stage-svg{display:none}
        .ncx-flow.fd-line-static .dot{display:none}
        .ncx-flow .base{fill:none;stroke:var(--fd-line,var(--ncx-rule));stroke-width:2;stroke-dasharray:4 7}
        .ncx-flow .dot{fill:var(--fd-dot,var(--ncx-crimson));stroke:var(--ncx-white);stroke-width:2}
        /* Each card's accent (--acc) colours its border, ring and shadow; its
           eyebrow takes the accent's text stop (--acc-ink), which steps to the
           on-navy tone inside a highlight. Crimson by default, teal for the
           third card; a card's own accent is set on it. */
        .ncx-flow .node{--acc:var(--ncx-crimson);--acc-ink:var(--ncx-crimson-ink);
          position:relative;z-index:1;background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:14px;
          padding:16px 16px 18px;min-height:136px;display:flex;flex-direction:column;gap:7px;transition:border-color .3s,box-shadow .4s}
        .ncx-flow .node.ok{--acc:var(--ncx-teal);--acc-ink:var(--ncx-teal-ink)}
        .ncx-flow .node.on{border-color:var(--acc);box-shadow:0 0 0 1px var(--acc),0 14px 30px -18px var(--acc)}
        .ncx-flow.fd-noshadow .node.on{box-shadow:0 0 0 1px var(--acc)}
        .ncx-flow .tag{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ncx-muted)}
        .ncx-flow .node.on .tag{color:var(--acc-ink)}
        .ncx-flow .node b{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:1.05rem;line-height:1.25;color:var(--ncx-ink)}
        .ncx-flow .node small{color:var(--ncx-muted);font-size:.85rem;line-height:1.45}
        .ncx-flow .node.ok:not(.on) b,.ncx-flow .node.ok:not(.on) small{opacity:.45}
        .ncx-flow .hch{display:flex;gap:8px;flex-wrap:wrap}
        .ncx-flow .hch span{border-radius:999px;padding:5px 11px;font-size:.8rem;border:1px solid var(--ncx-rule);color:var(--ncx-muted);transition:background .3s,color .3s}
        .ncx-flow .hch span.on{background:var(--ncx-crimson);color:var(--ncx-on-navy);border-color:var(--ncx-crimson)}
        .ncx-flow .stage-foot{display:grid;grid-template-columns:1fr 1fr 1fr;gap:clamp(28px,6vw,80px);margin-top:12px}
        .ncx-flow .ev-link{grid-column:3;justify-self:start;font-weight:600;font-size:.9rem;color:var(--ncx-crimson-ink);text-decoration:none}
        .ncx-flow .ev-link:hover{text-decoration:underline}
        .ncx-flow .note{margin:18px 0 0;font-size:.82rem;color:var(--ncx-muted)}
        @media (max-width:720px){
          .ncx-flow{padding:60px 0}
          .ncx-flow .stage{grid-template-columns:1fr;gap:30px}
          .ncx-flow .stage-foot{grid-template-columns:1fr}
          .ncx-flow .ev-link{grid-column:1}
        }
      `

/**
 * Agent features mode, on top of flowCss. The cards are joined by a still
 * line by default, and stack below 900px. The hidden attribute has to win
 * over the grid and flex displays, or every panel would show.
 */
export const featuresCss = `
        /* The family tab's own sliding indicator (a shared layoutId, Framer
           Motion), behind the selected tab's label. */
        .ncx-flow--features .fam-trig .tb{position:relative;overflow:hidden;z-index:0}
        .ncx-flow--features .fam-ind{position:absolute;inset:0;border-radius:999px;z-index:-1;
          background:var(--fd-sel-bg,var(--ncx-crimson))}
        .ncx-flow--features .fam-trig .tb[aria-pressed="true"]{background:transparent}
        .ncx-flow--features .fam-label{position:relative;z-index:1}
        /* The agent list: one family mounted at a time (AnimatePresence),
           sliding in from the direction of travel. */
        .ncx-flow--features .chips-wrap{position:relative;overflow:hidden}
        /* The stage-outer's own height tracks whichever panel is laid out
           (Framer Motion layout); the rest sit position:absolute inside it,
           out of flow, so they add nothing to that height. */
        .ncx-flow--features .stage-outer{position:relative}
        .ncx-flow--features .lab-q--agents{margin:20px 0 10px}
        .ncx-flow--features .chips{display:flex;flex-wrap:wrap;gap:8px}
        .ncx-flow--features .chip{display:inline-flex;align-items:center;gap:7px;color:var(--ncx-body);background:var(--ncx-white);
          border:1px solid var(--ncx-rule);border-radius:999px;padding:6px 12px;cursor:pointer;font-family:inherit;font-weight:500;font-size:.84rem;line-height:1.2}
        .ncx-flow--features.fd-compact .chip{padding:4px 10px;font-size:.78rem}
        .ncx-flow--features .chip[aria-pressed="true"]{border-color:var(--fd-chip,var(--ncx-crimson));box-shadow:0 0 0 1px var(--fd-chip,var(--ncx-crimson));
          color:var(--fd-chip-ink,var(--ncx-crimson-ink))}
        .ncx-flow--features .chip .pilot{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.62rem;letter-spacing:.12em;
          text-transform:uppercase;padding:2px 6px;border-radius:999px;background:var(--ncx-cloud);color:var(--ncx-muted)}
        .ncx-flow--features .stage::before{content:"";position:absolute;z-index:0;left:16%;right:16%;top:50%;height:3px;margin-top:-1.5px;
          border-radius:3px;background:var(--fd-line,var(--ncx-crimson))}
        /* Animated draws the measured line instead (StageLine); none draws no line. */
        .ncx-flow--features.fd-line-animated .stage::before,.ncx-flow--features.fd-line-none .stage::before{display:none}
        .ncx-flow--features .node{min-height:0}
        .ncx-flow--features .feat{list-style:none;padding:0;margin:0 0 4px;display:flex;flex-direction:column;gap:9px}
        .ncx-flow--features .feat li{display:flex;align-items:flex-start;gap:9px;font-size:.88rem;line-height:1.45;color:var(--ncx-body)}
        .ncx-flow--features .feat svg{flex:none;margin-top:2px;color:var(--ncx-crimson)}
        .ncx-flow--features .hch{margin-top:4px}
        .ncx-flow--features .hch--handlers{margin-top:12px}
        .ncx-flow--features .you-set strong{font-weight:600;color:var(--ncx-ink)}
        /* The database icon beside "Saves to your systems": a crimson packet
           arcs into it on a change (GSAP MotionPath), and it dips once. */
        .ncx-flow--features .saves{display:flex;align-items:center;gap:12px;margin-top:2px}
        .ncx-flow--features .saves-ic{flex:none}
        .ncx-flow--features .saves .pkt{fill:var(--ncx-crimson)}
        .ncx-flow--features .saves small{color:var(--ncx-muted);font-size:.85rem;line-height:1.45}
        @media (max-width:899.98px){
          .ncx-flow--features .stage{grid-template-columns:1fr;gap:30px}
          .ncx-flow--features .stage::before{left:50%;right:auto;top:0;bottom:0;width:3px;height:auto;margin:0 0 0 -1.5px}
        }
`
