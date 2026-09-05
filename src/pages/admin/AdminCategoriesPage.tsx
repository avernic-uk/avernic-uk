import { useEffect, useState, type FormEvent } from 'react'
import { adminFetchJson } from '@/lib/api/adminFetch'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'

interface CategoryRow {
  id: string
  slug: string
  name: string
  description: string | null
  sort_order: number
  product_count: number
}

interface FormState {
  slug: string
  name: string
  description: string
  sortOrder: string
}

const emptyForm: FormState = { slug: '', name: '', description: '', sortOrder: '0' }

export default function AdminCategoriesPage() {
  useDocumentMeta({ title: 'Categories — Admin', noindex: true })

  const [categories, setCategories] = useState<CategoryRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  function load() {
    adminFetchJson<{ categories: CategoryRow[] }>('/api/admin/categories')
      .then((res) => setCategories(res.categories))
      .catch((err) => setError(err.message))
  }

  useEffect(load, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(category: CategoryRow) {
    setEditingId(category.id)
    setForm({
      slug: category.slug,
      name: category.name,
      description: category.description ?? '',
      sortOrder: String(category.sort_order),
    })
    setFormError(null)
    setModalOpen(true)
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      sortOrder: Number(form.sortOrder) || 0,
    }
    try {
      if (editingId) {
        await adminFetchJson(`/api/admin/categories/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) })
      } else {
        await adminFetchJson('/api/admin/categories', { method: 'POST', body: JSON.stringify(payload) })
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save this category.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminFetchJson(`/api/admin/categories/${deleteTarget.id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this category.')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-950">Categories</h1>
          <p className="mt-1 text-sm text-ink-500">
            Deleting a category moves its products to “Uncategorised” rather than removing them.
          </p>
        </div>
        <Button variant="accent" onClick={openCreate}>
          New category
        </Button>
      </div>

      {error && (
        <div className="mt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3 text-right">Products</th>
              <th className="px-4 py-3 text-right">Sort order</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(categories ?? []).map((category) => (
              <tr key={category.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900">{category.name}</p>
                  {category.description && <p className="text-xs text-ink-400">{category.description}</p>}
                </td>
                <td className="px-4 py-3 text-ink-600">{category.slug}</td>
                <td className="px-4 py-3 text-right">{category.product_count}</td>
                <td className="px-4 py-3 text-right">{category.sort_order}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(category)}>
                      Edit
                    </Button>
                    {category.slug !== 'uncategorised' && (
                      <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(category)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {categories && categories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-500">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit category' : 'New category'}>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => set('name', e.target.value)} />
          <Input label="Slug" required value={form.slug} onChange={(e) => set('slug', e.target.value)} hint="Used in the category URL — lowercase letters, numbers and hyphens only." />
          <Input label="Description (optional)" value={form.description} onChange={(e) => set('description', e.target.value)} />
          <Input
            label="Sort order"
            type="number"
            value={form.sortOrder}
            onChange={(e) => set('sortOrder', e.target.value)}
            hint="Lower numbers appear first."
          />
          {formError && <Alert tone="danger">{formError}</Alert>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" loading={saving}>
              {editingId ? 'Save changes' : 'Create category'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete category">
        <p className="text-sm text-ink-600">
          Delete “{deleteTarget?.name}”?{' '}
          {deleteTarget && deleteTarget.product_count > 0
            ? `Its ${deleteTarget.product_count} product${deleteTarget.product_count === 1 ? '' : 's'} will be moved to “Uncategorised”.`
            : 'It has no products in it.'}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="accent" loading={deleting} onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
