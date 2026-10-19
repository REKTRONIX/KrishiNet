import React from "react";
import {
  Activity,
  Cpu,
  Wifi,
  WifiOff,
  Zap,
  Play,
  Pause,
  RotateCw,
  Sparkles,
  AlertTriangle,
  AlertOctagon,
  Layers,
  Download,
  FolderDown,
} from "lucide-react";
import { FarmZone } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface HeaderProps {
  zones: FarmZone[];
  activeZoneId: string;
  onSelectZone: (zoneId: string) => void;
  isRunning: boolean;
  onToggleRunning: () => void;
  onStepTick: () => void;
  speed: number;
  onSetSpeed: (speed: number) => void;
  isGatewayOnline: boolean;
  onToggleGateway: () => void;
  gridStatus: string;
  voltage: number;
  onOpenStressModal: () => void;
  onOpenAiModal: () => void;
  activeReflexCount: number;
  alertsCount?: number;
  onViewAlerts?: () => void;
  onExportData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  zones,
  activeZoneId,
  onSelectZone,
  isRunning,
  onToggleRunning,
  onStepTick,
  speed,
  onSetSpeed,
  isGatewayOnline,
  onToggleGateway,
  gridStatus,
  voltage,
  onOpenStressModal,
  onOpenAiModal,
  activeReflexCount,
  alertsCount = 0,
  onViewAlerts,
  onExportData,
}) => {
  const { t, translateCrop } = useLanguage();
  const activeZone = zones.find((z) => z.id === activeZoneId) || zones[0];

  return (
    <header className="bg-stone-900 border-b border-stone-800 sticky top-0 z-30 shadow-xl backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* Top bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/50 border border-emerald-400/30 shrink-0">
              <Cpu className="h-6 w-6 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
                  {t.header.appTitle} <span className="text-emerald-400 font-mono text-xs sm:text-sm px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/60">{t.header.versionTag}</span>
                </h1>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {t.header.appSubtitle}
              </p>
            </div>
          </div>

          {/* Quick Status Badges + Language Switcher */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Language Switcher */}
            <LanguageSwitcher variant="segmented" />

            {/* Edge Gateway Status */}
            <button
              onClick={onToggleGateway}
              title="Click to toggle Edge Gateway connectivity (simulate rural GSM link loss)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                isGatewayOnline
                  ? "bg-emerald-950/50 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60"
                  : "bg-amber-950/60 border-amber-700 text-amber-300 hover:bg-amber-900/70 animate-pulse"
              }`}
            >
              {isGatewayOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.header.mqttGateway}: <strong className="font-mono">{t.header.gatewayOnline}</strong></span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.header.mqttGateway}: <strong className="font-mono">{t.header.gatewayStoreAndForward}</strong></span>
                </>
              )}
            </button>

            {/* Indian 3-Phase Rural Feeder status */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                gridStatus === "3-PHASE_HEALTHY"
                  ? "bg-stone-800/80 border-stone-700 text-stone-300"
                  : "bg-red-950/70 border-red-700 text-red-300 animate-pulse"
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${gridStatus === "3-PHASE_HEALTHY" ? "text-amber-400" : "text-red-400"}`} />
              <span>{t.header.gridStatus}: <strong className="font-mono">{voltage}V</strong> ({gridStatus === "3-PHASE_HEALTHY" ? t.header.phaseNormal : t.header.singlePhasing})</span>
            </div>

            {/* Reflex Agent Loop Status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-200">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>{t.header.reflexPolicy}: <strong className="font-mono">{activeReflexCount > 0 ? t.header.intervened : t.header.optimizing}</strong></span>
            </div>

            {/* Active Alerts Badge */}
            {alertsCount > 0 && (
              <button
                id="header-active-alerts-btn"
                onClick={onViewAlerts}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-700 text-rose-200 hover:bg-rose-900 transition-all cursor-pointer shadow-md shadow-rose-950/50"
                title={`${alertsCount} active alert notification(s)`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                <span>{t.header.alerts}: <strong className="font-mono text-white">{alertsCount}</strong></span>
              </button>
            )}
          </div>
        </div>

        {/* Second bar: Zone selector & Simulation controls */}
        <div className="mt-3 pt-3 border-t border-stone-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Farm Zones Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Layers className="w-3.5 h-3.5" /> {t.header.zones}:
            </span>
            {zones.map((zone) => {
              const isSelected = zone.id === activeZoneId;
              const isStressed = zone.stressStatus !== "HEALTHY";

              return (
                <button
                  key={zone.id}
                  onClick={() => onSelectZone(zone.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? "bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-950/50"
                      : "bg-stone-800/70 border-stone-700/60 text-stone-300 hover:bg-stone-800 hover:text-white"
                  }`}
                >
                  <span>{zone.name} ({translateCrop(zone.crop)})</span>
                  {isStressed && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" title="Crop stress detected" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Action buttons & Sim control */}
          <div className="flex items-center space-x-2">
            {/* Simulation Play / Pause */}
            <div className="flex items-center bg-stone-800/90 rounded-lg p-1 border border-stone-700">
              <button
                onClick={onToggleRunning}
                className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                  isRunning ? "bg-amber-600 text-white" : "bg-emerald-600 text-white"
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> {t.header.pauseAgent}
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> {t.header.runAgent}
                  </>
                )}
              </button>

              <button
                onClick={onStepTick}
                disabled={isRunning}
                title={t.header.stepTooltip}
                className="px-2.5 py-1 text-xs text-stone-300 hover:text-white disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3 h-3" /> {t.header.step}
              </button>

              <div className="h-4 w-px bg-stone-700 mx-1" />

              {/* Speed toggle */}
              <div className="flex items-center text-xs space-x-1 px-1">
                {[1, 2, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => onSetSpeed(s)}
                    className={`px-1.5 py-0.5 rounded font-mono text-[11px] cursor-pointer ${
                      speed === s ? "bg-emerald-700 text-white font-bold" : "text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Stress scenario injector */}
            <button
              onClick={onOpenStressModal}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 border border-rose-800/80 text-rose-200 hover:bg-rose-900/60 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.header.simulateDisturbance}</span>
            </button>

            {/* Export 24-Hour Telemetry & RL Actions Dataset */}
            <button
              id="header-export-data-btn"
              onClick={onExportData}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/60 border border-cyan-700/80 text-cyan-200 hover:bg-cyan-900/60 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-cyan-950/40"
              title="Export 24-hour sensor telemetry and RL agent actions as CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.header.exportData}</span>
            </button>

            {/* Download Complete KrishiNet Codebase ZIP */}
            <a
              id="header-download-zip-btn"
              href="/api/download-zip"
              download="krishinet-precision-agro-agent.zip"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-950/60 border border-violet-700/80 text-violet-200 hover:bg-violet-900/60 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-violet-950/40"
              title="Download all KrishiNet codebase files and documentation as ZIP"
            >
              <FolderDown className="w-3.5 h-3.5 text-violet-400" />
              <span>Codebase (.zip)</span>
            </a>

            {/* AI Agronomist Consultation */}
            <button
              onClick={onOpenAiModal}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-950"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-spin" />
              <span>{t.header.aiAgronomist}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
