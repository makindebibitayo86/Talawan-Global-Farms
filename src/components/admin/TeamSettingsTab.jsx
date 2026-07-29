import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { fetchSectionContent, upsertSectionContent } from '../../lib/siteContent'

const SECTION = 'team'

// Keys match the defaults in Team.jsx exactly, so whatever's saved here is
// what the public section falls back to before Supabase resolves too.
const TEAM_DEFAULTS = {
  'team.eyebrow': 'Community',
  'team.heading': 'The People Behind Talawan Global Farms',
  'team.intro':
    'From the fields to the farmhouse, this is the team that keeps Talawan Global Farms running.',
}

const EYEBROW_FIELD = { key: 'team.eyebrow', label: 'Eyebrow label' }
const HEADING_FIELD = { key: 'team.heading', label: 'Heading' }
const INTRO_FIELD = { key: 'team.intro', label: 'Intro', rows: 3 }

export default function TeamSettingsTab() {
  const [values, setValues] = useState(TEAM_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('idle') // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchSectionContent(SECTION, TEAM_DEFAULTS).then((data) => {
      if (!cancelled) {
        setValues(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  function handleChange(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setStatus('idle')
  }

  async function handleSave() {
    setStatus('saving')
    setErrorMsg('')
    try {
      const textEntries = [EYEBROW_FIELD, HEADING_FIELD, INTRO_FIELD].map(({ key }) => ({
        key,
        value: values[key],
        type: 'text',
      }))
      await upsertSectionContent(textEntries, SECTION)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Failed to save changes.')
    }
  }

  if (loading) {
    return (
      <div className="rounded-[16px] border border-line glass-panel p-6">
        <div className="flex items-center gap-2 text-ink-soft">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading team content…
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-line glass-panel p-6">
      <h2 className="mb-5 font-medium text-ink">Team section</h2>

      <div className="max-w-xl space-y-5">
        <div>
          <label className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
            {EYEBROW_FIELD.label}
          </label>
          <input
            type="text"
            value={values[EYEBROW_FIELD.key]}
            onChange={(e) => handleChange(EYEBROW_FIELD.key, e.target.value)}
            className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
            {HEADING_FIELD.label}
          </label>
          <input
            type="text"
            value={values[HEADING_FIELD.key]}
            onChange={(e) => handleChange(HEADING_FIELD.key, e.target.value)}
            className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
            {INTRO_FIELD.label}
          </label>
          <textarea
            rows={INTRO_FIELD.rows}
            value={values[INTRO_FIELD.key]}
            onChange={(e) => handleChange(INTRO_FIELD.key, e.target.value)}
            className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </div>

      {/* Team member profiles themselves aren't wired up yet — this tab
          currently only covers the section header copy, same scope as
          Team.jsx's current placeholder state. */}

      <div className="mt-6 border-t border-line pt-6">
        {status === 'error' && (
          <p className="mb-4 flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {errorMsg}
          </p>
        )}
        {status === 'success' && (
          <p className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
            <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            Team section updated.
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'saving'}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70 lg:w-auto lg:px-10"
        >
          {status === 'saving' && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
          {status === 'saving' ? 'Saving' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
