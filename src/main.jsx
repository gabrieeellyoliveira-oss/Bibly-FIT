import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import Login from './screens/Login'
import { AuthProvider, useAuth } from './lib/auth'
import { StoreProvider } from './lib/store'
import './styles.css'

function Root() {
  const { cloud, ready, user, recovering } = useAuth()
  if (!ready) {
    return (
      <div className="splash">
        <div className="brand">bibly</div>
      </div>
    )
  }
  if (cloud && (!user || recovering)) return <Login />
  return (
    <StoreProvider key={user?.id || 'local'} user={user}>
      <App />
    </StoreProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>,
)
