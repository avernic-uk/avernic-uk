import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useSiteSettings } from '@/lib/settings/SiteSettingsProvider'
import { Markdown } from './markdown'

// ============================================================================
// Admin-editable page copy (Admin → Content, table `content_blocks`).
//
// Every block is fetched once per page load and held in context, rather than
// each page fetching its own: the whole table is a few dozen short rows, and
// one request means navigating between Terms, Privacy and Returns doesn't
// produce a visible flash of empty page each time.
//
// A block that hasn't loaded yet, or isn't in the database at all, renders
// nothing rather than an error. That matters because these are legal and
// policy pages: a transient failure should leave a section missing and
// obviously so, never a stack trace in front of a customer.
// ============================================================================

interface ContentBlocksValue {
  blocks: Record<string, string>
  loaded: boolean
}

const ContentBlocksContext = createContext<ContentBlocksValue>({ blocks: {}, loaded: false })

export function ContentBlocksProvider({ children }: { children: ReactNode }) {
  const [blocks, setBlocks] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('content_blocks')
      .select('key, body')
      .then(({ data }) => {
        if (cancelled) return
        const next: Record<string, string> = {}
        for (const row of (data ?? []) as { key: string; body: string }[]) next[row.key] = row.body
        setBlocks(next)
        setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(() => ({ blocks, loaded }), [blocks, loaded])
  return <ContentBlocksContext.Provider value={value}>{children}</ContentBlocksContext.Provider>
}

export function useContentBlock(key: string): string {
  return useContext(ContentBlocksContext).blocks[key] ?? ''
}

/**
 * Renders one stored block as formatted content.
 *
 * `fallback` is for the rare block whose absence would leave a page looking
 * broken — most callers should omit it and let an empty block render nothing.
 */
export function ContentBlock({ blockKey, fallback = '' }: { blockKey: string; fallback?: string }) {
  const { settings } = useSiteSettings()
  const body = useContentBlock(blockKey) || fallback
  if (!body.trim()) return null
  return <Markdown body={body} settings={settings} />
}

/** The "Last updated: …" line under a page title, when one has been set. */
export function useLastUpdated(blockKey: string): string | undefined {
  const value = useContentBlock(blockKey).trim()
  return value || undefined
}
