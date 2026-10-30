/**
 * The cards, the drawing panel and the drawing, from the approved design's
 * CSS (docs/reference/harness-hero-demo.html). Brand tokens only; light
 * theme only. The drawing's layout follows the drawing's own width: a
 * container query before the page is interactive, then the ResizeObserver's
 * choice (data-layout on .hh-draw).
 */
export const stageCss = `
  .ncx-hh .hh-stage{margin-top:var(--hh-stage);display:grid;grid-template-columns:minmax(0,35fr) minmax(0,65fr);gap:20px;align-items:start}
  .ncx-hh .hh-stage[data-cards="above"]{grid-template-columns:minmax(0,1fr)}
  /* Cards on the left: the column is as tall as the drawing panel, the cards share its height, titles centred. */
  @media (min-width:900px){
    .ncx-hh .hh-stage[data-cards="left"]{align-items:stretch}
    .ncx-hh .hh-stage[data-cards="left"] .hh-cards{height:100%}
    .ncx-hh .hh-stage[data-cards="left"] .hh-card{flex:1 1 0;justify-content:center;min-height:48px}
  }

  /* Cards: outlined, title only, a status dot; white with a soft shadow when selected. */
  .ncx-hh .hh-cards{display:flex;flex-direction:column;gap:8px;margin:0;padding:0}
  .ncx-hh .hh-stage[data-cards="above"] .hh-cards{display:grid;grid-template-columns:repeat(var(--hh-cards),minmax(0,1fr));gap:8px}
  .ncx-hh .hh-card{position:relative;overflow:hidden;text-align:left;cursor:pointer;background:transparent;border:1px solid var(--ncx-rule);
    border-radius:12px;padding:11px 14px 13px;display:flex;flex-direction:column;gap:6px;color:inherit;font:inherit;
    transition:background .25s,border-color .25s,box-shadow .25s}
  .ncx-hh .hh-card:hover{background:var(--ncx-white)}
  .ncx-hh .hh-card[aria-selected="true"]{background:var(--ncx-white);border-color:var(--ncx-wire);box-shadow:var(--ncx-shadow)}
  .ncx-hh .hh-card:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:2px}
  .ncx-hh .hh-card-top{display:flex;align-items:center;gap:10px}
  .ncx-hh .hh-card-dot{flex:none;width:8px;height:8px;border-radius:50%;border:1.5px solid var(--ncx-faint)}
  .ncx-hh .hh-card[aria-selected="true"] .hh-card-dot{background:var(--ncx-crimson);border-color:var(--ncx-crimson)}
  .ncx-hh .hh-card-title{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:14.5px;line-height:1.35;color:var(--ncx-ink)}
  /* Room for the progress line (motion step): 2px at the bottom, empty until then. */
  .ncx-hh .hh-card-prog{position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--ncx-crimson);transform-origin:0 50%;transform:scaleX(0)}
  .ncx-hh .hh-card[aria-selected="false"] .hh-card-prog{visibility:hidden}
  .ncx-hh .hh-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

  /* The drawing panel. */
  .ncx-hh .hh-panel{position:relative;background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:20px;padding:12px 16px 10px;min-width:0}
  .ncx-hh .hh-panel:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:2px}
  .ncx-hh .hh-draw{position:relative;container:hhdraw / inline-size}
  /* Portrait: one row above the drawing, two lines kept for the text so the row never changes height. */
  .ncx-hh .hh-status{display:flex;align-items:flex-start;gap:10px;flex-wrap:nowrap;min-height:34px;margin-bottom:6px;line-height:17px;
    font:500 12px var(--font-label),ui-monospace,monospace;color:var(--ncx-muted)}
  .ncx-hh .hh-live{display:inline-flex;align-items:center;gap:7px;text-transform:uppercase;letter-spacing:.07em;color:var(--ncx-ink)}
  .ncx-hh .hh-live i{width:7px;height:7px;border-radius:50%;background:var(--ncx-teal)}
  .ncx-hh .hh-live{flex:none}
  .ncx-hh .hh-status-text{min-width:0;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden}
  .ncx-hh .hh-status-text:empty{display:none}
  .ncx-hh .hh-status-text b{font-weight:500;color:var(--ncx-ink)}
  .ncx-hh .hh-stage[data-level="on"] .hh-live i{animation:hh-blink 2.4s ease-in-out infinite}
  @keyframes hh-blink{0%,100%{opacity:1}50%{opacity:.3}}
  .ncx-hh .hh-dwrap svg{display:block;width:100%;height:auto;overflow:visible}
  /* Mid-size panels: the status sits in the empty top-left corner of the drawing, its lines stacked. */
  .ncx-hh .hh-draw[data-status="corner"] .hh-status{position:absolute;top:2px;left:0;width:17%;z-index:2;margin:0;
    flex-direction:column;align-items:flex-start;gap:5px;font-size:11px;min-height:0;line-height:1.45}
  .ncx-hh .hh-draw[data-status="corner"] .hh-status-text{display:block;overflow:visible}
  .ncx-hh .hh-draw[data-status="corner"] .hh-status-text b{display:block}
  .ncx-hh .hh-draw[data-status="corner"] .hh-sep{display:none}
  /* Wide panels (over 800px): one row above the drawing, starting where the BYOC box starts (Stage.tsx measures it). */
  .ncx-hh .hh-draw[data-status="wide"] .hh-status{min-height:20px;margin-bottom:8px;align-items:center;padding-left:var(--hh-box-left,0px)}
  .ncx-hh .hh-draw[data-status="wide"] .hh-status-text{display:block;white-space:nowrap;text-overflow:ellipsis}
  .ncx-hh .hh-draw[data-layout="landscape"] .hh-svg--portrait,.ncx-hh .hh-draw[data-layout="portrait"] .hh-svg--landscape{display:none}
  /* Before the page is interactive: the same choices from the drawing's own width. */
  .ncx-hh .hh-draw:not([data-layout]) .hh-svg--portrait{display:none}
  @container hhdraw (max-width:479.98px){.ncx-hh .hh-draw:not([data-layout]) .hh-svg--portrait{display:block}.ncx-hh .hh-draw:not([data-layout]) .hh-svg--landscape{display:none}}
  @container hhdraw (min-width:480px) and (max-width:768px){.ncx-hh .hh-draw:not([data-status]) .hh-status{position:absolute;top:2px;left:0;width:17%;z-index:2;margin:0;
    flex-direction:column;align-items:flex-start;gap:5px;font-size:11px;min-height:0;line-height:1.45}
    .ncx-hh .hh-draw:not([data-status]) .hh-sep{display:none}}
  @container hhdraw (min-width:768.02px){.ncx-hh .hh-draw:not([data-status]) .hh-status{min-height:20px;margin-bottom:8px;align-items:center;
    padding-left:calc(100cqw * 160 / 760)}}

  /* The caption: the selected card's explanation and the lit parts. */
  .ncx-hh .hh-caption{border-top:1px solid var(--ncx-rule-soft);margin-top:6px;padding-top:9px;min-height:62px;display:grid}
  .ncx-hh .hh-cap{grid-area:1 / 1;display:flex;flex-direction:column;gap:6px;visibility:hidden}
  .ncx-hh .hh-cap[data-on]{visibility:visible}
  .ncx-hh .hh-cap-body{margin:0;font-size:14px;line-height:1.5;color:var(--ncx-body)}
  .ncx-hh .hh-cap-tags{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:0;padding:0;list-style:none;
    font:500 11.5px var(--font-label),ui-monospace,monospace;color:var(--ncx-muted)}
  .ncx-hh .hh-tag{background:var(--ncx-crimson-tint);color:var(--ncx-crimson-ink);border-radius:999px;padding:2px 9px}

  /* The drawing. */
  .ncx-hh .hh-svg .bound{fill:none;stroke:var(--ncx-faint);stroke-width:1.4;stroke-dasharray:7 6}
  .ncx-hh .hh-svg .door-gap{stroke:var(--ncx-white);stroke-width:5}
  .ncx-hh .hh-svg .door-cap{stroke:var(--ncx-faint);stroke-width:1.4;stroke-linecap:round}
  .ncx-hh .hh-svg .is-on .door-cap{stroke:var(--ncx-crimson)}
  .ncx-hh .hh-svg .knock{fill:none;stroke:var(--ncx-white);stroke-width:8}
  .ncx-hh .hh-svg .is-on .bound{stroke:var(--ncx-crimson);stroke-width:1.8}
  .ncx-hh .hh-svg .box{fill:var(--ncx-white);stroke:var(--ncx-rule);stroke-width:1.2}
  .ncx-hh .hh-svg .is-on .box{stroke:var(--ncx-crimson);stroke-width:1.5;fill:var(--ncx-crimson-tint)}
  .ncx-hh .hh-svg .lbl{font:600 13px var(--font-display),Arial,sans-serif;fill:var(--ncx-ink)}
  .ncx-hh .hh-svg .mono{font:500 10.5px var(--font-label),ui-monospace,monospace;fill:var(--ncx-muted);letter-spacing:.02em}
  .ncx-hh .hh-svg .chip-bg{fill:var(--ncx-paper);stroke:var(--ncx-rule)}
  .ncx-hh .hh-svg .chip-t{font:500 10.5px var(--font-label),ui-monospace,monospace;fill:var(--ncx-body)}
  .ncx-hh .hh-svg .ln{fill:none;stroke:var(--ncx-wire);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
  .ncx-hh .hh-svg .is-on .ln{stroke:var(--ncx-crimson)}
  .ncx-hh .hh-svg .orch-box{fill:var(--ncx-navy);stroke:var(--ncx-navy);stroke-width:1.2}
  .ncx-hh .hh-svg .is-on .orch-box{stroke:var(--ncx-crimson);stroke-width:2.4}
  .ncx-hh .hh-svg .orch-t{font:600 16px var(--font-display),Arial,sans-serif;fill:var(--ncx-on-navy)}
  .ncx-hh .hh-svg .orch-s{font:500 10.5px var(--font-label),ui-monospace,monospace;fill:var(--ncx-on-navy);opacity:.75;letter-spacing:.08em;text-transform:uppercase}
  .ncx-hh .hh-svg .orch-d{fill:var(--ncx-on-navy);opacity:.45}
  .ncx-hh .hh-svg .halo{fill:none;stroke:var(--ncx-crimson);stroke-width:2;opacity:0;transform-box:fill-box;transform-origin:center}
  .ncx-hh .hh-svg .gate{fill:var(--ncx-paper);stroke:var(--ncx-wire);stroke-width:1.2}
  .ncx-hh .hh-svg .is-on .gate{stroke:var(--ncx-crimson);stroke-width:1.8}
  .ncx-hh .hh-svg .chk-c{fill:var(--ncx-white);stroke:var(--ncx-teal);stroke-width:1.3}
  .ncx-hh .hh-svg .chk-p{fill:none;stroke:var(--ncx-teal);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
  .ncx-hh .hh-svg .chk-f{fill:var(--ncx-teal);opacity:0;transform-box:fill-box;transform-origin:center}
  .ncx-hh .hh-svg .abox{fill:var(--ncx-white);stroke:var(--ncx-rule);stroke-width:1.2}
  .ncx-hh .hh-svg .is-on .abox{stroke:var(--ncx-crimson);stroke-width:1.5;fill:var(--ncx-crimson-tint)}
  .ncx-hh .hh-svg .hbox{fill:var(--ncx-white);stroke:var(--ncx-teal);stroke-width:1.3;stroke-dasharray:4 3}
  .ncx-hh .hh-svg .is-on .hbox{stroke:var(--ncx-crimson);stroke-width:1.5;fill:var(--ncx-crimson-tint)}
  .ncx-hh .hh-svg .person{fill:none;stroke:var(--ncx-teal);stroke-width:1.5;stroke-linecap:round}
  .ncx-hh .hh-svg .flash{fill:var(--ncx-teal-tint);stroke:var(--ncx-teal);stroke-width:1.4;opacity:0}
  .ncx-hh .hh-svg .loop-ln{stroke:var(--ncx-teal);stroke-width:1.8}
  .ncx-hh .hh-svg .is-on .loop-ln{stroke:var(--ncx-teal);stroke-width:2.6}
  .ncx-hh .hh-svg .loop-t{font:500 10.5px var(--font-label),ui-monospace,monospace;fill:var(--ncx-teal);letter-spacing:.03em}
  .ncx-hh .hh-svg .loop-bg{fill:var(--ncx-teal-tint);opacity:0}
  .ncx-hh .hh-svg .is-on .loop-bg{opacity:1}
  .ncx-hh .hh-svg--portrait .lbl{font-size:12px}
  .ncx-hh .hh-svg--portrait .chip-t{font-size:10px}
  .ncx-hh .hh-svg--portrait .orch-t{font-size:15px}
  .ncx-hh .hh-svg [data-parts]{transition:opacity .35s ease}
  .ncx-hh .hh-svg .dim{opacity:.35}
  /* Reduced: a short fade between highlights. Off: none. */
  .ncx-hh .hh-stage[data-level="reduced"] .hh-svg [data-parts]{transition-duration:.2s}
  .ncx-hh .hh-stage[data-level="off"] .hh-svg [data-parts],.ncx-hh .hh-stage[data-level="off"] .hh-card{transition:none}
  /* The moving dots (loop.ts). */
  .ncx-hh .hh-svg .dot-core{fill:var(--ncx-crimson)}
  .ncx-hh .hh-svg .dot-halo{fill:var(--ncx-crimson);opacity:.16}
  .ncx-hh .hh-svg .dot.teal .dot-core,.ncx-hh .hh-svg .dot.teal .dot-halo{fill:var(--ncx-teal)}
  /* The hidden SVG the browser measures chip text in once fonts load. */
  .ncx-hh .hh-measure{position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none}

  @media (prefers-reduced-motion:reduce){.ncx-hh .hh-card,.ncx-hh .hh-svg [data-parts]{transition:none}.ncx-hh .hh-live i{animation:none}}

  /* Phones and small tablets: the drawing first, then the cards in one row that scrolls sideways. */
  @media (max-width:899.98px){
    .ncx-hh .hh-stage,.ncx-hh .hh-stage[data-cards="above"]{grid-template-columns:minmax(0,1fr)}
    .ncx-hh .hh-panel{order:1}
    .ncx-hh .hh-cards,.ncx-hh .hh-stage[data-cards="above"] .hh-cards{order:2;display:flex;flex-direction:row;overflow-x:auto;
      scroll-snap-type:x mandatory;padding-bottom:6px;scrollbar-width:thin}
    .ncx-hh .hh-card{flex:0 0 min(70%,250px);scroll-snap-align:start}
  }
`
