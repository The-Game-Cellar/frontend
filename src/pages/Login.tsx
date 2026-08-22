import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import AttributionFooter from '../components/common/AttributionFooter'
import { startLogin } from '../services/authService'

export default function Login() {
  const [searchParams] = useSearchParams()
  const failed = searchParams.get('error') !== null

  // No form here: the password is typed on Keycloak and never reaches this origin.
  useEffect(() => {
    if (!failed) startLogin()
  }, [failed])

  if (!failed) return null

  return (
    <div className="min-h-screen bg-[#0a0b14] flex flex-col items-center justify-center font-mono">
      <div className="bg-[#111220] border border-[#1e2035] rounded-xl p-8 w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-[#e8e4dc] tracking-wider">
            THE GAME CELLAR
          </h1>
          <p className="text-xs text-[#4a5068]">Sign in to your account</p>
        </div>

        <p className="text-xs text-[#ef4444] bg-[#ef444410] border border-[#ef444430] rounded px-3 py-2">
          That sign-in did not complete. It may have taken too long, or been started
          from a stale tab.
        </p>

        <button
          type="button"
          onClick={() => startLogin()}
          className="w-full px-4 py-2 bg-[#f7258515] border border-[#f72585] text-[#f72585] text-sm rounded [box-shadow:0_0_8px_#f72585,0_0_20px_#f7258540] hover:[box-shadow:0_0_12px_#f72585,0_0_30px_#f7258550] active:scale-[0.97] transition-[box-shadow,transform] duration-200"
        >
          Try again
        </button>
      </div>
      <div className="mt-6">
        <AttributionFooter />
      </div>
    </div>
  )
}
