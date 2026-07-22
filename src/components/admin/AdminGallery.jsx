import { useEffect, useState } from 'react'
import { Upload, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

const BUCKET = 'farm-images'
const SUPABASE_STORAGE_URL =
  'https://bhcyamtmorvzfckmlhfq.supabase.co/storage/v1/object/public/farm-images/'
const img = (filename) => `${SUPABASE_STORAGE_URL}${filename}`

function humanize(filename) {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/^farm-/, '')
    .replace(/-\d+$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function slugifyFilename(file) {
  const stamp = Date.now()
  const clean = file.name.trim().toLowerCase().replace(/[^a-z0-9.]+/g, '-')
  return `${stamp}-${clean}`
}

const PAGE_SIZE = 15

export default function AdminGallery() {
  const [files, setFiles] = useState([])
  const [productMap, setProductMap] = useState(new Map())
  const [status, setStatus] = useState('loading')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [deletingName, setDeletingName] = useState(null)
  const [page, setPage] = useState(1)

  async function load() {
    setStatus('loading')
    const [filesRes, productsRes] = await Promise.all([
      supabase.storage.from(BUCKET).list('', { limit: 200 }),
      supabase.from('products').select('name, image_filename'),
    ])

    if (filesRes.error || productsRes.error) {
      console.error(filesRes.error || productsRes.error)
      setStatus('error')
      return
    }

    setProductMap(new Map((productsRes.data ?? []).map((p) => [p.image_filename, p.name])))
    setFiles((filesRes.data ?? []).filter((f) => f.name && f.id))
    setStatus('ready')
    setPage(1)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')

    const filename = slugifyFilename(file)
    const { error } = await supabase.storage.from(BUCKET).upload(filename, file, { upsert: true })

    setUploading(false)
    e.target.value = ''
    if (error) {
      setUploadError(error.message)
      return
    }
    load()
  }

  async function handleDelete(file) {
    const usedBy = productMap.get(file.name)
    const warning = usedBy
      ? `"${file.name}" is currently used as the photo for the product "${usedBy}". Deleting it will break that product's image. Delete anyway?`
      : `Delete "${file.name}"? This can't be undone.`
    if (!window.confirm(warning)) return

    setDeletingName(file.name)
    const { error } = await supabase.storage.from(BUCKET).remove([file.name])
    setDeletingName(null)
    if (error) {
      alert(`Couldn't delete: ${error.message}`)
      return
    }
    load()
  }

  const totalPages = Math.max(1, Math.ceil(files.length / PAGE_SIZE))
  const paginatedFiles = files.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-px w-6 bg-primary" />
            <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-primary">Gallery</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-ink">A look into our world</h1>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Upload className="h-4 w-4" strokeWidth={2} />}
          {uploading ? 'Uploading…' : 'Upload image'}
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      <p className="mb-4 text-[15px] font-medium text-ink-soft">
        Every image here shows on the site's Gallery strip.
        <br />
        Photos already assigned to a product are labelled
        <br />
        "Product" and are edited from the Products tab
        <br />
        — everything else shows as a standalone "Farm" shot.
      </p>

      {uploadError && (
        <p className="mb-4 flex items-center gap-2 text-sm font-medium text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          {uploadError}
        </p>
      )}

      {status === 'loading' && <p className="text-ink-soft">Loading gallery…</p>}
      {status === 'error' && <p className="text-red-600">Couldn't load the gallery.</p>}

      {status === 'ready' && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {paginatedFiles.map((file) => {
              const usedBy = productMap.get(file.name)
              return (
                <div key={file.id} className="group relative overflow-hidden rounded-[16px] border border-line bg-canvas">
                  <div className="aspect-square w-full overflow-hidden">
                    <img src={img(file.name)} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {usedBy ?? humanize(file.name)}
                    </p>
                    <span className="text-[11px] uppercase tracking-[0.06em] text-ink-soft/70">
                      {usedBy ? 'Product' : 'Farm'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(file)}
                    disabled={deletingName === file.name}
                    aria-label="Delete image"
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-canvas/90 text-ink-soft shadow-sm backdrop-blur-sm transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    {deletingName === file.name ? (
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                    ) : (
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          {files.length > PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-[13px] text-ink-soft">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-full border border-line px-4 py-2 text-[13px] font-medium uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-soft"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-full border border-line px-4 py-2 text-[13px] font-medium uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-soft"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
