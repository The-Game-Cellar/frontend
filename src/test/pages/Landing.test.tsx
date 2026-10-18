import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import AuthProvider from '../../context/AuthProvider'
import Landing from '../../pages/Landing'
import PublicLayout from '../../components/public/PublicLayout'
import Privacy from '../../pages/Privacy'

const API = 'http://api.test'

function signedOut() {
  server.use(
    http.get(`${API}/api/v1/auth/me`, () => new HttpResponse(null, { status: 401 })),
    http.post(`${API}/api/v1/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
  )
}

async function renderLanding() {
  signedOut()
  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
  await screen.findByRole('heading', { level: 1, name: /your backlog/i })
}

function renderPrivacy() {
  render(
    <MemoryRouter initialEntries={['/privacy']}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/privacy" element={<Privacy />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Landing page', () => {
  it('offers Log in as a link to the sign-in', async () => {
    await renderLanding()
    const nav = screen.getByRole('banner')
    expect(within(nav).getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login')
  })

  it('shows Coming soon in the nav, the hero and the closing, never as a link or a button', async () => {
    await renderLanding()
    const soon = screen.getAllByText('Coming soon', { selector: '.btn' })
    expect(soon).toHaveLength(3)
    soon.forEach((el) => {
      expect(el).toHaveAttribute('aria-disabled', 'true')
      expect(el.closest('a, button')).toBeNull()
    })
  })

  it('scrolls to the rooms from the hero', async () => {
    await renderLanding()
    expect(screen.getByRole('link', { name: 'See how it works' })).toHaveAttribute('href', '#rooms')
    expect(document.getElementById('rooms')).not.toBeNull()
  })

  it('links the privacy policy, the contact address and IGDB from the footer, and no terms yet', async () => {
    await renderLanding()
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy')
    expect(within(footer).getByRole('link', { name: 'Contact' })).toHaveAttribute('href', 'mailto:hello@gamecellar.app')
    expect(within(footer).getByRole('link', { name: 'IGDB' })).toHaveAttribute('href', 'https://www.igdb.com')
    expect(within(footer).queryByRole('link', { name: /terms/i })).not.toBeInTheDocument()
  })

  it('carries the four rooms in the rail and one window each', async () => {
    await renderLanding()
    const rail = screen.getByRole('navigation', { name: 'Rooms' })
    expect(within(rail).getAllByRole('link').map((a) => a.textContent)).toEqual(['Library', 'Dusty', 'Recommend', 'Explore'])
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Library', 'Explore', 'Recommend', 'Dusty'])
  })

  it('draws every cover from IGDB at the cover size the mosaic uses', async () => {
    await renderLanding()
    const covers = Array.from(document.querySelectorAll('img')).map((img) => img.getAttribute('src') ?? '')
    expect(covers.length).toBeGreaterThan(0)
    covers.forEach((src) => expect(src).toMatch(/^https:\/\/images\.igdb\.com\/igdb\/image\/upload\/t_cover_small_2x\/[a-z0-9]+\.jpg$/))
  })
})

describe('The shared public nav and footer on /privacy', () => {
  it('shows the same Log in link and inert Coming soon as the front page', () => {
    renderPrivacy()
    const nav = document.querySelector('header.nav') as HTMLElement
    expect(within(nav).getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login')
    const soon = within(nav).getByText('Coming soon')
    expect(soon).toHaveAttribute('aria-disabled', 'true')
    expect(soon.closest('a, button')).toBeNull()
  })

  it('carries the footer without a terms link', () => {
    renderPrivacy()
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByRole('link', { name: 'Contact' })).toHaveAttribute('href', 'mailto:hello@gamecellar.app')
    expect(within(footer).queryByRole('link', { name: /terms/i })).not.toBeInTheDocument()
  })
})
