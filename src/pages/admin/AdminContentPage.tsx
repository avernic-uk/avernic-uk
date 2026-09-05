import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminFetchJson } from '@/lib/api/adminFetch'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'

// ============================================================================
// Admin → Content: every piece of page copy on the site, editable in one place.
//
// Blocks are grouped by the page that renders them, and only changed blocks are
// sent on save — so two people editing different pages can't overwrite each
// other, and a stray keystroke in one textarea doesn't rewrite the whole site.
// ============================================================================

interface Block {
  key: string
  page: string
  page_path: string
  label: string
  hint: string
  body: string
  sort_order: number
}

/** Copy still carrying a launch marker, so it can be surfaced rather than quietly shipped. */
const TODO_MARKER = /TO BE COMPLETED/i

const TOKENS = [
  ['{{companyName}}', 'Legal company name'],
  ['{{companyNumber}}', 'Company registration number'],
  ['{{registeredAddress}}', 'Registered address'],
  ['{{contactEmail}}', 'Contact email'],
  ['{{contactPhone}}', 'Contact phone'],
  ['{{deliveryStandard}}', '48hr Tracked price'],
  ['{{deliveryExpress}}', '24hr Tracked & Signed price'],
  ['{{deliveryFreeThreshold}}', 'Free delivery threshold'],
]

export default function AdminContentPage() {
  useDocumentMeta({ title: 'Content — Admin', noindex: true })
  const [blocks, setBlocks] = useState<Block[] | null>(null)
  const [edited, setEdited] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminFetchJson<{ blocks: Block[] }>('/api/admin/content')
      .then(({ blocks: rows }) => setBlocks(rows))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load content.'))
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, Block[]>()
    for (const block of blocks ?? []) {
      const existing = map.get(block.page)
      if (existing) existing.push(block)
      else map.set(block.page, [block])
    }
    return [...map.entries()]
  }, [blocks])

  const outstanding = useMemo(
    () => (blocks ?? []).filter((b) => TODO_MARKER.test(edited[b.key] ?? b.body)),
    [blocks, edited],
  )

  const dirtyCount = Object.keys(edited).length

  function value(block: Block): string {
    return edited[block.key] ?? block.body
  }

  function change(block: Block, next: string) {
    setSaved(false)
    setEdited((prev) => {
      // Typing a value back to what it already was un-marks it as changed,
      // so "unsaved changes" always reflects reality.
      if (next === block.body) {
        const { [block.key]: _discard, ...rest } = prev
        return rest
      }
      return { ...prev, [block.key]: next }
    })
  }

  async function save() {
    if (dirtyCount === 0) return
    setSaving(true)
    setError(null)
    try {
      await adminFetchJson('/api/admin/content', { method: 'PATCH', body: JSON.stringify({ blocks: edited }) })
      setBlocks((prev) => (prev ?? []).map((b) => (b.key in edited ? { ...b, body: edited[b.key] } : b)))
      setEdited({})
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  if (!blocks && !error) return <p className="text-sm text-ink-500">Loading…</p>

  return (
    <div className="max-w-3xl pb-24">
      <h1 className="text-2xl font-semibold text-ink-950">Content</h1>
      <p className="mt-1 text-sm text-ink-600">
        The wording on every information page. Changes go live as soon as you save — no deploy needed.
      </p>

      {error && (
        <div className="mt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      {outstanding.length > 0 && (
        <div className="mt-5">
          <Alert tone="warning" title={`${outstanding.length} section${outstanding.length === 1 ? '' : 's'} still needs your wording`}>
            These are marked <strong>TO BE COMPLETED</strong> and are visible to customers right now:{' '}
            {outstanding.map((b, i) => (
              <span key={b.key}>
                {i > 0 && ', '}
                {b.page} → {b.label}
              </span>
            ))}
            .
          </Alert>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-ink-200 bg-ink-50/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Formatting</p>
        <p className="mt-2 text-xs leading-relaxed text-ink-600">
          <code>## Heading</code> makes a heading, <code>- item</code> makes a bullet list,{' '}
          <code>**bold**</code> makes text bold, and <code>[link text](/delivery)</code> makes a link. Leave a blank
          line between paragraphs.
        </p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-500">Auto-filling details</p>
        <p className="mt-2 text-xs leading-relaxed text-ink-600">
          These fill in automatically from{' '}
          <Link to="/admin/settings" className="underline">
            Settings
          </Link>
          , so you only type them once. Any that are still blank show up highlighted on the page.
        </p>
        <ul className="mt-2 grid gap-1 text-xs text-ink-600 sm:grid-cols-2">
          {TOKENS.map(([token, meaning]) => (
            <li key={token}>
              <code className="text-ink-800">{token}</code> — {meaning}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 space-y-10">
        {grouped.map(([page, pageBlocks]) => (
          <section key={page}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{page}</h2>
              {pageBlocks[0]?.page_path && (
                <a
                  href={pageBlocks[0].page_path}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-ink-500 underline underline-offset-2 hover:text-accent-600"
                >
                  View page ↗
                </a>
              )}
            </div>

            <div className="mt-4 space-y-5">
              {pageBlocks.map((block) => {
                const isDirty = block.key in edited
                const needsWork = TODO_MARKER.test(value(block))
                return (
                  <div key={block.key} className="rounded-2xl border border-ink-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label htmlFor={block.key} className="text-sm font-medium text-ink-900">
                        {block.label}
                      </label>
                      <div className="flex gap-2">
                        {needsWork && <Badge tone="warning">Needs your wording</Badge>}
                        {isDirty && <Badge tone="neutral">Unsaved</Badge>}
                      </div>
                    </div>
                    {block.hint && <p className="mt-1 text-xs leading-relaxed text-ink-500">{block.hint}</p>}
                    <textarea
                      id={block.key}
                      value={value(block)}
                      onChange={(e) => change(block, e.target.value)}
                      rows={Math.min(26, Math.max(4, value(block).split('\n').length + 2))}
                      className="mt-3 w-full rounded-lg border border-ink-300 bg-white p-3 font-mono text-xs leading-relaxed text-ink-900 focus-visible:outline-2 focus-visible:outline-accent-500 dark:bg-ink-50"
                    />
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Sticky save bar: these pages are long, and a save button at the very
          bottom is a save button nobody finds. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 backdrop-blur dark:bg-ink-50/95">
        <div className="container-page flex items-center justify-between gap-4 py-3">
          <p className="text-sm text-ink-600">
            {dirtyCount > 0
              ? `${dirtyCount} unsaved change${dirtyCount === 1 ? '' : 's'}`
              : saved
                ? 'All changes saved.'
                : 'No unsaved changes.'}
          </p>
          <Button variant="accent" loading={saving} disabled={dirtyCount === 0} onClick={save}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  )
}
