'use client'

import React, { Children, useState } from 'react'

/**
 * Shows one quote at a time, with dot pagination. No autoplay: the reader
 * moves through the quotes themselves.
 */
export const TestimonialCarousel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const slides = Children.toArray(children)
  const [active, setActive] = useState(0)

  return (
    <div className="ncx-testi__carousel">
      {slides.map((slide, i) => (
        <div key={i} hidden={i !== active}>
          {slide}
        </div>
      ))}
      <div className="ncx-testi__dots">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show quote ${i + 1} of ${slides.length}`}
            aria-current={i === active ? 'true' : undefined}
            className={i === active ? 'is-active' : undefined}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </div>
  )
}
