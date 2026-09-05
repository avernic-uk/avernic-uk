import { Link } from 'react-router-dom'
import { useSiteSettings } from '@/lib/settings/SiteSettingsProvider'

export function Logo({ className = '' }: { className?: string }) {
  const { settings } = useSiteSettings()
  return (
    <Link
      to="/"
      className={`flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-accent-500 ${className}`}
    >
      <img
        src={settings.logoUrl || '/logo-icon.png'}
        alt=""
        className="h-8 w-auto drop-shadow-[0_0_10px_rgb(var(--accent-500)/0.35)]"
      />
      <span className="font-display text-lg font-semibold tracking-tight text-ink-950">
        Avernic <span className="text-accent-600">UK</span>
      </span>
    </Link>
  )
}
