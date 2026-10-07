import React from 'react'

/**
 * Splits a figure from its unit so the two can be coloured separately: the
 * number in ink, the unit in crimson. "74%" gives the row emphasis without a
 * second crimson focal point competing with the page's CTA.
 *
 * Anything that is not a leading number is returned untouched.
 */
export const StatValue: React.FC<{ value?: string | null }> = ({ value }) => {
  const text = String(value ?? '')
  const m = text.match(/^(\s*[\d.,]+)(.*)$/)
  if (!m || !m[2].trim()) return <>{text}</>
  return (
    <>
      {m[1]}
      <em className="ncx-unit">{m[2]}</em>
    </>
  )
}
