import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { SiteSettings } from '@/types'
import { formatGBP } from '@/lib/format'

// ============================================================================
// A deliberately small Markdown renderer for admin-editable page content.
//
// WHY NOT A LIBRARY
// This renders text typed into the admin panel. A general Markdown library
// renders raw HTML by default, which would turn that textarea into a way to
// inject markup — and the pages it feeds include the terms and privacy
// policies. This parser has no HTML path at all: every piece of output is a
// React element built here, so there is nothing to sanitise and nothing that
// can escape into the page. It also keeps the bundle free of a dependency for
// what amounts to headings, lists, links and emphasis.
//
// SUPPORTED
//   ## Heading            → h2          ### Heading → h3
//   - item / * item       → unordered list
//   1. item               → ordered list
//   **bold**  *italic*    → strong / em
//   [text](/path)         → internal Link, or external <a> for http(s)
//   {{token}}             → live value from Admin → Settings
//   blank line            → new paragraph
//
// Anything else is rendered as literal text, which is the safe failure mode:
// an unsupported construct looks wrong, rather than doing something unexpected.
// ============================================================================

/** Values a {{token}} can resolve to, and the label shown when one is still blank. */
function tokenTable(settings: SiteSettings): Record<string, { value: string; label: string }> {
  return {
    companyName: { value: settings.companyName, label: 'legal company name' },
    companyNumber: { value: settings.companyNumber, label: 'company registration number' },
    registeredAddress: { value: settings.registeredAddress, label: 'registered business address' },
    contactEmail: { value: settings.contactEmail, label: 'customer service email' },
    contactPhone: { value: settings.contactPhone, label: 'customer service telephone' },
    deliveryStandard: { value: formatGBP(settings.deliveryStandardMinor), label: 'standard delivery price' },
    deliveryExpress: { value: formatGBP(settings.deliveryExpressMinor), label: 'express delivery price' },
    deliveryFreeThreshold: { value: formatGBP(settings.deliveryFreeThresholdMinor), label: 'free delivery threshold' },
  }
}

/**
 * An unfilled token renders as a highlighted placeholder rather than as an
 * empty gap. That is the whole point of it: a missing company number should be
 * impossible to miss on the page, not quietly absent from a sentence that then
 * reads as though it were finished.
 */
function TokenPlaceholder({ label }: { label: string }) {
  return <span className="rounded bg-accent-100 px-1.5 py-0.5 font-medium text-accent-800">[{label}]</span>
}

/** Splits inline markup — tokens, links, bold, italic — into React nodes. */
function renderInline(text: string, settings: SiteSettings, keyPrefix: string): ReactNode[] {
  const tokens = tokenTable(settings)
  const nodes: ReactNode[] = []
  // One pass, one regex: whichever construct matches first at the current
  // position wins, which avoids the classic bug of bold-inside-link (or the
  // reverse) being mangled by running separate passes over the same string.
  const pattern = /\{\{(\w+)\}\}|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g
  let last = 0
  let match: RegExpExecArray | null
  let i = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const key = `${keyPrefix}-${i++}`

    if (match[1] !== undefined) {
      const token = tokens[match[1]]
      if (!token) nodes.push(match[0])
      else if (token.value) nodes.push(<Fragment key={key}>{token.value}</Fragment>)
      else nodes.push(<TokenPlaceholder key={key} label={token.label} />)
    } else if (match[2] !== undefined && match[3] !== undefined) {
      const [, , label, href] = match
      const external = /^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')
      nodes.push(
        external ? (
          <a key={key} href={href} className="underline underline-offset-2 hover:text-accent-600" rel="noopener noreferrer">
            {label}
          </a>
        ) : (
          <Link key={key} to={href} className="underline underline-offset-2 hover:text-accent-600">
            {label}
          </Link>
        ),
      )
    } else if (match[4] !== undefined) {
      nodes.push(
        <strong key={key} className="font-semibold text-ink-900">
          {match[4]}
        </strong>,
      )
    } else if (match[5] !== undefined) {
      nodes.push(<em key={key}>{match[5]}</em>)
    }

    last = pattern.lastIndex
  }

  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

/** Renders a stored content block as React elements. */
export function Markdown({ body, settings }: { body: string; settings: SiteSettings }) {
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []

  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let key = 0

  function flushParagraph() {
    if (paragraph.length === 0) return
    const text = paragraph.join(' ').trim()
    paragraph = []
    if (text) blocks.push(<p key={`p-${key++}`}>{renderInline(text, settings, `p${key}`)}</p>)
  }

  function flushList() {
    if (!list || list.items.length === 0) {
      list = null
      return
    }
    const { ordered, items } = list
    list = null
    const rendered = items.map((item, index) => (
      <li key={index} className="pl-1">
        {renderInline(item, settings, `li${key}-${index}`)}
      </li>
    ))
    blocks.push(
      ordered ? (
        <ol key={`ol-${key++}`} className="list-decimal space-y-1.5 pl-5">
          {rendered}
        </ol>
      ) : (
        <ul key={`ul-${key++}`} className="list-disc space-y-1.5 pl-5">
          {rendered}
        </ul>
      ),
    )
  }

  for (const raw of lines) {
    const line = raw.trim()

    if (!line) {
      flushParagraph()
      flushList()
      continue
    }

    const heading = line.match(/^(#{2,3})\s+(.*)$/)
    if (heading) {
      flushParagraph()
      flushList()
      const text = renderInline(heading[2], settings, `h${key}`)
      blocks.push(
        heading[1].length === 2 ? (
          <h2 key={`h-${key++}`} className="text-lg font-semibold text-ink-900">
            {text}
          </h2>
        ) : (
          <h3 key={`h-${key++}`} className="text-base font-semibold text-ink-900">
            {text}
          </h3>
        ),
      )
      continue
    }

    const unordered = line.match(/^[-*]\s+(.*)$/)
    const ordered = line.match(/^\d+\.\s+(.*)$/)
    if (unordered || ordered) {
      flushParagraph()
      const isOrdered = Boolean(ordered)
      if (!list || list.ordered !== isOrdered) {
        flushList()
        list = { ordered: isOrdered, items: [] }
      }
      list.items.push((unordered ? unordered[1] : ordered![1]).trim())
      continue
    }

    flushList()
    paragraph.push(line)
  }

  flushParagraph()
  flushList()

  return <>{blocks}</>
}
