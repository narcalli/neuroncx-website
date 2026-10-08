'use client'

import React, { useState } from 'react'

import type { AgenticOrbitBlock as AgenticOrbitProps } from '@/payload-types'

type Role = NonNullable<AgenticOrbitProps['roles']>[number]

export const AgenticOrbitBlock: React.FC<AgenticOrbitProps> = ({ heading, intro, centreLabel, roles }) => {
  const list: Role[] = (roles || []).filter((r) => r && r.label)
  const [active, setActive] = useState<number | null>(null)
  if (!list.length) return null

  const caption = active !== null ? list[active].caption : 'Hover a role to see where it sits.'
  const hold = active !== null

  return (
    <section className="ncx-orbit">
      <style>{`
        .ncx-orbit{
          --orbit-core-hi:#3B4A8C; /* lit stop of the core sphere gradient */
          padding:84px 0;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-orbit h2{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:clamp(1.55rem,3.4vw,2.2rem);max-width:24ch;margin:0;color:var(--ncx-ink)}
        .ncx-orbit .sub{max-width:62ch;margin-top:18px;color:var(--ncx-muted)}
        .ncx-orbit .rel{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center;margin-top:40px}
        .ncx-orbit ul{list-style:none;margin:26px 0 0;padding:0;border-top:1px solid var(--ncx-rule)}
        .ncx-orbit li{padding:14px 12px;border-bottom:1px solid var(--ncx-rule);font-weight:500;border-left:4px solid transparent;transition:background .25s,border-color .25s}
        .ncx-orbit li.hl{background:var(--ncx-white);border-left-color:var(--ncx-crimson);padding-left:18px}
        /* The radius follows the orbit's own width. It used to be a fixed 150px
           while the orbit shrank with the screen, so on a phone the chips
           circled past the edge and the whole page scrolled sideways. At the
           full 420px this is exactly 150px, so desktop is unchanged; below
           that it leaves 60px for half a chip, and the chips wrap to fit. */
        .ncx-orbit .orbit{position:relative;width:min(100%,420px);aspect-ratio:1;margin-inline:auto;
          container-type:inline-size;--r:min(150px,calc(50cqi - 60px))}
        .ncx-orbit .ring{position:absolute;border-radius:50%;border:1px dashed var(--ncx-rule);left:50%;top:50%;transform:translate(-50%,-50%)}
        .ncx-orbit .ring.r1{width:calc(var(--r)*2);height:calc(var(--r)*2)}
        .ncx-orbit .ring.r2{width:calc(var(--r)*1.15);height:calc(var(--r)*1.15);border-style:dotted}
        .ncx-orbit .core{position:absolute;left:50%;top:50%;width:104px;height:104px;margin:-52px 0 0 -52px;border-radius:50%;display:grid;place-items:center;text-align:center;color:var(--ncx-on-navy);
          font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.82rem;line-height:1.2;background:radial-gradient(circle at 30% 25%,var(--orbit-core-hi),var(--ncx-navy) 75%);
          box-shadow:0 0 0 8px rgba(198,40,40,.1),0 18px 36px -14px rgba(26,32,53,.6)}
        .ncx-orbit .spin{position:absolute;left:50%;top:50%;width:0;height:0;animation:ncxSpin 40s linear infinite}
        .ncx-orbit .spin.paused{animation-play-state:paused}
        @keyframes ncxSpin{
          from{transform:rotate(var(--a)) translateX(var(--r)) rotate(calc(var(--a) * -1))}
          to{transform:rotate(calc(var(--a) + 360deg)) translateX(var(--r)) rotate(calc((var(--a) + 360deg) * -1))}
        }
        .ncx-orbit .on-node{position:absolute;left:0;top:0;transform:translate(-50%,-50%);white-space:nowrap;border:1.5px solid var(--ncx-rule);background:var(--ncx-white);color:var(--ncx-body);
          border-radius:999px;padding:8px 14px;font-family:var(--font-body),Arial,sans-serif;font-weight:600;font-size:.85rem;cursor:pointer}
        .ncx-orbit .on-node.hl{background:var(--ncx-crimson);border-color:var(--ncx-crimson);color:var(--ncx-on-navy)}
        /* After the chip's own rule, which would otherwise win on order. */
        @container (max-width:419px){
          .ncx-orbit .on-node{white-space:normal;max-width:120px;text-align:center;line-height:1.25;padding:6px 10px}
        }
        .ncx-orbit .cap{margin:16px auto 0;text-align:center;font-size:.95rem;color:var(--ncx-muted);min-height:1.6em;max-width:36ch}
        @media (max-width:860px){.ncx-orbit .rel{grid-template-columns:1fr;gap:28px}}
        @media (prefers-reduced-motion:reduce){.ncx-orbit .spin{animation:none}}
      `}</style>
      <div className="wrap ncx-container">
        <h2>{heading}</h2>
        {intro ? <p className="sub">{intro}</p> : null}
        <div className="rel">
          <div>
            <ul>
              {list.map((r, i) => (
                <li
                  key={i}
                  tabIndex={0}
                  className={active === i ? 'hl' : ''}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                >
                  {r.label}
                  {r.subLabel ? <span style={{ display: 'block', fontWeight: 400, fontSize: '.9rem', color: 'var(--ncx-muted)' }}>{r.subLabel}</span> : null}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="orbit">
              <span className="ring r1" aria-hidden="true" />
              <span className="ring r2" aria-hidden="true" />
              <div className="core">{centreLabel || 'One transaction'}</div>
              {list.map((r, i) => {
                const angle = (360 / list.length) * i
                return (
                  <div
                    key={i}
                    className={`spin${hold ? ' paused' : ''}`}
                    style={{ ['--a' as string]: `${angle}deg` }}
                  >
                    <button
                      type="button"
                      className={`on-node${active === i ? ' hl' : ''}`}
                      onMouseEnter={() => setActive(i)}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive(i)}
                      onBlur={() => setActive(null)}
                    >
                      {r.label}
                    </button>
                  </div>
                )
              })}
            </div>
            <p className="cap" aria-live="polite">
              {caption}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
