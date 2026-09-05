import { useId, useRef, useState } from 'react'
import { adminUpload } from '@/lib/api/adminFetch'
import { Button } from '@/components/ui/Button'

// ============================================================================
// An image field that accepts either an upload or a pasted URL.
//
// Both paths matter. Upload is what someone actually wants day to day — pick
// the file, done, no third-party image host and no URL to keep track of. The
// URL box stays because images already hosted elsewhere shouldn't have to be
// re-uploaded to be used, and because if the upload endpoint is ever
// unavailable the field still works.
//
// The preview is the point of the component. Pasting a URL into a bare text
// box tells you nothing until you save and reload the storefront; showing the
// image inline turns a typo into something you notice immediately.
// ============================================================================

export function ImageField({
  label,
  value,
  onChange,
  hint,
  previewClassName = 'h-24 w-24 object-cover',
}: {
  label: string
  value: string
  onChange: (url: string) => void
  hint?: string
  /** Tailwind sizing for the preview — square for a logo, wider for a hero. */
  previewClassName?: string
}) {
  const id = useId()
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [failedToLoad, setFailedToLoad] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const { url } = await adminUpload<{ url: string }>('/api/admin/uploads', file)
      setFailedToLoad(false)
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The upload failed.')
    } finally {
      setUploading(false)
      // Reset so choosing the same file twice still fires a change event.
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-800">
        {label}
      </label>

      <div className="flex flex-wrap items-start gap-3">
        {value && !failedToLoad && (
          <img
            src={value}
            alt=""
            onError={() => setFailedToLoad(true)}
            onLoad={() => setFailedToLoad(false)}
            className={`shrink-0 rounded-xl border border-ink-200 bg-ink-50 ${previewClassName}`}
          />
        )}

        <div className="min-w-[16rem] flex-1">
          <input
            id={id}
            type="url"
            inputMode="url"
            placeholder="https://… or use Upload"
            value={value}
            onChange={(e) => {
              setFailedToLoad(false)
              onChange(e.target.value)
            }}
            className="h-11 w-full rounded-xl border border-ink-300 bg-white px-3.5 text-sm text-ink-900 shadow-card focus-visible:outline-2 focus-visible:outline-accent-500 dark:bg-ink-50"
          />

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml"
              className="sr-only"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
            <Button type="button" size="sm" variant="outline" loading={uploading} onClick={() => fileInput.current?.click()}>
              {uploading ? 'Uploading…' : 'Upload image'}
            </Button>
            {value && (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange('')}>
                Remove
              </Button>
            )}
          </div>

          {hint && <p className="mt-2 text-xs leading-relaxed text-ink-500">{hint}</p>}

          {value && failedToLoad && (
            <p className="mt-2 text-xs text-danger-600">
              That URL doesn&rsquo;t load as an image. Check it, or upload the file instead.
            </p>
          )}
          {error && <p className="mt-2 text-xs text-danger-600">{error}</p>}
        </div>
      </div>
    </div>
  )
}
