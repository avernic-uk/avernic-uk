import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Admin-editable site settings (functions/api/admin/settings.ts), read here
 * server-side wherever a hardcoded value used to live — currently just
 * delivery pricing (see pricing.ts). Falls back to the same defaults the
 * site shipped with if the settings row is ever missing, so a database
 * hiccup degrades to "old hardcoded behaviour" rather than breaking pricing.
 */
export interface SiteSettings {
  companyName: string
  companyNumber: string
  registeredAddress: string
  contactEmail: string
  contactPhone: string
  deliveryStandardMinor: number
  deliveryFreeThresholdMinor: number
  heroHeading: string
  heroSubheading: string
  ageNoticeText: string
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  companyName: '',
  companyNumber: '',
  registeredAddress: '',
  contactEmail: '',
  contactPhone: '',
  deliveryStandardMinor: 295,
  deliveryFreeThresholdMinor: 4000,
  heroHeading: 'Peptide skincare, made simpler.',
  heroSubheading:
    'Cosmetic peptide serums, moisturisers and treatments, chosen with care and delivered across the United Kingdom — with a straightforward checkout and secure Open Banking payment.',
  ageNoticeText: 'Our products are cosmetic skincare intended for adults aged 18 and over.',
}

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

function mapRow(row: SettingsRow): SiteSettings {
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

export async function getSiteSettings(supabase: SupabaseClient): Promise<SiteSettings> {
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle()
  if (error || !data) return DEFAULT_SITE_SETTINGS
  return mapRow(data as SettingsRow)
}
