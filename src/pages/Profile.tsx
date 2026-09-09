import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import {
  startAccountAction,
  useDeleteAccount,
  useExportAccountData,
} from '../services/authService'

interface Notice { tone: 'ok' | 'bad'; text: string }

// What the gateway reports on the return from Keycloak. "cancelled" is a button on
// Keycloak's own form, so it is a normal outcome rather than a failure.
function noticeFor(action: string, status: string): Notice | null {
  if (action === 'password') {
    if (status === 'success') return { tone: 'ok', text: 'Password updated.' }
    if (status === 'cancelled') return { tone: 'ok', text: 'Password unchanged.' }
    return { tone: 'bad', text: 'Password update failed. Please try again.' }
  }
  if (action === 'email') {
    if (status === 'pending') {
      return { tone: 'ok', text: 'Check your new address for a confirmation link. The change takes effect once you follow it.' }
    }
    if (status === 'changed') return { tone: 'ok', text: 'Email updated.' }
    if (status === 'cancelled') return { tone: 'ok', text: 'Email unchanged.' }
    return { tone: 'bad', text: 'Email update failed. Please try again.' }
  }
  if (action === 'delete') {
    return { tone: 'bad', text: 'Could not confirm your sign-in, so nothing was deleted. Please try again.' }
  }
  return null
}

export default function Profile() {
  const { email, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const deleteAccountMutation = useDeleteAccount()
  const exportAccountDataMutation = useExportAccountData()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteSaving, setDeleteSaving] = useState(false)
  const [exportError, setExportError] = useState(false)
  const [logoutError, setLogoutError] = useState(false)

  // The outcome of a Keycloak round trip lives in the URL rather than in state, so the
  // page reads the same whether it was just redirected here or reloaded afterwards.
  const action = searchParams.get('action')
  const status = searchParams.get('status')
  const deleteModalOpen = action === 'delete' && status === 'ready'
  const notice: Notice | null = deleteModalOpen || !action || !status ? null : noticeFor(action, status)

  function closeDeleteModal() {
    if (deleteSaving) return
    setDeleteError(null)
    setSearchParams({}, { replace: true })
  }

  async function handleDeleteAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setDeleteError(null)
    setDeleteSaving(true)
    try {
      await deleteAccountMutation.mutateAsync()
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

  function closeConfirm() {
    setConfirmOpen(false)
    setLogoutError(false)
  }

  async function handleLogout() {
    setLogoutError(false)
    try {
      await logout()
      navigate('/login')
    } catch {
      setLogoutError(true)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">Account</h1>
        <p className="text-sm text-[#8891a8]">
          Manage your account credentials, exported data, and sign-out.
        </p>
      </div>

      {notice && (
        <p
          className={
            notice.tone === 'ok'
              ? 'text-sm text-[#22c55e] bg-[#22c55e10] border border-[#22c55e30] rounded px-3 py-2'
              : 'text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2'
          }
        >
          {notice.text}
        </p>
      )}

      <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-5 space-y-3">
        <p className="text-sm text-[#8891a8] uppercase tracking-wider">Account</p>
        <p className="text-base text-[#e8e4dc]">{email ?? '-'}</p>
        <p className="text-sm text-[#8891a8]">
          Your email and password are managed on the sign-in page. Both open there and return you here.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => startAccountAction('UPDATE_EMAIL')}
            className="text-sm px-4 py-2 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f7258560] transition-[color,border-color,text-shadow,transform] duration-200 active:scale-[0.97]"
          >
            Change email
          </button>
          <button
            type="button"
            onClick={() => startAccountAction('UPDATE_PASSWORD')}
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
            onClick={() => startAccountAction('DELETE_ACCOUNT')}
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
                Your library, ratings, and platforms will be permanently removed. Your account will be deleted. <span className="text-[#ef4444]">This cannot be undone.</span>
              </p>
            </div>
            <form onSubmit={handleDeleteAccount} className="space-y-3">
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
          onClick={closeConfirm}
        >
          <div
            className="bg-[#111220] border border-[#1e2035] rounded-lg p-6 w-full max-w-xs space-y-4 animate-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-base font-medium text-[#e8e4dc]">Sign out?</p>
              <p className="text-sm text-[#8891a8]">You will be returned to the login page.</p>
            </div>
            {logoutError && (
              <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
                Could not sign out. Check your connection and try again.
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeConfirm}
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
