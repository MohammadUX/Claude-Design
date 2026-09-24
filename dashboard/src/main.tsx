import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/500.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import './index.css'
import App from './App.tsx'
import { RegistrationProvider } from './state/registrations.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RegistrationProvider>
      {import.meta.env.MODE === 'artifact' ? (
        <MemoryRouter initialEntries={['/events']}>
          <App />
        </MemoryRouter>
      ) : (
        <BrowserRouter>
          <App />
        </BrowserRouter>
      )}
    </RegistrationProvider>
  </StrictMode>,
)
