import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Activity, Cpu, Database, TrendingUp, ArrowRight, Zap, CheckCircle, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import axios from 'axios'
import SpiralCanvas from '../../components/SpiralCanvas'

const LIME = '#C6FF4A'
const PURPLE = '#9B7BFF'

function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 border border-border hover:border-lime/20 transition-colors bg-surface"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded ${accent === 'lime' ? 'bg-lime/10 text-lime' : 'bg-purple/10 text-purple'}`}>
          <Icon size={18} />
        </div>
        {sub && <span className="text-xs text-muted">{sub}</span>}
      </div>
      <div className="font-display font-bold text-3xl text-white mb-1">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </motion.div>
  )
}

export default function OverviewPage() {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [modelStatus, setModelStatus] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [analRes, modelRes, histRes] = await Promise.all([
          axios.get('/api/analytics').catch(() => ({ data: null })),
          axios.get('/api/health').catch(() => ({ data: null })),
          axios.get('/api/history?limit=5').catch(() => ({ data: { items: [] } })),
        ])
        setAnalytics(analRes.data)
        setModelStatus(modelRes.data)
        setHistory(histRes.data?.items || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const pieData = analytics ? [
    { name: 'Healthy', value: analytics.healthy_count, color: LIME },
    { name: "Parkinson's", value: analytics.parkinson_count, color: PURPLE },
  ] : []

  const barData = analytics?.daily_counts?.slice().reverse().map(d => ({
    day: d.day?.slice(5), // MM-DD
    count: d.cnt
  })) || []

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted tracking-widest mb-2">
            — WORKSPACE OVERVIEW
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-bold text-4xl"
          >
            Intelligence<br />
            <span className="text-gradient-lime">Dashboard</span>
          </motion.h1>
        </div>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate('/workspace/studio')}
          className="flex items-center gap-2 px-5 py-2.5 bg-lime text-bg font-bold text-sm rounded hover:bg-lime/90 transition-all"
        >
          Analyze Image <ArrowRight size={14} />
        </motion.button>
      </div>

      {/* Model status banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`flex items-center gap-3 p-4 mb-8 border rounded ${
          modelStatus?.model_loaded
            ? 'border-lime/20 bg-lime/5'
            : 'border-yellow-500/20 bg-yellow-500/5'
        }`}
      >
        {modelStatus?.model_loaded ? (
          <CheckCircle size={16} className="text-lime shrink-0" />
        ) : (
          <AlertCircle size={16} className="text-yellow-400 shrink-0" />
        )}
        <div className="flex-1">
          {modelStatus?.model_loaded ? (
            <span className="text-sm text-lime font-medium">
              Multi-Model Suite loaded (Ultralytics YOLO11, ResNet50, VGG16, Custom CNN) · Live inference active
            </span>
          ) : (
            <span className="text-sm text-yellow-400 font-medium">
              Training models — Check <code className="bg-black/30 px-1 rounded">backend/model/</code> for checkpoints
            </span>
          )}
        </div>
        <span className={`text-xs px-2 py-1 rounded font-mono ${modelStatus?.model_loaded ? 'bg-lime/10 text-lime' : 'bg-yellow-500/10 text-yellow-400'}`}>
          YOLO11 Suite
        </span>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Analyses"
          value={analytics?.total_predictions ?? '—'}
          icon={Activity}
          accent="lime"
        />
        <StatCard
          label="Healthy Classified"
          value={analytics?.healthy_count ?? '—'}
          sub={analytics ? `${((analytics.healthy_count / (analytics.total_predictions || 1)) * 100).toFixed(0)}%` : ''}
          icon={TrendingUp}
          accent="lime"
        />
        <StatCard
          label="Parkinson's Classified"
          value={analytics?.parkinson_count ?? '—'}
          sub={analytics ? `${((analytics.parkinson_count / (analytics.total_predictions || 1)) * 100).toFixed(0)}%` : ''}
          icon={Zap}
          accent="purple"
        />
        <StatCard
          label="Avg Inference"
          value={analytics?.avg_inference_time_ms ? `${analytics.avg_inference_time_ms}ms` : '—'}
          sub="per image"
          icon={Cpu}
          accent="purple"
        />
      </div>

      {/* Charts + Spiral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 p-6 border border-border bg-surface"
        >
          <p className="text-xs text-muted tracking-widest mb-6">DAILY ANALYSIS ACTIVITY</p>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barCategoryGap="40%">
                <XAxis dataKey="day" stroke="#888B83" tick={{ fontSize: 11 }} />
                <YAxis stroke="#888B83" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1B1D19', border: '1px solid #2A2D26', borderRadius: 4, fontSize: 12 }}
                  labelStyle={{ color: '#F3F2EC' }}
                  itemStyle={{ color: '#C6FF4A' }}
                />
                <Bar dataKey="count" fill={LIME} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted text-sm">
              No activity yet — run your first analysis
            </div>
          )}
        </motion.div>

        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 border border-border bg-surface flex flex-col"
        >
          <p className="text-xs text-muted tracking-widest mb-6">PREDICTION DISTRIBUTION</p>
          {analytics?.total_predictions > 0 ? (
            <div className="flex-1 flex flex-col items-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-6 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs text-muted">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="opacity-30">
                <SpiralCanvas size={140} interactive={false} />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent history */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="border border-border bg-surface"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <p className="text-xs text-muted tracking-widest">RECENT ANALYSES</p>
          <button
            onClick={() => navigate('/workspace/predictions')}
            className="text-xs text-lime hover:underline"
          >
            View all →
          </button>
        </div>
        {history.length === 0 ? (
          <div className="p-10 text-center text-muted text-sm">
            No analyses yet. Upload an image in the Image Studio.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {history.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/2 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">{item.filename}</p>
                  <p className="text-xs text-muted mt-0.5">{new Date(item.timestamp).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    item.predicted_class === 'healthy' ? 'bg-lime/10 text-lime' : 'bg-purple/10 text-purple'
                  }`}>
                    {item.predicted_class?.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted font-mono">
                    {(item.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Architecture summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-6 border border-border bg-surface"
      >
        <p className="text-xs text-muted tracking-widest mb-5">MODEL ARCHITECTURE SUMMARY</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Champion Model', value: 'YOLO11n-cls' },
            { label: 'Suite Models', value: '4 Architectures' },
            { label: 'Input Sizes', value: '224 / 640 px' },
            { label: 'Comparison', value: 'YOLO11 vs ResNet/VGG/CNN' },
            { label: 'Frameworks', value: 'Ultralytics + PyTorch' },
            { label: 'Test Accuracy', value: '85.0% (Champion)' },
            { label: 'Test F1 Score', value: '82.35% (Champion)' },
            { label: 'Classes', value: 'healthy / parkinson' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-muted mb-1">{item.label}</p>
              <p className="text-sm font-bold text-white font-mono">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
