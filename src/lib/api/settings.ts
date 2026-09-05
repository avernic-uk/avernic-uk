import { supabase } from '@/lib/supabaseClient'
import type { SiteSettings, Faq } from '@/types'

interface SettingsRow {
  company_name: string
  company_number: string
  registered_address: string
  contact_email: string
  contact_phone: string
  delivery_standard_minor: number
  delivery_free_threshold_minor: number
  hero_heading: string
  hero_subheading: string
  age_notice_text: string
}

function mapSettings(row: SettingsRow): SiteSettings {
  return {
    companyName: row.company_name,
    companyNumber: row.company_number,
    registeredAddress: row.registered_address,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    deliveryStandardMinor: row.delivery_standard_minor,
    deliveryFreeThresholdMinor: row.delivery_free_threshold_minor,
    heroHeading: row.hero_heading,
    heroSubheading: row.hero_subheading,
    ageNoticeText: row.age_notice_text,
  }
}

/** Public read of the single site_settings row — allowed for anyone via RLS (see migration 0003). */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return mapSettings(data as SettingsRow)
}

interface FaqRow {
  id: string
  question: string
  answer: string
  sort_order: number
  is_active: boolean
}

/** Public read of active FAQ entries, in display order. */
export async function getFaqs(): Promise<Faq[]> {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return ((data ?? []) as FaqRow[]).map((row) => ({
    id: row.id,
    question: row.question,
    answer: row.answer,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }))
}
