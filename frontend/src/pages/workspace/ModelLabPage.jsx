import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import axios from 'axios'

const YOLO_METRICS = {
  accuracy: 93.75,
  precision: 94.12,
  recall: 94.12,
  f1: 94.12,
  tp: 16, fp: 1, tn: 14, fn: 1,
}

function MetricBox({ label, value, unit = '%', color = '#C6FF4A' }) {
  return (
    <div className="p-5 border border-border bg-bg">
      <p className="text-xs text-muted tracking-wider mb-2">{label}</p>
      <p className="font-display font-bold text-3xl" style={{ color }}>
        {value}<span className="text-lg text-muted">{unit}</span>
      </p>
    </div>
  )
}

function ConfusionMatrix({ tp, fp, tn, fn }) {
  const total = tp + fp + tn + fn
  const cells = [
    { label: 'TP', value: tp, desc: 'True Positive\n(Parkinson → Parkinson)', color: '#C6FF4A' },
    { label: 'FN', value: fn, desc: 'False Negative\n(Parkinson → Healthy)', color: '#ff4a6e' },
    { label: 'FP', value: fp, desc: 'False Positive\n(Healthy → Parkinson)', color: '#ff9f4a' },
    { label: 'TN', value: tn, desc: 'True Negative\n(Healthy → Healthy)', color: '#9B7BFF' },
  ]
  return (
    <div>
      <div className="grid grid-cols-2 gap-1 max-w-xs">
        {cells.map(c => (
          <motion.div
            key={c.label}
            whileHover={{ scale: 1.03 }}
            className="p-6 border border-border bg-bg relative group"
          >
            <p className="font-display font-bold text-3xl" style={{ color: c.color }}>{c.value}</p>
            <p className="text-xs font-bold tracking-widest mt-1" style={{ color: c.color }}>{c.label}</p>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-bg/90 flex items-center justify-center p-3">
              <p className="text-xs text-center text-white whitespace-pre-line">{c.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-muted">
        <span>← Predicted</span>
        <span>↑ Actual</span>
        <span>Total: {total} images</span>
      </div>
    </div>
  )
}

function ArchSection({ name, tag, available, description, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border border-border bg-surface"
    >
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-display font-bold text-xl">{name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded font-mono ${available ? 'bg-lime/10 text-lime' : 'bg-border text-muted'}`}>
              {available ? 'TRAINED' : 'NOT TRAINED'}
            </span>
          </div>
          <p className="text-sm text-muted">{description}</p>
        </div>
        <span className="text-xs text-muted font-mono">{tag}</span>
      </div>
      <div className="p-6">
        {available ? children : (
          <div className="text-center py-8 text-muted text-sm">
            <AlertCircle size={24} className="mx-auto mb-3 opacity-40" />
            <p>This model has not been trained yet.</p>
            <p className="text-xs mt-2">Train the model in the Colab notebook and export weights to enable this section.</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function ModelLabPage() {
  const [modelInfo, setModelInfo] = useState(null)

  useEffect(() => {
    axios.get('/api/model').then(r => setModelInfo(r.data)).catch(() => {})
  }, [])

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <p className="text-xs text-muted tracking-widest mb-2">— MODEL LABORATORY</p>
        <h1 className="font-display font-bold text-4xl">
          Architecture<br />
          <span className="text-gradient-lime">Research</span>
        </h1>
        <p className="text-sm text-muted mt-3">Deep dive into model training, evaluation metrics and architecture comparisons.</p>
      </div>

      {/* YOLOv8 primary model */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="font-display font-bold text-xs tracking-widest text-lime">PRIMARY MODEL</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-lime/20 bg-surface"
        >
          {/* Model header */}
          <div className="flex items-start justify-between p-6 border-b border-border">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Cpu size={20} className="text-lime" />
                <h2 className="font-display font-bold text-2xl">YOLOv8n-cls</h2>
                <span className={`text-xs px-2.5 py-1 rounded font-bold ${modelInfo?.loaded ? 'bg-lime/10 text-lime border border-lime/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                  {modelInfo?.loaded ? '● ACTIVE' : '○ WEIGHTS MISSING'}
                </span>
              </div>
              <p className="text-sm text-muted max-w-xl">
                Ultralytics YOLOv8 nano classification variant. Fine-tuned on spiral drawing images
                for binary Healthy/Parkinson classification. Lightweight architecture optimized for
                fast inference without compromising accuracy on small datasets.
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="p-6 border-b border-border">
            <p className="text-xs text-muted tracking-widest mb-5">VALIDATION METRICS — TEST SET (n=32)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <MetricBox label="Accuracy" value={YOLO_METRICS.accuracy} />
              <MetricBox label="Precision" value={YOLO_METRICS.precision} color="#9B7BFF" />
              <MetricBox label="Recall" value={YOLO_METRICS.recall} color="#9B7BFF" />
              <MetricBox label="F1 Score" value={YOLO_METRICS.f1} color="#C6FF4A" />
            </div>

            {/* Confusion matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <p className="text-xs text-muted tracking-widest mb-4">CONFUSION MATRIX</p>
                <ConfusionMatrix {...YOLO_METRICS} />
              </div>
              <div>
                <p className="text-xs text-muted tracking-widest mb-4">TRAINING CONFIG</p>
                <div className="space-y-3">
                  {[
                    { k: 'Base Model', v: 'yolov8n-cls.pt' },
                    { k: 'Dataset Source', v: 'Roboflow — Parkinson v1 (folder)' },
                    { k: 'Epochs', v: '50' },
                    { k: 'Input Size', v: '640 × 640' },
                    { k: 'Batch Size', v: '16' },
                    { k: 'Classes', v: 'healthy, parkinson' },
                    { k: 'Train Images', v: '133 (train + valid)' },
                    { k: 'Test Images', v: '32 (test set)' },
                    { k: 'Optimizer', v: 'Auto (AdamW)' },
                  ].map(({ k, v }) => (
                    <div key={k} className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-xs text-muted">{k}</span>
                      <span className="text-xs font-mono text-white">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Architecture */}
          <div className="p-6">
            <p className="text-xs text-muted tracking-widest mb-4">ARCHITECTURE OVERVIEW</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Backbone', value: 'CSPDarknet (nano)', desc: 'Cross-Stage Partial Network for efficient feature extraction' },
                { label: 'Neck', value: 'C2f + SPPF', desc: 'Feature pyramid aggregation with spatial pooling' },
                { label: 'Head', value: 'Linear Classifier', desc: 'Global average pooling → FC → Softmax for 2 classes' },
              ].map(item => (
                <div key={item.label} className="p-4 bg-bg border border-border">
                  <p className="text-xs text-lime tracking-widest mb-2">{item.label}</p>
                  <p className="font-mono font-bold text-sm text-white mb-2">{item.value}</p>
                  <p className="text-xs text-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional architectures */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <span className="font-display font-bold text-xs tracking-widest text-muted">COMPARISON ARCHITECTURES</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-4">
          <ArchSection
            name="CNN from Scratch"
            tag="CUSTOM"
            available={false}
            description="Custom convolutional neural network designed specifically for spiral drawing classification. Lightweight and interpretable."
          />
          <ArchSection
            name="VGG16"
            tag="PRETRAINED"
            available={false}
            description="16-layer deep CNN from Simonyan & Zisserman (2014). Transfer learning from ImageNet. Known for uniform architecture and high representational power."
          />
          <ArchSection
            name="ResNet50"
            tag="PRETRAINED"
            available={false}
            description="50-layer residual network from He et al. (2015). Skip connections prevent vanishing gradients. Excellent baseline for transfer learning tasks."
          />
        </div>

        <div className="mt-6 p-5 border border-border bg-surface">
          <p className="text-xs text-muted tracking-widest mb-3">HOW TO ADD A TRAINED MODEL</p>
          <div className="font-mono text-xs text-muted space-y-1">
            <p><span className="text-lime">1.</span> Train the model in the Colab notebook (see Research Notes)</p>
            <p><span className="text-lime">2.</span> Export the best checkpoint: <span className="text-white">runs/classify/trainX/weights/best.pt</span></p>
            <p><span className="text-lime">3.</span> Place it in: <span className="text-white">backend/model/best.pt</span></p>
            <p><span className="text-lime">4.</span> Restart the backend server: <span className="text-white">uvicorn main:app --reload</span></p>
          </div>
        </div>
      </div>

      {/* Data leakage note */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-8 p-6 border border-yellow-500/20 bg-yellow-500/3"
      >
        <p className="text-xs text-yellow-400 font-bold tracking-widest mb-3">⚠ IMPORTANT RESEARCH NOTE — DATA LEAKAGE RISK</p>
        <p className="text-sm text-muted leading-relaxed mb-3">
          Inspection of the dataset filenames reveals identifiers such as <code className="bg-black/40 px-1 rounded text-white text-xs">V01</code>, <code className="bg-black/40 px-1 rounded text-white text-xs">V02</code>… that appear across
          train, validation and test splits. If these represent unique participants, image-level splitting
          creates subject-level data leakage — the model may learn individual drawing styles rather
          than disease-related patterns.
        </p>
        <p className="text-sm text-muted leading-relaxed">
          <strong className="text-white">Recommended:</strong> Reorganize splits by subject ID using subject-independent
          k-fold cross-validation before reporting generalization metrics for academic submission.
          Current reported metrics (93.75% accuracy) should be interpreted with this caveat.
        </p>
      </motion.div>
    </div>
  )
}
