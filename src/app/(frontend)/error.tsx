'use client'

import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'

/**
 * Shown in place of a page that failed on the server or in the browser. The
 * header and footer stay, so the visitor can move on. Nothing technical is
 * shown; the error is in the server logs (its digest links the two).
 */
export default function PageError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container py-28">
      <div className="prose max-w-none">
        <h1 style={{ marginBottom: 0 }}>Something went wrong on our side</h1>
        <p className="mb-4">This page could not be shown just now. Please try again, or go back to the home page.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="default" onClick={() => reset()}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  )
}
