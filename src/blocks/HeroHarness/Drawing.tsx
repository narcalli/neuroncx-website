import React from 'react'

import { groupState, type Drawing, type Group, type Part, type Shape } from './geometry'

/** One shape as SVG. Shapes the motion step needs carry data-k. */
const draw = (s: Shape, key: React.Key): React.ReactNode => {
  const k = 'k' in s && s.k ? { 'data-k': s.k } : {}
  switch (s.t) {
    case 'rect':
      return <rect key={key} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} className={s.cls} {...k} />
    case 'path':
      return <path key={key} d={s.d} className={s.cls} {...k} />
    case 'line':
      return <line key={key} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} className={s.cls} />
    case 'circle':
      return <circle key={key} cx={s.cx} cy={s.cy} r={s.r} className={s.cls} {...k} />
    case 'text':
      return (
        <text key={key} x={s.x} y={s.y} className={s.cls} textAnchor={s.anchor} {...k}>
          {s.text}
        </text>
      )
    case 'g':
      return (
        <g key={key} transform={s.transform}>
          {s.items.map(draw)}
        </g>
      )
  }
}

const layer = (groups: Group[], lit: Part[]) =>
  groups.map((g, i) => {
    const state = groupState(g.parts, lit)
    return (
      <g key={i} data-parts={g.parts.join(' ')} className={state === 'on' ? 'is-on' : state === 'dim' ? 'dim' : undefined}>
        {g.items.map(draw)}
      </g>
    )
  })

/**
 * The harness drawing as SVG: the box and lines, then the boxes and labels,
 * then an empty layer for the moving dots (motion step). `lit` is the
 * selected card's parts; none lights nothing and dims nothing.
 */
export const HarnessDrawing: React.FC<{ drawing: Drawing; lit: Part[]; label: string; hidden?: boolean }> = ({
  drawing,
  lit,
  label,
  hidden,
}) => (
  <svg
    className={`hh-svg hh-svg--${drawing.layout}`}
    viewBox={`0 0 ${drawing.width} ${drawing.height}`}
    role="img"
    aria-label={label}
    data-layout={drawing.layout}
    {...(hidden ? { 'aria-hidden': true } : {})}
  >
    <g className="hh-lines">{layer(drawing.lines, lit)}</g>
    <g className="hh-nodes">{layer(drawing.nodes, lit)}</g>
    <g className="hh-dots" />
  </svg>
)
