import { ButtonLink } from '@/components/ui/Button'
import { useDocumentMeta } from '@/lib/useDocumentMeta'

export default function NotFoundPage() {
  useDocumentMeta({ title: 'Page not found', noindex: true })
  return (
    <div className="container-page py-24 text-center">
      <p className="text-sm font-medium text-accent-600">404</p>
      <h1 className="mt-2 text-3xl font-semibold text-ink-950">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-ink-600">
        Sorry, we couldn't find the page you were looking for. It may have been moved or no longer exists.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <ButtonLink to="/" variant="primary">
          Back to homepage
        </ButtonLink>
        <ButtonLink to="/shop" variant="outline">
          Shop
        </ButtonLink>
      </div>
    </div>
  )
}
