import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// `createRoot` conecta React con el div#root del archivo index.html.
createRoot(document.getElementById('root')).render(
  // `StrictMode` ayuda a detectar malas prácticas durante desarrollo.
  <StrictMode>
    {/* Aquí renderizamos el componente principal de la aplicación. */}
    <App />
  </StrictMode>,
)
