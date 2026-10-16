import canUseDOM from './canUseDOM'

/**
 * The two addresses the site needs, from the environment:
 *
 *   NEXT_PUBLIC_SERVER_URL   this website, e.g. https://neuroncx.netlify.app
 *   NEXT_PUBLIC_PAYLOAD_URL  the Payload CMS (API and media), e.g. the Amplify app.
 *                            CMS_URL, server only, still works as before.
 *
 * Both NEXT_PUBLIC_ values are fixed into the build. localhost is only a
 * fallback while developing (NODE_ENV "development"); a production build
 * without them gets an empty string instead, and next.config.ts warns at build
 * time. Nothing here ever points a visitor's browser at localhost.
 */

const isDev = process.env.NODE_ENV === 'development'

const clean = (url?: string | null): string => (url || '').trim().replace(/\/+$/, '')

/** This website's public address, with no trailing slash. Empty when not set outside development. */
export const getServerSideURL = (): string =>
  clean(process.env.NEXT_PUBLIC_SERVER_URL) || (isDev ? 'http://localhost:3000' : '')

/**
 * This website's address for code that may run in the browser: there it is
 * the page's own origin, so calls to the site itself never name a host.
 */
export const getClientSideURL = (): string =>
  canUseDOM ? window.location.origin : getServerSideURL()

/**
 * The Payload CMS address for the API and media files, with no trailing slash.
 * On the server, CMS_URL wins when set; in the browser only the NEXT_PUBLIC_
 * value exists. Empty when neither is set outside development.
 */
export const getPayloadURL = (): string =>
  clean(process.env.CMS_URL) ||
  clean(process.env.NEXT_PUBLIC_PAYLOAD_URL) ||
  (isDev ? 'http://localhost:3001' : '')
