// robots.txt and the sitemap index use the same address as the rest of the site.
// siteUrl() stops the build when it is missing.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { siteUrl } = require('./scripts/site-url.cjs')

const SITE_URL = siteUrl()

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  exclude: ['/pages-sitemap.xml', '/*', '/posts/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        // Preview and API addresses are never pages. /og (the share card) stays open for social sites.
        disallow: ['/admin/*', '/next/', '/api/'],
      },
    ],
    additionalSitemaps: [
      `${SITE_URL}/pages-sitemap.xml`,
      // Content collection entry pages and hubs (src/app/(frontend)/content-sitemap.xml).
      `${SITE_URL}/content-sitemap.xml`,
    ],
    // The generator always writes a Host line, which search engines no longer use.
    transformRobotsTxt: async (_, robotsTxt) => robotsTxt.replace(/# Host\r?\nHost: .*\r?\n\r?\n?/, ''),
  },
}
