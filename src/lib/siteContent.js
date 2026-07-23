import { supabase } from './supabaseClient'

const TABLE = 'site_content'
const STORAGE_BUCKET = 'farm-images'
const STORAGE_PREFIX = 'site-content'

/**
 * Fetch all content rows for a given section, returned as a flat
 * { key: value } map merged over `defaults`. Any key not yet present
 * in Supabase (new field, or table not seeded yet) falls back to its
 * default so the site never renders blank.
 */
export async function fetchSectionContent(section, defaults = {}) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('key, value')
    .eq('section', section)

  if (error) {
    console.error(`[siteContent] fetch failed for section "${section}":`, error.message)
    return { ...defaults }
  }

  const fetched = Object.fromEntries(data.map((row) => [row.key, row.value]))
  return { ...defaults, ...fetched }
}

/**
 * Upsert several content rows at once — used when a whole admin tab
 * is saved in one action. `entries` is an array of
 * { key, value, type? } objects; type defaults to 'text'.
 */
export async function upsertSectionContent(entries, section) {
  const rows = entries.map(({ key, value, type = 'text' }) => ({
    key,
    value,
    section,
    type,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from(TABLE).upsert(rows, { onConflict: 'key' })
  if (error) throw error
}

/**
 * Upload a file to the shared storage bucket and return its public URL.
 * Filenames are namespaced by content key + timestamp so re-uploads
 * never collide or silently overwrite an old asset still cached
 * somewhere.
 */
export async function uploadContentImage(file, key) {
  const ext = file.name.split('.').pop()
  const path = `${STORAGE_PREFIX}/${key}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: true })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
