import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Trash2, Download, Filter, ChevronDown, Eye } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

function ProbMiniBar({ value, color }) {
  return (
    <div className="w-20 h-1 bg-border rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${value * 100}%`, background: color }} />
    </div>
  )
}

function DetailModal({ item, onClose, onDownload }) {
  if (!item) return null
  const isHealthy = item.predicted_class === 'healthy'
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-surface border border-border rounded p-8 max-w-md w-full"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs text-muted tracking-widest mb-1">ANALYSIS DETAIL</p>
            <p className="font-display font-bold text-xl">{item.filename}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">✕</button>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted">Predicted Class</span>
            <span className="text-sm font-bold" style={{ color: isHealthy ? '#C6FF4A' : '#9B7BFF' }}>
              {item.predicted_class?.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">Confidence</span>
            <span className="text-sm font-mono text-white">{(item.confidence * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">Healthy Prob</span>
            <span className="text-sm font-mono text-white">{(item.healthy_prob * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">Parkinson Prob</span>
            <span className="text-sm font-mono text-white">{(item.parkinson_prob * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">Model</span>
            <span className="text-sm font-mono text-white">{item.model_used}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">Inference Time</span>
            <span className="text-sm font-mono text-white">{item.inference_time_ms}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">Timestamp</span>
            <span className="text-sm font-mono text-white text-right">{new Date(item.timestamp).toLocaleString()}</span>
          </div>
        </div>
        <div className="mt-6 p-3 border border-lime/10 rounded">
          <p className="text-xs text-muted">⚠ Experimental research classification. Not a medical diagnosis.</p>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => onDownload(item)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-lime text-bg text-xs font-bold rounded hover:bg-lime/90 transition-all"
          >
            <Download size={13} /> Export PDF Report
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 border border-border text-muted text-xs font-bold rounded hover:text-white transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function PredictionsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/history?limit=200')
      setItems(data.items || [])
    } catch {
      toast.error('Could not load history')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/history/${id}`)
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success('Record deleted.')
    } catch {
      toast.error('Delete failed.')
    }
  }

  const handleDownload = async (item) => {
    try {
      const res = await axios.get(`/api/report/${item.id}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Traceform_Report_${item.id}_${item.predicted_class}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Report downloaded')
    } catch {
      toast.error('Failed to download report')
    }
  }

  const filtered = items.filter(item => {
    const matchSearch = item.filename?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || item.predicted_class === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <p className="text-xs text-muted tracking-widest mb-2">— PREDICTION HISTORY</p>
        <h1 className="font-display font-bold text-4xl">
          Analysis<br />
          <span className="text-gradient-lime">Records</span>
        </h1>
        <p className="text-sm text-muted mt-3">{items.length} total experiments logged</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by filename…"
            className="w-full bg-surface border border-border rounded pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:border-lime/40 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'healthy', 'parkinson'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 text-xs font-bold rounded transition-all capitalize
                ${filter === f
                  ? f === 'healthy' ? 'bg-lime/10 text-lime border border-lime/30'
                    : f === 'parkinson' ? 'bg-purple/10 text-purple border border-purple/30'
                    : 'bg-white/10 text-white border border-white/20'
                  : 'border border-border text-muted hover:text-white'}`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-border bg-surface rounded overflow-hidden"
      >
        <div className="grid grid-cols-[1fr_120px_120px_120px_90px_100px] gap-4 px-6 py-3 border-b border-border text-xs text-muted uppercase tracking-widest">
          <span>Filename</span>
          <span>Class</span>
          <span>Confidence</span>
          <span>Probabilities</span>
          <span>Time</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm">
            {items.length === 0 ? 'No analyses yet — run your first experiment in Image Studio' : 'No results match your filter'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item, i) => {
              const isH = item.predicted_class === 'healthy'
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-[1fr_120px_120px_120px_90px_100px] gap-4 px-6 py-4 items-center hover:bg-white/2 transition-colors"
                >
                  <div>
                    <p className="text-sm text-white font-medium truncate">{item.filename}</p>
                    <p className="text-xs text-muted mt-0.5">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded w-fit ${isH ? 'bg-lime/10 text-lime' : 'bg-purple/10 text-purple'}`}>
                    {item.predicted_class?.toUpperCase()}
                  </span>
                  <span className="text-sm font-mono text-white">{(item.confidence * 100).toFixed(1)}%</span>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted w-6">H</span>
                      <ProbMiniBar value={item.healthy_prob} color="#C6FF4A" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted w-6">P</span>
                      <ProbMiniBar value={item.parkinson_prob} color="#9B7BFF" />
                    </div>
                  </div>
                  <span className="text-xs font-mono text-muted">{item.inference_time_ms?.toFixed(0)}ms</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelected(item)}
                      title="View Details"
                      className="p-1.5 text-muted hover:text-white transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleDownload(item)}
                      title="Export PDF Report"
                      className="p-1.5 text-muted hover:text-lime transition-colors"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Delete Entry"
                      className="p-1.5 text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {selected && (
          <DetailModal
            item={selected}
            onClose={() => setSelected(null)}
            onDownload={handleDownload}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
