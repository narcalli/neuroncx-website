'use client'

import React, { useState } from 'react'

import { KeyPointList } from '@/components/cards/KeyPoints'

import { accentVars, designClasses, designVars, type Design } from './design'
import type { FeatureFamily } from './featureData'
import { StageLine } from './StageLine'
import { featuresCss, flowCss } from './styles'

/**
 * Agent features mode: pick a family, then an agent, and see what it does,
 * its features and what it saves. Every agent's panel is in the HTML, so
 * search engines read them all; only the selected one shows. The first
 * family is selected on load, and the first agent whenever the family
 * changes. The Design tab (design.ts) sets the eyebrows, tags, colours,
 * line, buttons and panel; with nothing set it draws as it always has.
 */
export const AgentFeatures: React.FC<{
  heading: string
  intro?: string | null
  families: FeatureFamily[]
  pickFamilyLabel: string
  pickAgentLabel: string
  design: Design
}> = ({ heading, intro, families, pickFamilyLabel, pickAgentLabel, design: d }) => {
  const [familyAt, setFamilyAt] = useState(0)
  const [agentAt, setAgentAt] = useState(0)

  if (!families.length) return null

  return (
    <section className={`ncx-flow ncx-flow--features ${designClasses(d)}`} style={designVars(d)}>
      <style>{flowCss}</style>
      <style>{featuresCss}</style>

      <div className="wrap ncx-container">
        <h2>{heading}</h2>
        {intro ? <p className="sec-sub">{intro}</p> : null}

        <div className="lab-box">
          <p className="lab-q">{pickFamilyLabel}</p>
          <div className="trig" role="group" aria-label={pickFamilyLabel}>
            {families.map((f, fi) => (
              <button
                key={f.id}
                type="button"
                className="tb"
                aria-pressed={fi === familyAt}
                onClick={() => {
                  setFamilyAt(fi)
                  setAgentAt(0)
                }}
              >
                {f.name}
              </button>
            ))}
          </div>

          <p className="lab-q lab-q--agents">{pickAgentLabel}</p>
          {families.map((f, fi) => (
            <div key={f.id} className="chips" role="group" aria-label={`${pickAgentLabel}: ${f.name}`} hidden={fi !== familyAt}>
              {f.agents.map((a, ai) => (
                <button
                  key={a.id}
                  type="button"
                  className="chip"
                  aria-pressed={fi === familyAt && ai === agentAt}
                  aria-controls={`ncx-agent-${a.id}`}
                  onClick={() => setAgentAt(ai)}
                >
                  {a.name}
                  {a.pilot ? <span className="pilot">Pilot</span> : null}
                </button>
              ))}
            </div>
          ))}

          {families.map((f, fi) =>
            f.agents.map((a, ai) => (
              <div
                key={a.id}
                id={`ncx-agent-${a.id}`}
                className="stage"
                role="region"
                aria-label={a.name}
                hidden={!(fi === familyAt && ai === agentAt)}
              >
                {d.lineStyle === 'animated' && fi === familyAt && ai === agentAt ? (
                  <StageLine lineStyle="animated" playKey={a.id} />
                ) : null}
                <div className="node on" style={accentVars(d.accents[0])}>
                  <span className="tag">{d.stageLabels[0]}</span>
                  <b>{a.name}</b>
                  {a.summary ? <small>{a.summary}</small> : null}
                  {a.channels.length ? (
                    <div className="hch">
                      {a.channels.map((c) => (
                        <span key={c}>{c}</span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="node on" style={accentVars(d.accents[1])}>
                  <span className="tag">{d.stageLabels[1]}</span>
                  <KeyPointList points={a.keyPoints} gapAbove={7} />
                  <div className="hch hch--handlers">
                    <span className="on">{d.handlerLabels.agent}</span>
                    {a.humanTeam ? <span className="on">{d.handlerLabels.human}</span> : null}
                  </div>
                </div>

                <div className="node ok on" style={accentVars(d.accents[2])}>
                  <span className="tag">{d.stageLabels[2]}</span>
                  {a.records ? <small>{a.records}</small> : null}
                  {a.teamControls ? (
                    <small className="you-set">
                      <strong>You set:</strong> {a.teamControls}
                    </small>
                  ) : null}
                </div>
              </div>
            )),
          )}
        </div>
      </div>
    </section>
  )
}
