import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { register as registerUser } from '../services/authService';
import AttributionFooter from '../components/common/AttributionFooter';

const inputClass =
  'w-full bg-[#0a0b14] border border-[#2a2d45] rounded px-3 py-2 text-sm text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none focus:[box-shadow:0_0_8px_#f7258540] transition-[border-color,box-shadow] duration-200';
const labelClass = 'block text-xs text-[#4a5068] uppercase tracking-wider';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const userInfo = await registerUser(username, email, password);
      login(userInfo);
      navigate('/onboarding');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0b14] flex flex-col items-center justify-center font-mono">
      <div className="bg-[#111220] border border-[#1e2035] rounded-xl p-8 w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-[#e8e4dc] tracking-wider">
            THE GAME CELLAR
          </h1>
          <p className="text-xs text-[#4a5068]">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="username" className={labelClass}>Username</label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="coolplayer99"
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className={labelClass}>Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className={labelClass}>Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="confirm" className={labelClass}>Confirm password</label>
            <input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          {error && (
            <p className="text-xs text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-sm rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-[box-shadow,transform] duration-200"
          >
            {loading ? '[ CREATING ACCOUNT... ]' : 'Create account'}
          </button>
        </form>

        <p className="text-xs text-center text-[#4a5068]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] transition-[color,text-shadow] duration-200"
          >
            Sign in
          </Link>
        </p>
      </div>
      <div className="mt-6">
        <AttributionFooter />
      </div>
    </div>
  );
}
