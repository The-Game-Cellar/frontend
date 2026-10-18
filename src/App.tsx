import { BrowserRouter } from 'react-router-dom'

import AuthProvider from './context/AuthProvider'
import PostLoginTransition from './components/common/PostLoginTransition'
import AppRoutes from './AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PostLoginTransition />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
