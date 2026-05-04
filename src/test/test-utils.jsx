import { MemoryRouter } from 'react-router-dom';
import AuthProvider from '../context/AuthContext';

export function renderWithProviders(ui, { initialEntries = ['/'] } = {}) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}
