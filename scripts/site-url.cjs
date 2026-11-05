// The public site address for build-time files. A build without it fails here,
// so robots.txt and the sitemaps can never go out with a placeholder address.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadEnvConfig } = require('@next/env')

const siteUrl = () => {
  loadEnvConfig(process.cwd())
  const raw = (process.env.NEXT_PUBLIC_SERVER_URL || '').trim().replace(/\/+$/, '')
  let valid = false
  try {
    valid = /^https?:$/.test(new URL(raw).protocol)
  } catch {
    valid = false
  }
  if (!valid) {
    throw new Error(
      `NEXT_PUBLIC_SERVER_URL must be the site's full address, such as https://neuroncx.in, but it is ${raw ? `"${raw}"` : 'not set'}. ` +
        'Set it in the Netlify environment variables (or .env when building locally) and build again.',
    )
  }
  return raw
}

module.exports = { siteUrl }

if (require.main === module) {
  try {
    console.log(`Site address: ${siteUrl()}`)
  } catch (err) {
    console.error(`\n[site URL] ${err.message}\n`)
    process.exit(1)
  }
}
