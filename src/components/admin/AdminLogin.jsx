import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import logoIcon from '../../assets/logo-icon-color.png'
import logoWordmark from '../../assets/logo-wordmark-color.png'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // login | forgot
  const [form, setForm] = useState({ email: '', password: '' })
  const [resetEmail, setResetEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('idle') // idle | checking | submitting | error
  const [resetStatus, setResetStatus] = useState('idle') // idle | submitting | sent | error
  const [errorMsg, setErrorMsg] = useState('')
  const [resetErrorMsg, setResetErrorMsg] = useState('')

  // If already logged in, skip straight past the login form.
  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) navigate('/admin', { replace: true })
    })
    return () => {
      cancelled = true
    }
  }, [navigate])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setStatus('error')
      setErrorMsg(
        error.message === 'Invalid login credentials'
          ? 'Incorrect email or password.'
          : error.message
      )
      return
    }

    navigate('/admin', { replace: true })
  }

  async function handleResetRequest(e) {
    e.preventDefault()
    setResetStatus('submitting')
    setResetErrorMsg('')

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })

    if (error) {
      setResetStatus('error')
      setResetErrorMsg(error.message)
      return
    }

    setResetStatus('sent')
  }

  function backToSignIn() {
    setMode('login')
    setResetStatus('idle')
    setResetErrorMsg('')
    setResetEmail('')
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-canvas-alt px-4">
      <style>{`
        .admin-input:-webkit-autofill,
        .admin-input:-webkit-autofill:hover,
        .admin-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #f6f4ec inset;
          -webkit-text-fill-color: #23291f;
          transition: background-color 9999s ease-in-out 0s;
        }
      `}</style>
      <div
        className="w-full rounded-[20px] bg-canvas p-9"
        style={{
          maxWidth: '380px',
          border: '1px solid rgba(35, 41, 31, 0.14)',
          boxShadow: '0 24px 48px -16px rgba(35, 41, 31, 0.28)',
        }}
      >
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <img src={logoIcon} alt="" className="h-14 w-auto object-contain" />
            <img src={logoWordmark} alt="Talawan Global Farms" className="h-8 w-auto object-contain" />
          </div>
          <span className="flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.14em] text-ink-soft">
            <Lock className="h-3 w-3" strokeWidth={2} />
            {mode === 'login' ? 'Admin sign in' : 'Reset password'}
          </span>
        </div>

        {mode === 'login' && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              value={form.email}
              onChange={handleChange}
              className="admin-input mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
              Password
            </label>
            <div className="relative mt-2">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                className="admin-input w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 pr-11 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft transition-colors hover:text-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
              </button>
            </div>
          </div>

          {status === 'error' && (
            <p className="flex items-center gap-2 text-sm font-medium text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            {status === 'submitting' ? 'Signing in' : 'Sign in'}
          </button>

          <button
            type="button"
            onClick={() => setMode('forgot')}
            className="block w-full text-center text-[13px] text-ink-soft transition-colors hover:text-primary"
          >
            Forgot password?
          </button>
        </form>
        )}

        {mode === 'forgot' && resetStatus !== 'sent' && (
          <form onSubmit={handleResetRequest} className="space-y-5">
            <p className="text-[13px] leading-relaxed text-ink-soft">
              Enter your email and we'll send you a link to reset your password.
            </p>

            <div>
              <label htmlFor="resetEmail" className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                Email
              </label>
              <input
                id="resetEmail"
                name="resetEmail"
                type="email"
                required
                autoComplete="username"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="admin-input mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
              />
            </div>

            {resetStatus === 'error' && (
              <p className="flex items-center gap-2 text-sm font-medium text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                {resetErrorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={resetStatus === 'submitting'}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {resetStatus === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              {resetStatus === 'submitting' ? 'Sending' : 'Send reset link'}
            </button>

            <button
              type="button"
              onClick={backToSignIn}
              className="block w-full text-center text-[13px] text-ink-soft transition-colors hover:text-primary"
            >
              Back to sign in
            </button>
          </form>
        )}

        {mode === 'forgot' && resetStatus === 'sent' && (
          <div className="space-y-5">
            <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-soft">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
              Check {resetEmail} for a link to reset your password. It may take a minute to arrive.
            </p>

            <button
              type="button"
              onClick={backToSignIn}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark"
            >
              Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
