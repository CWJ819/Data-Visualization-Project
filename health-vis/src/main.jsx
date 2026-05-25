import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, theme as antdTheme } from 'antd'
import App from './App.jsx'

try {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ConfigProvider
        theme={{
          algorithm: antdTheme.darkAlgorithm,
          token: {
            colorPrimary: '#00d4aa',
            colorBgBase: '#0a1628',
            borderRadius: 8,
            fontFamily: "'Inter', sans-serif",
          },
        }}
      >
        <App />
      </ConfigProvider>
    </StrictMode>,
  )
} catch (e) {
  // Fallback: render error directly to DOM
  document.getElementById('root').innerHTML = `
    <div style="color:red;padding:40px;background:#0a1628;min-height:100vh">
      <h1>Fatal Error:</h1>
      <pre style="white-space:pre-wrap">${e.message}\n\n${e.stack}</pre>
    </div>`
}
