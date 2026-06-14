import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import {
  useChangeEmail,
  useChangePassword,
  useDeleteAccount,
  useExportAccountData,
} from '../services/authService'
import type { UserInfo } from '../services/authService'

const inputClass =
  'w-full bg-[#0a0b14] border border-[#2a2d45] rounded px-3 py-2 text-sm text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none focus:[box-shadow:0_0_8px_#f7258540] transition-[border-color,box-shadow] duration-200'
const labelClass = 'block text-sm text-[#8891a8] uppercase tracking-wider'

interface EmailFormState { newEmail: string; currentPassword: string }
interface PwFormState { currentPassword: string; newPassword: string; confirmPassword: string }

function asUserInfo(value: unknown): UserInfo | null {
  if (value && typeof value === 'object' && 'userId' in value && typeof (value as { userId: unknown }).userId === 'string') {
    return value as UserInfo
  }
  return null
}

export default function Profile() {
  const { email, logout, login } = useAuth()
  const navigate = useNavigate()

  const changeEmailMutation = useChangeEmail()
  const changePasswordMutation = useChangePassword()
  const deleteAccountMutation = useDeleteAccount()
  const exportAccountDataMutation = useExportAccountData()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [pwModalOpen, setPwModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteForm, setDeleteForm] = useState({ currentPassword: '' })
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteSaving, setDeleteSaving] = useState(false)
  const [exportError, setExportError] = useState(false)

  const [emailForm, setEmailForm] = useState<EmailFormState>({ newEmail: '', currentPassword: '' })
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [emailSaving, setEmailSaving] = useState(false)

  const [pwForm, setPwForm] = useState<PwFormState>({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  function updateEmailField<K extends keyof EmailFormState>(key: K, value: EmailFormState[K]) {
    setEmailForm((prev) => ({ ...prev, [key]: value }))
    if (emailError) setEmailError(null)
    if (emailSuccess) setEmailSuccess(false)
  }

  function updatePwField<K extends keyof PwFormState>(key: K, value: PwFormState[K]) {
    setPwForm((prev) => ({ ...prev, [key]: value }))
    if (pwError) setPwError(null)
    if (pwSuccess) setPwSuccess(false)
  }

  function closeEmailModal() {
    setEmailModalOpen(false)
    setEmailForm({ newEmail: '', currentPassword: '' })
    setEmailError(null)
    setEmailSuccess(false)
  }

  function closePwModal() {
    setPwModalOpen(false)
    setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setPwError(null)
    setPwSuccess(false)
  }

  function closeDeleteModal() {
    if (deleteSaving) return
    setDeleteModalOpen(false)
    setDeleteForm({ currentPassword: '' })
    setDeleteError(null)
  }

  async function handleDeleteAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setDeleteError(null)
    setDeleteSaving(true)
    try {
      await deleteAccountMutation.mutateAsync(deleteForm.currentPassword)
      navigate('/login', { replace: true })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Account deletion failed')
      setDeleteSaving(false)
    }
  }

  async function handleExportData() {
    setExportError(false)
    try {
      const data = await exportAccountDataMutation.mutateAsync()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const stamp = new Date().toISOString().slice(0, 10)
      a.download = `the-game-cellar-export-${stamp}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setExportError(true)
      setTimeout(() => setExportError(false), 3000)
    }
  }

  async function handleChangeEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEmailError(null)
    setEmailSuccess(false)
    if (email && emailForm.newEmail.trim().toLowerCase() === email.toLowerCase()) {
      setEmailError('New email is the same as current email')
      return
    }
    setEmailSaving(true)
    try {
      const result = await changeEmailMutation.mutateAsync({
        currentPassword: emailForm.currentPassword,
        newEmail: emailForm.newEmail,
      })
      const userInfo = asUserInfo(result)
      if (userInfo) login(userInfo)
      setEmailForm({ newEmail: '', currentPassword: '' })
      setEmailSuccess(true)
      setTimeout(() => {
        setEmailModalOpen(false)
        setEmailSuccess(false)
      }, 1200)
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Email update failed')
    } finally {
      setEmailSaving(false)
    }
  }

  async function handleChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(false)
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match')
      return
    }
    if (pwForm.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters')
      return
    }
    if (!/[A-Za-z]/.test(pwForm.newPassword) || !/\d/.test(pwForm.newPassword)) {
      setPwError('New password must contain at least one letter and one digit')
      return
    }
    if (pwForm.newPassword === pwForm.currentPassword) {
      setPwError('New password must differ from current password')
      return
    }
    setPwSaving(true)
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPwSuccess(true)
      setTimeout(() => {
        setPwModalOpen(false)
        setPwSuccess(false)
      }, 1200)
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Password update failed')
    } finally {
      setPwSaving(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">Account</h1>
        <p className="text-sm text-[#8891a8]">
          Manage your account credentials, exported data, and sign-out.
        </p>
      </div>

      <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-5 space-y-3">
        <p className="text-sm text-[#8891a8] uppercase tracking-wider">Account</p>
        <p className="text-base text-[#e8e4dc]">{email ?? '-'}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setEmailModalOpen(true)}
            className="text-sm px-4 py-2 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f7258560] transition-[color,border-color,text-shadow,transform] duration-200 active:scale-[0.97]"
          >
            Change email
          </button>
          <button
            type="button"
            onClick={() => setPwModalOpen(true)}
            className="text-sm px-4 py-2 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f7258560] transition-[color,border-color,text-shadow,transform] duration-200 active:scale-[0.97]"
          >
            Change password
          </button>
        </div>
      </section>

      <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-5 space-y-3">
        <p className="text-sm text-[#8891a8] uppercase tracking-wider">Your data</p>
        <p className="text-sm text-[#8891a8]">Export a JSON copy of everything we hold for you, or delete your account permanently.</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportData}
            disabled={exportAccountDataMutation.isPending}
            className="text-sm px-4 py-2 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f7258560] disabled:opacity-40 disabled:cursor-not-allowed transition-[color,border-color,text-shadow,transform] duration-200 active:scale-[0.97]"
          >
            {exportAccountDataMutation.isPending ? '[ EXPORTING... ]' : 'Download my data'}
          </button>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="text-sm px-4 py-2 rounded border border-[#ef4444] text-[#ef4444] hover:bg-[#ef444415] hover:[box-shadow:0_0_10px_#ef444460] transition-[background-color,box-shadow,transform] duration-200 active:scale-[0.97]"
          >
            Delete account
          </button>
        </div>
        {exportError && (
          <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            Export failed. Please try again.
          </p>
        )}
      </section>

      <button
        onClick={() => setConfirmOpen(true)}
        className="px-4 py-2 bg-[#ef444410] border border-[#ef4444] text-[#ef4444] text-sm rounded [box-shadow:0_0_8px_#ef444440,0_0_20px_#ef444420] hover:bg-[#ef444420] hover:[box-shadow:0_0_12px_#ef444450,0_0_25px_#ef444430] transition-[background-color,box-shadow,transform] duration-200 active:scale-[0.97]"
      >
        Sign out
      </button>

      {emailModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-enter"
          onClick={closeEmailModal}
        >
          <div
            className="bg-[#111220] border border-[#1e2035] rounded-lg p-6 w-full max-w-sm space-y-4 animate-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-base font-medium text-[#e8e4dc]">Change email</p>
              <p className="text-sm text-[#8891a8]">Current: {email ?? '-'}</p>
            </div>
            <form onSubmit={handleChangeEmail} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="new-email" className={labelClass}>New email</label>
                <input
                  id="new-email"
                  type="email"
                  required
                  value={emailForm.newEmail}
                  onChange={(e) => updateEmailField('newEmail', e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="email-current-pw" className={labelClass}>Current password</label>
                <input
                  id="email-current-pw"
                  type="password"
                  required
                  value={emailForm.currentPassword}
                  onChange={(e) => updateEmailField('currentPassword', e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              {emailError && (
                <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
                  {emailError}
                </p>
              )}
              {emailSuccess && (
                <p className="text-sm text-[#22c55e] bg-[#22c55e10] border border-[#22c55e30] rounded px-3 py-2">
                  Email updated.
                </p>
              )}
              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={closeEmailModal}
                  className="px-4 py-2 border border-[#2a2d45] text-[#8891a8] text-sm rounded hover:border-[#8891a8] hover:text-[#e8e4dc] transition-[border-color,color,transform] duration-200 active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={emailSaving}
                  className="px-4 py-2 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-sm rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-[box-shadow,transform] duration-200"
                >
                  {emailSaving ? '[ SAVING... ]' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pwModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-enter"
          onClick={closePwModal}
        >
          <div
            className="bg-[#111220] border border-[#1e2035] rounded-lg p-6 w-full max-w-sm space-y-4 animate-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-base font-medium text-[#e8e4dc]">Change password</p>
              <p className="text-sm text-[#8891a8]">Min 8 characters, at least one letter and one digit.</p>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="pw-current" className={labelClass}>Current password</label>
                <input
                  id="pw-current"
                  type="password"
                  required
                  value={pwForm.currentPassword}
                  onChange={(e) => updatePwField('currentPassword', e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="pw-new" className={labelClass}>New password</label>
                <input
                  id="pw-new"
                  type="password"
                  required
                  value={pwForm.newPassword}
                  onChange={(e) => updatePwField('newPassword', e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="pw-confirm" className={labelClass}>Confirm new password</label>
                <input
                  id="pw-confirm"
                  type="password"
                  required
                  value={pwForm.confirmPassword}
                  onChange={(e) => updatePwField('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              {pwError && (
                <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
                  {pwError}
                </p>
              )}
              {pwSuccess && (
                <p className="text-sm text-[#22c55e] bg-[#22c55e10] border border-[#22c55e30] rounded px-3 py-2">
                  Password updated.
                </p>
              )}
              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={closePwModal}
                  className="px-4 py-2 border border-[#2a2d45] text-[#8891a8] text-sm rounded hover:border-[#8891a8] hover:text-[#e8e4dc] transition-[border-color,color,transform] duration-200 active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="px-4 py-2 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-sm rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-[box-shadow,transform] duration-200"
                >
                  {pwSaving ? '[ SAVING... ]' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-enter"
          onClick={closeDeleteModal}
        >
          <div
            className="bg-[#111220] border border-[#ef444460] rounded-lg p-6 w-full max-w-sm space-y-4 animate-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-base font-medium text-[#ef4444]">Delete account?</p>
              <p className="text-sm text-[#8891a8]">
                Your library, ratings, and platforms will be permanently removed. Your Keycloak account will be deleted. <span className="text-[#ef4444]">This cannot be undone.</span>
              </p>
            </div>
            <form onSubmit={handleDeleteAccount} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="delete-current-pw" className={labelClass}>Confirm with current password</label>
                <input
                  id="delete-current-pw"
                  type="password"
                  required
                  value={deleteForm.currentPassword}
                  onChange={(e) => setDeleteForm({ currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className={inputClass}
                  autoFocus
                />
              </div>
              {deleteError && (
                <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
                  {deleteError}
                </p>
              )}
              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleteSaving}
                  className="px-4 py-2 border border-[#2a2d45] text-[#8891a8] text-sm rounded hover:border-[#8891a8] hover:text-[#e8e4dc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteSaving}
                  className="px-4 py-2 bg-[#ef444415] border border-[#ef4444] text-[#ef4444] text-sm rounded [box-shadow:0_0_10px_#ef4444,0_0_28px_#ef444460] hover:bg-[#ef444425] hover:[box-shadow:0_0_14px_#ef4444,0_0_36px_#ef444480] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-[background-color,box-shadow,transform] duration-200"
                >
                  {deleteSaving ? '[ DELETING... ]' : 'Delete forever'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center animate-enter"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="bg-[#111220] border border-[#1e2035] rounded-lg p-6 w-full max-w-xs space-y-4 animate-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-base font-medium text-[#e8e4dc]">Sign out?</p>
              <p className="text-sm text-[#8891a8]">You will be returned to the login page.</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-1.5 border border-[#2a2d45] text-[#8891a8] text-xs rounded hover:border-[#8891a8] hover:text-[#e8e4dc] transition-[border-color,color,transform] duration-200 active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#ef444410] border border-[#ef4444] text-[#ef4444] text-sm rounded [box-shadow:0_0_8px_#ef444440,0_0_20px_#ef444420] hover:bg-[#ef444420] hover:[box-shadow:0_0_12px_#ef444450,0_0_25px_#ef444430] transition-[background-color,box-shadow,transform] duration-200 active:scale-[0.97]"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
