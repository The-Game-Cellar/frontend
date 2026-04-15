import { Link } from 'react-router-dom';
import { redirectToRegister } from '../services/authService';

export default function Register() {
  return (
    <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center font-mono">
      <div className="bg-[#111220] border border-[#1e2035] rounded-xl p-8 w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-[#e8e4dc] tracking-wider">
            THE GAME CELLAR
          </h1>
          <p className="text-xs text-[#4a5068]">Create your account</p>
        </div>

        <div className="space-y-3 text-xs text-[#8891a8] leading-relaxed">
          <p>
            Registration is handled by our secure auth provider. You&apos;ll be
            redirected to fill in your details, then brought straight back.
          </p>
          <p className="text-[#4a5068]">
            After registering you&apos;ll set up your platforms so we can
            start recommending games right away.
          </p>
        </div>

        <button
          onClick={redirectToRegister}
          className="w-full px-4 py-2 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-sm rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] transition-all duration-200"
        >
          Continue to registration →
        </button>

        <p className="text-xs text-center text-[#4a5068]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[#8891a8] hover:text-[#f72585] hover:[text-shadow:0_0_8px_#f72585] transition-all duration-200"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
