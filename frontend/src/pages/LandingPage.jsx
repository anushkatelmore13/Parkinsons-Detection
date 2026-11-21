import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ExternalLink } from 'lucide-react'
import SpiralCanvas from '../components/SpiralCanvas'

const NAV_LINKS = [
  { label: 'Explore', href: '#explore' },
  { label: 'Experiments', href: '#experiments' },
  { label: 'Model Lab', href: '#model' },
  { label: 'About', href: '#about' },
]

const TAGS = ['Computer Vision', 'Deep Learning', 'Pattern Recognition', 'Model Experiments']

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  })
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg text-white overflow-x-hidden noise">
      {/* Grid pattern bg */}
      <div className="fixed inset-0 grid-pattern pointer-events-none" />

      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-glass border-b border-border"
      >
        <span className="font-display font-bold text-xl tracking-widest text-lime">TRACEFORM</span>
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted hover:text-white transition-colors tracking-wide"
            >
              {link.label}
            </a>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/workspace')}
          className="px-5 py-2 text-sm font-semibold bg-lime text-bg rounded hover:bg-lime/90 transition-colors"
        >
          Launch Workspace
        </motion.button>
      </motion.nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-24">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(198,255,74,0.04) 0%, rgba(155,123,255,0.03) 50%, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left text */}
          <div>
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-lime/20 rounded-full mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
              <span className="text-xs text-lime tracking-wider font-medium">VISUAL INTELLIGENCE LAB</span>
            </motion.div>

            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="font-display font-bold text-6xl lg:text-7xl leading-[0.95] mb-6 tracking-tight"
            >
              WE SEE<br />
              <span className="text-gradient-lime">PATTERNS.</span><br />
              MACHINES<br />
              FIND MEANING.
            </motion.h1>

            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="text-muted text-lg leading-relaxed max-w-md mb-10"
            >
              An experimental visual intelligence platform exploring how deep learning
              interprets complex image patterns — including spiral drawing analysis
              for Parkinson's research.
            </motion.p>

            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(198,255,74,0.2)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/workspace')}
                className="flex items-center gap-2 px-7 py-3.5 bg-lime text-bg font-bold text-sm rounded hover:bg-lime/90 transition-all"
              >
                EXPLORE THE LAB <ArrowRight size={16} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/workspace/studio')}
                className="flex items-center gap-2 px-7 py-3.5 border border-border text-white font-bold text-sm rounded hover:border-purple/50 hover:text-purple transition-all"
              >
                ENTER WORKSPACE <ExternalLink size={16} />
              </motion.button>
            </motion.div>
          </div>

          {/* Right spiral */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center relative"
          >
            {/* Outer ring decoration */}
            <div className="absolute inset-0 rounded-full border border-lime/10 animate-spin-slow" />
            <div className="absolute inset-8 rounded-full border border-purple/10"
              style={{ animation: 'spiral-reverse 18s linear infinite' }} />

            <div className="relative">
              <SpiralCanvas size={460} interactive={true} />
              {/* Corner labels */}
              <div className="absolute -top-4 -left-4 text-xs text-lime/60 font-mono">01</div>
              <div className="absolute -top-4 -right-4 text-xs text-purple/60 font-mono">∞</div>
              <div className="absolute -bottom-4 -left-4 text-xs text-muted font-mono">SPIRAL</div>
              <div className="absolute -bottom-4 -right-4 text-xs text-muted font-mono">SCAN</div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-muted tracking-widest">SCROLL</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-px h-10 bg-gradient-to-b from-lime/40 to-transparent"
          />
        </motion.div>
      </section>

      {/* Tags strip */}
      <section id="explore" className="border-t border-b border-border py-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center"
        >
          {[...TAGS, ...TAGS, ...TAGS].map((tag, i) => (
            <span key={i} className="shrink-0 flex items-center gap-6 px-8 text-sm text-muted font-medium tracking-widest uppercase">
              <span className="w-1 h-1 bg-lime rounded-full" />
              {tag}
            </span>
          ))}
        </motion.div>
      </section>

      {/* About section */}
      <section id="about" className="max-w-7xl mx-auto px-8 py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display font-bold text-5xl leading-tight mb-6"
            >
              Patterns<br />
              <span className="text-gradient-lime">Have More</span><br />
              to Say.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted text-lg leading-relaxed mb-6"
            >
              TRACEFORM is an experimental AI research platform built around YOLOv8 image classification.
              It analyzes spiral drawing images to study how neural networks distinguish visual patterns
              associated with Parkinson's disease versus healthy motor control.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-4 border border-lime/20 bg-lime/5 rounded"
            >
              <p className="text-xs text-lime/80 font-medium tracking-wide mb-2">⚠ RESEARCH DISCLAIMER</p>
              <p className="text-sm text-muted leading-relaxed">
                This platform is for research and educational purposes only.
                It is not a medical diagnostic tool. All predictions are experimental
                image classifications and must not be used for clinical decisions.
              </p>
            </motion.div>
          </div>
          <div className="space-y-6">
            {[
              { label: 'Architecture', value: 'YOLOv8n-cls', desc: 'Nano classification model fine-tuned on spiral drawings' },
              { label: 'Dataset', value: '60 images', desc: 'Train / Test split · healthy & parkinson classes · Roboflow' },
              { label: 'Val Accuracy', value: '93.75%', desc: 'TP=16, FP=1, TN=14, FN=1 on test set' },
              { label: 'Task', value: 'Binary Classification', desc: 'Healthy vs Parkinson spiral drawing analysis' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-5 p-5 border border-border hover:border-lime/20 transition-colors"
              >
                <div className="w-1 bg-lime/30 rounded-full shrink-0" />
                <div>
                  <div className="text-xs text-muted tracking-wider mb-1">{item.label}</div>
                  <div className="font-display font-bold text-xl text-lime mb-1">{item.value}</div>
                  <div className="text-sm text-muted">{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Experiments section */}
      <section id="experiments" className="border-t border-border">
        <div className="max-w-7xl mx-auto px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-xs text-muted tracking-widest mb-3">— WORKSPACE MODULES</p>
            <h2 className="font-display font-bold text-4xl">Research Tools</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Image Studio',
                desc: 'Upload spiral drawings. Run real YOLOv8 inference. See actual classification results with confidence scores.',
                tag: 'LIVE INFERENCE',
                path: '/workspace/studio',
                accent: 'lime'
              },
              {
                title: 'Model Lab',
                desc: 'Inspect the YOLOv8n-cls architecture, training metrics, confusion matrix and performance curves.',
                tag: 'MODEL ANALYSIS',
                path: '/workspace/model',
                accent: 'purple'
              },
              {
                title: 'Dataset Explorer',
                desc: 'Visual gallery of training and test images. Class distribution, splits and format information.',
                tag: 'DATA INTEL',
                path: '/workspace/dataset',
                accent: 'lime'
              },
              {
                title: 'Prediction History',
                desc: 'Full audit trail of all analyses. Search, filter, review and export experimental reports.',
                tag: 'HISTORY',
                path: '/workspace/predictions',
                accent: 'purple'
              },
              {
                title: 'Analytics',
                desc: 'Live prediction distribution, confidence trends and usage statistics from real inference runs.',
                tag: 'ANALYTICS',
                path: '/workspace',
                accent: 'lime'
              },
              {
                title: 'Research Notes',
                desc: 'Documented methodology, model architecture notes, dataset context and responsible-use guidelines.',
                tag: 'DOCUMENTATION',
                path: '/workspace/notes',
                accent: 'purple'
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -4 }}
                onClick={() => navigate(card.path)}
                className="p-6 border border-border hover:border-lime/20 cursor-pointer transition-all group"
              >
                <div className={`text-xs font-bold tracking-widest mb-4 ${card.accent === 'lime' ? 'text-lime' : 'text-purple'}`}>
                  {card.tag}
                </div>
                <h3 className="font-display font-bold text-xl mb-3 group-hover:text-lime transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-5">{card.desc}</p>
                <div className={`flex items-center gap-2 text-xs font-medium ${card.accent === 'lime' ? 'text-lime' : 'text-purple'}`}>
                  Open <ArrowRight size={12} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display font-bold text-lg tracking-widest text-lime">TRACEFORM</span>
          <p className="text-xs text-muted text-center">
            Experimental research platform · Not a medical device · YOLOv8n-cls · Parkinson Spiral Classification
          </p>
          <p className="text-xs text-muted">v1.0.0</p>
        </div>
      </footer>
    </div>
  )
}
