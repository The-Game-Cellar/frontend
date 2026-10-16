import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PublicLayout from '../../components/public/PublicLayout'
import Privacy from '../../pages/Privacy'

function renderPrivacy() {
  return render(
    <MemoryRouter initialEntries={['/privacy']}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/privacy" element={<Privacy />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('Privacy page', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
    vi.restoreAllMocks()
  })

  it('renders the policy heading', () => {
    renderPrivacy()
    expect(screen.getByRole('heading', { name: /what the cellar keeps about you/i, level: 1 })).toBeInTheDocument()
  })

  it('lists every section in the contents, each pointing at its section', () => {
    renderPrivacy()
    const contents = screen.getByRole('navigation', { name: /on this page/i })
    const links = within(contents).getAllByRole('link')
    expect(links).toHaveLength(8)
    links.forEach((link) => {
      const id = link.getAttribute('href')?.slice(1) ?? ''
      expect(document.getElementById(id)).not.toBeNull()
    })
  })

  it('scrolls a deep link to its section', () => {
    const scroll = vi.spyOn(HTMLElement.prototype, 'scrollIntoView')
    window.history.replaceState(null, '', '/privacy#rights')
    renderPrivacy()
    expect(scroll.mock.contexts).toContain(document.getElementById('rights'))
  })

  // A crafted link must not take the page down.
  it('still renders when the fragment is a malformed escape', () => {
    window.history.replaceState(null, '', '/privacy#%')
    renderPrivacy()
    expect(screen.getByRole('heading', { name: /what the cellar keeps about you/i, level: 1 })).toBeInTheDocument()
  })

  it('marks the footer Privacy link as the current page', () => {
    renderPrivacy()
    expect(screen.getByRole('link', { name: /^privacy$/i })).toHaveAttribute('aria-current', 'page')
  })
})
