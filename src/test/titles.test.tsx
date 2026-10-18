import { describe, it, expect, afterEach } from 'vitest'
import { useState } from 'react'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from './server'
import AuthProvider from '../context/AuthProvider'
import AppRoutes from '../AppRoutes'

const API = 'http://api.test'
// Vitest runs from the frontend root, where index.html and public/ live.
const ROOT = process.cwd()

function renderAt(path: string) {
  function Harness() {
    const [queryClient] = useState(
      () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } } }),
    )
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }
  return render(<Harness />)
}

describe('Tab titles', () => {
  afterEach(() => {
    document.title = ''
  })

  it.each([
    ['/dashboard', 'Dashboard'],
    ['/library', 'Library'],
    ['/recommendations', 'Recommend'],
    ['/explore', 'Explore'],
    ['/wildcard', 'Wild Card'],
    ['/profile', 'Account'],
    ['/profile/statistics', 'Statistics'],
    ['/profile/preferences', 'Preferences'],
    ['/about', 'About'],
    ['/privacy', 'Privacy'],
  ])('names %s after its page', async (path, page) => {
    renderAt(path)
    await waitFor(() => expect(document.title).toBe(`${page} · The Game Cellar`))
  })

  it('names onboarding for an account that has not finished it', async () => {
    server.use(http.get(`${API}/api/v1/library/onboarding`, () => HttpResponse.json({ completed: false, completedAt: null })))
    renderAt('/onboarding')
    await waitFor(() => expect(document.title).toBe('Onboarding · The Game Cellar'))
  })

  it('names the front page after the product alone', async () => {
    server.use(
      http.get(`${API}/api/v1/auth/me`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${API}/api/v1/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
    )
    renderAt('/')
    await waitFor(() => expect(document.title).toBe('The Game Cellar'))
  })

  it('names a game page after the game once it has loaded', async () => {
    let release: () => void = () => {}
    const loaded = new Promise<void>((r) => { release = r })
    server.use(
      http.get(`${API}/api/v1/games/12345`, async () => {
        await loaded
        return HttpResponse.json({ igdbId: 12345, name: 'Hollow Knight', genres: [], platforms: [], screenshotUrls: [], videoIds: [] })
      }),
      http.get(`${API}/api/v1/recommendations/similar/12345`, () => HttpResponse.json([])),
    )
    renderAt('/games/12345')
    await waitFor(() => expect(document.title).toBe('Game · The Game Cellar'))
    release()
    await waitFor(() => expect(document.title).toBe('Hollow Knight · The Game Cellar'))
  })
})

describe('index.html', () => {
  const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8')
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const meta = (attr: string, value: string) => doc.querySelector(`meta[${attr}="${value}"]`)?.getAttribute('content')
  const LEDE = 'Track every game you have played, want to play, or gave up on. Then let the cellar suggest what to pick up next, built from your own shelf rather than the charts.'

  it('names the product in the tab before any page has loaded', () => {
    expect(doc.title).toBe('The Game Cellar')
  })

  it('describes the product with the hero\'s lede, for search results and shared links', () => {
    expect(meta('name', 'description')).toBe(LEDE)
    expect(meta('property', 'og:description')).toBe(LEDE)
    expect(meta('property', 'og:title')).toBe('The Game Cellar')
    expect(meta('property', 'og:type')).toBe('website')
    expect(meta('property', 'og:url')).toBe('https://gamecellar.app/')
    expect(meta('property', 'og:image')).toBe('https://gamecellar.app/og-image.png')
  })

  it('colours the mobile browser bar with the page background', () => {
    expect(meta('name', 'theme-color')).toBe('#0a0b14')
  })

  it('links every icon, and every icon it links exists', () => {
    const icons = Array.from(doc.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')).map((l) => l.getAttribute('href'))
    expect(icons).toEqual(['/favicon.svg', '/favicon-32.png', '/favicon-16.png', '/apple-touch-icon.png'])
    ;[...icons, '/og-image.png'].forEach((href) => expect(existsSync(resolve(ROOT, 'public', href!.slice(1)))).toBe(true))
  })

  it('loads the entry script the source tree actually has', () => {
    const src = doc.querySelector('script[type="module"]')?.getAttribute('src')
    expect(src).toBe('/src/main.tsx')
    expect(existsSync(resolve(ROOT, src!.slice(1)))).toBe(true)
  })

  it('draws the favicon as the static stair-line tube, with no filter and no animation', () => {
    const svg = readFileSync(resolve(ROOT, 'public/favicon.svg'), 'utf8')
    const lines = Array.from(new DOMParser().parseFromString(svg, 'image/svg+xml').querySelectorAll('polyline'))
    expect(lines.map((l) => [l.getAttribute('stroke-width'), l.getAttribute('stroke-opacity'), l.getAttribute('points')])).toEqual([
      ['4.2', '.35', '2,5 8.5,5 8.5,12 15.5,12 15.5,19 22,19'],
      ['1.6', null, '2,5 8.5,5 8.5,12 15.5,12 15.5,19 22,19'],
    ])
    expect(svg).not.toMatch(/<filter|<animate/)
  })
})
