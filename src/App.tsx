import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './screens/Home'
import NewCareer from './screens/NewCareer'
import Game from './screens/Game'
import { useCareer } from './store/careerStore'
import { gespeichertesTheme, wendeThemeAn } from './ui/theme'

/** Hält das Vereinsfarben-Theme synchron mit dem aktuellen Verein (auch nach Transfers). */
function useThemeSync() {
  const vereinId = useCareer((s) => s.career?.vereinId)
  useEffect(() => {
    wendeThemeAn(gespeichertesTheme(), { vereinId: vereinId || undefined, speichern: false })
  }, [vereinId])
}

export default function App() {
  useThemeSync()
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/neu" element={<NewCareer />} />
      <Route path="/spiel" element={<Game />} />
    </Routes>
  )
}
