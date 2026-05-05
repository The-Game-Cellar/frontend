import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import App from './App'
import { queryClient } from './services/queryClient'

let scrollTimer: ReturnType<typeof setTimeout> | undefined

document.addEventListener('scroll', () => {
  document.documentElement.classList.add('is-scrolling')
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => document.documentElement.classList.remove('is-scrolling'), 800)
}, { capture: true, passive: true })

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Missing #root element in index.html')
createRoot(rootEl).render(
  <QueryClientProvider client={queryClient}>
    <App />
    {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-right" />}
  </QueryClientProvider>
)
