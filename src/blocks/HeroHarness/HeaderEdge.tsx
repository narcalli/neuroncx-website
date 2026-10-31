'use client'

import React, { useLayoutEffect, useSyncExternalStore } from 'react'

/**
 * Width "Match the header": reads the header bar's own side padding
 * (.ncx-nav__in), so the title, cards and drawing start under the logo and
 * end under the last header button, at every width the header's padding
 * takes. The rule it writes applies from 760px up; below that the normal
 * phone margins stay. Without the header (or without scripts) the block keeps
 * the site column. The header itself is not touched.
 */
export const HEADER_EDGE_SCRIPT = `(function(){
var id='hh-header-edge';
function set(){
var bar=document.querySelector('.ncx-nav__in');if(!bar)return;
var cs=getComputedStyle(bar),s=document.getElementById(id);
if(!s){s=document.createElement('style');s.id=id;document.head.appendChild(s);}
s.textContent='@media (min-width:760px){.ncx-hh[data-width="header"] .ncx-container{max-width:none;padding-left:'+cs.paddingLeft+';padding-right:'+cs.paddingRight+'}}';
}
set();
if(!window.__hhHeaderEdge){window.__hhHeaderEdge=1;addEventListener('resize',set);}
})();`

const noSubscribe = () => () => {}

/**
 * Runs the measurement both ways a page can arrive:
 * - a full page load: the script in the server HTML runs as the page is read,
 *   before the hero below it is drawn, so the hero never jumps sideways;
 * - a link from another page: React draws the page in the browser, where a
 *   script tag would not run, so the effect runs it before the browser paints.
 * The script tag is only in the server HTML and the first render that matches
 * it, then goes.
 */
export const HeaderEdge: React.FC = () => {
  const fromServer = useSyncExternalStore(
    noSubscribe,
    () => false,
    () => true,
  )
  useLayoutEffect(() => {
    const run = document.createElement('script')
    run.text = HEADER_EDGE_SCRIPT
    document.head.appendChild(run)
    run.remove()
  }, [])
  return fromServer ? <script dangerouslySetInnerHTML={{ __html: HEADER_EDGE_SCRIPT }} /> : null
}
