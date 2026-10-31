/**
 * Header CSS, ported from design/reference/header-reference.html.
 *
 * Two deliberate differences from the reference:
 *  - Selectors are prefixed `ncx-`. The reference uses bare names (.nav, .card,
 *    .btn) that would collide with the per-block styles already on these pages.
 *  - Its palette tokens are namespaced `--hdr-*` for the same reason: a global
 *    `--line` or `--ink` would leak into blocks that read those names without
 *    declaring them. The six shared tokens (--nav-glass, --wash, --g1..--g4)
 *    stay global and live in globals.css.
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
  /* Mega menu: the New badge, the featured card, a row under the pointer. */
  --hdr-crimson-tint:#FBEAEA;
  --hdr-crimson-wash:#FCF5F4;
  --hdr-hover:#F4F6FA;
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

/* ---------- announcement bar ---------- */
.ncx-topbar{background:transparent;border-bottom:1px solid var(--hdr-line-soft);flex:none}
.ncx-topbar__in{
  max-width:var(--hdr-max);margin:0 auto;padding:9px 46px 9px var(--hdr-gutter);
  display:flex;align-items:center;justify-content:center;gap:12px;
  font-family:var(--font-body),Arial,sans-serif;
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
  font-family:var(--font-body),Arial,sans-serif;
  border-bottom:1px solid transparent;box-shadow:none;
  transition:border-color .25s,transform .3s cubic-bezier(.22,1,.36,1);
}
/* Past 8px of scroll (prompt 4): the glass veil gives way to a solid white
   bar with a hairline and a soft shadow. Riding a dark section keeps the
   veil instead, so the white bar never fights the dark text over it. */
.ncx-nav.is-stuck:not(.on-dark){
  border-bottom-color:var(--hdr-line);box-shadow:var(--hdr-shadow);
}
.ncx-nav.is-stuck:not(.on-dark)::before{background:var(--hdr-surface)}
/* Past 240px, sliding down hides the bar; scrolling up, opening a menu or
   the drawer, or focus landing inside it (headerScroll.ts) brings it back. */
.ncx-nav.is-hidden{transform:translateY(-100%)}
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
.ncx-nav.on-dark .ncx-ghost,
.ncx-nav.on-dark .ncx-burger{color:#fff}
.ncx-nav.on-dark .ncx-navlink:hover,
.ncx-nav.on-dark .ncx-ghost:hover{color:#fff;opacity:.72}
.ncx-nav.on-dark .ncx-mark,
.ncx-nav.on-dark .ncx-burger{background:transparent;border-color:rgba(255,255,255,.28);color:#fff}
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
  padding:7px 18px 7px 8px;border-radius:999px;border:1px solid var(--hdr-line);
}
.ncx-mark__dot{width:20px;height:20px;border-radius:50%;background:var(--hdr-crimson);position:relative;flex:none}
.ncx-mark__dot::after{content:"";position:absolute;inset:6px;border-radius:50%;background:#fff}
/* Bigger than the fallback dot: an uploaded mark carries detail, and at 20px
   it read as a speck next to the wordmark. */
.ncx-mark__img{width:30px;height:30px;border-radius:50%;object-fit:contain;flex:none;display:block}

.ncx-nav__links{display:flex;align-items:center;margin-inline:auto}
/* Static, so the mega panel is placed against the whole bar (place() in
   Component.client.tsx measures from it). The hover pill gets its own
   positioned slot around the link instead. */
.ncx-navitem{position:static}
.ncx-navslot{position:relative;display:flex}
.ncx-navlink{
  position:relative;z-index:1;
  display:flex;align-items:center;gap:5px;height:40px;padding:0 15px;
  font-family:var(--font-body),Arial,sans-serif;font-size:14px;
  color:var(--hdr-ink);text-decoration:none;
  background:none;border:0;cursor:pointer;border-radius:8px;
}
/* The pill that slides between nav items on hover (point 3, prompt 4): one
   shared element (layoutId in Component.client.tsx), so moving the mouse
   from one item to the next slides it rather than fading a new one in. */
.ncx-navpill{
  position:absolute;inset:4px 2px;z-index:0;border-radius:8px;
  background:var(--hdr-hover);
}
.ncx-nav.on-dark .ncx-navpill{background:rgba(255,255,255,.14)}
.ncx-navlink:hover{color:var(--hdr-teal)}
.ncx-navlink svg{width:10px;height:10px;opacity:.5;transition:transform .2s}
.ncx-navitem.is-open .ncx-navlink{background:var(--hdr-surface);box-shadow:0 0 0 1px var(--hdr-line)}
.ncx-navitem.is-open .ncx-navlink svg{transform:rotate(180deg)}
.ncx-nav__right{display:flex;align-items:center;gap:6px;flex:none}
.ncx-ghost{font-size:14px;color:var(--hdr-ink);text-decoration:none;padding:0 12px}
.ncx-ghost:hover{color:var(--hdr-teal)}
/* A hairline rather than a typed "|": it stays the same weight at any size and
   takes the chrome colour, so it fades in and out with the rest. */
.ncx-sep{
  width:1px;height:16px;flex:none;background:currentColor;opacity:.28;
  color:var(--hdr-ink);
}
.ncx-nav.on-dark .ncx-sep{color:#fff;opacity:.34}
.ncx-btn-pill{
  font-family:var(--font-label),'IBM Plex Mono',monospace;
  font-size:11px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;
  background:var(--hdr-crimson);color:#fff;text-decoration:none;
  padding:13px 22px;border-radius:999px;white-space:nowrap;transition:background .15s;
}
.ncx-btn-pill:hover{background:var(--hdr-crimson-hover)}

/* ---------- mega menu panel ----------
   As wide as its content. The component caps it at the page container's
   content width (max-width) and writes its left offset (place() in
   Component.client.tsx): under its trigger, moved left only as far as the
   container's right edge requires. CSS cannot measure either. */
.ncx-nav__frame{position:absolute;left:0;right:0;top:0;height:0;visibility:hidden;pointer-events:none}
.ncx-mega{
  position:absolute;left:0;top:calc(100% + 8px);
  display:flex;align-items:stretch;
  width:max-content;max-width:calc(100vw - 48px);padding:10px;
  background:var(--hdr-surface);border:1px solid var(--hdr-line);border-radius:16px;
  box-shadow:0 2px 4px rgba(20,26,45,.04), 0 22px 54px -22px rgba(20,26,45,.26);
  color:var(--hdr-ink);font-family:var(--font-body),Arial,sans-serif;
  opacity:0;visibility:hidden;transform:translateY(-4px);
  transition:opacity .15s ease,transform .15s ease,visibility .15s;
}
.ncx-navitem.is-open .ncx-mega{opacity:1;visibility:visible;transform:none}
/* An invisible bridge from the bottom of the triggers (52px) to the panel, as
   wide as the panel, so a mouse heading down never lands on the scrim. It
   shares the panel's visibility, so it catches nothing while the menu is closed. */
.ncx-mega::before{content:"";position:absolute;left:-1px;right:-1px;bottom:100%;height:21px}
/* Each group a column as wide as its content; a hairline between columns.
   When the panel hits its cap, the widest group wraps first: none goes
   narrower than its longest word. */
.ncx-mega__group{flex:0 1 auto;min-width:min-content}
.ncx-mega__group + .ncx-mega__group{margin-left:10px;padding-left:10px;border-left:1px solid var(--hdr-line-soft)}
/* Columns following 50ms apart (point 4, prompt 4): each starts a little
   below and faded out, then drops into place; --i (set in MegaMenu.tsx) is
   its place in the stagger. The delay is reset to 0 outside .is-open, so
   closing never waits for it. */
.ncx-mega__group,.ncx-mega__feature{
  opacity:0;transform:translateY(-6px);transition-delay:0s;
  transition:opacity .18s ease,transform .18s ease;
}
.ncx-navitem.is-open .ncx-mega__group,
.ncx-navitem.is-open .ncx-mega__feature{
  opacity:1;transform:none;transition-delay:calc(var(--i,0) * 50ms);
}
.ncx-mega__eyebrow{
  margin:6px 12px 4px;
  font-family:var(--font-label),'IBM Plex Mono',monospace;
  font-size:10px;font-weight:500;line-height:14px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--hdr-ink-faint);
}
.ncx-mega__list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:auto;gap:2px}
/* 4 or more items: two columns, each as wide as its widest item, filled row by row. */
.ncx-mega__list.is-grid{grid-template-columns:repeat(2,auto);column-gap:4px}
.ncx-mega__list > li{display:flex}
/* Icon slot and text. The slot is as tall as the label's line and the rows
   align to the top, so a label sits on the same line whether a description
   follows it or not, and every label in a column starts at the same x. */
.ncx-mega__item{
  flex:1;display:grid;grid-template-columns:20px 1fr;column-gap:12px;align-items:start;
  max-width:320px;padding:10px 12px;border-radius:10px;
  color:var(--hdr-ink);text-decoration:none;transition:background .14s;
}
.ncx-mega__item:not(:has(.ncx-mega__icon)){grid-template-columns:1fr}
.ncx-mega__item:hover{background:var(--hdr-hover)}
.ncx-mega__icon{display:flex;align-items:center;justify-content:center;width:20px;height:20px;color:var(--hdr-crimson)}
.ncx-mega__icon svg{width:18px;height:18px;display:block}
.ncx-mega__text{display:flex;flex-direction:column;gap:2px}
.ncx-mega__label{display:flex;align-items:center;flex-wrap:wrap;column-gap:8px;font-size:14px;font-weight:500;line-height:20px}
.ncx-mega__desc{font-size:13px;line-height:18px;color:var(--hdr-ink-soft)}
.ncx-pill{
  font-family:var(--font-label),'IBM Plex Mono',monospace;
  font-size:9.5px;font-weight:500;line-height:1;letter-spacing:.1em;text-transform:uppercase;
  padding:3px 7px;border-radius:999px;flex:none;
}
.ncx-pill--new{background:var(--hdr-crimson-tint);color:var(--hdr-crimson)}
.ncx-pill--beta{background:var(--hdr-teal-tint);color:var(--hdr-teal)}
/* The featured card: always the last column, a fixed 240px, lightly tinted. */
.ncx-mega__feature{
  flex:none;width:240px;margin-left:10px;
  display:flex;flex-direction:column;gap:6px;padding:14px;border-radius:12px;
  background:var(--hdr-crimson-wash);color:var(--hdr-ink);text-decoration:none;
  transition:background .14s;
}
a.ncx-mega__feature:hover{background:var(--hdr-crimson-tint)}
.ncx-mega__feature img{display:block;width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;border-radius:8px;margin-bottom:6px}
.ncx-mega__feature-eyebrow{
  font-family:var(--font-label),'IBM Plex Mono',monospace;
  font-size:10px;font-weight:500;line-height:14px;letter-spacing:.12em;text-transform:uppercase;color:var(--hdr-crimson);
}
.ncx-mega__feature-title{font-family:var(--font-display),Arial,sans-serif;font-size:15px;font-weight:600;line-height:1.35;letter-spacing:-.01em}
.ncx-mega__feature-cta{margin-top:auto;padding-top:6px;font-size:13px;font-weight:500;color:var(--hdr-crimson)}
/* Reduced motion: the panel appears in place, no slide (the rule at the end
   of this sheet also drops the fade). */
@media (prefers-reduced-motion:reduce){
  .ncx-mega,.ncx-mega__group,.ncx-mega__feature{transform:none}
}

/* ---------- layer behind an open menu ---------- */
/* Invisible: the page stays sharp while a menu is open. The layer is only
   there so a mouse moving onto the page, or a tap on it, closes the menu
   without pressing whatever sits underneath. */
.ncx-scrim{
  position:fixed;inset:0;z-index:40;background:transparent;
  visibility:hidden;
}
body.ncx-menu-open .ncx-scrim{visibility:visible}

.ncx-nav :focus-visible,
.ncx-topbar :focus-visible{outline:2px solid var(--hdr-teal);outline-offset:3px;border-radius:4px}
.ncx-nav.on-dark :focus-visible{outline-color:#fff}

/* Without backdrop-filter there is no veil to speak of, so the bar takes a
   solid background instead and the flip still decides which one. */
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  .ncx-nav::before{
    background:var(--hdr-surface);
    -webkit-mask-image:none;mask-image:none;inset:0;
    border-bottom:1px solid var(--hdr-line);
  }
  .ncx-nav.on-dark::before{background:#0A0E18;border-bottom-color:rgba(255,255,255,.14)}
}

@media (max-width:1100px){
  .ncx-navlink{padding:0 11px;font-size:13.5px}
}
@media (max-width:900px){
  .ncx-nav__links{display:none}
  /* Same place as the centre links: it belongs in the drawer at this width. */
  .ncx-support,.ncx-sep{display:none}
  .ncx-nav__right{margin-left:auto}
  .ncx-ghost{padding:0 8px;font-size:13.5px}
  .ncx-btn-pill{padding:11px 16px;font-size:10px;letter-spacing:.08em}
  .ncx-mark{font-size:15px;padding:6px 14px 6px 7px}
  .ncx-mark__img{width:26px;height:26px}
  .ncx-topbar__in{font-size:12.5px;gap:9px;padding-right:40px}
}
/* Phones: the bar keeps the logo, Book a demo and the menu button. Sign in is
   in the drawer's footer at this width. */
@media (max-width:480px){
  .ncx-nav__right .ncx-ghost{display:none}
}
/* The smallest phones: a slightly smaller logo pill, so the bar still fits
   inside its side padding at 320px. */
@media (max-width:360px){
  .ncx-mark{font-size:14px;gap:7px;padding:5px 12px 5px 6px}
  .ncx-mark__img{width:24px;height:24px}
}
/* ---------- menu button ----------
   Hidden by default and shown below 900px. Both display rules live here and
   nowhere else, so no other rule can override either one. */
.ncx-burger{
  display:none;align-items:center;gap:9px;flex:none;
  height:44px;padding:0 17px;border-radius:999px;
  border:1px solid var(--hdr-line);background:var(--hdr-surface);color:var(--hdr-ink);
  font-family:inherit;cursor:pointer;
}
@media (max-width:900px){
  .ncx-burger{display:flex}
}
.ncx-burger__label{font-weight:700;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;line-height:1}
.ncx-burger__bars{display:flex;flex-direction:column;gap:5px}
.ncx-burger__bars i{display:block;width:16px;height:2px;border-radius:2px;background:currentColor}
/* Phones: icon only, a round 44px button. The aria-label (Open menu, Close
   menu) still names it. */
@media (max-width:480px){
  .ncx-burger{width:44px;padding:0;justify-content:center}
  .ncx-burger__label{display:none}
}

/* ---------- menu drawer ----------
   Full screen inside the viewport, above the bar (z 60) and the WhatsApp
   widget (z 50). Its display rules all live here: the hidden attribute must
   win over display:flex, and the drawer never shows above 900px, where the
   full menu is in the bar. Always light, whatever the bar is riding on. */
.ncx-drawer{
  position:fixed;inset:0;z-index:70;
  display:flex;flex-direction:column;
  height:100vh;height:100dvh;
  padding-top:env(safe-area-inset-top,0px);
  background:var(--hdr-surface);color:var(--hdr-ink);
  font-family:var(--font-body),Arial,sans-serif;
  /* Slides in from the right (point 5, prompt 4). Kept in the DOM (inert
     when closed, Component.client.tsx) rather than unmounted with [hidden],
     so there is something to slide; visibility only flips once the slide
     out has finished, so it stops taking clicks and the tab order right away. */
  transform:translateX(100%);visibility:hidden;pointer-events:none;
  transition:transform .32s cubic-bezier(.22,1,.36,1),visibility 0s .32s;
}
.ncx-drawer.is-open{
  transform:none;visibility:visible;pointer-events:auto;
  transition:transform .32s cubic-bezier(.22,1,.36,1),visibility 0s;
}
@media (min-width:901px){
  .ncx-drawer{display:none}
}
/* The top bar matches the main bar: 64px, the logo pill on the left. */
.ncx-drawer__bar{
  flex:none;height:64px;display:flex;align-items:center;justify-content:space-between;gap:8px;
  padding-inline:clamp(14px,2vw,28px);border-bottom:1px solid var(--hdr-line);
}
.ncx-drawer__close{
  flex:none;width:44px;height:44px;padding:0;display:flex;align-items:center;justify-content:center;
  border:1px solid var(--hdr-line);border-radius:999px;background:var(--hdr-surface);color:var(--hdr-ink);
  cursor:pointer;
}
.ncx-drawer__x{position:relative;width:16px;height:16px}
.ncx-drawer__x::before,.ncx-drawer__x::after{
  content:"";position:absolute;left:0;top:7px;width:16px;height:2px;border-radius:2px;background:currentColor;
}
.ncx-drawer__x::before{transform:rotate(45deg)}
.ncx-drawer__x::after{transform:rotate(-45deg)}
/* Only the body scrolls; the top bar and the footer stay put. */
.ncx-drawer__body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain}
.ncx-drawer__list{list-style:none;margin:0;padding:0}
.ncx-drawer__item + .ncx-drawer__item{border-top:1px solid var(--hdr-line)}
/* Links following 40ms apart as the drawer opens (point 5, prompt 4); --i
   (set in Component.client.tsx) is each row's place in the stagger. */
.ncx-drawer__item{
  opacity:0;transform:translateX(12px);transition-delay:0s;
  transition:opacity .22s ease,transform .22s ease;
}
.ncx-drawer.is-open .ncx-drawer__item{
  opacity:1;transform:none;transition-delay:calc(var(--i,0) * 40ms);
}
.ncx-drawer__row{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  width:100%;min-height:56px;padding:0 clamp(18px,5vw,28px);
  font-family:inherit;font-size:17px;font-weight:500;line-height:1.3;text-align:left;
  color:var(--hdr-ink);text-decoration:none;background:none;border:0;cursor:pointer;
}
/* The bar's down chevron, turned to point right; it points down again while
   its section is open. */
.ncx-drawer__row svg{flex:none;width:12px;height:12px;opacity:.55;transform:rotate(-90deg);transition:transform .2s ease}
.ncx-drawer__row[aria-expanded="true"] svg{transform:none}
.ncx-drawer__row:hover{color:var(--hdr-teal)}
/* A dropdown's links: indented behind a 2px rule. */
.ncx-drawer__sub{
  list-style:none;margin:0 clamp(18px,5vw,28px) 16px;padding:0 0 0 16px;
  border-left:2px solid var(--hdr-line);
}
.ncx-drawer__eyebrow{
  font-family:var(--font-label),'IBM Plex Mono',monospace;
  font-size:10.5px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;
  color:var(--hdr-teal);padding:14px 0 4px;
}
.ncx-drawer__sub > .ncx-drawer__eyebrow:first-child{padding-top:4px}
.ncx-drawer__link{
  display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:48px;
  font-size:16px;line-height:1.35;color:var(--hdr-ink);text-decoration:none;
}
.ncx-drawer__link:hover{color:var(--hdr-teal)}
.ncx-drawer__foot{
  flex:none;display:flex;flex-direction:column;gap:12px;
  padding:16px clamp(18px,5vw,28px) calc(16px + env(safe-area-inset-bottom,0px));
  border-top:1px solid var(--hdr-line);
}
/* The bar's CTA style, full width. The selector outweighs the phone-size
   tweak to .ncx-btn-pill in the 900px block above. */
.ncx-drawer .ncx-drawer__cta{
  display:flex;align-items:center;justify-content:center;width:100%;min-height:52px;
  padding:0 22px;font-size:12px;letter-spacing:.12em;
}
.ncx-drawer__minor{display:flex;justify-content:center;gap:28px}
.ncx-drawer__minor a{font-size:15px;color:var(--hdr-ink);text-decoration:none;padding:8px 4px}
.ncx-drawer__minor a:hover{color:var(--hdr-teal)}
.ncx-drawer :focus-visible{outline:2px solid var(--hdr-teal);outline-offset:-2px;border-radius:6px}

@media (prefers-reduced-motion:reduce){
  .ncx-nav,.ncx-nav *,.ncx-topbar,.ncx-topbar *,.ncx-scrim,.ncx-drawer,.ncx-drawer *{transition:none!important;animation:none!important}
}
`
