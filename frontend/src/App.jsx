import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import LandingPage from './pages/LandingPage'
import WorkspacePage from './pages/WorkspacePage'

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/workspace/*" element={<WorkspacePage />} />
      </Routes>
    </AnimatePresence>
  )
}
