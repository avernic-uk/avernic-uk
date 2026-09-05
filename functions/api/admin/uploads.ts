import { getSupabaseAdmin } from '../../_lib/supabaseAdmin'
import { requireAdmin } from '../../_lib/auth'
import { json, errorResponse, ApiError } from '../../_lib/respond'
import type { Env } from '../../_lib/types'

// ============================================================================
// POST /api/admin/uploads — admin-only image upload.
//
// Takes a multipart form with a single `file` field and returns the public URL
// of the stored object, ready to drop into a product's image field or the
// homepage hero setting.
//
// This is the only writer to the `site-images` bucket. The bucket has a public
// read policy and deliberately no write policy (migration 0009), so the write
// only succeeds because this runs with the service-role key — after
// requireAdmin() has established that the caller is actually an admin. An
// unauthenticated request never reaches the storage call.
// ============================================================================

const MAX_BYTES = 5 * 1024 * 1024

/**
 * SVG is accepted because logos are often supplied that way, but it is worth
 * being clear-eyed about it: an SVG is a document that can carry script, so a
 * malicious one served from your own origin could run in a visitor's browser.
 * Two things contain that here — only an authenticated admin can upload at
 * all, and Supabase Storage serves these from its own domain rather than from
 * avernic.uk, so nothing uploaded shares an origin with the shop or its
 * session. Drop 'image/svg+xml' from both lists (here and in the migration) if
 * you would rather not allow it.
 */
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'])

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
}

/**
 * Builds a safe, collision-proof object key.
 *
 * The original filename is kept — recognisably, so the storage listing is
 * browsable months later — but only after being stripped to characters that
 * can't confuse a path or a URL. A random suffix means re-uploading a file
 * called `hero.jpg` never silently replaces the `hero.jpg` already in use on a
 * live page.
 */
function objectKey(originalName: string, contentType: string): string {
  const ext = EXTENSIONS[contentType] ?? 'bin'
  const base = originalName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  const stamp = new Date().toISOString().slice(0, 10)
  const random = crypto.randomUUID().slice(0, 8)
  return `${stamp}/${base || 'image'}-${random}.${ext}`
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)

    const form = await context.request.formData().catch(() => null)
    const file = form?.get('file')
    if (!form || !(file instanceof File)) throw new ApiError(400, 'Choose an image file to upload.')

    if (file.size === 0) throw new ApiError(400, 'That file is empty.')
    if (file.size > MAX_BYTES) {
      throw new ApiError(413, `That image is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 5MB — try saving it smaller.`)
    }

    const contentType = file.type.toLowerCase()
    if (!ALLOWED_TYPES.has(contentType)) {
      throw new ApiError(415, 'That file type is not supported. Upload a JPEG, PNG, WebP, AVIF, GIF or SVG image.')
    }

    const supabase = getSupabaseAdmin(context.env)
    const key = objectKey(file.name || 'image', contentType)

    const { error } = await supabase.storage
      .from('site-images')
      .upload(key, await file.arrayBuffer(), {
        contentType,
        // Long cache: the key already carries a random suffix, so a given URL's
        // bytes never change and the browser can hold onto it indefinitely.
        cacheControl: '31536000',
        upsert: false,
      })
    if (error) throw new ApiError(502, `Upload failed: ${error.message}`)

    const { data } = supabase.storage.from('site-images').getPublicUrl(key)

    return json({ url: data.publicUrl, path: key, bytes: file.size, contentType }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
