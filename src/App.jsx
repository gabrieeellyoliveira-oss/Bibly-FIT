import { useEffect, useState } from 'react'
import Icon3D from './components/Icon3D'
import Home from './screens/Home'
import Workouts from './screens/Workouts'
import WorkoutDetail from './screens/WorkoutDetail'
import Photos from './screens/Photos'
import Profile from './screens/Profile'
import Evolution from './screens/Evolution'

function useRoute() {
  const read = () => location.hash.replace(/^#/, '') || '/'
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => {
      setRoute(read())
      window.scrollTo(0, 0)
    }
    addEventListener('hashchange', onChange)
    return () => removeEventListener('hashchange', onChange)
  }, [])
  return route
}

const TABS = [
  { path: '/', label: 'Início', icon: 'home', match: ['', 'evolucao'] },
  { path: '/treinos', label: 'Treinos', icon: 'dumbbell', match: ['treinos'] },
  { path: '/fotos', label: 'Fotos', icon: 'photo', match: ['fotos'] },
  { path: '/perfil', label: 'Perfil', icon: 'user', match: ['perfil'] },
]

export default function App() {
  const route = useRoute()
  const [path, query = ''] = route.split('?')
  const [, section = '', param] = path.split('/')

  let screen
  if (section === 'treinos' && param) screen = <WorkoutDetail id={decodeURIComponent(param)} query={query} />
  else if (section === 'treinos') screen = <Workouts query={query} />
  else if (section === 'fotos') screen = <Photos query={query} />
  else if (section === 'perfil') screen = <Profile />
  else if (section === 'evolucao') screen = <Evolution query={query} />
  else screen = <Home />

  return (
    <div className="app">
      <main className="screen" key={path}>
        {screen}
      </main>
      <nav className="tabbar" aria-label="Navegação principal">
        {TABS.map((t) => {
          const on = t.match.includes(section)
          return (
            <a key={t.path} href={'#' + t.path} className={'tab' + (on ? ' tab-on' : '')} aria-current={on ? 'page' : undefined}>
              <span className="tab-pedestal" aria-hidden="true" />
              <Icon3D name={t.icon} size={30} muted={!on} />
              <span>{t.label}</span>
            </a>
          )
        })}
      </nav>
    </div>
  )
}
