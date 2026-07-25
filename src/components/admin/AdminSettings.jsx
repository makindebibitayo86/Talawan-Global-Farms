import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, KeyRound, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import HeroSettingsTab from './HeroSettingsTab'
import AboutSettingsTab from './AboutSettingsTab'
import FarmsSettingsTab from './FarmsSettingsTab'
import ProductsSettingsTab from './ProductsSettingsTab'
import GallerySettingsTab from './GallerySettingsTab'
import ContactSettingsTab from './ContactSettingsTab'

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' }

const RULES = [
  { key: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { key: 'number', label: 'One number', test: (v) => /[0-9]/.test(v) },
]

// One entry per site section — kept here to validate the :tab URL param.
// Adding a new editable section: build a <XSettingsTab />, add it here,
// and add matching entries to SETTINGS_TABS in AdminLayout.jsx.
const TABS = [
  { key: 'hero' },
  { key: 'about' },
  { key: 'farms' },
  { key: 'products' },
  { key: 'gallery' },
  { key: 'contact' },
  { key: 'account' },
]

function getPasswordChecks(value) {
  return RULES.map((rule) => ({ ...rule, passed: rule.test(value) }))
}

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

// Strength meter + live requirements checklist for the new password field.
function PasswordStrength({ value }) {
  const checks = useMemo(() => getPasswordChecks(value), [value])
  const passedCount = checks.filter((c) => c.passed).length

  const strength =
    value.length === 0
      ? { label: '', width: '0%', color: 'bg-line' }
      : passedCount <= 1
      ? { label: 'Weak', width: '33%', color: 'bg-red-500' }
      : passedCount <= 3
      ? { label: 'Fair', width: '66%', color: 'bg-amber-500' }
      : { label: 'Strong', width: '100%', color: 'bg-primary' }

  return (
    <div className="mt-3 space-y-3">
      <div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas-alt">
          <div
            className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
            style={{ width: strength.width }}
          />
        </div>
        {strength.label && (
          <p
            className={`mt-1.5 text-[12px] font-medium ${
              strength.label === 'Weak'
                ? 'text-red-600'
                : strength.label === 'Fair'
                ? 'text-amber-600'
                : 'text-primary'
            }`}
          >
            {strength.label} password
          </p>
        )}
      </div>

      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {checks.map((check) => (
          <li
            key={check.key}
            className={`flex items-center gap-1.5 text-[12px] transition-colors ${
              check.passed ? 'text-primary' : 'text-ink-soft'
            }`}
          >
            {check.passed ? (
              <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
            ) : (
              <X className="h-3.5 w-3.5 shrink-0 opacity-40" strokeWidth={2} />
            )}
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AccountTab() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [showFields, setShowFields] = useState({ current: false, next: false, confirm: false })
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('')

  const passwordChecks = useMemo(() => getPasswordChecks(form.newPassword), [form.newPassword])
  const isPasswordStrongEnough = passwordChecks.every((c) => c.passed)

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

    if (!isPasswordStrongEnough) {
      setStatus('error')
      setErrorMsg('New password must meet all the requirements below.')
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

        <div>
          <PasswordField
            id="newPassword"
            label="New password"
            value={form.newPassword}
            onChange={handleChange}
            show={showFields.next}
            onToggleShow={() => toggleShow('next')}
            autoComplete="new-password"
          />
          <PasswordStrength value={form.newPassword} />
        </div>

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
          disabled={status === 'submitting' || !isPasswordStrongEnough}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
          {status === 'submitting' ? 'Updating' : 'Update password'}
        </button>
      </form>
    </div>
  )
}

export default function AdminSettings() {
  const { tab } = useParams()
  const activeTab = TABS.some((t) => t.key === tab) ? tab : 'hero'

  return (
    <div>
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-px w-6 bg-primary" />
          <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-primary">Settings</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-ink">Manage your site.</h1>
      </div>

      {activeTab === 'hero' && <HeroSettingsTab />}
      {activeTab === 'about' && <AboutSettingsTab />}
      {activeTab === 'farms' && <FarmsSettingsTab />}
      {activeTab === 'products' && <ProductsSettingsTab />}
      {activeTab === 'gallery' && <GallerySettingsTab />}
      {activeTab === 'contact' && <ContactSettingsTab />}
      {activeTab === 'account' && <AccountTab />}
    </div>
  )
}
