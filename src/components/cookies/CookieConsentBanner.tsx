import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCookieConsent } from '@/lib/cookies/CookieConsentProvider'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-accent-500 ${
        checked ? 'bg-accent-500' : 'bg-ink-300'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

/**
 * PECR/UK GDPR cookie banner: appears until the visitor makes an explicit
 * choice, offers "Reject non-essential" exactly as prominently as "Accept
 * all" (no pre-ticked boxes, no bias toward accepting), and the same choice
 * can always be revisited later via Footer → "Cookie preferences" or the
 * Cookie policy page.
 *
 * The copy below describes what the site actually does, which is the whole
 * point of it. Analytics here is first-party and cookieless — it stores nothing
 * on the device, so unlike a normal analytics category it does not need consent
 * and is on by default. Saying so plainly, and giving a switch that genuinely
 * stops it, is the honest position; quietly measuring people because no law
 * requires a prompt is not.
 */
export function CookieConsentBanner() {
  const { showBanner, showPreferences, categories, acceptAll, rejectNonEssential, savePreferences, openPreferences, closePreferences } =
    useCookieConsent()
  const [analyticsDraft, setAnalyticsDraft] = useState(categories.analytics)

  // Re-sync the draft toggle to the last saved choice whenever the panel is
  // (re)opened — covers both the banner's own "Manage preferences" button
  // and the Footer's "Cookie preferences" link opening it directly.
  useEffect(() => {
    if (showPreferences) setAnalyticsDraft(categories.analytics)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPreferences])

  if (!showBanner && !showPreferences) return null

  return (
    <>
      {showBanner && !showPreferences && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200/70 bg-white/95 p-4 shadow-popover backdrop-blur dark:bg-ink-50/95 sm:p-5"
        >
          <div className="container-page flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-relaxed text-ink-700">
              We use strictly necessary cookies and local storage to run your basket, checkout and account sign-in.
              We also measure how the site is used — without cookies, and without collecting anything that
              identifies you — and you can switch that off. We don't use advertising or tracking cookies at all.
              See our{' '}
              <Link to="/cookies" className="underline">
                Cookie policy
              </Link>{' '}
              for details.
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={rejectNonEssential}>
                Reject non-essential
              </Button>
              <Button size="sm" variant="outline" onClick={openPreferences}>
                Manage preferences
              </Button>
              <Button size="sm" variant="accent" onClick={acceptAll}>
                Accept all
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal open={showPreferences} onClose={closePreferences} title="Cookie preferences">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4 rounded-xl border border-ink-200 p-4">
            <div>
              <p className="text-sm font-semibold text-ink-900">Strictly necessary</p>
              <p className="mt-1 text-xs text-ink-500">
                Required for the basket, checkout, delivery method and sign-in to work. Cannot be switched off.
              </p>
            </div>
            <Switch checked disabled label="Strictly necessary cookies (always on)" />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-xl border border-ink-200 p-4">
            <div>
              <p className="text-sm font-semibold text-ink-900">Analytics</p>
              <p className="mt-1 text-xs text-ink-500">
                Counts visits and which pages and searches are popular, so we can improve the site. No cookies, no
                tracking across other websites, and nothing that identifies you personally. Switch it off and we
                won't count your visits at all.
              </p>
            </div>
            <Switch checked={analyticsDraft} onChange={setAnalyticsDraft} label="Usage measurement" />
          </div>

          <p className="text-xs text-ink-500">
            You can change these choices at any time from the link in the site footer, or on our{' '}
            <Link to="/cookies" className="underline" onClick={closePreferences}>
              Cookie policy
            </Link>{' '}
            page.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={rejectNonEssential}>
              Reject non-essential
            </Button>
            <Button size="sm" variant="outline" onClick={() => savePreferences({ analytics: analyticsDraft })}>
              Save preferences
            </Button>
            <Button size="sm" variant="accent" onClick={acceptAll}>
              Accept all
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
