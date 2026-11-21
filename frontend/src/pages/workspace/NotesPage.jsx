import { motion } from 'framer-motion'

function Section({ title, tag, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-10"
    >
      <div className="flex items-center gap-4 mb-5">
        <span className="text-xs text-lime font-bold tracking-widest">{tag}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <h2 className="font-display font-bold text-2xl mb-5">{title}</h2>
      {children}
    </motion.section>
  )
}

function Code({ children }) {
  return (
    <code className="bg-bg border border-border px-1.5 py-0.5 rounded text-lime text-xs font-mono">
      {children}
    </code>
  )
}

export default function NotesPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <p className="text-xs text-muted tracking-widest mb-2">— RESEARCH NOTES</p>
        <h1 className="font-display font-bold text-4xl">
          Project<br />
          <span className="text-gradient-lime">Documentation</span>
        </h1>
        <p className="text-sm text-muted mt-3">Methodology, architecture notes, dataset context and responsible-use guidelines.</p>
      </div>

      <Section title="Project Overview" tag="01 — OVERVIEW">
        <div className="prose prose-sm max-w-none text-muted space-y-3">
          <p>
            <strong className="text-white">TRACEFORM</strong> is an experimental visual intelligence research platform
            that uses deep learning to classify spiral drawing images into two categories:
            <strong className="text-lime"> Healthy</strong> and <strong className="text-purple"> Parkinson's</strong>.
          </p>
          <p>
            The underlying hypothesis is that motor symptoms of Parkinson's disease introduce measurable
            distortions in hand-drawn spiral patterns. Deep learning models can potentially detect
            these visual differences without hand-crafted feature engineering.
          </p>
          <p>
            This platform is built as a university capstone project and research demonstration.
            It is not a clinical tool and has not been validated against medical standards.
          </p>
        </div>
      </Section>

      <Section title="Dataset Description" tag="02 — DATASET">
        <div className="space-y-3 text-sm text-muted">
          <div className="p-5 border border-border bg-surface space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Source', 'Roboflow — Parkinson Disease Detection v1'],
                ['Format', 'Folder (classification layout)'],
                ['Total Images', '204 (102 healthy, 102 parkinson)'],
                ['Splits', 'train / valid / test'],
                ['Train', '65 healthy + 68 parkinson = 133'],
                ['Validation', '14 healthy + 17 parkinson = 31'],
                ['Test', '23 healthy + 17 parkinson = 40'],
                ['Image Dims', 'Variable (non-uniform)'],
                ['Color', 'RGB'],
                ['File Format', 'JPEG / PNG'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-muted mb-0.5">{k}</p>
                  <p className="text-sm text-white font-mono">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border border-yellow-500/20 bg-yellow-500/5 rounded">
            <p className="text-xs text-yellow-400 font-bold mb-2">⚠ SUBJECT-LEVEL LEAKAGE WARNING</p>
            <p className="text-xs leading-relaxed">
              Filename identifiers such as <Code>V01</Code>, <Code>V02</Code>… <Code>V55</Code> suggest
              participant-level IDs appearing across train, validation and test splits. If confirmed as
              participant IDs, the random image-level split creates data leakage: the model may learn
              individual handwriting style rather than disease patterns. For publication-quality results,
              apply subject-independent k-fold cross-validation and re-evaluate.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Preprocessing Pipeline" tag="03 — PREPROCESSING">
        <div className="space-y-3 text-sm text-muted">
          <p>YOLOv8 handles preprocessing internally during training and inference:</p>
          <div className="p-5 bg-surface border border-border font-mono text-xs space-y-2">
            {[
              '1. Load image (PIL → RGB)',
              '2. Resize to 640×640 (letterbox padding)',
              '3. Normalize pixel values to [0, 1]',
              '4. Convert to PyTorch tensor (C, H, W)',
              '5. Batch inference through YOLOv8n-cls backbone',
              '6. Softmax output → class probabilities',
            ].map(s => <p key={s} className="text-white">{s}</p>)}
          </div>
          <p>
            The original Colab notebook used <Code>imgsz=640</Code>, <Code>epochs=50</Code>, <Code>batch=16</Code>.
            Augmentations (flips, rotations, HSV jitter) are applied automatically by Ultralytics during training.
          </p>
        </div>
      </Section>

      <Section title="Model Architecture" tag="04 — ARCHITECTURE">
        <div className="space-y-4 text-sm text-muted">
          <p>
            <strong className="text-white">YOLOv8n-cls</strong> is the nano variant of the YOLOv8 classification
            architecture by Ultralytics. Key properties:
          </p>
          <ul className="list-none space-y-2 pl-0">
            {[
              'CSPDarknet backbone for multi-scale feature extraction',
              'C2f modules (Cross-Stage Partial with two bottleneck convolutions)',
              'SPPF (Spatial Pyramid Pooling — Fast) for multi-scale context',
              'Global Average Pooling → Linear → Softmax classification head',
              'Pre-trained on ImageNet; fine-tuned on spiral drawing dataset',
              '~2.7M parameters (nano variant) — fast inference on CPU/GPU',
            ].map(item => (
              <li key={item} className="flex gap-3">
                <span className="text-lime mt-0.5 shrink-0">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="p-4 border border-lime/10 bg-lime/3 rounded">
            <p className="text-xs text-lime font-bold mb-2">TRAINING RESULTS (from Colab notebook)</p>
            <p className="text-xs">
              Accuracy: <strong className="text-white">93.75%</strong> ·
              Precision: <strong className="text-white">94.12%</strong> ·
              Recall: <strong className="text-white">94.12%</strong> ·
              F1: <strong className="text-white">94.12%</strong><br/>
              TP=16, FP=1, TN=14, FN=1 (test set n=32 as reported in notebook)
            </p>
          </div>
        </div>
      </Section>

      <Section title="Research Context" tag="05 — LITERATURE">
        <div className="space-y-3 text-sm text-muted">
          <p>Key references and standards informing this project:</p>
          <div className="space-y-3">
            {[
              {
                title: 'Handwriting-based Parkinson\'s Detection (Sci. Reports, 2026)',
                detail: 'Demonstrates subject-wise 5-fold CV to prevent leakage. Reports how image-level splits overestimate generalization in small medical imaging datasets.',
              },
              {
                title: 'CLAIM 2024 Guidelines',
                detail: 'Recommends transparent reporting of dataset sources, patient vs image split levels, preprocessing steps, reference standards and test conditions for AI clinical studies.',
              },
              {
                title: 'TRIPOD+AI Reporting Standard',
                detail: 'Provides guidance for transparent reporting of clinical AI prediction models. Emphasizes external validation and uncertainty quantification.',
              },
              {
                title: 'Ultraltyics YOLOv8 Classification Docs',
                detail: 'Official documentation for YOLOv8n-cls training, fine-tuning, validation and export. Available at: docs.ultralytics.com',
              },
            ].map(r => (
              <div key={r.title} className="p-4 border border-border bg-surface">
                <p className="text-sm font-medium text-white mb-1">{r.title}</p>
                <p className="text-xs text-muted">{r.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Getting Started" tag="06 — SETUP">
        <div className="space-y-4 font-mono text-xs">
          <div className="p-5 bg-surface border border-border">
            <p className="text-lime mb-3"># Backend setup</p>
            <p className="text-muted">cd backend</p>
            <p className="text-muted">pip install -r requirements.txt</p>
            <p className="text-muted">mkdir -p model uploads</p>
            <p className="text-muted"># Place best.pt in backend/model/</p>
            <p className="text-muted">uvicorn main:app --reload --port 8000</p>
          </div>
          <div className="p-5 bg-surface border border-border">
            <p className="text-lime mb-3"># Frontend setup</p>
            <p className="text-muted">cd frontend</p>
            <p className="text-muted">npm install</p>
            <p className="text-muted">npm run dev</p>
            <p className="text-muted"># Open http://localhost:5173</p>
          </div>
          <div className="p-5 bg-surface border border-border">
            <p className="text-lime mb-3"># Train model (Google Colab)</p>
            <p className="text-muted">model = YOLO("yolov8n-cls.pt")</p>
            <p className="text-muted">model.train(data=dataset.location, epochs=50, imgsz=640, batch=16)</p>
            <p className="text-muted"># Export: runs/classify/trainX/weights/best.pt</p>
          </div>
        </div>
      </Section>

      <Section title="Responsible Use Disclaimer" tag="07 — ETHICS">
        <div className="p-6 border border-red-500/20 bg-red-500/3 rounded space-y-3 text-sm text-muted">
          <p className="text-white font-bold">This platform is NOT a medical device.</p>
          <ul className="space-y-2">
            {[
              'All classifications are experimental research outputs only.',
              'The model has not been validated against clinical diagnostic standards.',
              'Results must not be used for clinical screening, diagnosis, or any medical decision-making.',
              'The dataset is small (n=204) and may not generalize to unseen populations.',
              'Subject-level data leakage may inflate reported accuracy metrics.',
              'Always consult a qualified neurologist for Parkinson\'s disease concerns.',
              'This system has not received CE marking, FDA clearance, or equivalent regulatory approval.',
            ].map(item => (
              <li key={item} className="flex gap-3">
                <span className="text-red-400 shrink-0">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </div>
  )
}
