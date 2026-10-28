// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

// jsdom has no matchMedia, which the motion code (src/motion/) can read when
// a test renders an animated block: a no-op stub is enough, since nothing
// here scrolls or resizes.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}
