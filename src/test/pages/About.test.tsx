import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import About from '../../pages/About'

describe('About page', () => {
  it('renders the about heading', () => {
    render(<MemoryRouter><About /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /^about$/i, level: 1 })).toBeInTheDocument()
  })

  it('attributes IGDB with a discoverable external link', () => {
    render(<MemoryRouter><About /></MemoryRouter>)
    const igdbLink = screen.getByRole('link', { name: /igdb/i })
    expect(igdbLink).toHaveAttribute('href', 'https://www.igdb.com')
    expect(igdbLink).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })
})
