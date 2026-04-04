import { StrictMode } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import App from './App'
import { AuthProvider } from './context/AuthContext'

/**
 * @param {string} _url
 * @param {import('react-dom/server').RenderToPipeableStreamOptions} [options]
 */
export function render(_url, options) {
  return renderToPipeableStream(
    <StrictMode>
      <StaticRouter location={_url}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </StaticRouter>
    </StrictMode>,
    options,
  )
}
