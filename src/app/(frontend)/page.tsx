import PageTemplate, { generateMetadata } from './[slug]/page'

// Content comes from the CMS at request time. Without this, the build can
// save a "not found" for the homepage if the CMS is unreachable while building.
export const dynamic = 'force-dynamic'

export default PageTemplate

export { generateMetadata }
