import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './lib/auth/AuthProvider'
import { BasketProvider } from './lib/basket/BasketProvider'
import { ThemeProvider } from './lib/theme/ThemeProvider'
import { SiteSettingsProvider } from './lib/settings/SiteSettingsProvider'
import { ContentBlocksProvider } from '@/lib/content/ContentBlocks'
import { CookieConsentProvider } from './lib/cookies/CookieConsentProvider'
import './index.css'

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root not found')
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <SiteSettingsProvider>
            <CookieConsentProvider>
              <ContentBlocksProvider>
                <BasketProvider>
                  <App />
                </BasketProvider>
              </ContentBlocksProvider>
            </CookieConsentProvider>
          </SiteSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
