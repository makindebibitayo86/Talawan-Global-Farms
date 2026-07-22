import { useState } from 'react'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' }

function PasswordField({ id, label, value, onChange, show, onToggleShow, autoComplete }) {
  return (
    <div>
      <label htmlFor={id} className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          name={id}
          type={show ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className="w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 pr-11 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft transition-colors hover:text-primary"
        >
          {show ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
        </button>
      </div>
    </div>
  )
}

export default function AdminSettings() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [showFields, setShowFields] = useState({ current: false, next: false, confirm: false })
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function toggleShow(field) {
    setShowFields((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    if (form.newPassword.length < 8) {
      setStatus('error')
      setErrorMsg('New password must be at least 8 characters.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setStatus('error')
      setErrorMsg("New password and confirmation don't match.")
      return
    }

    // Confirm the admin actually knows the current password before changing
    // anything — re-authenticate against it rather than trusting the
    // existing session alone.
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user?.email) {
      setStatus('error')
      setErrorMsg("Couldn't verify the current session. Try logging in again.")
      return
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: form.currentPassword,
    })

    if (verifyError) {
      setStatus('error')
      setErrorMsg('Current password is incorrect.')
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: form.newPassword,
    })

    if (updateError) {
      setStatus('error')
      setErrorMsg(updateError.message)
      return
    }

    setStatus('success')
    setForm(EMPTY_FORM)
  }

  return (
    <div>
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-px w-6 bg-primary" />
          <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-primary">Account</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-ink">Keep your account secure.</h1>
      </div>

      <div className="max-w-md rounded-[16px] border border-line bg-canvas p-6">
        <div className="mb-5 flex items-center gap-2 text-ink">
          <KeyRound className="h-4 w-4 text-primary" strokeWidth={2} />
          <h2 className="font-medium">Change password</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField
            id="currentPassword"
            label="Current password"
            value={form.currentPassword}
            onChange={handleChange}
            show={showFields.current}
            onToggleShow={() => toggleShow('current')}
            autoComplete="current-password"
          />
          <PasswordField
            id="newPassword"
            label="New password"
            value={form.newPassword}
            onChange={handleChange}
            show={showFields.next}
            onToggleShow={() => toggleShow('next')}
            autoComplete="new-password"
          />
          <PasswordField
            id="confirmPassword"
            label="Confirm new password"
            value={form.confirmPassword}
            onChange={handleChange}
            show={showFields.confirm}
            onToggleShow={() => toggleShow('confirm')}
            autoComplete="new-password"
          />

          {status === 'error' && (
            <p className="flex items-center gap-2 text-sm font-medium text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {errorMsg}
            </p>
          )}
          {status === 'success' && (
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              Password updated.
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            {status === 'submitting' ? 'Updating' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
