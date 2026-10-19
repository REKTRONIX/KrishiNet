import React, { useState, useMemo } from "react";
import {
  Download,
  X,
  FileSpreadsheet,
  Check,
  Layers,
  Clock,
  Cpu,
  Droplets,
  Zap,
  Activity,
  Table,
  CheckCircle2,
  Copy,
  Info,
} from "lucide-react";
import {
  AgentAction,
  ClimateTelemetry,
  FarmZone,
  FiveSensors,
  IndianIrrigationHardware,
  ReflexRuleLog,
} from "../types";
import { useLanguage } from "../context/LanguageContext";
import {
  convertTelemetryToCSV,
  downloadCsvFile,
  generate24HourTelemetryDataset,
  TelemetryExportRecord,
} from "../utils/telemetryExport";

interface ExportTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: FarmZone[];
  activeZoneId: string;
  currentSensors: FiveSensors;
  currentClimate: ClimateTelemetry;
  currentHardware: IndianIrrigationHardware;
  kalmanFilteredMoisture: number;
  recentReflexLogs: ReflexRuleLog[];
  currentAction: AgentAction;
  currentReward: number;
  currentTdError: number;
  onSuccessExport?: (filename: string, recordCount: number) => void;
}

export const ExportTelemetryModal: React.FC<ExportTelemetryModalProps> = ({
  isOpen,
  onClose,
  zones,
  activeZoneId,
  currentSensors,
  currentClimate,
  currentHardware,
  kalmanFilteredMoisture,
  recentReflexLogs,
  currentAction,
  currentReward,
  currentTdError,
  onSuccessExport,
}) => {
  const { t, translateCrop } = useLanguage();

  const [filterMode, setFilterMode] = useState<"ACTIVE_ZONE_ONLY" | "ALL_ZONES">("ACTIVE_ZONE_ONLY");
  const [intervalMinutes, setIntervalMinutes] = useState<15 | 30 | 60>(30);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [hasExported, setHasExported] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

  const activeZone = zones.find((z) => z.id === activeZoneId) || zones[0];

  // Dynamically generate preview dataset based on active options
  const dataset: TelemetryExportRecord[] = useMemo(() => {
    if (!isOpen) return [];
    return generate24HourTelemetryDataset({
      zones,
      activeZoneId,
      filterMode,
      intervalMinutes,
      currentSensors,
      currentClimate,
      currentHardware,
      kalmanFilteredMoisture,
      recentReflexLogs,
      currentAction,
      currentReward,
      currentTdError,
    });
  }, [
    isOpen,
    zones,
    activeZoneId,
    filterMode,
    intervalMinutes,
    currentSensors,
    currentClimate,
    currentHardware,
    kalmanFilteredMoisture,
    recentReflexLogs,
    currentAction,
    currentReward,
    currentTdError,
  ]);

  // Preview slice (latest 5 records)
  const previewSlice = useMemo(() => {
    return dataset.slice(-5).reverse();
  }, [dataset]);

  const targetFilename = useMemo(() => {
    const dateStr = new Date().toISOString().split("T")[0];
    const zoneSlug =
      filterMode === "ALL_ZONES"
        ? "AllZones"
        : activeZone.name.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 15);
    return `krishi_mitra_telemetry_rl_actions_24h_${zoneSlug}_${intervalMinutes}m_${dateStr}.csv`;
  }, [filterMode, activeZone.name, intervalMinutes]);

  const pythonSnippet = `import pandas as pd\n\n# Load 24-hour agro-telemetry & RL dataset\ndf = pd.read_csv("${targetFilename}", comment="#")\nprint(df.info())\nprint(df[['Timestamp_Local', 'Soil_Moisture_15cm_Kalman_Filtered_Pct_VWC', 'RL_Agent_Action_Executed', 'Bellman_Immediate_Reward_rt']].head())`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(pythonSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  const handleDownload = () => {
    setIsExporting(true);
    try {
      const csvString = convertTelemetryToCSV(dataset, {
        zoneName: activeZone.name,
        filterMode,
        intervalMinutes,
      });

      downloadCsvFile(csvString, targetFilename);

      setHasExported(true);
      if (onSuccessExport) {
        onSuccessExport(targetFilename, dataset.length);
      }
      setTimeout(() => {
        setIsExporting(false);
      }, 800);
      setTimeout(() => {
        setHasExported(false);
      }, 3500);
    } catch (err) {
      console.error("Export error:", err);
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-950 px-5 py-4 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/70 flex items-center justify-center text-cyan-400 shrink-0 shadow-md shadow-cyan-950/40">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2 truncate">
                <span>{t.exportTelemetry.modalTitle}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                  CSV • 24H
                </span>
              </h2>
              <p className="text-xs text-stone-400 truncate">
                {t.exportTelemetry.modalSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export dialog"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800/80 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-stone-300 scrollbar-thin">
          {/* Top Options Bar: Zone Scope & Interval */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Zone Scope Selection */}
            <div className="bg-stone-950/80 p-3.5 rounded-xl border border-stone-800/90 space-y-2">
              <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                {t.exportTelemetry.zoneScope}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFilterMode("ACTIVE_ZONE_ONLY")}
                  className={`px-3 py-2 rounded-lg text-left border transition-all cursor-pointer flex flex-col ${
                    filterMode === "ACTIVE_ZONE_ONLY"
                      ? "bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-sm"
                      : "bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-850 hover:text-stone-200"
                  }`}
                >
                  <span className="font-semibold text-xs text-stone-100 truncate">
                    {t.exportTelemetry.currentZoneOnly}
                  </span>
                  <span className="text-[10px] text-stone-400 truncate mt-0.5">
                    {activeZone.name} ({translateCrop(activeZone.crop)})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterMode("ALL_ZONES")}
                  className={`px-3 py-2 rounded-lg text-left border transition-all cursor-pointer flex flex-col ${
                    filterMode === "ALL_ZONES"
                      ? "bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-sm"
                      : "bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-850 hover:text-stone-200"
                  }`}
                >
                  <span className="font-semibold text-xs text-stone-100 truncate">
                    {t.exportTelemetry.allZones}
                  </span>
                  <span className="text-[10px] text-stone-400 truncate mt-0.5">
                    {zones.length} Zones • Basmati, Cotton, Cane, Tomato
                  </span>
                </button>
              </div>
            </div>

            {/* Time Resolution Selection */}
            <div className="bg-stone-950/80 p-3.5 rounded-xl border border-stone-800/90 space-y-2">
              <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {t.exportTelemetry.samplingInterval}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 15, label: "15 min", rows: "96 rows" },
                  { value: 30, label: "30 min", rows: "48 rows (Std)", badge: "Rec" },
                  { value: 60, label: "1 hour", rows: "24 rows" },
                ].map((item) => {
                  const isSelected = intervalMinutes === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setIntervalMinutes(item.value as 15 | 30 | 60)}
                      className={`px-2 py-2 rounded-lg text-center border transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                        isSelected
                          ? "bg-cyan-950/70 border-cyan-500 text-cyan-200 shadow-sm"
                          : "bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-850 hover:text-stone-200"
                      }`}
                    >
                      {item.badge && (
                        <span className="absolute -top-1.5 right-1 px-1 py-0.2 text-[8px] font-bold bg-cyan-600 text-white rounded">
                          {item.badge}
                        </span>
                      )}
                      <span className="font-semibold text-xs text-stone-100">{item.label}</span>
                      <span className="text-[9px] text-stone-400">{item.rows}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dataset Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-stone-950/60 p-3 rounded-xl border border-stone-800/70 flex flex-col">
              <span className="text-stone-500 text-[10px] uppercase font-semibold">
                {t.exportTelemetry.totalRecords}
              </span>
              <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                {dataset.length}
              </span>
              <span className="text-[10px] text-stone-400">
                {filterMode === "ALL_ZONES" ? "4 zones combined" : "Active zone records"}
              </span>
            </div>

            <div className="bg-stone-950/60 p-3 rounded-xl border border-stone-800/70 flex flex-col">
              <span className="text-stone-500 text-[10px] uppercase font-semibold">
                {t.exportTelemetry.totalColumns}
              </span>
              <span className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                48 Attributes
              </span>
              <span className="text-[10px] text-stone-400">Sensors, Weather, RL & HW</span>
            </div>

            <div className="bg-stone-950/60 p-3 rounded-xl border border-stone-800/70 flex flex-col">
              <span className="text-stone-500 text-[10px] uppercase font-semibold">
                {t.exportTelemetry.timeHorizon}
              </span>
              <span className="text-lg font-bold font-mono text-amber-300 mt-0.5">
                24.0 Hours
              </span>
              <span className="text-[10px] text-stone-400">Past 24h diurnal cycle</span>
            </div>

            <div className="bg-stone-950/60 p-3 rounded-xl border border-stone-800/70 flex flex-col">
              <span className="text-stone-500 text-[10px] uppercase font-semibold">
                {t.exportTelemetry.fileFormat}
              </span>
              <span className="text-lg font-bold font-mono text-stone-200 mt-0.5">
                RFC-4180 CSV
              </span>
              <span className="text-[10px] text-stone-400">~{(dataset.length * 0.38).toFixed(1)} KB payload</span>
            </div>
          </div>

          {/* Included Subsystems Matrix */}
          <div className="bg-stone-950/60 p-3.5 rounded-xl border border-stone-800/70 space-y-2">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
              {t.exportTelemetry.includedSubsystems}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-start gap-2 bg-stone-900/80 p-2 rounded-lg border border-stone-800">
                <Droplets className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-200 block">5-Sensor Root Zone Matrix</strong>
                  <span className="text-stone-400 text-[10.5px]">
                    15cm/45cm Moisture (% VWC), Kalman Denoised, NPK (kg/ha), EC (dS/m), Soil pH, Temp
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-stone-900/80 p-2 rounded-lg border border-stone-800">
                <Activity className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-200 block">Agrometeorology & Canopy Vision</strong>
                  <span className="text-stone-400 text-[10.5px]">
                    Ambient Temp, Humidity (RH), Solar (W/m²), VPD (kPa), Penman-Monteith ET0, CWSI, NDVI
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-stone-900/80 p-2 rounded-lg border border-stone-800">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-200 block">Indian Rural Irrigation Hardware</strong>
                  <span className="text-stone-400 text-[10.5px]">
                    415V 3-Phase Voltage, DOL Starter Tripping, Motor Amps, Manifold Pressure (bar), Venturi NPK
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-stone-900/80 p-2 rounded-lg border border-stone-800">
                <Cpu className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-200 block">Q-Learning RL & Reflex Safety Layer</strong>
                  <span className="text-stone-400 text-[10.5px]">
                    Selected Action, MDP State Key, Bellman Reward (rₜ), TD Error, Safety Override Rule & Trigger
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabular Preview */}
          <div className="bg-stone-950/80 rounded-xl border border-stone-800 overflow-hidden space-y-0">
            <div className="px-4 py-2.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs">
                <Table className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-stone-200">
                  {t.exportTelemetry.previewTitle}
                </span>
              </div>
              <span className="text-[10px] text-stone-400 font-mono">
                Showing {previewSlice.length} of {dataset.length} records
              </span>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-stone-900 text-stone-400 border-b border-stone-800 font-mono text-[10px]">
                    <th className="py-2 px-3 whitespace-nowrap">Time (Local)</th>
                    <th className="py-2 px-3 whitespace-nowrap">Zone</th>
                    <th className="py-2 px-3 whitespace-nowrap">Moisture (Kalman)</th>
                    <th className="py-2 px-3 whitespace-nowrap">N (kg/ha)</th>
                    <th className="py-2 px-3 whitespace-nowrap">VPD (kPa)</th>
                    <th className="py-2 px-3 whitespace-nowrap">Grid Voltage</th>
                    <th className="py-2 px-3 whitespace-nowrap">RL Agent Action</th>
                    <th className="py-2 px-3 whitespace-nowrap">Reward (rₜ)</th>
                    <th className="py-2 px-3 whitespace-nowrap">Decision Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono">
                  {previewSlice.map((row, idx) => {
                    const isReflex = row.decisionMode === "REFLEX_SAFETY_OVERRIDE";
                    const isExplore = row.decisionMode === "EXPLORATION";

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-stone-850/60 transition-colors text-stone-300"
                      >
                        <td className="py-2 px-3 whitespace-nowrap text-stone-400 text-[10.5px]">
                          {row.timestampLocal}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-stone-200">
                          {row.zoneId}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span
                            className={
                              row.shallowMoistureKalmanVwc < 22
                                ? "text-rose-400 font-bold"
                                : row.shallowMoistureKalmanVwc <= 34
                                ? "text-emerald-400"
                                : "text-blue-400"
                            }
                          >
                            {row.shallowMoistureKalmanVwc.toFixed(1)}% VWC
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-stone-300">
                          {row.nitrogenKgHa}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-amber-300">
                          {row.vpdKpa.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span
                            className={
                              row.lineVoltageV < 340 ? "text-rose-400 font-bold" : "text-stone-300"
                            }
                          >
                            {row.lineVoltageV}V
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-cyan-950/80 text-cyan-200 border border-cyan-800 font-sans font-medium">
                            {row.rlActionName}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span
                            className={
                              row.mdpReward >= 0 ? "text-emerald-400" : "text-rose-400 font-semibold"
                            }
                          >
                            {row.mdpReward >= 0 ? `+${row.mdpReward.toFixed(1)}` : row.mdpReward.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {isReflex ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-950/80 text-rose-300 border border-rose-800 font-sans font-semibold">
                              REFLEX OVERRIDE
                            </span>
                          ) : isExplore ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-950/80 text-amber-300 border border-amber-800 font-sans">
                              EXPLORE
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-sans">
                              EXPLOIT
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Python / Pandas Snippet Box */}
          <div className="bg-stone-950/80 p-3 rounded-xl border border-stone-800 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-stone-400 text-xs truncate">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">
                Load in Python: <code className="text-stone-200 font-mono text-[11px] bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">pd.read_csv("{targetFilename}", comment="#")</code>
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopySnippet}
              className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center gap-1 shrink-0 border border-stone-700 transition-colors cursor-pointer"
              title="Copy python pandas snippet"
            >
              {copiedSnippet ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-stone-400" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-stone-950 px-5 py-3.5 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-400 font-mono truncate w-full sm:w-auto">
            Target: <span className="text-cyan-300">{targetFilename}</span>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-transparent transition-colors cursor-pointer"
            >
              {t.common.close}
            </button>

            <button
              type="button"
              id="download-telemetry-csv-btn"
              onClick={handleDownload}
              disabled={isExporting}
              className={`px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer shadow-lg ${
                hasExported
                  ? "bg-emerald-600 border-emerald-400 text-white shadow-emerald-950/60"
                  : "bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 active:from-cyan-700 active:to-teal-700 border-cyan-500 text-white shadow-cyan-950/60"
              }`}
            >
              {hasExported ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                  <span>{t.common.save}</span>
                </>
              ) : isExporting ? (
                <>
                  <Download className="w-4 h-4 text-white animate-pulse" />
                  <span>{t.exportTelemetry.downloading}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>{t.exportTelemetry.downloadCsv}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
