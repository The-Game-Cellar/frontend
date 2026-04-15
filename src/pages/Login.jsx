import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { login as keycloakLogin } from '../services/authService';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = await keycloakLogin(username, password);
      login(token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center font-mono">
      <div className="bg-[#111220] border border-[#1e2035] rounded-xl p-8 w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-[#e8e4dc] tracking-wider">
            THE GAME CELLAR
          </h1>
          <p className="text-xs text-[#4a5068]">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="username" className="block text-xs text-[#8891a8]">
              Username or email
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#0a0b14] border border-[#1e2035] rounded px-3 py-2 text-sm text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none focus:[box-shadow:0_0_8px_#f7258540] transition-all duration-200"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-xs text-[#8891a8]">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0a0b14] border border-[#1e2035] rounded px-3 py-2 text-sm text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none focus:[box-shadow:0_0_8px_#f7258540] transition-all duration-200"
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
            className="w-full px-4 py-2 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-sm rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] disabled:opacity-50 transition-all duration-200"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-center text-[#4a5068]">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] transition-all duration-200"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
