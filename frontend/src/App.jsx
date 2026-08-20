import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Spline from '@splinetool/react-spline';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronDown,
  Droplets,
  Leaf,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Sprout,
  Upload,
  X,
} from 'lucide-react';

const SPLINE_SCENE_URL = import.meta.env.VITE_SPLINE_SCENE_URL || '';

const featureCards = [
  {
    icon: ScanLine,
    title: 'Visual analysis',
    text: 'Upload one clear leaf image and let the model inspect visible patterns.',
  },
  {
    icon: Droplets,
    title: 'Field context',
    text: 'Use the prediction as an early signal for crop-health decisions.',
  },
  {
    icon: ShieldCheck,
    title: 'Confidence aware',
    text: 'See the model confidence prominently instead of hiding it in a result box.',
  },
];

function FloatingPlant({ className = '', delay = 0, rotate = 0 }) {
  return (
    <motion.div
      className={`pointer-events-none absolute ${className}`}
      initial={{ opacity: 0, y: 18, rotate: rotate - 8 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <svg viewBox="0 0 120 170" className="h-full w-full drop-shadow-[0_14px_18px_rgba(28,61,35,0.12)]" aria-hidden="true">
        <path d="M57 164C58 126 59 90 66 48" stroke="#315A39" strokeWidth="5" strokeLinecap="round" />
        <path d="M63 82C38 76 25 58 28 36C49 38 65 53 63 82Z" fill="#6E9F61" />
        <path d="M60 106C84 99 102 84 103 64C81 64 66 78 60 106Z" fill="#4C824D" />
        <path d="M59 132C36 124 22 110 21 92C42 95 56 107 59 132Z" fill="#88B06F" />
      </svg>
    </motion.div>
  );
}

function ConfidenceRing({ confidence, healthy }) {
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (confidence / 100) * circumference;

  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg className="-rotate-90 h-full w-full" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#E7EEDA" strokeWidth="10" />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={healthy ? '#4F8A52' : '#D68A3A'}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <span className="font-mono text-2xl font-bold text-[#1E3524]">{confidence}%</span>
        <span className="-mt-7 translate-y-7 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6C806D]">
          confidence
        </span>
      </div>
    </div>
  );
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showSpline, setShowSpline] = useState(Boolean(SPLINE_SCENE_URL));
  const dragCounter = useRef(0);

  const loadFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    setShowDetails(false);
  }, []);

  const handleFileChange = (e) => loadFile(e.target.files?.[0]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => e.preventDefault(), []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      loadFile(e.dataTransfer.files?.[0]);
    },
    [loadFile]
  );

  // BACKEND REQUEST: intentionally preserved from the supplied frontend.
  const analyzeImage = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Backend offline. Please start the FastAPI server.');
      }

      const data = await response.json();
      const formattedName = data.disease.replace(/___/g, ' - ').replace(/_/g, ' ');

      setResult({ disease: formattedName, confidence: data.confidence });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setShowDetails(false);
  };

  const isHealthy = Boolean(result && /healthy/i.test(result.disease));

  const resultTone = useMemo(
    () =>
      isHealthy
        ? {
            label: 'Healthy signal',
            badge: 'bg-emerald-100 text-emerald-200 border-emerald-200',
            icon: CheckCircle2,
            gradient: 'from-[#EAF7E9] via-white to-[#F6FBEE]',
          }
        : {
            label: 'Potential issue detected',
            badge: 'bg-amber-100 text-amber-900 border-amber-200',
            icon: Droplets,
            gradient: 'from-[#FFF4E7] via-white to-[#FFF9F0]',
          },
    [isHealthy]
  );

  const ResultIcon = resultTone.icon;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F3F8EF] text-[#18301F]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&family=Space+Mono:wght@400;700&display=swap');

        :root { color-scheme: light; }
        html { scroll-behavior: smooth; }
        body { margin: 0; background: #F3F8EF; }
        * { box-sizing: border-box; }
        .font-display { font-family: 'Manrope', sans-serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }
        .font-data { font-family: 'Space Mono', monospace; }
        .agri-grid {
          background-image:
            linear-gradient(rgba(69, 112, 75, 0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(69, 112, 75, 0.055) 1px, transparent 1px);
          background-size: 30px 30px;
        }
        .leaf-noise {
          background-image: radial-gradient(rgba(255,255,255,.16) 1px, transparent 1px);
          background-size: 12px 12px;
        }
        ::selection { background: #BFD8AF; color: #19351F; }
      `}</style>

      <div className="pointer-events-none fixed inset-0 agri-grid opacity-70" />

      <motion.div
        className="pointer-events-none fixed -left-24 top-24 h-72 w-72 rounded-full bg-[#B6D9A2]/35 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none fixed right-[-100px] top-[28%] h-80 w-80 rounded-full bg-[#F0D98D]/25 blur-3xl"
        animate={{ x: [0, -25, 0], y: [0, 18, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <FloatingPlant className="hidden xl:block left-[3vw] bottom-10 h-52 w-36" delay={0.2} rotate={-8} />
      <FloatingPlant className="hidden lg:block right-[4vw] top-[18%] h-60 w-40" delay={0.35} rotate={9} />

      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <nav className="mb-7 flex items-center justify-between rounded-2xl border border-[#D8E6D3] bg-white/70 px-4 py-3 shadow-[0_14px_40px_rgba(31,62,37,0.06)] backdrop-blur-xl sm:px-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1F5A38] text-white shadow-lg shadow-[#1F5A38]/15">
              <Sprout size={21} strokeWidth={2.2} />
            </div>
            <div>
              <p className="font-display text-sm font-extrabold tracking-tight text-[#18301F]">Plant Health AI</p>
              <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-[#779078]">Field diagnostics</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,.10)]" />
            
          </div>
        </nav>

        <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative z-10 pb-2 pt-3 lg:pt-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#CFE0C9] bg-white/75 px-3.5 py-2 shadow-sm backdrop-blur"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#E6F1E2] text-[#3E774A]">
                <Leaf size={14} />
              </span>
              <span className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-[#4F6E56]">
                Crop intelligence
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.06 }}
              className="font-display max-w-3xl text-5xl font-extrabold leading-[0.98] tracking-[-0.05em] text-[#17311F] sm:text-6xl lg:text-7xl"
            >
              Read the leaf.
              <span className="block text-[#4F8A52]">Understand the crop.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.14 }}
              className="font-body mt-6 max-w-xl text-base leading-7 text-[#5D725F] sm:text-lg"
            >
              Drop in a leaf photograph and turn your existing plant-disease model into a fast,
              polished field-diagnostic experience.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-7 flex flex-wrap gap-3"
            >
              {['Instant scan', 'Confidence score', 'Mobile friendly'].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-[#D5E3D0] bg-white/70 px-3.5 py-2 font-body text-xs font-semibold text-[#557058] shadow-sm"
                >
                  {label}
                </span>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[350px] overflow-hidden rounded-[34px] border border-[#D5E5D1] bg-[#E8F1E4] shadow-[0_30px_80px_-28px_rgba(25,65,34,.28)] sm:h-[430px]"
          >
            {showSpline && SPLINE_SCENE_URL ? (
              <>
                <Spline scene={SPLINE_SCENE_URL} className="absolute inset-0 h-full w-full" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#18331f]/25 to-transparent" />
              </>
            ) : (
              <div className="relative h-full w-full overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,244,188,.75),transparent_27%),linear-gradient(145deg,#e9f4e4,#cfe5cb_55%,#b5d19d)]" />
                <motion.div
                  className="absolute right-7 top-8 h-32 w-32 rounded-full bg-[#F3D67A]/70 blur-2xl"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.55, 0.8, 0.55] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -bottom-14 left-[-7%] h-44 w-[120%] rounded-[50%] bg-[#7EA56A]"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                  <div>
                    <p className="font-display text-3xl font-extrabold tracking-tight text-white drop-shadow">Field view</p>
                    <p className="font-body text-sm text-white/80">Interactive 3D scene ready when you add a Spline URL.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSpline(Boolean(SPLINE_SCENE_URL))}
                    className="rounded-xl border border-white/30 bg-white/15 px-3 py-2 font-body text-xs font-bold text-white backdrop-blur"
                  >
                    {SPLINE_SCENE_URL ? 'Use 3D' : '3D optional'}
                  </button>
                </div>
                {['#4E7B4C', '#6D9B57', '#3D653E'].map((color, i) => (
                  <motion.div
                    key={color}
                    className="absolute bottom-[9%] left-[36%] h-44 w-20 origin-bottom"
                    initial={{ x: (i - 1) * 32, rotate: [-25, 0, 24][i] }}
                    animate={{ x: (i - 1) * 32, rotate: [-25 + i * 24, -18 + i * 20, -25 + i * 24] }}
                    transition={{ x: { duration: 0.6 }, rotate: { duration: 3.8 + i, repeat: Infinity, ease: 'easeInOut' } }}
                  >
                    <svg viewBox="0 0 90 180" className="h-full w-full">
                      <path d="M45 180C45 140 45 100 46 52" stroke="#2C5932" strokeWidth="6" strokeLinecap="round" />
                      <path d="M47 91C18 87 4 66 7 41C30 42 47 58 47 91Z" fill={color} />
                      <path d="M45 121C70 114 85 97 85 75C63 75 49 89 45 121Z" fill={color} opacity=".84" />
                    </svg>
                  </motion.div>
                ))}
              </div>
            )}
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/40 bg-black/10 px-3 py-1.5 text-white backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B8E07C]" />
              <span className="font-data text-[10px] uppercase tracking-[0.2em]">live field layer</span>
            </div>
          </motion.div>
        </section>

        <section className="mt-10">
          <div className="grid gap-5 lg:grid-cols-[1.08fr_.92fr]">
            <motion.div
              layout
              className="rounded-[32px] border border-[#D5E3D1] bg-white/90 p-5 shadow-[0_28px_80px_-34px_rgba(33,69,39,.35)] backdrop-blur-xl sm:p-7"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-body text-[11px] font-bold uppercase tracking-[0.22em] text-[#7A8D79]">01 / Capture</p>
                  <h2 className="font-display mt-1 text-2xl font-extrabold tracking-tight text-[#1B3723]">Upload a leaf</h2>
                </div>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="grid h-9 w-9 place-items-center rounded-full border border-[#D8E5D3] bg-[#F7FAF5] text-[#668068] transition hover:bg-[#EDF5E8]"
                    aria-label="Remove selected image"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <label
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`group relative flex min-h-[320px] cursor-pointer items-center justify-center overflow-hidden rounded-[26px] border-2 border-dashed transition-all duration-300 ${
                  isDragging
                    ? 'scale-[1.01] border-[#3F814C] bg-[#ECF7E8] shadow-[0_0_0_7px_rgba(79,138,82,.08)]'
                    : preview
                      ? 'border-[#D7E4D2] bg-[#F7FAF5]'
                      : 'border-[#C9DBC6] bg-[#F8FBF7] hover:border-[#7EAA76] hover:bg-[#F3F9F1]'
                }`}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Selected leaf" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F2616]/70 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-white/70">Selected specimen</p>
                        <p className="mt-1 truncate font-display text-lg font-extrabold text-white">{selectedFile?.name}</p>
                      </div>
                      <span className="rounded-full bg-white/15 px-3 py-1.5 font-data text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                        image ready
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="relative px-6 py-10 text-center">
                    <motion.div
                      animate={isDragging ? { scale: [1, 1.12, 1], rotate: [0, -5, 5, 0] } : { y: [0, -6, 0] }}
                      transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
                      className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-[24px] border border-[#D8E6D4] bg-white text-[#4F8A52] shadow-[0_14px_35px_rgba(42,82,48,.10)]"
                    >
                      <Camera size={32} strokeWidth={1.8} />
                    </motion.div>
                    <p className="font-display text-xl font-extrabold tracking-tight text-[#28462F]">
                      {isDragging ? 'Release to plant the image' : 'Drag & drop your leaf photo'}
                    </p>
                    <p className="font-body mt-2 text-sm text-[#728574]">or click to browse PNG, JPG or JPEG files</p>
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#ECF4E9] px-3 py-1.5 font-body text-xs font-semibold text-[#5D755E]">
                      <Upload size={13} />
                      Maximize accuracy with a clear leaf
                    </div>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={analyzeImage}
                  disabled={!selectedFile || loading}
                  className="relative flex h-14 flex-1 items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#1F5A38] px-5 font-body text-sm font-extrabold text-white shadow-[0_16px_35px_-16px_rgba(31,90,56,.75)] transition hover:-translate-y-0.5 hover:bg-[#184C2E] disabled:cursor-not-allowed disabled:bg-[#DDE8DA] disabled:text-[#8BA08B] disabled:shadow-none"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {loading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex items-center gap-3"
                      >
                        <span className="relative h-5 w-5">
                          <span className="absolute inset-0 rounded-full border-2 border-white/30" />
                          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-white" />
                        </span>
                        Reading plant signals…
                      </motion.span>
                    ) : (
                      <motion.span
                        key="ready"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex items-center gap-2"
                      >
                        <ScanLine size={18} />
                        Diagnose this leaf
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {selectedFile && !loading && (
                    <motion.span
                      className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-white/10"
                      animate={{ x: [-100, 260] }}
                      transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
                    />
                  )}
                </button>
                {preview && !loading && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-[#D9E5D6] bg-[#F7FAF5] px-5 font-body text-sm font-bold text-[#557158] transition hover:bg-white"
                  >
                    <RotateCcw size={16} />
                    Reset
                  </button>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 flex items-start gap-3 rounded-2xl border border-[#F1D1B2] bg-[#FFF5EA] p-4"
                >
                  <AlertTriangle className="mt-0.5 shrink-0 text-[#B8682D]" size={18} />
                  <div>
                    <p className="font-body text-sm font-extrabold text-[#8D4A23]">Field station unreachable</p>
                    <p className="mt-0.5 font-body text-sm leading-6 text-[#9E6544]">{error}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            <motion.div
              layout
              className="rounded-[32px] border border-[#D5E3D1] bg-[#173B24] p-5 text-white shadow-[0_28px_80px_-34px_rgba(24,61,36,.6)] sm:p-7"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body text-[11px] font-bold uppercase tracking-[0.22em] text-[#A9C5AD]">02 / Diagnose</p>
                  <h2 className="font-display mt-1 text-2xl font-extrabold tracking-tight">Prediction panel</h2>
                </div>
                {result && (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-body text-[10px] font-bold uppercase tracking-[0.15em] text-[#ffffff]">
                    complete
                  </span>
                )}
              </div>

              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="scan"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-7 rounded-[26px] border border-white/10 bg-white/[0.06] p-5"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white/[0.05]">
                      <div className="absolute inset-0 bg-[linear-gradient(100deg,transparent,rgba(177,225,153,.22),transparent)] animate-[pulse_2s_ease-in-out_infinite]" />
                      <motion.div
                        className="absolute left-0 right-0 h-1 bg-[#A8D57B] shadow-[0_0_24px_rgba(168,213,123,.7)]"
                        animate={{ top: ['6%', '94%', '6%'] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <div className="absolute inset-0 grid place-items-center">
                        <ScanLine size={58} className="text-white/55" strokeWidth={1.2} />
                      </div>
                    </div>
                    <div className="mt-5 space-y-3">
                      {[68, 42, 84].map((w, i) => (
                        <motion.div
                          key={i}
                          className="h-3 rounded-full bg-white/10"
                          animate={{ width: [`${w}%`, `${Math.min(w + 17, 96)}%`, `${w}%`] }}
                          transition={{ duration: 1.4 + i * 0.25, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      ))}
                    </div>
                    <p className="mt-5 font-data text-[10px] uppercase tracking-[0.22em] text-[#A8C49E]">Extracting leaf features…</p>
                  </motion.div>
                ) : result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="mt-7"
                  >
                    <div className={`rounded-[28px] border border-white/10 bg-gradient-to-br ${resultTone.gradient} p-5 text-[#1B3322] sm:p-6`}>
                      <div className="flex items-start justify-between gap-4">
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-body text-[10px] font-extrabold uppercase tracking-[0.16em] ${resultTone.badge}`}>
                          <ResultIcon size={14} />
                          {resultTone.label}
                        </span>
                        <CheckCircle2 className="text-[#4F8A52]" size={19} />
                      </div>

                      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
                        <ConfidenceRing confidence={result.confidence} healthy={isHealthy} />
                        <div className="min-w-0">
                          <p className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-[#71816F]">Predicted condition</p>
                          <h3 className="font-display mt-2 break-words text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[#17311F]">
                            {result.disease}
                          </h3>
                          <p className="font-body mt-2 text-sm leading-6 text-[#617063]">
                            Your model returned a {isHealthy ? 'healthy' : 'potentially affected'} leaf classification.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowDetails((current) => !current)}
                        className="mt-6 flex w-full items-center justify-between rounded-2xl border border-[#D9E7D2] bg-white/60 px-4 py-3 text-left font-body text-sm font-bold text-[#4A664D] transition hover:bg-white"
                      >
                        <span>{showDetails ? 'Hide model details' : 'Show model details'}</span>
                        <motion.span animate={{ rotate: showDetails ? 180 : 0 }}>
                          <ChevronDown size={17} />
                        </motion.span>
                      </button>

                      <AnimatePresence initial={false}>
                        {showDetails && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="grid gap-3 pt-4 sm:grid-cols-2">
                              <div className="rounded-2xl bg-white/55 p-4">
                                <p className="font-body text-[10px] font-bold uppercase tracking-[0.18em] text-[#788777]">Confidence</p>
                                <p className="font-data mt-1.5 text-lg font-bold text-[#294930]">{result.confidence}%</p>
                              </div>
                              <div className="rounded-2xl bg-white/55 p-4">
                                <p className="font-body text-[10px] font-bold uppercase tracking-[0.18em] text-[#788777]">Model status</p>
                                <p className="mt-1.5 font-body text-sm font-extrabold text-[#294930]">Prediction received</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-7 flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.055] p-6 text-center"
                  >
                    <motion.div
                      animate={{ y: [0, -8, 0], rotate: [0, -2, 2, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="relative mb-6 grid h-24 w-24 place-items-center rounded-[30px] border border-white/10 bg-white/[0.07]"
                    >
                      <Sprout size={42} className="text-[#A7D27E]" strokeWidth={1.4} />
                      <span className="absolute inset-0 rounded-[30px] shadow-[0_0_0_9px_rgba(167,210,126,.04)]" />
                    </motion.div>
                    <h3 className="font-display text-2xl font-extrabold tracking-tight">Waiting for a specimen</h3>
                    <p className="font-body mt-2 max-w-sm text-sm leading-6 text-[#A7BBA8]">
                      Upload a leaf on the left. The prediction, confidence ring and diagnostic state will appear here.
                    </p>
                    <div className="mt-6 flex items-center gap-2 font-data text-[10px] uppercase tracking-[0.2em] text-[#7F9E83]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#A7D27E]" />
                      model idle
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {featureCards.map(({ icon: Icon, title, text }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
              whileHover={{ y: -5 }}
              className="rounded-3xl border border-[#D9E6D5] bg-white/75 p-5 shadow-sm backdrop-blur"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ECF4E9] text-[#4F8A52]">
                <Icon size={19} />
              </div>
              <h3 className="font-display mt-4 text-base font-extrabold tracking-tight text-[#27452E]">{title}</h3>
              <p className="font-body mt-2 text-sm leading-6 text-[#718473]">{text}</p>
            </motion.div>
          ))}
        </section>

        <footer className="px-1 pb-4 pt-7 text-center sm:text-left">
          <p className="font-body text-xs text-[#849484]">
            Frontend-only redesign • existing FastAPI prediction endpoint retained
          </p>
        </footer>
      </div>
    </main>
  );
}

export default App;
