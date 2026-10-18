import { useRef } from 'react'
import { Outlet } from 'react-router-dom'
import PublicNav from './PublicNav'
import PublicFooter from './PublicFooter'
import usePublicPageMotion from './usePublicPageMotion'
import './public.css'

export default function PublicLayout() {
  const shellRef = useRef<HTMLDivElement>(null)
  usePublicPageMotion(shellRef)

  return (
    <div className="public" ref={shellRef}>
      <div className="bg" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
      </div>

      <div className="page">
        <PublicNav />
        <Outlet />
        <PublicFooter />
      </div>
    </div>
  )
}
