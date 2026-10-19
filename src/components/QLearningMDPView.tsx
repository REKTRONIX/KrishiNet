import React, { useState } from "react";
import {
  BrainCircuit,
  Zap,
  Award,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
  HelpCircle,
  Sparkles,
  Download,
} from "lucide-react";
import {
  ACTION_SPECS,
  ALL_ACTIONS,
} from "../utils/rlEngine";
import { AgentAction, QTableEntry, ReflexRuleLog } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface QLearningMDPViewProps {
  currentStateKey: string;
  lastAction: AgentAction;
  isExploration: boolean;
  lastReward: number;
  lastTdError: number;
  qTableEntries: QTableEntry[];
  stats: {
    totalSteps: number;
    cumulativeReward: number;
    avgRecentReward: number;
    epsilon: number;
    alpha: number;
    gamma: number;
  };
  reflexLogs: ReflexRuleLog[];
  onExplainDecision: () => void;
  isExplainingAi: boolean;
  onExportTelemetry?: () => void;
}

export const QLearningMDPView: React.FC<QLearningMDPViewProps> = ({
  currentStateKey,
  lastAction,
  isExploration,
  lastReward,
  lastTdError,
  qTableEntries,
  stats,
  reflexLogs,
  onExplainDecision,
  isExplainingAi,
  onExportTelemetry,
}) => {
  const { t, language } = useLanguage();
  const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(true);

  // Filter entries if requested
  const displayedEntries = filterActiveOnly
    ? qTableEntries.slice(0, 10)
    : qTableEntries;

  // Q-value background color helper
  const getQColor = (val: number, isBest: boolean) => {
    if (isBest) {
      return "bg-emerald-600/30 text-emerald-200 border border-emerald-500/50 font-bold";
    }
    if (val > 5) return "bg-emerald-950/30 text-emerald-300";
    if (val < -5) return "bg-red-950/30 text-red-300";
    return "text-stone-400";
  };

  return (
    <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-stone-950 px-4 py-2.5 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-xs tracking-wider uppercase text-stone-200">
            {t.rl.title}
          </h3>
          <span className="text-[11px] font-mono text-emerald-400/90 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 hidden sm:inline">
            Bellman TD Update
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {onExportTelemetry && (
            <button
              id="rl-export-24h-csv-btn"
              onClick={onExportTelemetry}
              className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-cyan-300 hover:text-white font-medium flex items-center gap-1.5 transition-all cursor-pointer border border-stone-700 shadow-sm"
              title="Export 24-hour sensor telemetry and RL agent actions as CSV"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>{t.common.export} (24h CSV)</span>
            </button>
          )}

          <button
            onClick={onExplainDecision}
            disabled={isExplainingAi}
            className="px-2.5 py-1 rounded bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3 h-3 ${isExplainingAi ? "animate-spin" : ""}`} />
            <span>{isExplainingAi ? t.rl.explaining : t.rl.explainDecision}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Training Metrics Strip */}
      <div className="bg-stone-950/70 px-4 py-3 border-b border-stone-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        {/* Step count */}
        <div className="bg-stone-900/90 p-2.5 rounded-lg border border-stone-800">
          <span className="text-stone-400 text-[11px] block">{t.rl.totalTransitions}</span>
          <span className="text-lg font-bold font-mono text-white">{stats.totalSteps}</span>
        </div>

        {/* Current State */}
        <div className="bg-stone-900/90 p-2.5 rounded-lg border border-stone-800">
          <span className="text-stone-400 text-[11px] block">{t.rl.currentState}</span>
          <span className="text-xs font-bold font-mono text-emerald-400 truncate block">
            {currentStateKey}
          </span>
        </div>

        {/* Last Action Executed */}
        <div className="bg-stone-900/90 p-2.5 rounded-lg border border-stone-800">
          <span className="text-stone-400 text-[11px] block">{t.rl.selectedAction}</span>
          <div className="flex items-center space-x-1">
            <span className="text-xs font-bold font-mono text-cyan-300 truncate">
              {ACTION_SPECS[lastAction]?.name || lastAction}
            </span>
            {isExploration && (
              <span className="text-[9px] px-1 rounded bg-amber-950 text-amber-300 border border-amber-700">
                EXPLORE
              </span>
            )}
          </div>
        </div>

        {/* Immediate Reward */}
        <div className="bg-stone-900/90 p-2.5 rounded-lg border border-stone-800">
          <span className="text-stone-400 text-[11px] block">{t.rl.bellmanReward} (rₜ)</span>
          <span
            className={`text-lg font-bold font-mono ${
              lastReward >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {lastReward >= 0 ? `+${lastReward.toFixed(1)}` : lastReward.toFixed(1)}
          </span>
        </div>

        {/* TD Error */}
        <div className="bg-stone-900/90 p-2.5 rounded-lg border border-stone-800">
          <span className="text-stone-400 text-[11px] block">{t.rl.tdError} (δₜ)</span>
          <span className="text-lg font-bold font-mono text-stone-200">
            {lastTdError.toFixed(3)}
          </span>
        </div>

        {/* Cumulative Reward */}
        <div className="bg-stone-900/90 p-2.5 rounded-lg border border-stone-800">
          <span className="text-stone-400 text-[11px] block">{t.rl.explorationRate} (ε)</span>
          <span className="text-lg font-bold font-mono text-teal-300">
            {(stats.epsilon * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Q-Table Live Heatmap */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-stone-300">Q(s, a) Policy Lookup Matrix</span>
              <span className="text-stone-500 font-mono text-[10px]">
                (State: Soil Moisture × Nitrogen × Micro-VPD)
              </span>
            </div>
            <button
              onClick={() => setFilterActiveOnly(!filterActiveOnly)}
              className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
            >
              {filterActiveOnly ? "Show All 18 States" : "Show Top States"}
            </button>
          </div>

          <div className="bg-stone-950 rounded-lg border border-stone-800 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-stone-900/90 text-stone-400 border-b border-stone-800 text-[11px]">
                <tr>
                  <th className="p-2.5">MDP State (s)</th>
                  {ALL_ACTIONS.map((a) => (
                    <th key={a} className="p-2.5 text-right">
                      {ACTION_SPECS[a]?.name.split(" ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {displayedEntries.map((row) => {
                  const isCurrent = row.stateKey === currentStateKey;
                  // Find best action for this state
                  const bestAction = ALL_ACTIONS.reduce((prev, curr) =>
                    row.qValues[curr] > row.qValues[prev] ? curr : prev
                  );

                  return (
                    <tr
                      key={row.stateKey}
                      className={`transition-colors ${
                        isCurrent
                          ? "bg-emerald-950/40 border-l-4 border-emerald-400"
                          : "hover:bg-stone-900/40"
                      }`}
                    >
                      <td className="p-2.5 font-sans font-medium text-stone-200 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          {isCurrent && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          )}
                          <span>{row.stateLabel}</span>
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono">{row.stateKey}</div>
                      </td>

                      {ALL_ACTIONS.map((a) => {
                        const val = row.qValues[a];
                        const isBest = a === bestAction;
                        return (
                          <td
                            key={a}
                            className={`p-2.5 text-right font-mono text-xs ${getQColor(
                              val,
                              isBest
                            )}`}
                          >
                            {val.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Model-Based Reflex Arbitrator & Safety Override Log */}
        <div className="bg-stone-950/80 rounded-lg p-3 border border-stone-800 flex flex-col justify-between text-xs">
          <div>
            <div className="flex items-center space-x-1.5 font-semibold text-stone-200 mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Reflex Agent Safety & Arbitration Rules</span>
            </div>
            <p className="text-[11px] text-stone-400 mb-3">
              Fast-path reflex heuristics supervise the RL agent, guaranteeing instant cut-off during Indian grid single-phasing or monsoon rains.
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {reflexLogs.length === 0 ? (
                <div className="p-3 rounded bg-stone-900/80 border border-stone-800 text-stone-400 text-center">
                  No active emergency triggers. RL policy executing autonomously.
                </div>
              ) : (
                reflexLogs.slice(0, 4).map((log, index) => (
                  <div
                    key={`${log.id}-${index}`}
                    className="p-2 rounded bg-stone-900 border border-stone-800 text-stone-300 space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-amber-400 font-bold">{log.type}</span>
                      <span className="text-stone-500">{log.timestamp}</span>
                    </div>
                    <div className="text-stone-200 font-medium text-[11px]">{log.trigger}</div>
                    <div className="text-emerald-400 text-[10px] flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" /> {log.actionTaken}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Hyperparameter knobs */}
          <div className="mt-3 pt-3 border-t border-stone-800 font-mono text-[11px] text-stone-400 grid grid-cols-3 gap-2 text-center">
            <div className="bg-stone-900 p-1.5 rounded">
              <span className="text-stone-500 block text-[9px]">ALPHA (α)</span>
              <span className="text-stone-200 font-bold">{stats.alpha}</span>
            </div>
            <div className="bg-stone-900 p-1.5 rounded">
              <span className="text-stone-500 block text-[9px]">GAMMA (γ)</span>
              <span className="text-stone-200 font-bold">{stats.gamma}</span>
            </div>
            <div className="bg-stone-900 p-1.5 rounded">
              <span className="text-stone-500 block text-[9px]">EPSILON (ε)</span>
              <span className="text-stone-200 font-bold">{stats.epsilon}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
