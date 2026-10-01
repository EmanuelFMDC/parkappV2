import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'

async function boot() {
  // No backend yet (D-014): the API lives in the browser. Remove the flag to talk to a real server.
  // DEV and MODE are replaced at build time, so in a production build this whole branch (and the
  // mock API chunk behind it) is removed from the bundle.
  const mockAllowed = import.meta.env.DEV || import.meta.env.MODE === 'e2e'
  if (mockAllowed && import.meta.env.VITE_USE_MOCK_API === 'true') {
    const { startMockApi } = await import('./mocks/browser')
    await startMockApi()
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void boot()
