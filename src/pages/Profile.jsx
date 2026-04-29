import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getStats, getUserPlatforms, addPlatform, removePlatform } from '../services/libraryService';
import { changeEmail, changePassword, deleteAccount, exportAccountData } from '../services/authService';

const inputClass =
  'w-full bg-[#0a0b14] border border-[#2a2d45] rounded px-3 py-2 text-sm text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none focus:[box-shadow:0_0_8px_#f7258540] transition-[border-color,box-shadow] duration-200';
const labelClass = 'block text-xs text-[#4a5068] uppercase tracking-wider';

const ALL_PLATFORMS = [
  'PC', 'PlayStation 5', 'PlayStation 4',
  'Xbox Series S/X', 'Xbox One', 'Nintendo Switch',
];

const STATUSES = [
  { key: 'PLAYING',   label: 'Playing',   color: '#22c55e', glow: '#22c55e40' },
  { key: 'BACKLOG',   label: 'Backlog',   color: '#2563eb', glow: '#2563eb40' },
  { key: 'COMPLETED', label: 'Completed', color: '#a855f7', glow: '#a855f740' },
  { key: 'DROPPED',   label: 'Dropped',   color: '#ef4444', glow: '#ef444440' },
  { key: 'WISHLIST',  label: 'Wishlist',  color: '#f59e0b', glow: '#f59e0b40' },
];

export default function Profile() {
  const { email, logout, login } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(false);
  const [platforms, setPlatforms] = useState([]);
  const [platformsError, setPlatformsError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addPlatformError, setAddPlatformError] = useState(false);
  const [removePlatformError, setRemovePlatformError] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteForm, setDeleteForm] = useState({ currentPassword: '' });
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState(false);

  const [emailForm, setEmailForm] = useState({ newEmail: '', currentPassword: '' });
  const [emailError, setEmailError] = useState(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  function updateEmailField(key, value) {
    setEmailForm(prev => ({ ...prev, [key]: value }));
    if (emailError) setEmailError(null);
    if (emailSuccess) setEmailSuccess(false);
  }

  function updatePwField(key, value) {
    setPwForm(prev => ({ ...prev, [key]: value }));
    if (pwError) setPwError(null);
    if (pwSuccess) setPwSuccess(false);
  }

  function closeEmailModal() {
    setEmailModalOpen(false);
    setEmailForm({ newEmail: '', currentPassword: '' });
    setEmailError(null);
    setEmailSuccess(false);
  }

  function closePwModal() {
    setPwModalOpen(false);
    setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPwError(null);
    setPwSuccess(false);
  }

  function closeDeleteModal() {
    if (deleteSaving) return;
    setDeleteModalOpen(false);
    setDeleteForm({ currentPassword: '' });
    setDeleteError(null);
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    setDeleteError(null);
    setDeleteSaving(true);
    try {
      await deleteAccount(deleteForm.currentPassword);
      navigate('/login', { replace: true });
    } catch (err) {
      setDeleteError(err.message);
      setDeleteSaving(false);
    }
  }

  async function handleExportData() {
    setExportError(false);
    setExportLoading(true);
    try {
      const data = await exportAccountData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `the-game-cellar-export-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setExportError(true);
      setTimeout(() => setExportError(false), 3000);
    } finally {
      setExportLoading(false);
    }
  }

  async function handleChangeEmail(e) {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(false);
    if (email && emailForm.newEmail.trim().toLowerCase() === email.toLowerCase()) {
      setEmailError('New email is the same as current email');
      return;
    }
    setEmailSaving(true);
    try {
      const userInfo = await changeEmail(emailForm.currentPassword, emailForm.newEmail);
      if (userInfo && userInfo.userId) login(userInfo);
      setEmailForm({ newEmail: '', currentPassword: '' });
      setEmailSuccess(true);
      setTimeout(() => {
        setEmailModalOpen(false);
        setEmailSuccess(false);
      }, 1200);
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setEmailSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }
    if (!/[A-Za-z]/.test(pwForm.newPassword) || !/\d/.test(pwForm.newPassword)) {
      setPwError('New password must contain at least one letter and one digit');
      return;
    }
    if (pwForm.newPassword === pwForm.currentPassword) {
      setPwError('New password must differ from current password');
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwSuccess(true);
      setTimeout(() => {
        setPwModalOpen(false);
        setPwSuccess(false);
      }, 1200);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  useEffect(() => {
    getStats().then(r => setStats(r.data)).catch(() => setStatsError(true));
    getUserPlatforms().then(r => setPlatforms(Array.isArray(r.data) ? r.data : [])).catch(() => setPlatformsError(true));
  }, []);

  const ownedNames = platforms.map(p => p.platformName);
  const available = ALL_PLATFORMS.filter(p => !ownedNames.includes(p));
  const totalGames = stats
    ? Object.values(stats.byStatus ?? {}).reduce((sum, n) => sum + n, 0)
    : null;

  async function handleRemovePlatform(platformId) {
    try {
      await removePlatform(platformId);
      setPlatforms(prev => prev.filter(p => p.id !== platformId));
    } catch {
      setRemovePlatformError(true);
      setTimeout(() => setRemovePlatformError(false), 3000);
    }
  }

  async function handleAddPlatform(name) {
    setAdding(true);
    try {
      await addPlatform({ platformName: name, isPrimary: false });
      const res = await getUserPlatforms();
      setPlatforms(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAddPlatformError(true);
      setTimeout(() => setAddPlatformError(false), 3000);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[#e8e4dc]">Profile</h1>

      {/* Account */}
      <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-5 space-y-3">
        <p className="text-xs text-[#8891a8] uppercase tracking-wider">Account</p>
        <p className="text-sm text-[#e8e4dc]">{email ?? '—'}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setEmailModalOpen(true)}
            className="text-xs px-3 py-1.5 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f7258560] transition-[color,border-color,text-shadow] duration-200"
          >
            Change email
          </button>
          <button
            type="button"
            onClick={() => setPwModalOpen(true)}
            className="text-xs px-3 py-1.5 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f7258560] transition-[color,border-color,text-shadow] duration-200"
          >
            Change password
          </button>
        </div>
        {totalGames !== null && (
          <div className="pt-3 border-t border-[#1e2035] flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-[#f72585] [text-shadow:0_0_12px_#f7258560]">
              {totalGames}
            </span>
            <span className="text-xs text-[#8891a8]">games in library</span>
          </div>
        )}
      </section>

      {/* Library stats */}
      {statsError && (
        <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
          Failed to load library stats.
        </p>
      )}
      {stats && (
        <section className="space-y-3">
          <p className="text-xs text-[#8891a8] uppercase tracking-wider">Library</p>
          <div className="grid grid-cols-3 gap-3">
            {STATUSES.map(({ key, label, color, glow }) => {
              const count = stats.byStatus?.[key] ?? 0;
              return (
                <button
                  key={key}
                  onClick={() => navigate(`/library?status=${key}`)}
                  className="bg-[#111220] border border-[#2a2d45] rounded-lg p-4 text-center space-y-1 transition-[border-color,box-shadow,transform] duration-200 hover:border-current hover:scale-[1.02]"
                  style={{ '--glow': glow }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.boxShadow = `0 0 12px ${glow}`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <p className="text-2xl font-semibold" style={{ color, textShadow: `0 0 10px ${glow}` }}>
                    {count}
                  </p>
                  <p className="text-xs text-[#8891a8]">{label}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Platforms */}
      <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-5 space-y-4">
        <p className="text-xs text-[#8891a8] uppercase tracking-wider">Platforms</p>
        {platformsError && (
          <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            Failed to load platforms.
          </p>
        )}
        {removePlatformError && (
          <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            Failed to remove platform. Please try again.
          </p>
        )}
        {!platformsError && platforms.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {platforms.map(p => (
              <span key={p.id} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border bg-[#f7258510] border-[#f7258560] text-[#f72585]">
                {p.platformName}
                <button
                  type="button"
                  onClick={() => handleRemovePlatform(p.id)}
                  className="text-base leading-none text-[#4a5068] hover:text-[#ef4444] transition-colors"
                  title="Remove platform"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          !platformsError && <p className="text-xs text-[#4a5068]">No platforms added yet.</p>
        )}
        {addPlatformError && (
          <p className="text-sm text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            Failed to add platform. Please try again.
          </p>
        )}
        {!platformsError && available.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-[#1e2035]">
            <p className="text-xs text-[#8891a8]">Add platform</p>
            <div className="flex flex-wrap gap-2">
              {available.map(name => (
                <button
                  key={name}
                  onClick={() => handleAddPlatform(name)}
                  disabled={adding}
                  className="text-xs px-3 py-1.5 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc] disabled:opacity-40 transition-colors"
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Privacy / data */}
      <section className="bg-[#111220] border border-[#2a2d45] rounded-lg p-5 space-y-3">
        <p className="text-xs text-[#8891a8] uppercase tracking-wider">Your data</p>
        <p className="text-xs text-[#4a5068]">Export a JSON copy of everything we hold for you, or delete your account permanently.</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportData}
            disabled={exportLoading}
            className="text-xs px-3 py-1.5 rounded border border-[#2a2d45] text-[#8891a8] hover:border-[#f72585] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f7258560] disabled:opacity-40 disabled:cursor-not-allowed transition-[color,border-color,text-shadow] duration-200"
          >
            {exportLoading ? '[ EXPORTING... ]' : 'Download my data'}
          </button>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="text-xs px-3 py-1.5 rounded border border-[#ef4444] text-[#ef4444] hover:bg-[#ef444415] hover:[box-shadow:0_0_10px_#ef444460] transition-[background-color,box-shadow] duration-200"
          >
            Delete account
          </button>
        </div>
        {exportError && (
          <p className="text-xs text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
            Export failed. Please try again.
          </p>
        )}
      </section>

      {/* Sign out */}
      <button
        onClick={() => setConfirmOpen(true)}
        className="px-4 py-2 bg-[#ef444410] border border-[#ef4444] text-[#ef4444] text-xs rounded [box-shadow:0_0_8px_#ef444440,0_0_20px_#ef444420] hover:bg-[#ef444420] hover:[box-shadow:0_0_12px_#ef444450,0_0_25px_#ef444430] transition-[background-color,box-shadow] duration-200"
      >
        Sign out
      </button>

      {/* Change email modal */}
      {emailModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-enter"
          onClick={closeEmailModal}
        >
          <div
            className="bg-[#111220] border border-[#1e2035] rounded-lg p-6 w-full max-w-sm space-y-4 animate-enter"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#e8e4dc]">Change email</p>
              <p className="text-xs text-[#4a5068]">Current: {email ?? '—'}</p>
            </div>
            <form onSubmit={handleChangeEmail} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="new-email" className={labelClass}>New email</label>
                <input
                  id="new-email"
                  type="email"
                  required
                  value={emailForm.newEmail}
                  onChange={e => updateEmailField('newEmail', e.target.value)}
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
                  onChange={e => updateEmailField('currentPassword', e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              {emailError && (
                <p className="text-xs text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
                  {emailError}
                </p>
              )}
              {emailSuccess && (
                <p className="text-xs text-[#22c55e] bg-[#22c55e10] border border-[#22c55e30] rounded px-3 py-2">
                  Email updated.
                </p>
              )}
              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={closeEmailModal}
                  className="px-4 py-1.5 border border-[#2a2d45] text-[#8891a8] text-xs rounded hover:border-[#8891a8] hover:text-[#e8e4dc] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={emailSaving}
                  className="px-4 py-1.5 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-xs rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-[box-shadow,transform] duration-200"
                >
                  {emailSaving ? '[ SAVING... ]' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change password modal */}
      {pwModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-enter"
          onClick={closePwModal}
        >
          <div
            className="bg-[#111220] border border-[#1e2035] rounded-lg p-6 w-full max-w-sm space-y-4 animate-enter"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#e8e4dc]">Change password</p>
              <p className="text-xs text-[#4a5068]">Min 8 characters, at least one letter and one digit.</p>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="pw-current" className={labelClass}>Current password</label>
                <input
                  id="pw-current"
                  type="password"
                  required
                  value={pwForm.currentPassword}
                  onChange={e => updatePwField('currentPassword', e.target.value)}
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
                  onChange={e => updatePwField('newPassword', e.target.value)}
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
                  onChange={e => updatePwField('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              {pwError && (
                <p className="text-xs text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
                  {pwError}
                </p>
              )}
              {pwSuccess && (
                <p className="text-xs text-[#22c55e] bg-[#22c55e10] border border-[#22c55e30] rounded px-3 py-2">
                  Password updated.
                </p>
              )}
              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={closePwModal}
                  className="px-4 py-1.5 border border-[#2a2d45] text-[#8891a8] text-xs rounded hover:border-[#8891a8] hover:text-[#e8e4dc] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="px-4 py-1.5 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-xs rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-[box-shadow,transform] duration-200"
                >
                  {pwSaving ? '[ SAVING... ]' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete account modal */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-enter"
          onClick={closeDeleteModal}
        >
          <div
            className="bg-[#111220] border border-[#ef444460] rounded-lg p-6 w-full max-w-sm space-y-4 animate-enter"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#ef4444]">Delete account?</p>
              <p className="text-xs text-[#8891a8]">
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
                  onChange={e => setDeleteForm({ currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className={inputClass}
                  autoFocus
                />
              </div>
              {deleteError && (
                <p className="text-xs text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
                  {deleteError}
                </p>
              )}
              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleteSaving}
                  className="px-4 py-1.5 border border-[#2a2d45] text-[#8891a8] text-xs rounded hover:border-[#8891a8] hover:text-[#e8e4dc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteSaving}
                  className="px-4 py-1.5 bg-[#ef444415] border border-[#ef4444] text-[#ef4444] text-xs rounded [box-shadow:0_0_10px_#ef4444,0_0_28px_#ef444460] hover:bg-[#ef444425] hover:[box-shadow:0_0_14px_#ef4444,0_0_36px_#ef444480] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-[background-color,box-shadow,transform] duration-200"
                >
                  {deleteSaving ? '[ DELETING... ]' : 'Delete forever'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout confirm modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center animate-enter"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="bg-[#111220] border border-[#1e2035] rounded-lg p-6 w-full max-w-xs space-y-4 animate-enter"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#e8e4dc]">Sign out?</p>
              <p className="text-xs text-[#4a5068]">You will be returned to the login page.</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-1.5 border border-[#2a2d45] text-[#8891a8] text-xs rounded hover:border-[#8891a8] hover:text-[#e8e4dc] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 bg-[#ef444410] border border-[#ef4444] text-[#ef4444] text-xs rounded [box-shadow:0_0_8px_#ef444440,0_0_20px_#ef444420] hover:bg-[#ef444420] hover:[box-shadow:0_0_12px_#ef444450,0_0_25px_#ef444430] transition-[background-color,box-shadow] duration-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
