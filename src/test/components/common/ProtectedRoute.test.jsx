import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../../server';
import AuthProvider from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/common/ProtectedRoute';

const API = 'http://api.test';

function Harness({ initialPath }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>login-page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>dashboard-page</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('renders the child route when authenticated', async () => {
    render(<Harness initialPath="/dashboard" />);
    await waitFor(() => expect(screen.getByText('dashboard-page')).toBeInTheDocument());
  });

  it('redirects to /login when not authenticated', async () => {
    server.use(
      http.get(`${API}/api/v1/auth/me`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${API}/api/v1/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
    );
    render(<Harness initialPath="/dashboard" />);
    await waitFor(() => expect(screen.getByText('login-page')).toBeInTheDocument());
    expect(screen.queryByText('dashboard-page')).not.toBeInTheDocument();
  });
});
