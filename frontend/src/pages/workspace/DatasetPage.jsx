import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Grid, List, ChevronLeft, ChevronRight } from 'lucide-react'
import axios from 'axios'

// Dataset stats derived from ZIP inspection
const STATIC_STATS = {
  total_images: 204,
  classes: ['healthy', 'parkinson'],
  format: 'JPEG / PNG (RGB)',
  image_size: 'Variable (non-uniform dimensions)',
  source: 'Roboflow — Parkinson Disease Detection v1 (folder format)',
  splits: {
    train:  { healthy: 65, parkinson: 68 },
    valid:  { healthy: 14, parkinson: 17 },
    test:   { healthy: 23, parkinson: 17 },
  },
  note: 'Subject identifiers (V01–V55) appear across splits — potential subject-level leakage. See Model Lab for details.',
}

// Use images from the dataset copied to backend/static
// Falls back to placeholder styling if unavailable
function ImageCard({ src, label, filename }) {
  const [err, setErr] = useState(false)
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      className="relative overflow-hidden border border-border bg-bg group"
    >
      {!err ? (
        <img
          src={src}
          alt={label}
          onError={() => setErr(true)}
          className="w-full h-32 object-cover filter grayscale group-hover:grayscale-0 transition-all duration-300"
          style={{ background: '#0a0b0a' }}
        />
      ) : (
        <div className="w-full h-32 flex items-center justify-center bg-surface">
          <div className="text-center">
            <div className="w-8 h-8 border border-dashed border-muted/40 rounded-full mx-auto mb-2" />
            <p className="text-xs text-muted">spiral</p>
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-bg to-transparent">
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${label === 'healthy' ? 'text-lime' : 'text-purple'}`}>
          {label?.toUpperCase()}
        </span>
      </div>
    </motion.div>
  )
}

function SplitBar({ split, healthy, parkinson }) {
  const total = healthy + parkinson
  const hPct = (healthy / total * 100).toFixed(0)
  const pPct = (parkinson / total * 100).toFixed(0)
  return (
    <div className="mb-5">
      <div className="flex justify-between text-xs mb-2">
        <span className="text-muted uppercase tracking-wider font-bold">{split}</span>
        <span className="text-muted">{total} images</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${hPct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="bg-lime"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pPct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className="bg-purple"
        />
      </div>
      <div className="flex justify-between text-xs mt-1.5">
        <span className="text-lime">{healthy} healthy ({hPct}%)</span>
        <span className="text-purple">{parkinson} parkinson ({pPct}%)</span>
      </div>
    </div>
  )
}

export default function DatasetPage() {
  const [apiStats, setApiStats] = useState(null)
  const [activeClass, setActiveClass] = useState('healthy')
  const [activeSplit, setActiveSplit] = useState('test')

  useEffect(() => {
    axios.get('/api/dataset').then(r => setApiStats(r.data)).catch(() => {})
  }, [])

  const stats = apiStats || STATIC_STATS
  const splits = stats.splits || STATIC_STATS.splits

  // Sample filenames from dataset (from ZIP inspection)
  const SAMPLE_FILES = {
    test: {
      healthy: [
        'V55HO11_png.rf.30fee433bdb010e007067e099420bc61.jpg',
        'V07HE01_png.rf.8385900ad78d41951017891b065dc514.jpg',
        'V09HO01_png.rf.6899e5f8b9a34e4c6534c9407e757b00.jpg',
        'V01HO01_png.rf.8011fde90da79e493b1c1a35bc2c3551.jpg',
        'V04HO01_png.rf.f75f07805307b9e1307da4b6e2f271d6.jpg',
        'V02HE01_png.rf.459ef9b8466cfbc98e3d366817bde435.jpg',
      ],
      parkinson: [
        'V15PE01_png.rf.ef7955f5761e4d55d802abb50b775cff.jpg',
        'V03PE07_png.rf.16c3d2ca1955e84eb75cab2f9c5884ac.jpg',
        'V08PO01_png.rf.ca406672eb94cedd153d6f88692936f9.jpg',
        'V14PE03_png.rf.45c38c5c5185163891ba8525465fe297.jpg',
        'V07PO01_png.rf.11e7aa3971fa64ad5e0dcfa7d73116e1.jpg',
        'V09PE01_png.rf.989619322b0e74cf7c3c4a32e51e19f0.jpg',
      ],
    },
  }

  const sampleFiles = SAMPLE_FILES[activeSplit]?.[activeClass] || []

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <p className="text-xs text-muted tracking-widest mb-2">— DATASET EXPLORER</p>
        <h1 className="font-display font-bold text-4xl">
          Data<br />
          <span className="text-gradient-lime">Laboratory</span>
        </h1>
        <p className="text-sm text-muted mt-3">
          Spiral drawing dataset · {stats.total_images} images · 2 classes · 3 splits
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Distribution bars */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 p-6 border border-border bg-surface"
        >
          <p className="text-xs text-muted tracking-widest mb-6">DATASET DISTRIBUTION BY SPLIT</p>
          <SplitBar split="Train" healthy={splits.train?.healthy || 65} parkinson={splits.train?.parkinson || 68} />
          <SplitBar split="Validation" healthy={splits.valid?.healthy || 14} parkinson={splits.valid?.parkinson || 17} />
          <SplitBar split="Test" healthy={splits.test?.healthy || 23} parkinson={splits.test?.parkinson || 17} />
          <div className="flex gap-4 mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted">Total: <strong className="text-white">{stats.total_images}</strong></span>
            <span className="text-xs text-lime">Healthy: <strong>102</strong></span>
            <span className="text-xs text-purple">Parkinson: <strong>102</strong></span>
            <span className="text-xs text-muted">Balance: <strong className="text-white">50/50</strong></span>
          </div>
        </motion.div>

        {/* Meta info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 border border-border bg-surface"
        >
          <p className="text-xs text-muted tracking-widest mb-5">DATASET METADATA</p>
          <div className="space-y-4">
            {[
              { k: 'Source', v: 'Roboflow v1' },
              { k: 'Format', v: 'Folder (classification)' },
              { k: 'File Types', v: 'JPEG / PNG' },
              { k: 'Dimensions', v: 'Variable (non-uniform)' },
              { k: 'Color Space', v: 'RGB' },
              { k: 'Task', v: 'Binary Classification' },
              { k: 'Classes', v: 'healthy, parkinson' },
              { k: 'Class Balance', v: '50 / 50 (balanced)' },
            ].map(({ k, v }) => (
              <div key={k} className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-xs text-muted">{k}</span>
                <span className="text-xs font-mono text-white">{v}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Warning */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="p-4 border border-yellow-500/20 bg-yellow-500/3 rounded mb-8"
      >
        <p className="text-xs text-yellow-400 font-bold tracking-widest mb-1">⚠ DATA QUALITY NOTE</p>
        <p className="text-xs text-muted">{STATIC_STATS.note}</p>
      </motion.div>

      {/* Image gallery */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-muted tracking-widest">IMAGE GALLERY — SAMPLE EXPLORATION</p>
          <div className="flex gap-2">
            {['healthy', 'parkinson'].map(c => (
              <button
                key={c}
                onClick={() => setActiveClass(c)}
                className={`px-4 py-1.5 text-xs font-bold rounded transition-all capitalize
                  ${activeClass === c
                    ? c === 'healthy' ? 'bg-lime/10 text-lime border border-lime/30' : 'bg-purple/10 text-purple border border-purple/30'
                    : 'border border-border text-muted hover:text-white'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of sample images */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {sampleFiles.map((fname, i) => (
            <ImageCard
              key={fname}
              src={`${import.meta.env.VITE_API_URL || ''}/api/dataset-image/${activeSplit}/${activeClass}/${fname}`}
              label={activeClass}
              filename={fname}
            />
          ))}
          {/* Placeholder cards for remaining counts */}
          {Array.from({ length: Math.max(0, (splits[activeSplit]?.[activeClass] || 0) - sampleFiles.length) }).slice(0, 6).map((_, i) => (
            <div key={`ph-${i}`} className="border border-dashed border-border/30 h-32 flex items-center justify-center">
              <p className="text-xs text-muted/40">+more</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted mt-4 text-center">
          Showing sample images. Connect backend dataset path to serve full gallery.
        </p>
      </div>
    </div>
  )
}
