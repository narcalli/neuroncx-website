// The public site address for robots.txt and the sitemap. localhost only while
// developing; a production build without NEXT_PUBLIC_SERVER_URL warns and uses
// a placeholder that clearly is not the site.
const isDev = process.env.NODE_ENV === 'development'
const SITE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  (isDev ? 'http://localhost:3000' : 'https://example.com')

if (!process.env.NEXT_PUBLIC_SERVER_URL && !process.env.VERCEL_PROJECT_PRODUCTION_URL && !isDev) {
  console.warn(
    '\n[site URL] NEXT_PUBLIC_SERVER_URL is not set, so robots.txt and the sitemap use https://example.com. Set it to the public site address.\n',
  )
}

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  exclude: ['/posts-sitemap.xml', '/pages-sitemap.xml', '/*', '/posts/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        disallow: '/admin/*',
      },
    ],
    additionalSitemaps: [`${SITE_URL}/pages-sitemap.xml`, `${SITE_URL}/posts-sitemap.xml`],
  },
}
