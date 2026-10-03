import { Route, Routes } from 'react-router-dom'
import Home from './screens/Home'
import NewCareer from './screens/NewCareer'
import Game from './screens/Game'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/neu" element={<NewCareer />} />
      <Route path="/spiel" element={<Game />} />
    </Routes>
  )
}
