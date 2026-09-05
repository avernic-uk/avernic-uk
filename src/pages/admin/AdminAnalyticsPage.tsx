import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { adminFetchJson } from '@/lib/api/adminFetch'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Card, CardBody } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'

// ============================================================================
// Admin → Analytics.
//
// Charts are hand-drawn SVG rather than a charting library: these are two
// simple forms, and a dependency would add weight to every admin page load for
// no expressive gain.
//
// Colour is deliberately single-hue. The design system has exactly one accent
// (brass) and a neutral ink scale, so every mark is drawn in
// `rgb(var(--accent-500))` — which the theme remaps per mode, giving 3.2:1
// against the light surface and 6.1:1 against the dark one without any
// `dark:` variants. There is no second categorical hue anywhere here: nothing
// on this page encodes identity by colour, so nothing needs one. Series are
// separated by position and label instead, and every chart is backed by the
// numbers in text so colour is never the only carrier of meaning.
// ============================================================================

interface Bucket {
  value: string
  views: number
  visitors: number
}

interface Analytics {
  rangeDays: number
  totals: { views: number; visitors: number; searches: number; zeroResultSearches: number }
  daily: { day: string; views: number; visitors: number }[]
  channels: Bucket[]
  referrers: Bucket[]
  searchTerms: { term: string; count: number; results: number | null }[]
  pages: Bucket[]
  devices: Bucket[]
  countries: Bucket[]
}

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
]

const CHANNEL_LABELS: Record<string, string> = {
  direct: 'Direct / typed in',
  organic_search: 'Search engines',
  ai_assistant: 'AI assistants',
  social: 'Social media',
  referral: 'Other websites',
  email: 'Email',
}

const DEVICE_LABELS: Record<string, string> = { mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop' }

const REGION_NAMES =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en-GB'], { type: 'region' })
    : null

function countryName(code: string): string {
  try {
    return REGION_NAMES?.of(code) ?? code
  } catch {
    return code
  }
}

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

/**
 * Visitors per day.
 *
 * One series, so no legend: the heading names it. Views are carried in the
 * hover tooltip rather than as a second line — for a shop this size the shape
 * of "how many people came" is the signal, and a second near-parallel line
 * mostly adds ink. Bars rather than a line because daily counts are discrete
 * totals, not a continuous quantity sampled over time.
 */
function VisitorsChart({ daily }: { daily: Analytics['daily'] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...daily.map((d) => d.visitors))
  // Round the axis up to something a person would actually choose.
  const step = Math.max(1, Math.ceil(max / 4 / 5) * 5)
  const top = Math.max(step, Math.ceil(max / step) * step)

  const H = 180
  const PAD_L = 34
  const PAD_B = 22
  const barGap = 2
  const W = 720
  const plotW = W - PAD_L
  const slot = plotW / Math.max(1, daily.length)
  const barW = Math.max(2, slot - barGap)

  const ticks = [0, top / 2, top]

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Visitors per day for the last ${daily.length} days`}
        preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => {
          const y = H - PAD_B - ((H - PAD_B) * t) / top
          return (
            <g key={t}>
              <line x1={PAD_L} x2={W} y1={y} y2={y} stroke="rgb(var(--ink-200))" strokeWidth={1} />
              <text x={0} y={y + 3} fontSize={9} fill="rgb(var(--ink-500))">
                {Math.round(t)}
              </text>
            </g>
          )
        })}

        {daily.map((d, i) => {
          const h = ((H - PAD_B) * d.visitors) / top
          const x = PAD_L + i * slot
          const y = H - PAD_B - h
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)}>
              {/* Full-height hit target: a 3px bar is far too small to aim at. */}
              <rect x={x} y={0} width={slot} height={H - PAD_B} fill="transparent" />
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(d.visitors > 0 ? 2 : 0, h)}
                rx={2}
                fill="rgb(var(--accent-500))"
                opacity={hover === null || hover === i ? 1 : 0.45}
              />
            </g>
          )
        })}

        {daily.map((d, i) =>
          // Only label the ends and middle — a date under every bar is unreadable.
          i === 0 || i === daily.length - 1 || i === Math.floor(daily.length / 2) ? (
            <text
              key={`l-${d.day}`}
              x={PAD_L + i * slot + barW / 2}
              y={H - 6}
              fontSize={9}
              fill="rgb(var(--ink-500))"
              textAnchor={i === 0 ? 'start' : i === daily.length - 1 ? 'end' : 'middle'}
            >
              {formatDay(d.day)}
            </text>
          ) : null,
        )}
      </svg>

      {hover !== null && daily[hover] && (
        <div className="pointer-events-none absolute left-0 top-0 rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs shadow-popover dark:bg-ink-50">
          <p className="font-medium text-ink-900">{formatDay(daily[hover].day)}</p>
          <p className="mt-0.5 text-ink-600">
            {daily[hover].visitors.toLocaleString('en-GB')} visitors · {daily[hover].views.toLocaleString('en-GB')} views
          </p>
        </div>
      )}
    </div>
  )
}

/** Ranked horizontal bars. One measure across named categories, so one hue and no legend. */
function RankedBars({ rows, labels }: { rows: Bucket[]; labels?: Record<string, string> }) {
  const max = Math.max(1, ...rows.map((r) => r.visitors))
  if (rows.length === 0) return <p className="text-sm text-ink-500">Nothing recorded yet.</p>
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.value}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink-800">{labels?.[row.value] ?? row.value}</span>
            <span className="shrink-0 font-medium tabular-nums text-ink-900">
              {row.visitors.toLocaleString('en-GB')}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(2, (row.visitors / max) * 100)}%`, backgroundColor: 'rgb(var(--accent-500))' }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Card>
      <CardBody>
        <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
        {hint && <p className="mt-1 text-xs leading-relaxed text-ink-500">{hint}</p>}
        <div className="mt-4">{children}</div>
      </CardBody>
    </Card>
  )
}

export default function AdminAnalyticsPage() {
  useDocumentMeta({ title: 'Analytics — Admin', noindex: true })
  const [days, setDays] = useState(30)
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    adminFetchJson<{ analytics: Analytics }>(`/api/admin/analytics?days=${days}`)
      .then(({ analytics }) => {
        if (!cancelled) setData(analytics)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load analytics.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [days])

  const zeroResults = useMemo(
    () => (data?.searchTerms ?? []).filter((s) => s.results === 0),
    [data],
  )

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-950">Analytics</h1>
          <p className="mt-1 text-sm text-ink-600">
            First-party and cookieless — no third party sees this, and it counts every visitor rather than only those
            who accept a banner.
          </p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.days}
              size="sm"
              variant={days === r.days ? 'accent' : 'outline'}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Alert tone="danger" title="We couldn't load analytics">
            {error}
          </Alert>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Visitors', value: data?.totals.visitors },
          { label: 'Page views', value: data?.totals.views },
          { label: 'Searches', value: data?.totals.searches },
          { label: 'Searches with no results', value: data?.totals.zeroResultSearches },
        ].map((tile) => (
          <Card key={tile.label}>
            <CardBody>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{tile.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-ink-950">
                {loading ? '—' : (tile.value ?? 0).toLocaleString('en-GB')}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      {!loading && data && data.totals.views === 0 && (
        <div className="mt-6">
          <Alert tone="info" title="No visits recorded yet">
            Analytics starts collecting from the moment it goes live, so this fills in as people visit. If it stays
            empty for more than a day after deploying, check that the deployment succeeded.
          </Alert>
        </div>
      )}

      <div className="mt-6">
        <Panel title="Visitors per day" hint="Hover any day for its exact visitor and page-view counts.">
          {data && data.daily.length > 0 ? (
            <VisitorsChart daily={data.daily} />
          ) : (
            <p className="text-sm text-ink-500">Nothing recorded yet.</p>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Where visitors come from"
          hint="AI assistants are counted separately from search engines, so you can see whether /llms.txt is earning citations."
        >
          <RankedBars rows={data?.channels ?? []} labels={CHANNEL_LABELS} />
        </Panel>

        <Panel title="Referring sites" hint="The specific sites sending people here.">
          <RankedBars rows={data?.referrers ?? []} />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="What people searched for"
          hint="Typed into the shop's own search box. The most actionable list on this page."
        >
          {data && data.searchTerms.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-500">
                    <th className="pb-2 pr-3 font-medium">Search term</th>
                    <th className="pb-2 pr-3 text-right font-medium">Times</th>
                    <th className="pb-2 text-right font-medium">Results</th>
                  </tr>
                </thead>
                <tbody>
                  {data.searchTerms.map((s) => (
                    <tr key={s.term} className="border-b border-ink-100 last:border-0">
                      <td className="py-2 pr-3 text-ink-800">{s.term}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-ink-900">{s.count}</td>
                      <td className="py-2 text-right tabular-nums">
                        {s.results === 0 ? (
                          <span className="font-medium text-danger-600">none</span>
                        ) : (
                          <span className="text-ink-600">{s.results ?? '—'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-ink-500">No searches recorded yet.</p>
          )}
        </Panel>

        <Panel
          title="Searched for, found nothing"
          hint="Each of these is a customer who came looking for something and left empty-handed — either a product worth stocking, or one you sell under a name they didn't think of."
        >
          {zeroResults.length > 0 ? (
            <ul className="space-y-2">
              {zeroResults.map((s) => (
                <li key={s.term} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-ink-800">{s.term}</span>
                  <span className="shrink-0 tabular-nums text-ink-500">
                    {s.count} {s.count === 1 ? 'search' : 'searches'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">
              Every search so far returned at least one product. Worth checking back as traffic grows.
            </p>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Most viewed pages">
          <RankedBars rows={data?.pages ?? []} />
        </Panel>
        <Panel title="Devices">
          <RankedBars rows={data?.devices ?? []} labels={DEVICE_LABELS} />
        </Panel>
        <Panel title="Countries">
          <RankedBars
            rows={(data?.countries ?? []).map((c) => ({ ...c, value: countryName(c.value) }))}
          />
        </Panel>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-ink-500">
        Counts exclude known bots and crawlers, and admin, account and checkout pages are never recorded. Visitors are
        counted using a scrambled code that changes daily, so the same person on two different days counts twice —
        that's the trade-off that keeps this data anonymous. Detailed records are deleted after 90 days.
      </p>
    </div>
  )
}
