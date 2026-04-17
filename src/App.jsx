import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AuthProvider from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Callback from './pages/Callback';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Recommendations from './pages/Recommendations';
import Explore from './pages/Explore';
import WildCard from './pages/WildCard';
import Profile from './pages/Profile';
import GameDetail from './pages/GameDetail';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Protected routes — redirect to /login if not authenticated */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/library" element={<Library />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/wildcard" element={<WildCard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/games/:rawgId" element={<GameDetail />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
