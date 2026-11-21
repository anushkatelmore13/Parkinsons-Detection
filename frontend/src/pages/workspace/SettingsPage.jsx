import { motion } from 'framer-motion'
import { Server, Database, Cpu, Globe, Shield } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <p className="text-xs text-muted tracking-widest mb-2">— SETTINGS</p>
        <h1 className="font-display font-bold text-4xl">
          System<br />
          <span className="text-gradient-lime">Configuration</span>
        </h1>
      </div>

      <div className="space-y-6">
        {/* API Config */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="border border-border bg-surface">
          <div className="flex items-center gap-3 p-5 border-b border-border">
            <Server size={16} className="text-lime" />
            <p className="font-semibold text-sm">Backend API</p>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'API Base URL', value: 'http://localhost:8000', editable: true },
              { label: 'Health Endpoint', value: '/api/health', editable: false },
              { label: 'Predict Endpoint', value: 'POST /api/predict', editable: false },
              { label: 'History Endpoint', value: 'GET /api/history', editable: false },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted w-40">{item.label}</span>
                <span className="text-sm font-mono text-white bg-bg border border-border rounded px-3 py-1.5 flex-1">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Model Config */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="border border-border bg-surface">
          <div className="flex items-center gap-3 p-5 border-b border-border">
            <Cpu size={16} className="text-purple" />
            <p className="font-semibold text-sm">Model Configuration</p>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Model Path', value: 'backend/model/best.pt' },
              { label: 'Architecture', value: 'YOLOv8n-cls' },
              { label: 'Input Size', value: '640 × 640' },
              { label: 'Classes', value: 'healthy, parkinson' },
              { label: 'Max Upload Size', value: '10 MB' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted w-40">{item.label}</span>
                <span className="text-sm font-mono text-white bg-bg border border-border rounded px-3 py-1.5 flex-1">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Database */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="border border-border bg-surface">
          <div className="flex items-center gap-3 p-5 border-b border-border">
            <Database size={16} className="text-lime" />
            <p className="font-semibold text-sm">Database</p>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Engine', value: 'SQLite' },
              { label: 'Database File', value: 'backend/traceform.db' },
              { label: 'Table', value: 'predictions' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted w-40">{item.label}</span>
                <span className="text-sm font-mono text-white bg-bg border border-border rounded px-3 py-1.5 flex-1">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="p-5 border border-lime/10 bg-lime/3 rounded">
          <div className="flex gap-3">
            <Shield size={16} className="text-lime shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-lime font-bold tracking-widest mb-2">RESEARCH PLATFORM DISCLAIMER</p>
              <p className="text-xs text-muted leading-relaxed">
                TRACEFORM is an academic research and demonstration platform. It is not a certified medical device.
                All inferences are experimental. Never use results for clinical decisions.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
