const badges = [
  {
    label: 'Encrypted checkout',
    icon: (
      <path
        d="M6 10V7a6 6 0 1 1 12 0v3M5 10h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: 'Open Banking via Fena',
    icon: (
      <path
        d="M3 10h18M5 10v9m4-9v9m4-9v9m4-9v9M4 19h16M12 3l9 4.5H3L12 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: 'Card details never stored',
    icon: (
      <path
        d="M3 6h18v12H3V6Zm0 4h18M6.5 14.5h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
]

/** Small reassurance strip shown near payment actions in the basket/checkout flow. */
export function SecureCheckoutBadges() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2">
      {badges.map((badge) => (
        <li key={badge.label} className="flex items-center gap-1.5 text-xs text-ink-500">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-accent-500">
            {badge.icon}
          </svg>
          {badge.label}
        </li>
      ))}
    </ul>
  )
}
