import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import React from 'react'

import { loadPostsPage, PostsIndex, postsMetadata } from '@/components/PostsIndex'
import { notFoundUnlessCmsDown } from '@/utilities/cms'

/**
 * The blog index from page 2 on, with /posts's template, title rules and
 * canonical (components/PostsIndex). Page 1 is /posts: redirects.ts sends
 * /posts/page/1 there, and this route does too if it is ever reached.
 */
export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ pageNumber: string }> }

/** A whole page number of 1 or more, or null. */
const pageOf = async (params: Args['params']): Promise<number | null> => {
  const { pageNumber } = await params
  return /^[1-9]\d*$/.test(pageNumber) ? Number(pageNumber) : null
}

export default async function PostsPage({ params }: Args) {
  const page = await pageOf(params)
  if (page === null) notFoundUnlessCmsDown()
  if (page === 1) permanentRedirect('/posts')
  const posts = await loadPostsPage(page)
  // A page past the last has no posts: not found, unless the CMS did not answer.
  if (!posts.docs.length || page > posts.totalPages) notFoundUnlessCmsDown()
  return <PostsIndex page={page} posts={posts} />
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  return postsMetadata((await pageOf(params)) ?? 1)
}
