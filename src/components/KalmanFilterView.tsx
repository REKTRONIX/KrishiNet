import React from "react";
import { Activity, Sliders, ShieldCheck, Info } from "lucide-react";
import { KalmanState } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface KalmanFilterViewProps {
  kalmanState: KalmanState;
  onUpdateNoise: (q: number, r: number) => void;
  targetSensorName?: string;
}

export const KalmanFilterView: React.FC<KalmanFilterViewProps> = ({
  kalmanState,
  onUpdateNoise,
  targetSensorName = "Shallow Soil Moisture (15cm)",
}) => {
  const { t, language } = useLanguage();
  const history = kalmanState.history;


  // SVG dimensions
  const svgWidth = 560;
  const svgHeight = 160;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 25;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Find min and max for scaling
  const allVals = history.flatMap((h) => [h.raw, h.filtered]);
  const minVal = Math.max(0, Math.floor(Math.min(...(allVals.length ? allVals : [15, 35])) - 4));
  const maxVal = Math.ceil(Math.max(...(allVals.length ? allVals : [15, 35])) + 4);
  const range = maxVal - minVal || 1;

  const getY = (val: number) => {
    return padTop + chartH - ((val - minVal) / range) * chartH;
  };

  const getX = (idx: number, total: number) => {
    if (total <= 1) return padLeft;
    return padLeft + (idx / (total - 1)) * chartW;
  };

  // Build SVG paths for Raw and Filtered series
  let rawPath = "";
  let filteredPath = "";

  history.forEach((pt, i) => {
    const x = getX(i, history.length);
    const yRaw = getY(pt.raw);
    const yFilt = getY(pt.filtered);

    if (i === 0) {
      rawPath = `M ${x} ${yRaw}`;
      filteredPath = `M ${x} ${yFilt}`;
    } else {
      rawPath += ` L ${x} ${yRaw}`;
      filteredPath += ` L ${x} ${yFilt}`;
    }
  });

  return (
    <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-stone-950 px-4 py-2.5 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-xs tracking-wider uppercase text-stone-200">
            {t.kalman.title}
          </h3>
          <span className="text-[11px] font-mono text-cyan-400/90 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 hidden sm:inline">
            Target: {targetSensorName}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-stone-400">
            {t.kalman.kalmanGain} (<strong className="text-cyan-300 font-bold">K</strong>):{" "}
            <span className="text-white bg-stone-800 px-1.5 py-0.5 rounded">
              {kalmanState.kalmanGain.toFixed(4)}
            </span>
          </span>
          <span className="text-stone-400 hidden sm:inline">
            Error Covariance (<strong className="text-amber-300 font-bold">P</strong>):{" "}
            <span className="text-white bg-stone-800 px-1.5 py-0.5 rounded">
              {kalmanState.estimateError.toFixed(4)}
            </span>
          </span>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Real-Time Graph */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-rose-400 inline-block" />
                <span className="text-stone-300">{t.kalman.rawSignal}</span>
                <span className="font-mono text-rose-400 font-bold ml-1">{kalmanState.raw.toFixed(1)}%</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-1 bg-cyan-400 inline-block rounded" />
                <span className="text-stone-300">{t.kalman.estimatedState}</span>
                <span className="font-mono text-cyan-300 font-bold ml-1">{kalmanState.filtered.toFixed(1)}%</span>
              </div>
            </div>
            <span className="text-stone-500 font-mono text-[10px]">Ring Buffer ({history.length} pts)</span>
          </div>

          {/* SVG Plot */}
          <div className="bg-stone-950 rounded-lg p-2 border border-stone-800 relative w-full overflow-hidden">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 select-none">
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padTop + chartH * ratio;
                const val = (maxVal - ratio * range).toFixed(0);
                return (
                  <g key={ratio}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={svgWidth - padRight}
                      y2={y}
                      stroke="#292524"
                      strokeDasharray="3 3"
                    />
                    <text x={padLeft - 6} y={y + 3} textAnchor="end" fill="#78716c" fontSize="9" fontFamily="monospace">
                      {val}%
                    </text>
                  </g>
                );
              })}

              {/* Raw Noisy Signal Line (dashed/thin rose) */}
              {rawPath && (
                <path
                  d={rawPath}
                  fill="none"
                  stroke="#fb7185"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  opacity="0.8"
                />
              )}

              {/* Kalman Filtered Smooth Signal (cyan thick glowing) */}
              {filteredPath && (
                <path
                  d={filteredPath}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Current head dot */}
              {history.length > 0 && (
                <circle
                  cx={getX(history.length - 1, history.length)}
                  cy={getY(kalmanState.filtered)}
                  r="4.5"
                  fill="#06b6d4"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              )}
            </svg>
          </div>
        </div>

        {/* Kalman Tuning Sliders & Formula Breakdown */}
        <div className="bg-stone-950/80 rounded-lg p-3 border border-stone-800 flex flex-col justify-between text-xs">
          <div>
            <div className="flex items-center space-x-1.5 font-semibold text-stone-300 mb-2">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Covariance Tuning Hyperparameters</span>
            </div>

            {/* Q: Process Noise */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between text-stone-400">
                <span>Process Noise (Q):</span>
                <span className="font-mono text-cyan-300 font-semibold">{kalmanState.processNoise.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.2"
                step="0.005"
                value={kalmanState.processNoise}
                onChange={(e) => onUpdateNoise(parseFloat(e.target.value), kalmanState.measurementNoise)}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] text-stone-500 block">
                Higher Q makes filter react faster to real soil dynamics.
              </span>
            </div>

            {/* R: Measurement Noise */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between text-stone-400">
                <span>Measurement Noise (R):</span>
                <span className="font-mono text-rose-300 font-semibold">{kalmanState.measurementNoise.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={kalmanState.measurementNoise}
                onChange={(e) => onUpdateNoise(kalmanState.processNoise, parseFloat(e.target.value))}
                className="w-full accent-rose-400 cursor-pointer"
              />
              <span className="text-[10px] text-stone-500 block">
                Higher R heavily dampens electromagnetic spikes from motor starters.
              </span>
            </div>
          </div>

          {/* Mathematical insight */}
          <div className="bg-stone-900/80 rounded p-2 border border-stone-800 font-mono text-[11px] text-stone-400 space-y-1">
            <div className="text-stone-300 font-semibold text-[11px] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> State Correction:
            </div>
            <div>x̂ₖ = x̂ₖ₋₁ + K(zₖ - x̂ₖ₋₁)</div>
            <div>K = Pₖ₋₁ / (Pₖ₋₁ + R)</div>
            <div className="text-emerald-400/90 text-[10px] mt-1 pt-1 border-t border-stone-800">
              ✓ Prevents false solenoid valve firing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
