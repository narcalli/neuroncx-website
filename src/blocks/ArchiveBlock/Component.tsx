import React from 'react'
import RichText from '@/components/RichText'

import { CollectionArchive } from '@/components/CollectionArchive'
import { getMany, CMS_TAG } from '@/utilities/cms'

type Props = {
  id?: string
  categories?: any[] | null
  introContent?: any
  limit?: number | null
  populateBy?: string | null
  selectedDocs?: { value?: any }[] | null
}

export const ArchiveBlock: React.FC<Props> = async (props) => {
  const { id, categories, introContent, limit: limitFromProps, populateBy, selectedDocs } = props

  const limit = limitFromProps || 3

  let posts: any[] = []

  if (populateBy === 'collection') {
    const flattenedCategories = categories?.map((category) =>
      typeof category === 'object' ? category.id : category,
    )

    const query: Record<string, string | number> = { depth: 1, limit }

    if (flattenedCategories && flattenedCategories.length > 0) {
      // REST takes `in` as a comma-separated list rather than an array.
      query['where[categories][in]'] = flattenedCategories.join(',')
    }

    posts = await getMany<any>('posts', query, { tags: [CMS_TAG, 'posts'] })
  } else if (selectedDocs?.length) {
    posts = selectedDocs
      .map((post) => (typeof post.value === 'object' ? post.value : null))
      .filter(Boolean)
  }

  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16">
          <RichText className="ms-0 max-w-[48rem]" data={introContent} enableGutter={false} />
        </div>
      )}
      <CollectionArchive posts={posts} />
    </div>
  )
}
