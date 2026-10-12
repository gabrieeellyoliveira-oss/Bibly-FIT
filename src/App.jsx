import { useEffect, useState } from 'react'
import Icon from './components/Icon'
import Home from './screens/Home'
import Workouts from './screens/Workouts'
import WorkoutDetail from './screens/WorkoutDetail'
import Photos from './screens/Photos'
import Profile from './screens/Profile'


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
  { path: '/', label: 'Início', icon: 'home' },
  { path: '/treinos', label: 'Treinos', icon: 'dumbbell' },
  { path: '/fotos', label: 'Fotos', icon: 'image' },
  { path: '/perfil', label: 'Perfil', icon: 'user' },
]

export default function App() {
  const route = useRoute()
  const [, section, param] = route.split('/')

  let screen
  if (section === 'treinos' && param) screen = <WorkoutDetail id={decodeURIComponent(param)} />
  else if (section === 'treinos') screen = <Workouts />
  else if (section === 'fotos') screen = <Photos />
  else if (section === 'perfil') screen = <Profile />
  else screen = <Home />

  const active = '/' + (section || '')

  return (
    <div className="app">
      <main className="screen">{screen}</main>
      <nav className="tabbar">
        {TABS.map((t) => {
          const on = active === t.path
          return (
            <a key={t.path} href={'#' + t.path} className={'tab' + (on ? ' tab-on' : '')}>
              <Icon name={t.icon} size={24} fill={on} strokeWidth={on ? 2 : 1.6} />
              <span>{t.label}</span>
            </a>
          )
        })}
      </nav>
    </div>
  )
}
