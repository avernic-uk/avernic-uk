import { useId, useState } from 'react'

export interface AccordionItemData {
  question: string
  answer: string
}

export function Accordion({ items }: { items: AccordionItemData[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const baseId = useId()

  return (
    <div className="divide-y divide-ink-200/80 rounded-2xl border border-ink-200/80 bg-white shadow-card dark:bg-ink-50">
      {items.map((item, index) => {
        const isOpen = openIndex === index
        const panelId = `${baseId}-panel-${index}`
        const buttonId = `${baseId}-button-${index}`
        return (
          <div key={item.question}>
            <h3>
              <button
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-ink-900 hover:bg-ink-100/60 sm:px-6 sm:py-5"
              >
                {item.question}
                <span
                  aria-hidden="true"
                  className={`shrink-0 text-accent-500 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="px-5 pb-4 text-sm leading-relaxed text-ink-600 sm:px-6 sm:pb-5"
            >
              {item.answer}
            </div>
          </div>
        )
      })}
    </div>
  )
}
