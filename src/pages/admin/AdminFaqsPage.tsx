import { useEffect, useState, type FormEvent } from 'react'
import { adminFetchJson } from '@/lib/api/adminFetch'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { useSiteSettings } from '@/lib/settings/SiteSettingsProvider'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'

interface FaqRow {
  id: string
  question: string
  answer: string
  sort_order: number
  is_active: boolean
}

export default function AdminFaqsPage() {
  useDocumentMeta({ title: 'FAQs — Admin', noindex: true })
  const { refresh } = useSiteSettings()

  const [faqs, setFaqs] = useState<FaqRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')
  const [adding, setAdding] = useState(false)

  function load() {
    adminFetchJson<{ faqs: FaqRow[] }>('/api/admin/faqs')
      .then((res) => setFaqs(res.faqs))
      .catch((err) => setError(err.message))
  }

  useEffect(load, [])

  async function addFaq(e: FormEvent) {
    e.preventDefault()
    if (!newQuestion.trim() || !newAnswer.trim()) return
    setAdding(true)
    setError(null)
    try {
      await adminFetchJson('/api/admin/faqs', {
        method: 'POST',
        body: JSON.stringify({ question: newQuestion.trim(), answer: newAnswer.trim() }),
      })
      setNewQuestion('')
      setNewAnswer('')
      load()
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this FAQ.')
    } finally {
      setAdding(false)
    }
  }

  async function updateFaq(id: string, patch: Partial<{ question: string; answer: string; isActive: boolean; sortOrder: number }>) {
    try {
      await adminFetchJson(`/api/admin/faqs/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
      load()
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this FAQ.')
    }
  }

  async function deleteFaq(id: string) {
    try {
      await adminFetchJson(`/api/admin/faqs/${id}`, { method: 'DELETE' })
      load()
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this FAQ.')
    }
  }

  function move(index: number, direction: -1 | 1) {
    if (!faqs) return
    const target = index + direction
    if (target < 0 || target >= faqs.length) return
    const a = faqs[index]
    const b = faqs[target]
    // Swap sort_order between the two neighbours.
    updateFaq(a.id, { sortOrder: b.sort_order })
    updateFaq(b.id, { sortOrder: a.sort_order })
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-ink-950">FAQs</h1>
      <p className="mt-1 text-sm text-ink-500">
        Shown on the homepage and as “General questions” on the FAQ page. Inactive entries are hidden from the site.
      </p>

      {error && (
        <div className="mt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {(faqs ?? []).map((faq, index) => (
          <div key={faq.id} className="rounded-2xl border border-ink-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <Input
                  label="Question"
                  value={faq.question}
                  onChange={(e) => setFaqs((prev) => prev!.map((f) => (f.id === faq.id ? { ...f, question: e.target.value } : f)))}
                  onBlur={(e) => updateFaq(faq.id, { question: e.target.value })}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-800">Answer</label>
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => setFaqs((prev) => prev!.map((f) => (f.id === faq.id ? { ...f, answer: e.target.value } : f)))}
                    onBlur={(e) => updateFaq(faq.id, { answer: e.target.value })}
                    className="w-full rounded-lg border border-ink-300 p-3 text-sm focus-visible:outline-2 focus-visible:outline-accent-500"
                  />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Badge tone={faq.is_active ? 'success' : 'neutral'}>{faq.is_active ? 'Visible' : 'Hidden'}</Badge>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => move(index, -1)} disabled={index === 0}>
                    ↑
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => move(index, 1)} disabled={index === (faqs?.length ?? 1) - 1}>
                    ↓
                  </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={() => updateFaq(faq.id, { isActive: !faq.is_active })}>
                  {faq.is_active ? 'Hide' : 'Show'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteFaq(faq.id)}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
        {faqs && faqs.length === 0 && <p className="text-sm text-ink-500">No FAQ entries yet.</p>}
      </div>

      <form onSubmit={addFaq} className="mt-8 space-y-3 rounded-2xl border border-dashed border-ink-300 p-4">
        <h2 className="text-sm font-semibold text-ink-800">Add a question</h2>
        <Input label="Question" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-800">Answer</label>
          <textarea
            rows={2}
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            className="w-full rounded-lg border border-ink-300 p-3 text-sm focus-visible:outline-2 focus-visible:outline-accent-500"
          />
        </div>
        <Button type="submit" variant="accent" loading={adding}>
          Add FAQ
        </Button>
      </form>
    </div>
  )
}
