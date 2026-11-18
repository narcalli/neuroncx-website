import type { Metadata } from 'next'
import React from 'react'

import { loadPostsPage, PostsIndex, postsMetadata } from '@/components/PostsIndex'

/** The blog index, page 1 (components/PostsIndex). Later pages are /posts/page/N. */
export const dynamic = 'force-dynamic'

export default async function PostsIndexPage() {
  return <PostsIndex page={1} posts={await loadPostsPage(1)} />
}

export async function generateMetadata(): Promise<Metadata> {
  return postsMetadata(1)
}
