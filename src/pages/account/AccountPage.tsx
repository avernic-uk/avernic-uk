import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { useIsAdmin } from '@/lib/auth/useIsAdmin'

export default function AccountPage() {
  useDocumentMeta({ title: 'Your account', noindex: true })
  const { user, signOut } = useAuth()
  const { isAdmin } = useIsAdmin()

  return (
    <div className="container-page max-w-2xl py-10 sm:py-14">
      <h1 className="text-3xl font-semibold text-ink-950">Your account</h1>
      <p className="mt-2 text-sm text-ink-600">{user?.email}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="text-sm font-semibold text-ink-900">Order history</h2>
            <p className="mt-1.5 text-sm text-ink-600">View your past and current orders.</p>
            <Link to="/account/orders" className="mt-4 inline-block text-sm font-medium text-accent-700 underline">
              View orders
            </Link>
          </CardBody>
        </Card>

        {isAdmin && (
          <Card>
            <CardBody>
              <h2 className="text-sm font-semibold text-ink-900">Admin dashboard</h2>
              <p className="mt-1.5 text-sm text-ink-600">Manage orders and products.</p>
              <Link to="/admin" className="mt-4 inline-block text-sm font-medium text-accent-700 underline">
                Open admin
              </Link>
            </CardBody>
          </Card>
        )}
      </div>

      <div className="mt-8">
        <Button variant="outline" onClick={() => signOut()}>
          Log out
        </Button>
      </div>
    </div>
  )
}
