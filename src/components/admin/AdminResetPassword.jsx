import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, CheckCircle2, KeyRound, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import logoIcon from '../../assets/logo-icon-color.png'
import logoWordmark from '../../assets/logo-wordmark-color.png'

export default function AdminResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false) // becomes true once the recovery link has been verified
  const [linkInvalid, setLinkInvalid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('')

  // Supabase reads the recovery token out of the URL itself and fires this
  // event once it's verified — that's our signal it's safe to show the form.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    // If the link was already consumed/expired before this listener
    // attached, getSession will settle without a PASSWORD_RECOVERY event.
    const timeout = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) setLinkInvalid(true)
      })
    }, 2500)

    return () => {
      listener?.subscription?.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    if (password.length < 8) {
      setStatus('error')
      setErrorMsg('New password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setStatus('error')
      setErrorMsg("New password and confirmation don't match.")
      return
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }

    setStatus('success')
  }

  return (
    <div className="fixed inset-0 overflow-y-auto">
      <div className="admin-shell flex min-h-full items-center justify-center px-4">
      <div
        className="w-full rounded-[20px] border border-line glass-panel p-9 shadow-[0_24px_48px_-16px_rgba(35,41,31,0.28)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)]"
        style={{ maxWidth: '380px' }}
      >
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <img src={logoIcon} alt="" className="h-10 w-auto object-contain" />
            <img src={logoWordmark} alt="Talawan Global Farms" className="h-6 w-auto object-contain" />
          </div>
          <span className="flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.14em] text-ink-soft">
            <KeyRound className="h-3 w-3" strokeWidth={2} />
            Reset password
          </span>
        </div>

        {linkInvalid && (
          <div className="space-y-5">
            <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-soft">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" strokeWidth={1.75} />
              This reset link is invalid or has expired. Request a new one from the sign-in page.
            </p>
            <button
              type="button"
              onClick={() => navigate('/admin/login', { replace: true })}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark"
            >
              Back to sign in
            </button>
          </div>
        )}

        {!linkInvalid && !ready && status !== 'success' && (
          <div className="flex items-center justify-center gap-2 py-4 text-[13px] text-ink-soft">
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            Verifying your link…
          </div>
        )}

        {ready && status !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                New password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 pr-11 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
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

            <div>
              <label htmlFor="confirmPassword" className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-soft">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 w-full rounded-sm border border-line bg-canvas-alt/60 px-4 py-3 text-ink outline-none transition focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary/10"
              />
            </div>

            {status === 'error' && (
              <p className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
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
              {status === 'submitting' ? 'Updating' : 'Update password'}
            </button>
          </form>
        )}

        {status === 'success' && (
          <div className="space-y-5">
            <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-soft">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
              Password updated. You're signed in with your new password.
            </p>
            <button
              type="button"
              onClick={() => navigate('/admin', { replace: true })}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-[13px] font-medium uppercase tracking-[0.08em] text-canvas transition-colors hover:bg-primary-dark"
            >
              Continue to dashboard
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
