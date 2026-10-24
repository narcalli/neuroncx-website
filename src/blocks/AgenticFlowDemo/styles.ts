/**
 * The Agentic Flow Demo's styles, shared by its two modes: Flow
 * (FlowDemo.tsx) and Agent features (AgentFeatures.tsx). flowCss is the Flow
 * mode's sheet as it was, unchanged.
 */
export const flowCss = `
        .ncx-flow{padding:84px 0;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-flow h2{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:clamp(1.55rem,3.4vw,2.2rem);
          max-width:var(--ncx-heading-max);letter-spacing:-.01em;margin:0;color:var(--ncx-ink)}
        .ncx-flow .sec-sub{max-width:62ch;margin-top:18px;color:var(--ncx-muted)}
        .ncx-flow .lab-box{margin-top:44px;border-radius:18px;padding:22px;background:var(--ncx-cloud);border:1px solid var(--ncx-rule)}
        .ncx-flow .lab-q{margin:0 0 14px;color:var(--ncx-muted);font-size:.92rem}
        .ncx-flow .trig{display:flex;flex-wrap:wrap;gap:10px}
        .ncx-flow .tb{color:var(--ncx-body);background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:999px;
          padding:9px 16px;cursor:pointer;font-weight:500;font-size:.92rem;font-family:inherit}
        .ncx-flow .tb[aria-pressed="true"]{background:var(--ncx-crimson);border-color:var(--ncx-crimson);color:var(--ncx-on-navy)}
        .ncx-flow .stage{position:relative;display:grid;grid-template-columns:1fr 1fr 1fr;gap:clamp(28px,6vw,80px);margin-top:26px;align-items:stretch}
        .ncx-flow .stage-svg{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;overflow:visible}
        .ncx-flow .base{fill:none;stroke:var(--ncx-rule);stroke-width:2;stroke-dasharray:4 7}
        .ncx-flow .trail{fill:none;stroke:var(--ncx-crimson);stroke-width:3;stroke-linecap:round}
        .ncx-flow .dot{fill:var(--ncx-crimson);stroke:var(--ncx-white);stroke-width:2}
        .ncx-flow .node{position:relative;z-index:1;background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:14px;
          padding:16px 16px 18px;min-height:136px;display:flex;flex-direction:column;gap:7px;transition:border-color .3s,box-shadow .4s}
        .ncx-flow .node.on{border-color:var(--ncx-crimson);box-shadow:0 0 0 1px var(--ncx-crimson),0 14px 30px -18px var(--ncx-crimson)}
        .ncx-flow .node.ok.on{border-color:var(--ncx-teal);box-shadow:0 0 0 1px var(--ncx-teal),0 14px 30px -18px var(--ncx-teal)}
        .ncx-flow .tag{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ncx-muted)}
        /* The node's ring and glow stay flat crimson/teal — they are state
           marks at area, not text. The tags are text, so they take the -ink
           stops and step to the on-navy tones inside a highlight. */
        .ncx-flow .node.on .tag{color:var(--ncx-crimson-ink)}
        .ncx-flow .node.ok.on .tag{color:var(--ncx-teal-ink)}
        .ncx-flow .node b{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:1.05rem;line-height:1.25;color:var(--ncx-ink)}
        .ncx-flow .node small{color:var(--ncx-muted);font-size:.85rem;line-height:1.45}
        .ncx-flow .node.ok:not(.on) b,.ncx-flow .node.ok:not(.on) small{opacity:.45}
        .ncx-flow .hch{display:flex;gap:8px;flex-wrap:wrap}
        .ncx-flow .hch span{border-radius:999px;padding:5px 11px;font-size:.8rem;border:1px solid var(--ncx-rule);color:var(--ncx-muted);transition:background .3s,color .3s}
        .ncx-flow .hch span.on{background:var(--ncx-crimson);color:var(--ncx-on-navy);border-color:var(--ncx-crimson)}
        .ncx-flow .note{margin:18px 0 0;font-size:.82rem;color:var(--ncx-muted)}
        @media (max-width:720px){
          .ncx-flow{padding:60px 0}
          .ncx-flow .stage{grid-template-columns:1fr;gap:30px}
        }
      `

/**
 * Agent features mode, on top of flowCss. The cards are joined by a still
 * line (no event travels here), and stack below 900px. The hidden attribute
 * has to win over the grid and flex displays, or every panel would show.
 */
export const featuresCss = `
        .ncx-flow--features .stage[hidden],.ncx-flow--features .chips[hidden]{display:none}
        .ncx-flow--features .lab-q--agents{margin:20px 0 10px}
        .ncx-flow--features .chips{display:flex;flex-wrap:wrap;gap:8px}
        .ncx-flow--features .chip{display:inline-flex;align-items:center;gap:7px;color:var(--ncx-body);background:var(--ncx-white);
          border:1px solid var(--ncx-rule);border-radius:999px;padding:6px 12px;cursor:pointer;font-family:inherit;font-weight:500;font-size:.84rem;line-height:1.2}
        .ncx-flow--features .chip[aria-pressed="true"]{border-color:var(--ncx-crimson);box-shadow:0 0 0 1px var(--ncx-crimson);color:var(--ncx-crimson-ink)}
        .ncx-flow--features .chip .pilot{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.62rem;letter-spacing:.12em;
          text-transform:uppercase;padding:2px 6px;border-radius:999px;background:var(--ncx-cloud);color:var(--ncx-muted)}
        .ncx-flow--features .stage::before{content:"";position:absolute;z-index:0;left:16%;right:16%;top:50%;height:3px;margin-top:-1.5px;
          border-radius:3px;background:var(--ncx-crimson)}
        .ncx-flow--features .node{min-height:0}
        .ncx-flow--features .hch{margin-top:4px}
        .ncx-flow--features .hch--handlers{margin-top:12px}
        .ncx-flow--features .you-set strong{font-weight:600;color:var(--ncx-ink)}
        @media (max-width:899.98px){
          .ncx-flow--features .stage{grid-template-columns:1fr;gap:30px}
          .ncx-flow--features .stage::before{left:50%;right:auto;top:0;bottom:0;width:3px;height:auto;margin:0 0 0 -1.5px}
        }
`
