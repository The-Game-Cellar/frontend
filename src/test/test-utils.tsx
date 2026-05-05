import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import AuthProvider from '../context/AuthProvider'

interface RenderOptions {
  initialEntries?: string[]
}

export function renderWithProviders(ui: ReactNode, { initialEntries = ['/'] }: RenderOptions = {}) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  )
}
