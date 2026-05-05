import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils'
import Onboarding from '../../pages/Onboarding'

function renderOnboarding() {
  return render(renderWithProviders(<Onboarding />))
}

describe('Onboarding page', () => {
  it('renders the platform grid', () => {
    renderOnboarding()
    expect(screen.getByText(/welcome to the cellar/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'PC' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'PlayStation 5' })).toBeInTheDocument()
  })

  it('reflects the selection count in the finish button', async () => {
    const user = userEvent.setup()
    renderOnboarding()
    await user.click(screen.getByRole('button', { name: 'PC' }))
    expect(screen.getByRole('button', { name: /enter the cellar \(1 selected\)/i })).toBeInTheDocument()
  })
})
