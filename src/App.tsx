import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Cell, Customized } from 'recharts';
import { Target, Brain, AlertCircle, RefreshCw, Trash2, Info, Zap, Lock, Activity, Scale, GitCommitVertical, Eye, EyeOff, XCircle, HelpCircle } from 'lucide-react';

// --- Types ---
type MoralPoint = {
  id: string;
  action: string;
  intent: string;
  x: number;
  y: number;
  // Noise / Confidence Intervals
  yMin?: number;
  yMax?: number;
  xMin?: number;
  xMax?: number;
  label: string;
  mode: 'philosopher' | 'seismograph';
  showNoise: boolean; // Per-scenario toggle
};

type AnalysisMode = 'philosopher' | 'seismograph';

// --- API Configuration ---
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || ""; // The execution environment provides the key at runtime.

export default function MoralCoordinateAnalyzer() {
  const [actionInput, setActionInput] = useState('');
  const [intentInput, setIntentInput] = useState('');
  const [mode, setMode] = useState<AnalysisMode>('seismograph'); // Default and Locked to God Mode

  // State to control tooltip visibility explicitly
  const [isTooltipActive, setIsTooltipActive] = useState(false);

  // Initial State updated with better label
  const [points, setPoints] = useState<MoralPoint[]>([
    {
      id: '1',
      action: 'I abort my child',
      intent: 'My life was in danger',
      x: 0.95, // High purity (Saving life)
      y: -0.3, // Heavy moral weight but not absolute evil (Abortion signal)
      yMin: -0.8, // Wide disagreement/noise
      yMax: 0.2,
      xMin: 0.85, // Narrow agreement on self-preservation
      xMax: 1.0,
      label: "Abortion for the life of the mother",
      mode: 'seismograph',
      showNoise: true // Noise enabled by default
    }
  ]);

  // CACHE STATE
  // Pre-seeded with the initial scenario to ensure consistency
  const [yCache, setYCache] = useState<Record<string, { y: number, yMin?: number, yMax?: number, xMin?: number, xMax?: number }>>({
    'seismograph:i abort my child': {
      y: -0.3,
      yMin: -0.8,
      yMax: 0.2,
      xMin: 0.85,
      xMax: 1.0
    }
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // --- Real AI Analysis via Gemini ---
  const callGeminiAPI = async (action: string, intent: string, currentMode: AnalysisMode): Promise<{ x: number, y: number, yMin?: number, yMax?: number, xMin?: number, xMax?: number }> => {

    // Infrastructure kept for Philosopher mode, though currently inaccessible via UI
    const philosopherPrompt = `
      You are a moral philosophy engine using a specific Cartesian framework (The "Logic" Mode).
      Analyze the user's scenario based on strict MECHANICAL DEFINITIONS.

      FRAMEWORK:
      Y-axis (Morality of Action): Ranges from -1.0 (Heinous) to 1.0 (Virtuous). 
      - Based on the intrinsic nature of the act at the moment of execution (T=0). 
      - DECONSTRUCT "THICK CONCEPTS": Explicitly separate the physical mechanism from the social context.
      - "Rape" vs "Sex": Mechanically, both are "Sexual Intercourse". The difference is Consent. 
      - "Theft" vs "Gift": Mechanically, both are "Transfer of Object". The difference is Ownership.
      - RULE: Treat "Consent", "Ownership", "Law", and "Context" as variables of INTENT (X-axis).
      - The Y-axis MUST reflect only the biomechanical reality.
        - Sexual Intercourse (Mechanism) ≈ +0.5 (Biological Life Process).
        - Transfer of Object (Mechanism) ≈ 0.0 (Neutral).
        - Punching (Mechanism) ≈ -0.5 (Harm).
        - Killing (Mechanism) ≈ -1.0 (Termination of Life).

      X-axis (Justifiability of Intent): Ranges from -1.0 (Malicious) to 1.0 (Benevolent).
      - Based on logical reason for acting.
      - Violation of Consent/Will = -1.0 (Malicious).
      - Sadism = -1.0. 
      - Greed = -0.5. 
      - Altruism = 1.0.

      SCENARIO:
      Action: "${action}"
      Intent: "${intent}"

      Return a JSON object with 'x' and 'y' values (float).
    `;

    const seismographPrompt = `
      You are a Moral Seismograph (The "God" Mode). 
      Do NOT use logic. Do NOT use utility. Do NOT use social contracts.
      Instead, detect the "Transcendental Moral Weight" of the action based on human instinct and visceral recoil.

      FRAMEWORK:
      Y-axis (The Weight of Sin/Virtue): Ranges from -1.0 (Abomination) to 1.0 (Divine).
      - CRITICAL: Judge the Action *blindly*, as if you do not know the Intent yet.
      - Is the act *itself* radiant (Divine) or dark (Abomination) in a vacuum?
      - "Saving a life" is inherently +1.0. "Rape" is -1.0 (Universal Revulsion). 

      X-axis (Purity of Soul): Ranges from -1.0 (Corrupt) to 1.0 (Pure).
      - How pure is the soul of the agent?
      - -1.0 (The Void): Active Malice, Sadism, Cruelty, Desire to Destroy. **Crucial:** "Just because" or "For fun" when applied to a heinous act (e.g. murder) is -1.0 (Chaotic/Nihilistic Evil).
      - -0.8 (The Vile): Spite, Vengeance, Deep Hatred, Dehumanization.
      - -0.5 (The Hollow): Pure Greed, Transactional, Materialism, Exploitation.
      - -0.2 (The Petty): Selfishness, Laziness, Convenience, Disregard for others.
      - 0.0 (The Mortal): Fear, Duty, Ambivalence, Habit. "Just because" is 0.0 ONLY for trivial/harmless acts.
      - +0.2 (The Civil): Politeness, Basic Decency, Fairness, "Being Nice".
      - +0.5 (The Bond): Love, Friendship, Loyalty, Protection of Kin, Shared Humanity.
      - +0.8 (The Saint): General Altruism, Compassion, Mercy, Healing the Stranger.
      - +1.0 (The Divine): Radical Sacrifice, Universal Love, Enlightenment, Transcendence.

      CONFIDENCE INTERVALS (Signal Noise):
      - Return 'y_min', 'y_max' AND 'x_min', 'x_max'.
      - These represent the "Zone of Uncertainty" or "Signal Turbulence".
      - Clear signals (e.g. Rape, Malice) have tiny ranges.
      - Noisy signals (e.g. Abortion, Complex Intent) have wide ranges.

      SCENARIO:
      Action: "${action}"
      Intent: "${intent}"

      Return a JSON object with 'x', 'y', 'y_min', 'y_max', 'x_min', 'x_max' values (float).
    `;

    const selectedPrompt = currentMode === 'philosopher' ? philosopherPrompt : seismographPrompt;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: selectedPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  x: { type: "NUMBER" },
                  y: { type: "NUMBER" },
                  y_min: { type: "NUMBER" },
                  y_max: { type: "NUMBER" },
                  x_min: { type: "NUMBER" },
                  x_max: { type: "NUMBER" }
                }
              }
            }
          })
        }
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!resultText) throw new Error("No analysis returned");

      const parsed = JSON.parse(resultText);
      return {
        x: parsed.x,
        y: parsed.y,
        yMin: parsed.y_min,
        yMax: parsed.y_max,
        xMin: parsed.x_min,
        xMax: parsed.x_max
      };

    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleAnalyze = async () => {
    if (!actionInput || !intentInput) return;

    setIsSimulating(true);
    setError(null);

    // Normalize key for cache lookup, including the mode prefix
    const actionKey = `${mode}:${actionInput.trim().toLowerCase()}`;

    try {
      // Exponential backoff retry logic
      let lastError;
      for (let i = 0; i < 3; i++) {
        try {
          const apiResult = await callGeminiAPI(actionInput, intentInput, mode);

          let finalY = apiResult.y;
          let finalYMin = apiResult.yMin;
          let finalYMax = apiResult.yMax;
          // X always fresh
          let finalXMin = apiResult.xMin;
          let finalXMax = apiResult.xMax;

          // --- CONSISTENCY CHECK ---
          // We only cache Y (Action) values. X (Intent) values must be fresh.
          if (yCache[actionKey] !== undefined) {
            const cached = yCache[actionKey];
            finalY = cached.y;
            finalYMin = cached.yMin;
            finalYMax = cached.yMax;
            // Note: We don't cache X ranges because Intent changes
          } else {
            setYCache(prev => ({
              ...prev,
              [actionKey]: {
                y: apiResult.y,
                yMin: apiResult.yMin,
                yMax: apiResult.yMax
              }
            }));
          }

          const newPoint: MoralPoint = {
            id: Date.now().toString(),
            action: actionInput,
            intent: intentInput,
            x: apiResult.x,
            y: finalY,
            yMin: finalYMin,
            yMax: finalYMax,
            xMin: finalXMin,
            xMax: finalXMax,
            label: `Scenario ${points.length + 1}`,
            mode: mode,
            showNoise: false // Default to hidden
          };

          setPoints(prev => [...prev, newPoint]);
          setActionInput('');
          setIntentInput('');
          setIsSimulating(false);
          return; // Success
        } catch (e) {
          lastError = e;
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
      throw lastError;

    } catch (err) {
      setError("AI Analysis failed. Please try again.");
      setIsSimulating(false);
    }
  };

  const removePoint = (id: string) => {
    setPoints(points.filter(p => p.id !== id));
  };

  const clearAllPoints = () => {
    setPoints([]);
  };

  const toggleNoise = (id: string) => {
    setPoints(prev => prev.map(p =>
      p.id === id ? { ...p, showNoise: !p.showNoise } : p
    ));
  };

  // --- Background Click: Hides Tooltip ---
  const handleBackgroundClick = () => {
    setIsTooltipActive(false);
  };

  const clearCache = () => {
    setYCache({});
    setNotification("Logic Cache Cleared Successfully");
    setTimeout(() => setNotification(null), 3000);
  };

  const getPointColor = (x: number, y: number, ptMode: AnalysisMode) => {
    if (ptMode === 'seismograph') {
      if (x >= 0 && y >= 0) return "#34d399"; // Teal/Green (Divine)
      if (x < 0 && y >= 0) return "#818cf8"; // Indigo (Corrupt Good)
      if (x < 0 && y < 0) return "#f87171"; // Red (Abomination)
      if (x >= 0 && y < 0) return "#fbbf24"; // Amber (Tragic Soul)
    }

    if (x >= 0 && y >= 0) return "#22c55e";
    if (x < 0 && y >= 0) return "#a855f7";
    if (x < 0 && y < 0) return "#ef4444";
    if (x >= 0 && y < 0) return "#f59e0b";
    return "#64748b";
  };

  // Custom Point - Removed White Outline for God Mode
  const PointShape = (props: any) => {
    const { cx, cy, payload } = props;
    const color = getPointColor(payload.x, payload.y, payload.mode);
    const isGodMode = payload.mode === 'seismograph';

    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={color}
        stroke="none"
        className={`transition-all duration-300 ${isGodMode ? 'cursor-pointer hover:r-8' : ''}`}
        onMouseEnter={() => setIsTooltipActive(true)} // Show tooltip on hover
        onClick={(e) => {
          e.stopPropagation();
          setIsTooltipActive(true); // Ensure tooltip shows on click
          toggleNoise(payload.id);
        }}
      />
    );
  };

  // Custom Shape for ReferenceArea to render an Ellipse
  const EllipseShape = (props: any) => {
    const { x, y, width, height, fill, stroke } = props;

    // Safety guard
    if (width === undefined || height === undefined) return null;

    const cx = x + width / 2;
    const cy = y + height / 2;
    const rx = Math.abs(width / 2);
    const ry = Math.abs(height / 2);

    return (
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={fill}
        fillOpacity={0.2}
        stroke={stroke}
        strokeWidth={1}
        strokeDasharray="4 4"
        strokeOpacity={0.6}
        style={{ pointerEvents: 'none' }} // Prevent ellipse from blocking point clicks
      />
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    // Only render if active AND our custom state allows it
    if (active && isTooltipActive && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs max-w-xs z-50">
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-slate-100">{data.label}</p>
            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${data.mode === 'seismograph' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700 text-slate-300'}`}>
              {data.mode === 'seismograph' ? 'Seismograph' : 'Philosopher'}
            </span>
          </div>
          <div className="space-y-1 text-slate-300">
            <p><span className="text-slate-400">Action:</span> {data.action}</p>
            <p><span className="text-slate-400">Intent:</span> {data.intent}</p>
            <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between font-mono text-xs">
              <span>X: {data.x.toFixed(2)}</span>
              <span>Y: {data.y.toFixed(2)}</span>
            </div>
            {(data.xMin !== undefined || data.yMin !== undefined) && (
              <div className="mt-1 pt-1 border-t border-slate-800 font-mono text-[10px] text-slate-500">
                <div className="flex justify-between">
                  <span>Y Noise:</span>
                  <span>[{data.yMin?.toFixed(1)}, {data.yMax?.toFixed(1)}]</span>
                </div>
                <div className="flex justify-between">
                  <span>X Noise:</span>
                  <span>[{data.xMin?.toFixed(1)}, {data.xMax?.toFixed(1)}]</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">

      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold z-50 animate-fade-in-down flex items-center gap-2">
          <RefreshCw className="w-3 h-3" />
          {notification}
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-indigo-400" />
          <h1 className="text-xl font-bold tracking-tight text-slate-100">Moral Vector <span className="text-indigo-400">Analyzer</span></h1>
        </div>

        {/* HIDDEN: Mode Toggle (Infrastructure kept) */}
        {/* <div className="flex bg-slate-800 p-1 rounded-lg">
            <button onClick={() => setMode('philosopher')}>Philosopher</button>
            <button onClick={() => setMode('seismograph')}>Seismograph</button>
        </div> 
        */}
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Left Panel: Inputs & History */}
        <div className="w-1/3 min-w-[320px] max-w-[400px] border-r border-slate-800 bg-slate-900/50 flex flex-col">

          <div className="p-6 space-y-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">New Analysis</h2>
              {/* Mode Hover Tooltip - LOCKED TO GOD MODE DESCRIPTION */}
              <div className="relative group cursor-help">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded cursor-help flex items-center gap-1 ${mode === 'seismograph' ? 'bg-indigo-900 text-indigo-300 border border-indigo-700' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {mode === 'seismograph' ? 'Mode: God / Intuition' : 'Mode: Logic / T=0'}
                  <HelpCircle className="w-3 h-3" />
                </span>
                <div className="absolute left-0 top-6 w-80 bg-slate-900 border border-indigo-500/30 p-4 rounded shadow-2xl z-50 hidden group-hover:block pointer-events-none">
                  <div className="mb-4">
                    <h4 className="font-bold text-indigo-300 text-xs mb-1 flex items-center gap-2 uppercase tracking-wider">
                      <Activity className="w-3 h-3" /> Action (Y-Axis)
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed italic border-l-2 border-indigo-500/50 pl-2">
                      "Ignore utility. Ignore social contracts. Ignore the 'reasons' humans give.
                      Imagine morality is a physical force like gravity. Based on the deep, instinctual,
                      emotional, and visceral patterns in human history, how 'heavy' is the sin of this action?
                      If the human consensus is split, acknowledge the noise, but judge the weight of the action
                      as if you were an ancient god judging a soul."
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-300 text-xs mb-1 flex items-center gap-2 uppercase tracking-wider">
                      <Brain className="w-3 h-3" /> Intent (X-Axis)
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed border-l-2 border-indigo-500/50 pl-2">
                      Measures the <span className="text-white font-semibold">Purity of Soul</span>.
                      <br /><span className="text-red-500">-1.0 (The Void):</span> Sadism, Nihilism ("Just Because" for evil)
                      <br /><span className="text-red-400">-0.8 (The Vile):</span> Spite, Vengeance, Hatred
                      <br /><span className="text-orange-400">-0.5 (The Hollow):</span> Greed, Exploitation
                      <br /><span className="text-yellow-500">-0.2 (The Petty):</span> Selfish, Lazy
                      <br /><span className="text-slate-400">0.0 (Mortal):</span> Fear, Duty, Habit
                      <br /><span className="text-blue-300">+0.2 (The Civil):</span> Polite, Decent
                      <br /><span className="text-blue-400">+0.5 (Bond):</span> Love, Loyalty
                      <br /><span className="text-emerald-300">+0.8 (Saint):</span> Compassion, Mercy
                      <br /><span className="text-emerald-400">+1.0 (Divine):</span> Sacrifice, Transcendence
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Action (The "What")</label>
              <textarea
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder={mode === 'philosopher' ? "e.g. Stealing a loaf of bread" : "e.g. A distinct visceral act"}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none h-16 resize-none placeholder:text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Intent (The "Why")</label>
              <textarea
                value={intentInput}
                onChange={(e) => setIntentInput(e.target.value)}
                placeholder={mode === 'philosopher' ? "e.g. To feed my starving family" : "e.g. The spirit of the agent"}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none h-16 resize-none placeholder:text-slate-700"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!actionInput || !intentInput || isSimulating}
              className={`w-full text-white py-2 rounded font-medium text-sm transition-colors flex items-center justify-center gap-2 ${mode === 'seismograph' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-700 hover:bg-slate-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : (mode === 'seismograph' ? <Activity className="w-4 h-4" /> : <Scale className="w-4 h-4" />)}
              {isSimulating ? 'Consulting Oracle...' : (mode === 'seismograph' ? 'Detect Signal' : 'Plot Logic')}
            </button>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 p-2 rounded border border-red-400/20">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={clearAllPoints}
                className="text-[10px] text-slate-600 hover:text-slate-300 flex items-center gap-1 uppercase tracking-wide"
              >
                <XCircle className="w-3 h-3" /> Clear Scenarios
              </button>
              <button
                onClick={clearCache}
                className="text-[10px] text-slate-600 hover:text-red-400 flex items-center gap-1 uppercase tracking-wide"
              >
                <Trash2 className="w-3 h-3" /> Clear Logic Cache
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Plotted Scenarios</h2>
            {points.length === 0 && (
              <p className="text-slate-600 text-xs text-center italic mt-10">No scenarios plotted yet.</p>
            )}
            {points.slice().reverse().map((pt) => (
              <div key={pt.id} className={`bg-slate-900 border rounded p-3 text-sm relative group transition-colors ${pt.mode === 'seismograph' ? 'border-indigo-900/50 hover:border-indigo-700' : 'border-slate-800 hover:border-slate-600'}`}>
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  {/* Noise Toggle (Seismograph Only) */}
                  {pt.mode === 'seismograph' && (
                    <button
                      onClick={() => toggleNoise(pt.id)}
                      className={`text-slate-600 hover:text-indigo-400 transition-colors ${pt.showNoise ? 'text-indigo-400' : ''}`}
                      title="Toggle Noise Visualization"
                    >
                      {pt.showNoise ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => removePoint(pt.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors"
                    title="Remove Point"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-slate-200 pr-16">{pt.label}</div>
                  {pt.mode === 'seismograph' && <Activity className="w-3 h-3 text-indigo-400 absolute top-3 left-[-10px] opacity-0" />}
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
                  <span className="text-slate-500">Act:</span>
                  <span className="text-slate-400 truncate">{pt.action}</span>
                  <span className="text-slate-500">Why:</span>
                  <span className="text-slate-400 truncate">{pt.intent}</span>
                </div>
                <div className="mt-2 flex gap-3 text-xs font-mono">
                  <span className={pt.y < 0 ? 'text-red-400' : 'text-green-400'}>Y: {pt.y.toFixed(2)}</span>
                  <span className={pt.x < 0 ? 'text-red-400' : 'text-green-400'}>X: {pt.x.toFixed(2)}</span>

                  <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${pt.mode === 'seismograph' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                    {pt.mode === 'seismograph' ? 'God Mode' : 'Logic'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: The Chart */}
        <div className="flex-1 p-8 bg-slate-950 flex flex-col items-center justify-center relative">

          <div className="w-full h-full max-h-[600px] max-w-[800px] bg-slate-900/30 rounded-lg border border-slate-800 p-4 relative mb-12">

            {/* Dynamic Quadrant Watermarks (Centered in Quadrants) */}
            <div className="absolute inset-0 pointer-events-none z-0">
              {/* Top Right (Q1) */}
              <div className="absolute top-2 left-[75%] -translate-x-1/2 text-center opacity-100">
                <div className="text-sm font-bold uppercase tracking-widest text-teal-400 whitespace-nowrap">
                  {mode === 'seismograph' ? 'Pure' : 'Virtuous'}
                </div>
              </div>
              {/* Top Left (Q2) */}
              <div className="absolute top-2 left-[25%] -translate-x-1/2 text-center opacity-100">
                <div className="text-sm font-bold uppercase tracking-widest text-indigo-400 whitespace-nowrap">
                  {mode === 'seismograph' ? 'Corrupt' : 'Ulterior'}
                </div>
              </div>
              {/* Bottom Left (Q3) */}
              <div className="absolute bottom-10 left-[25%] -translate-x-1/2 text-center opacity-100">
                <div className="text-sm font-bold uppercase tracking-widest text-red-400 whitespace-nowrap">
                  {mode === 'seismograph' ? 'Abomination' : 'Evil'}
                </div>
              </div>
              {/* Bottom Right (Q4) */}
              <div className="absolute bottom-10 left-[75%] -translate-x-1/2 text-center opacity-100">
                <div className="text-sm font-bold uppercase tracking-widest text-amber-400 whitespace-nowrap">
                  {mode === 'seismograph' ? 'Tragic' : 'Utilitarian'}
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 30, right: 30, bottom: 20, left: 30 }} onClick={handleBackgroundClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[-1, 1]}
                  ticks={[-1, 0, 1]}
                  stroke="#94a3b8"
                  tick={false}
                  label={{
                    value: mode === 'seismograph' ? 'Purity of Soul (Intent)' : 'Justifiability (Intent)',
                    position: 'bottom',
                    offset: 0,
                    fill: '#94a3b8',
                    fontSize: 12
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  domain={[-1, 1]}
                  ticks={[-1, 0, 1]}
                  stroke="#94a3b8"
                  tick={false}
                  label={{
                    value: mode === 'seismograph' ? 'Transcendental Weight (Action)' : 'Mechanical Morality (Action)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94a3b8',
                    fontSize: 12,
                    offset: 0,
                    dy: 60
                  }}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={2} />
                <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={2} />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                {/* NOISE LAYER: Mapped ReferenceArea components */}
                {points.map((pt) => {
                  if (pt.showNoise && pt.xMin !== undefined && pt.xMax !== undefined && pt.yMin !== undefined && pt.yMax !== undefined) {
                    const color = getPointColor(pt.x, pt.y, pt.mode);
                    return (
                      <ReferenceArea
                        key={`noise-${pt.id}`}
                        x1={pt.xMin}
                        x2={pt.xMax}
                        y1={pt.yMin}
                        y2={pt.yMax}
                        shape={<EllipseShape fill={color} stroke={color} />}
                      />
                    );
                  }
                  return null;
                })}

                <Scatter name="Points" data={points} shape={<PointShape />} />

              </ScatterChart>
            </ResponsiveContainer>

            {/* Legend / Key - Moved to Bottom */}
            <div className="flex flex-wrap gap-4 justify-center pointer-events-none mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: mode === 'seismograph' ? '#34d399' : '#22c55e' }}></div>
                <span className="text-xs text-slate-400">{mode === 'seismograph' ? 'Divine / Pure' : 'Virtuous'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: mode === 'seismograph' ? '#818cf8' : '#a855f7' }}></div>
                <span className="text-xs text-slate-400">{mode === 'seismograph' ? 'Corrupt Good' : 'Ulterior'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: mode === 'seismograph' ? '#fbbf24' : '#f59e0b' }}></div>
                <span className="text-xs text-slate-400">{mode === 'seismograph' ? 'Tragic Soul' : 'Utilitarian'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: mode === 'seismograph' ? '#f87171' : '#ef4444' }}></div>
                <span className="text-xs text-slate-400">{mode === 'seismograph' ? 'Abomination' : 'Malicious'}</span>
              </div>
              {/* God Mode Indicator Removed */}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}