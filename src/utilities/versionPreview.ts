import { getVersion } from './cms'
import { currentVersionTarget } from './versionCookie'

/**
 * For pages that load only published entries and ignore draft mode (an
 * integration's or a customer's own page): in an old-version preview of an
 * entry from this collection whose address in that version is this slug, the
 * entry as it was in that version. Otherwise null, and the page loads as
 * usual.
 */
export const previewedVersionOf = async <T>(collection: string, slug: string): Promise<T | null> => {
  const target = await currentVersionTarget()
  if (!target || target.collection !== collection) return null
  const version = await getVersion(target.collection, target.id, 2)
  if (!version || version.doc.slug !== slug) return null
  return { ...version.doc, id: version.parent } as T
}
