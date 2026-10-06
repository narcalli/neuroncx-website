/**
 * Header CSS, ported from design/reference/header-reference.html.
 *
 * Two deliberate differences from the reference:
 *  - Selectors are prefixed `ncx-`. The reference uses bare names (.nav, .card,
 *    .btn) that would collide with the per-block styles already on these pages.
 *  - Its palette tokens are namespaced `--hdr-*` for the same reason: a global
 *    `--line` or `--ink` would leak into blocks that read those names without
 *    declaring them. The seven shared tokens (--nav-glass, --scrim, --wash,
 *    --g1..--g4) stay global and live in globals.css.
 *
 * Everything else — sizes, radii, timings, easing, breakpoints — is the
 * reference's own values.
 */
export const headerCss = `
:root{
  --hdr-surface:#FFFFFF;
  --hdr-surface-2:#FBFCFE;
  --hdr-ink:#171C2E;
  --hdr-ink-soft:#5A6379;
  --hdr-ink-faint:#8A92A6;
  --hdr-line:#E2E6EF;
  --hdr-line-soft:#EDF0F6;
  --hdr-crimson:#C62828;
  --hdr-crimson-hover:#A81F1F;
  --hdr-teal:#136B74;
  --hdr-teal-tint:#E4F1F1;
  --hdr-shadow:0 1px 2px rgba(20,26,45,.05), 0 8px 24px -12px rgba(20,26,45,.14);
  --hdr-max:1160px;
  --hdr-pad:clamp(10px,1.4vw,18px);
  --hdr-gutter:clamp(20px,5vw,64px);
  /* Veil tints. Low enough that the section's own colour still comes through,
     high enough that text keeps its contrast. */
  --hdr-veil:rgba(255,255,255,.34);
  --hdr-veil-stuck:rgba(255,255,255,.52);
  --hdr-veil-busy:rgba(255,255,255,.74);
  --hdr-veil-dark:rgba(12,16,26,.32);
  --hdr-veil-dark-stuck:rgba(12,16,26,.46);
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --hdr-surface:#151924;
    --hdr-surface-2:#11151F;
    --hdr-ink:#E9EBF2;
    --hdr-ink-soft:#A3ABBF;
    --hdr-ink-faint:#737C92;
    --hdr-line:#262C3B;
    --hdr-line-soft:#1D2230;
    --hdr-crimson:#E05151;
    --hdr-crimson-hover:#C63F3F;
    --hdr-teal:#4FB2BB;
    --hdr-teal-tint:#10242A;
    --hdr-shadow:0 1px 2px rgba(0,0,0,.4), 0 10px 28px -14px rgba(0,0,0,.7);
    --hdr-veil:rgba(13,16,24,.42);
    --hdr-veil-stuck:rgba(13,16,24,.58);
    --hdr-veil-busy:rgba(13,16,24,.76);
  }
}
:root[data-theme="dark"]{
  --hdr-surface:#151924;
  --hdr-surface-2:#11151F;
  --hdr-ink:#E9EBF2;
  --hdr-ink-soft:#A3ABBF;
  --hdr-ink-faint:#737C92;
  --hdr-line:#262C3B;
  --hdr-line-soft:#1D2230;
  --hdr-crimson:#E05151;
  --hdr-crimson-hover:#C63F3F;
  --hdr-teal:#4FB2BB;
  --hdr-teal-tint:#10242A;
  --hdr-shadow:0 1px 2px rgba(0,0,0,.4), 0 10px 28px -14px rgba(0,0,0,.7);
  --hdr-veil:rgba(13,16,24,.42);
  --hdr-veil-stuck:rgba(13,16,24,.58);
  --hdr-veil-busy:rgba(13,16,24,.76);
}

/* ---------- announcement bar ---------- */
.ncx-topbar{background:transparent;border-bottom:1px solid var(--hdr-line-soft);flex:none}
.ncx-topbar__in{
  max-width:var(--hdr-max);margin:0 auto;padding:9px 46px 9px var(--hdr-gutter);
  display:flex;align-items:center;justify-content:center;gap:12px;
  font-family:var(--font-body),Inter,Arial,sans-serif;
  font-size:13.5px;color:var(--hdr-ink-soft);position:relative;text-align:center;
}
.ncx-topbar__cta{
  font-family:var(--font-label),'IBM Plex Mono',monospace;
  font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;
  background:var(--hdr-crimson);color:#fff;padding:4px 12px;border-radius:999px;
  text-decoration:none;white-space:nowrap;flex:none;
}
.ncx-topbar__x{
  position:absolute;right:12px;top:50%;transform:translateY(-50%);
  background:none;border:0;color:var(--hdr-ink-faint);font-size:18px;line-height:1;
  cursor:pointer;padding:4px 8px;border-radius:6px;
}
.ncx-topbar__x:hover{color:var(--hdr-ink)}

/* ---------- the bar ----------
   Edge to edge and transparent. The page runs underneath it (the negative
   margin below pulls the first section up), and all the separation comes from
   the veil, not from a background or a border. */
.ncx-nav{
  position:sticky;top:env(safe-area-inset-top,0px);z-index:60;
  height:64px;flex:none;margin-bottom:-64px;
  font-family:var(--font-body),Inter,Arial,sans-serif;
}
/* The veil: a blur with a light tint, masked so it is solid across the bar and
   feathers out below it. That soft bottom edge is the whole trick — it reads
   as haze over the page rather than as a bar sitting on top of it. */
.ncx-nav::before{
  content:"";position:absolute;inset:0 0 -26px;z-index:-1;pointer-events:none;
  background:var(--hdr-veil);
  backdrop-filter:blur(14px) saturate(1.25);
  -webkit-backdrop-filter:blur(14px) saturate(1.25);
  -webkit-mask-image:linear-gradient(to bottom,#000 0,#000 62%,transparent 100%);
  mask-image:linear-gradient(to bottom,#000 0,#000 62%,transparent 100%);
  transition:background .25s;
}
/* Once the page has moved, thicken the veil a little for separation. */
.ncx-nav.is-stuck::before{background:var(--hdr-veil-stuck)}
/* Something dark but small is passing underneath — a card, a panel, a figure.
   Not enough to flip the header, so the veil thickens to keep text readable. */
.ncx-nav.is-busy::before,
.ncx-nav.is-busy.is-stuck::before{background:var(--hdr-veil-busy)}
/* riding a dark section: the veil goes dark too, so white text has something
   to sit on. The crimson button never changes. */
.ncx-nav.on-dark::before{background:var(--hdr-veil-dark)}
.ncx-nav.on-dark.is-stuck::before{background:var(--hdr-veil-dark-stuck)}
.ncx-nav.on-dark .ncx-navlink,
.ncx-nav.on-dark .ncx-ghost{color:#fff}
.ncx-nav.on-dark .ncx-navlink:hover,
.ncx-nav.on-dark .ncx-ghost:hover{color:#fff;opacity:.72}
.ncx-nav.on-dark .ncx-mark{background:transparent;border-color:rgba(255,255,255,.28);color:#fff}
.ncx-nav.on-dark .ncx-navitem.is-open .ncx-navlink{background:rgba(255,255,255,.16);box-shadow:none;color:#fff}
/* Edge-anchored, like the reference bar: logo hard left, actions hard right. */
.ncx-nav__in{
  display:flex;align-items:center;gap:8px;height:100%;
  max-width:none;margin:0;padding-inline:clamp(14px,2vw,28px);
}
.ncx-mark{
  display:flex;align-items:center;gap:9px;text-decoration:none;flex:none;
  font-family:var(--font-display),'Instrument Sans',Arial,sans-serif;
  font-weight:700;font-size:16px;letter-spacing:-.02em;
  background:var(--hdr-surface);color:var(--hdr-ink);
  padding:9px 18px 9px 11px;border-radius:999px;border:1px solid var(--hdr-line);
}
.ncx-mark__dot{width:20px;height:20px;border-radius:50%;background:var(--hdr-crimson);position:relative;flex:none}
.ncx-mark__dot::after{content:"";position:absolute;inset:6px;border-radius:50%;background:#fff}
.ncx-mark__img{width:20px;height:20px;border-radius:50%;object-fit:contain;flex:none;display:block}

.ncx-nav__links{display:flex;align-items:center;margin-inline:auto}
.ncx-navitem{position:static}
.ncx-navlink{
  display:flex;align-items:center;gap:5px;height:40px;padding:0 15px;
  font-family:var(--font-body),Inter,Arial,sans-serif;font-size:14px;
  color:var(--hdr-ink);text-decoration:none;
  background:none;border:0;cursor:pointer;border-radius:8px;
}
.ncx-navlink:hover{color:var(--hdr-teal)}
.ncx-navlink svg{width:10px;height:10px;opacity:.5;transition:transform .2s}
.ncx-navitem.is-open .ncx-navlink{background:var(--hdr-surface);box-shadow:0 0 0 1px var(--hdr-line)}
.ncx-navitem.is-open .ncx-navlink svg{transform:rotate(180deg)}
.ncx-nav__right{display:flex;align-items:center;gap:6px;flex:none}
.ncx-ghost{font-size:14px;color:var(--hdr-ink);text-decoration:none;padding:0 12px}
.ncx-ghost:hover{color:var(--hdr-teal)}
.ncx-btn-pill{
  font-family:var(--font-label),'IBM Plex Mono',monospace;
  font-size:11px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;
  background:var(--hdr-crimson);color:#fff;text-decoration:none;
  padding:13px 22px;border-radius:999px;white-space:nowrap;transition:background .15s;
}
.ncx-btn-pill:hover{background:var(--hdr-crimson-hover)}

/* ---------- dropdown panel ---------- */
/* The left offset is written by the component on open: the panel is centred
   under its trigger and clamped inside the header, which CSS cannot do alone. */
.ncx-menu{
  position:absolute;left:0;top:calc(100% + 8px);
  width:min(292px,calc(100vw - 24px));padding:7px;
  background:var(--hdr-surface);border:1px solid var(--hdr-line);border-radius:15px;
  box-shadow:0 2px 4px rgba(20,26,45,.04), 0 22px 54px -22px rgba(20,26,45,.26);
  opacity:0;visibility:hidden;transform:translateY(-8px);
  transition:opacity .18s ease,transform .18s ease,visibility .18s ease;
}
.ncx-navitem.is-open .ncx-menu{opacity:1;visibility:visible;transform:none}
.ncx-menu a{
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:10px 12px;border-radius:9px;font-size:14.5px;line-height:1.35;
  text-decoration:none;color:var(--hdr-ink);transition:background .14s,color .14s;
}
.ncx-menu a:hover{background:var(--hdr-teal-tint);color:var(--hdr-teal)}
.ncx-menu h5{
  font-family:var(--font-label),'IBM Plex Mono',monospace;
  font-size:10px;font-weight:500;letter-spacing:.12em;
  text-transform:uppercase;color:var(--hdr-ink-faint);
  margin:10px 0 2px;padding:10px 12px 0;border-top:1px solid var(--hdr-line-soft);
}
.ncx-menu h5:first-child{margin-top:0;padding-top:2px;border-top:0}
.ncx-badge-new{
  font-family:var(--font-label),'IBM Plex Mono',monospace;
  font-size:9.5px;letter-spacing:.1em;padding:2px 7px;
  border:1px dashed var(--hdr-crimson);color:var(--hdr-crimson);border-radius:999px;flex:none;
}

/* ---------- scrim behind an open menu ---------- */
/* Light touch: behind a 292px panel a heavy blur reads as a modal. */
.ncx-scrim{
  position:fixed;inset:0;z-index:40;background:var(--scrim);
  backdrop-filter:blur(4px) saturate(.92);-webkit-backdrop-filter:blur(4px) saturate(.92);
  opacity:0;visibility:hidden;transition:opacity .24s ease,visibility .24s ease;
}
body.ncx-menu-open .ncx-scrim{opacity:1;visibility:visible}

.ncx-nav :focus-visible,
.ncx-topbar :focus-visible{outline:2px solid var(--hdr-teal);outline-offset:3px;border-radius:4px}
.ncx-nav.on-dark :focus-visible{outline-color:#fff}

/* Without backdrop-filter the glass would be a 72% wash and the scrim barely
   visible, so both fall back to solid instead of a heavier tint. */
/* Without backdrop-filter there is no veil to speak of, so the bar takes a
   solid background instead and the flip still decides which one. */
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  .ncx-nav::before{
    background:var(--hdr-surface);
    -webkit-mask-image:none;mask-image:none;inset:0;
    border-bottom:1px solid var(--hdr-line);
  }
  .ncx-nav.on-dark::before{background:#0A0E18;border-bottom-color:rgba(255,255,255,.14)}
  .ncx-scrim{background:rgba(23,28,46,.22)}
  :root[data-theme="dark"] .ncx-scrim{background:rgba(5,7,12,.34)}
}

@media (max-width:1040px){
  .ncx-navlink{padding:0 11px;font-size:13.5px}
}
@media (max-width:760px){
  .ncx-nav__links{display:none}
  .ncx-nav__right{margin-left:auto}
  .ncx-ghost{padding:0 8px;font-size:13.5px}
  .ncx-btn-pill{padding:11px 16px;font-size:10px;letter-spacing:.08em}
  .ncx-mark{font-size:15px;padding:8px 14px 8px 9px}
  .ncx-topbar__in{font-size:12.5px;gap:9px;padding-right:40px}
}
@media (prefers-reduced-motion:reduce){
  .ncx-nav,.ncx-nav *,.ncx-topbar,.ncx-topbar *,.ncx-scrim{transition:none!important;animation:none!important}
}
`
