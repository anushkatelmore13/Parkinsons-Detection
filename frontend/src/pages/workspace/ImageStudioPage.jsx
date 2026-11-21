import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, X, RefreshCw, Scan, Image as ImageIcon,
  AlertCircle, CheckCircle, Clock, Zap, Download, Eye, RotateCcw
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import SpiralCanvas from '../../components/SpiralCanvas'

const STEPS = ['Validating image', 'Sending to model', 'Running inference', 'Processing probabilities', 'Complete']

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
        className="bg-surface border border-border rounded p-8 max-w-lg w-full space-y-6"
      >
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <p className="text-xs text-lime font-mono tracking-widest mb-1">DETAILED ANALYSIS SPECIFICATION</p>
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
            <span className="text-muted">Model Backbone:</span>
            <span className="text-white">{item.model_used || 'YOLOv8n-cls'}</span>
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

        <div className="p-3 border border-yellow-500/20 bg-yellow-500/5 rounded">
          <p className="text-[11px] text-yellow-300 leading-relaxed">
            ⚠ Experimental AI classification for visual research. Not intended for clinical or diagnostic use.
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
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute left-0 right-0 h-16 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, transparent, rgba(198,255,74,0.06), transparent)' }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

export default function ImageStudioPage() {
  const [file, setFile]             = useState(null)
  const [preview, setPreview]       = useState(null)
  const [analyzing, setAnalyzing]   = useState(false)
  const [stepIdx, setStepIdx]       = useState(-1)
  const [result, setResult]         = useState(null)
  const [error, setError]           = useState(null)
  const [showDetails, setShowDetails] = useState(false)

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
      await new Promise(r => setTimeout(r, 400))
      setStepIdx(i)
    }

    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await axios.post('/api/predict', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setStepIdx(STEPS.length - 1)
      await new Promise(r => setTimeout(r, 200))
      setResult(data)
      toast.success('Inference completed successfully.')
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
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs text-muted tracking-widest mb-2">— IMAGE STUDIO</p>
        <h1 className="font-display font-bold text-4xl">
          Pattern<br />
          <span className="text-gradient-lime">Analysis</span>
        </h1>
        <p className="text-muted text-sm mt-3 max-w-md">
          Upload a spiral drawing. Run live YOLOv8n-cls inference. View class confidence and export research reports.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — Upload / Preview */}
        <div className="space-y-4">
          {!preview ? (
            /* Drop zone */
            <motion.div
              {...getRootProps()}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ borderColor: '#C6FF4A33' }}
              className={`relative h-80 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer transition-all
                ${isDragActive ? 'border-lime/60 bg-lime/5' : 'border-border bg-surface'}`}
            >
              <input {...getInputProps()} />
              <div className="text-center px-8">
                <Upload size={32} className="text-muted mb-4 mx-auto" />
                <p className="text-white font-semibold mb-2">
                  {isDragActive ? 'Drop it here' : 'Drag & drop a spiral image'}
                </p>
                <p className="text-xs text-muted mb-4">or click to browse files</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {['JPEG', 'PNG', 'WebP', 'BMP'].map(f => (
                    <span key={f} className="text-xs px-2 py-1 bg-border rounded text-muted">{f}</span>
                  ))}
                  <span className="text-xs px-2 py-1 bg-border rounded text-muted">Max 10 MB</span>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Image preview */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-surface border border-border rounded overflow-hidden"
            >
              {analyzing && <ScanOverlay />}
              <img
                src={preview}
                alt="Uploaded spiral"
                className="w-full object-contain max-h-80"
                style={{ background: '#0a0b0a' }}
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={removeFile}
                  title="Remove image"
                  className="p-1.5 bg-bg/80 border border-border rounded hover:border-red-500/50 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="absolute bottom-3 left-3 bg-bg/80 border border-border rounded px-3 py-1.5">
                <p className="text-xs text-muted font-mono">{file?.name}</p>
              </div>
            </motion.div>
          )}

          {/* File info */}
          {file && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-3 gap-3"
            >
              {[
                { label: 'File', value: file.name.length > 18 ? file.name.slice(0, 18) + '…' : file.name },
                { label: 'Size', value: `${(file.size / 1024).toFixed(1)} KB` },
                { label: 'Type', value: file.type.split('/')[1]?.toUpperCase() || 'IMG' },
              ].map(item => (
                <div key={item.label} className="p-3 bg-surface border border-border rounded">
                  <p className="text-xs text-muted mb-1">{item.label}</p>
                  <p className="text-sm font-mono text-white truncate">{item.value}</p>
                </div>
              ))}
            </motion.div>
          )}

          {/* Replace button when file exists */}
          {file && (
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-border text-muted text-sm rounded hover:border-lime/30 hover:text-white transition-all">
                <RefreshCw size={14} /> Replace image
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — Controls + Result */}
        <div className="space-y-4">
          {/* Analysis controls */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-surface border border-border rounded"
          >
            <p className="text-xs text-muted tracking-widest mb-5">ANALYSIS CONTROLS</p>

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
              whileHover={file && !analyzing ? { scale: 1.02, boxShadow: '0 0 24px rgba(198,255,74,0.2)' } : {}}
              whileTap={file && !analyzing ? { scale: 0.98 } : {}}
              onClick={analyze}
              disabled={!file || analyzing}
              className={`w-full flex items-center justify-center gap-2 py-3.5 font-bold text-sm rounded transition-all
                ${file && !analyzing
                  ? 'bg-lime text-bg hover:bg-lime/90 cursor-pointer'
                  : 'bg-border text-muted cursor-not-allowed'}`}
            >
              {analyzing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Scan size={16} />
                  </motion.div>
                  Running YOLOv8 Inference…
                </>
              ) : (
                <><Scan size={16} /> Analyze Image</>
              )}
            </motion.button>

            {!file && (
              <p className="text-xs text-muted text-center mt-3">Upload a spiral drawing to begin analysis</p>
            )}
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 border border-red-500/30 bg-red-500/5 rounded flex gap-3"
              >
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result card */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-6 border rounded relative overflow-hidden"
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
                    <p className="text-xs text-muted mb-0.5">Model</p>
                    <p className="text-xs font-mono text-white">{result.model_used}</p>
                    <p className="text-xs text-muted mt-2 mb-0.5">Latency</p>
                    <p className="text-xs font-mono text-white">{result.inference_time_ms} ms</p>
                  </div>
                </div>

                {/* Prob bars */}
                <div className="space-y-4 mb-6">
                  <ProbBar label="Healthy Probability" value={result.healthy_prob} color="#C6FF4A" />
                  <ProbBar label="Parkinson Probability" value={result.parkinson_prob} color="#9B7BFF" />
                </div>

                {/* The 3 Core Action Buttons requested in specification */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border">
                  <button
                    onClick={removeFile}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white/5 border border-border text-white text-xs font-semibold rounded hover:bg-white/10 transition-all"
                  >
                    <RotateCcw size={13} /> Another Image
                  </button>
                  <button
                    onClick={() => setShowDetails(true)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white/5 border border-border text-white text-xs font-semibold rounded hover:bg-white/10 transition-all"
                  >
                    <Eye size={13} /> View Details
                  </button>
                  <button
                    onClick={downloadReport}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-lime text-bg text-xs font-bold rounded hover:bg-lime/90 transition-all"
                  >
                    <Download size={13} /> Export Report
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* No result placeholder */}
          {!result && !error && !analyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 border border-border bg-surface rounded flex flex-col items-center justify-center gap-4 h-48"
            >
              <div className="opacity-20">
                <SpiralCanvas size={80} interactive={false} />
              </div>
              <p className="text-xs text-muted text-center">Results will appear here after analysis</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Full ethical and research disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 p-5 border border-lime/10 bg-lime/3 rounded"
      >
        <p className="text-xs text-lime/70 font-bold tracking-widest mb-2">RESEARCH & ETHICAL GUIDELINES</p>
        <p className="text-xs text-muted leading-relaxed">
          TRACEFORM is an experimental research platform. All classifications are produced by a YOLOv8n-cls model
          fine-tuned on the spiral drawing dataset (204 images). Results are for academic demonstration and research purposes
          only. They must not be used for clinical screening, diagnosis, or any medical decision-making.
          The model has not been validated against clinical standards (CE marking, FDA clearance, etc.).
          Subject-level data leakage may affect generalization metrics. Always consult a qualified medical professional
          for any health-related concerns.
        </p>
      </motion.div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetails && result && (
          <DetailModal
            item={result}
            onClose={() => setShowDetails(false)}
            onDownload={downloadReport}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
