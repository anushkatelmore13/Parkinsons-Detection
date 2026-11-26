import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, X, RefreshCw, Scan, Image as ImageIcon,
  AlertCircle, CheckCircle, Clock, Zap, Download, Eye, RotateCcw,
  Sparkles, Layers
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import SpiralCanvas from '../../components/SpiralCanvas'

const STEPS = ['Validating image', 'Selecting architecture', 'Extracting spiral features', 'Computing class logits', 'Complete']

const MODEL_OPTIONS = [
  { id: 'yolo11', label: 'Ultralytics YOLO11n-cls', badge: 'CHAMPION (85.0%)', color: '#C6FF4A' },
  { id: 'vgg16', label: 'VGG16 Transfer', badge: 'DEEP CNN (82.5%)', color: '#9B7BFF' },
  { id: 'resnet50', label: 'ResNet50 Transfer', badge: 'RESIDUAL (80.0%)', color: '#9B7BFF' },
  { id: 'custom_cnn', label: 'Custom 4-Block CNN', badge: 'SCRATCH (57.5%)', color: '#C6FF4A' },
  { id: 'compare', label: '4-Way Comparison & Consensus', badge: 'ALL 4 MODELS', color: '#C6FF4A' },
]

function ProbBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted">{label}</span>
        <span className="font-mono font-bold" style={{ color }}>{(value * 100).toFixed(2)}%</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
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
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-surface border border-border rounded-none p-8 max-w-lg w-full space-y-6"
      >
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <p className="text-xs text-lime font-mono tracking-widest mb-1">EMPIRICAL ANALYSIS REPORT</p>
            <p className="font-display font-bold text-xl text-white truncate max-w-xs">{item.filename}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors text-lg">✕</button>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between py-1.5 border-b border-border/40">
            <span className="text-muted">Target Classification:</span>
            <span className="font-bold uppercase" style={{ color: isHealthy ? '#C6FF4A' : '#9B7BFF' }}>
              {item.predicted_class}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border/40">
            <span className="text-muted">Confidence Score:</span>
            <span className="text-white font-bold">{(item.confidence * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border/40">
            <span className="text-muted">Healthy Probability:</span>
            <span className="text-lime">{(item.healthy_prob * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border/40">
            <span className="text-muted">Parkinson Probability:</span>
            <span className="text-purple">{(item.parkinson_prob * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border/40">
            <span className="text-muted">Model Architecture:</span>
            <span className="text-white">{item.model_used || 'Ultralytics YOLO11n-cls'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border/40">
            <span className="text-muted">Execution Latency:</span>
            <span className="text-white">{item.inference_time_ms} ms</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border/40">
            <span className="text-muted">Analysis Timestamp:</span>
            <span className="text-muted">{new Date(item.timestamp).toUTCString()}</span>
          </div>
        </div>

        <div className="p-3 border border-yellow-500/20 bg-yellow-500/5">
          <p className="text-[11px] text-yellow-300 leading-relaxed">
            ⚠ Experimental AI classification for visual intelligence research. Not intended for clinical or diagnostic use.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onDownload}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-lime text-bg font-bold text-xs rounded hover:bg-lime/90 transition-all"
          >
            <Download size={14} /> Download PDF Report
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

function ScanOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #C6FF4A, transparent)' }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute left-0 right-0 h-16 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, transparent, rgba(198,255,74,0.08), transparent)' }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

export default function ImageStudioPage() {
  const [file, setFile]                 = useState(null)
  const [preview, setPreview]           = useState(null)
  const [selectedModel, setSelectedModel] = useState('yolo11')
  const [analyzing, setAnalyzing]       = useState(false)
  const [stepIdx, setStepIdx]           = useState(-1)
  const [result, setResult]             = useState(null)
  const [error, setError]               = useState(null)
  const [showDetails, setShowDetails]   = useState(false)

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      toast.error('Invalid file. Use JPEG, PNG or WebP up to 10 MB.')
      return
    }
    const f = accepted[0]
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError(null)
    setStepIdx(-1)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/bmp': [] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
  })

  const removeFile = () => {
    setFile(null); setPreview(null); setResult(null); setError(null); setStepIdx(-1)
  }

  const analyze = async () => {
    if (!file) return
    setAnalyzing(true)
    setResult(null)
    setError(null)
    setStepIdx(0)

    for (let i = 1; i < STEPS.length - 1; i++) {
      await new Promise(r => setTimeout(r, 250))
      setStepIdx(i)
    }

    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await axios.post(`/api/predict?model=${selectedModel}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setStepIdx(STEPS.length - 1)
      await new Promise(r => setTimeout(r, 150))
      setResult(data)
      toast.success('Inference completed across chosen model(s).')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Inference failed. Check backend.'
      setError(msg)
      toast.error(msg)
    } finally {
      setAnalyzing(false)
    }
  }

  const downloadReport = async () => {
    if (!result?.id) return
    try {
      const res = await axios.get(`/api/report/${result.id}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Traceform_Research_Report_${result.id}_${result.predicted_class}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('PDF Research Report exported.')
    } catch {
      toast.error('Failed to download research report.')
    }
  }

  const isHealthy = result?.predicted_class === 'healthy'

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <p className="text-xs text-muted tracking-widest mb-2">— VISUAL INFERENCE STUDIO</p>
        <h1 className="font-display font-bold text-4xl">
          Spiral Drawing <br />
          <span className="text-gradient-lime">Pattern Analysis</span>
        </h1>
        <p className="text-muted text-sm mt-3 max-w-xl">
          Upload a hand-drawn spiral. Select from <span className="text-white font-semibold">Ultralytics YOLO11</span>, <span className="text-white font-semibold">ResNet50</span>, <span className="text-white font-semibold">VGG16</span>, or run <span className="text-white font-semibold">4-Way Multi-Model Consensus</span> simultaneously.
        </p>
      </div>

      {/* Model Selection Bar */}
      <div className="p-5 border border-border bg-surface">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-bold tracking-widest text-lime">SELECT DEEP LEARNING MODEL</span>
          <span className="text-[11px] font-mono text-muted">ACTIVE: {selectedModel.toUpperCase()}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {MODEL_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSelectedModel(opt.id)}
              className={`p-3 border text-left transition-all ${selectedModel === opt.id ? 'border-lime bg-lime/10 shadow-[0_0_15px_rgba(198,255,74,0.15)]' : 'border-border bg-bg hover:border-border/80'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded" style={{ color: opt.color, backgroundColor: `${opt.color}15` }}>
                  {opt.badge}
                </span>
                {selectedModel === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-lime" />}
              </div>
              <p className="text-xs font-bold text-white truncate">{opt.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT — Upload / Preview */}
        <div className="space-y-4">
          {!preview ? (
            /* Drop zone */
            <motion.div
              {...getRootProps()}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ borderColor: '#C6FF4A55' }}
              className={`relative h-80 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all
                ${isDragActive ? 'border-lime/60 bg-lime/5' : 'border-border bg-surface'}`}
            >
              <input {...getInputProps()} />
              <div className="text-center px-8">
                <Upload size={32} className="text-muted mb-4 mx-auto" />
                <p className="text-white font-semibold mb-2">
                  {isDragActive ? 'Drop spiral drawing here' : 'Drag & drop a spiral image'}
                </p>
                <p className="text-xs text-muted mb-4">or click to browse local files</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {['JPEG', 'PNG', 'WebP', 'BMP'].map(f => (
                    <span key={f} className="text-xs px-2 py-1 bg-border text-muted">{f}</span>
                  ))}
                  <span className="text-xs px-2 py-1 bg-border text-muted">Max 10 MB</span>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Image preview */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-surface border border-border overflow-hidden"
            >
              {analyzing && <ScanOverlay />}
              <img
                src={preview}
                alt="Uploaded spiral drawing"
                className="w-full object-contain max-h-80"
                style={{ background: '#0a0b0a' }}
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={removeFile}
                  title="Remove image"
                  className="p-1.5 bg-bg/80 border border-border hover:border-red-500/50 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="absolute bottom-3 left-3 bg-bg/80 border border-border px-3 py-1.5">
                <p className="text-xs text-muted font-mono">{file?.name}</p>
              </div>
            </motion.div>
          )}

          {/* File info */}
          {file && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-3 gap-3">
              {[
                { label: 'File', value: file.name.length > 18 ? file.name.slice(0, 18) + '…' : file.name },
                { label: 'Size', value: `${(file.size / 1024).toFixed(1)} KB` },
                { label: 'Type', value: file.type.split('/')[1]?.toUpperCase() || 'IMG' },
              ].map(item => (
                <div key={item.label} className="p-3 bg-surface border border-border">
                  <p className="text-xs text-muted mb-1">{item.label}</p>
                  <p className="text-sm font-mono text-white truncate">{item.value}</p>
                </div>
              ))}
            </motion.div>
          )}

          {/* Replace button */}
          {file && (
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-border text-muted text-sm hover:border-lime/30 hover:text-white transition-all">
                <RefreshCw size={14} /> Replace image
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — Controls + Result */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-surface border border-border"
          >
            <p className="text-xs text-muted tracking-widest mb-5">INFERENCE PIPELINE</p>

            {/* Step progress */}
            <div className="space-y-2 mb-6">
              {STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
                    ${i < stepIdx ? 'bg-lime' : i === stepIdx ? 'bg-lime/30 border border-lime' : 'bg-border'}`}>
                    {i < stepIdx && <CheckCircle size={12} className="text-bg" />}
                    {i === stepIdx && analyzing && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-3 h-3 border border-lime border-t-transparent rounded-full"
                      />
                    )}
                  </div>
                  <span className={`text-sm transition-colors ${i <= stepIdx ? 'text-white' : 'text-muted'}`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>

            <motion.button
              whileHover={file && !analyzing ? { scale: 1.01, boxShadow: '0 0 24px rgba(198,255,74,0.2)' } : {}}
              whileTap={file && !analyzing ? { scale: 0.99 } : {}}
              onClick={analyze}
              disabled={!file || analyzing}
              className={`w-full flex items-center justify-center gap-2 py-3.5 font-bold text-sm transition-all
                ${file && !analyzing
                  ? 'bg-lime text-bg hover:bg-lime/90 cursor-pointer'
                  : 'bg-border text-muted cursor-not-allowed'}`}
            >
              {analyzing ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Scan size={16} />
                  </motion.div>
                  Running {selectedModel === 'compare' ? '4-Way Multi-Model Inference…' : `${selectedModel.toUpperCase()} Inference…`}
                </>
              ) : (
                <><Scan size={16} /> Run {selectedModel === 'compare' ? '4-Way Consensus Analysis' : 'Model Inference'}</>
              )}
            </motion.button>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 border border-red-500/30 bg-red-500/5 flex gap-3"
              >
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result card (Single or Comparison) */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-6 border relative overflow-hidden"
                style={{
                  borderColor: isHealthy ? '#C6FF4A40' : '#9B7BFF40',
                  background: isHealthy
                    ? 'radial-gradient(circle at top right, rgba(198,255,74,0.08), rgba(27,29,25,0.95))'
                    : 'radial-gradient(circle at top right, rgba(155,123,255,0.08), rgba(27,29,25,0.95))',
                }}
              >
                {/* Result header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-xs text-muted tracking-widest mb-1.5 font-mono">CLASSIFICATION RESULT</p>
                    <p className="font-display font-bold text-3xl" style={{ color: isHealthy ? '#C6FF4A' : '#9B7BFF' }}>
                      {result.predicted_class?.toUpperCase()}
                    </p>
                    <p className="text-sm text-muted mt-1 font-mono">
                      {(result.confidence * 100).toFixed(2)}% confidence
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted mb-0.5">Model Used</p>
                    <p className="text-xs font-mono text-white font-bold">{result.model_used}</p>
                    <p className="text-xs text-muted mt-2 mb-0.5">Inference Time</p>
                    <p className="text-xs font-mono text-purple font-bold">{result.inference_time_ms} ms</p>
                  </div>
                </div>

                {/* Prob bars */}
                <div className="space-y-4 mb-6">
                  <ProbBar label="Healthy Pattern Probability" value={result.healthy_prob} color="#C6FF4A" />
                  <ProbBar label="Parkinson Pattern Probability" value={result.parkinson_prob} color="#9B7BFF" />
                </div>

                {/* 4-Way Comparison Grid if active */}
                {result.comparisons && (
                  <div className="mb-6 pt-4 border-t border-border">
                    <p className="text-xs font-mono text-lime tracking-widest mb-3">4-WAY CROSS-ARCHITECTURE BREAKDOWN</p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(result.comparisons).map(([key, item]) => (
                        <div key={key} className="p-3 bg-bg border border-border">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-mono text-muted uppercase">{key}</span>
                            <span className={`text-[10px] font-bold ${item.predicted_class === 'healthy' ? 'text-lime' : 'text-purple'}`}>
                              {item.predicted_class.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm font-mono font-bold text-white">{(item.confidence * 100).toFixed(1)}%</p>
                          <p className="text-[10px] text-muted font-mono">{item.inference_time_ms} ms</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border">
                  <button
                    onClick={removeFile}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white/5 border border-border text-white text-xs font-semibold hover:bg-white/10 transition-all"
                  >
                    <RotateCcw size={13} /> Another Image
                  </button>
                  <button
                    onClick={() => setShowDetails(true)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white/5 border border-border text-white text-xs font-semibold hover:bg-white/10 transition-all"
                  >
                    <Eye size={13} /> View Metrics
                  </button>
                  <button
                    onClick={downloadReport}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-lime text-bg text-xs font-bold hover:bg-lime/90 transition-all"
                  >
                    <Download size={13} /> PDF Report
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetails && result && (
          <DetailModal
            item={result}
            onClose={() => setShowDetails(false)}
            onDownload={downloadReport}
          />
        )}
      </AnimatePresence>

      {/* Responsible research disclaimer */}
      <div className="p-4 border border-border/80 bg-surface/50 text-xs text-muted flex items-start gap-3">
        <AlertCircle size={16} className="text-muted shrink-0 mt-0.5" />
        <p>
          TRACEFORM is an experimental research platform. All classifications are produced by deep computer vision models (Ultralytics YOLO11, ResNet50, VGG16, Custom CNN) trained for visual pattern analysis. This application is not a clinical medical device.
        </p>
      </div>
    </div>
  )
}
