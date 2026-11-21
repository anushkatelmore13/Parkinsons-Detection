import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import OverviewPage from './workspace/OverviewPage'
import ImageStudioPage from './workspace/ImageStudioPage'
import PredictionsPage from './workspace/PredictionsPage'
import ModelLabPage from './workspace/ModelLabPage'
import DatasetPage from './workspace/DatasetPage'
import NotesPage from './workspace/NotesPage'
import SettingsPage from './workspace/SettingsPage'

export default function WorkspacePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <main className="flex-1 overflow-y-auto relative">
        <Routes>
          <Route index element={<OverviewPage />} />
          <Route path="studio" element={<ImageStudioPage />} />
          <Route path="predictions" element={<PredictionsPage />} />
          <Route path="model" element={<ModelLabPage />} />
          <Route path="dataset" element={<DatasetPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}
