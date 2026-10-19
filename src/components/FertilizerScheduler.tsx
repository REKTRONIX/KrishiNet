import React, { useState } from "react";
import {
  FlaskConical,
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sparkles,
  Droplets,
  Calendar,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import {
  FiveSensors,
  IndianIrrigationHardware,
  FertilizerSchedule,
  FertilizerRecipeId,
  FertilizerExecutionLog,
  DosingTriggerMode,
} from "../types";
import { FERTILIZER_RECIPES } from "../utils/fertilizerRecipes";
import { useLanguage } from "../context/LanguageContext";

interface FertilizerSchedulerProps {
  schedules: FertilizerSchedule[];
  activeZoneId: string;
  activeZoneName: string;
  activeCropName: string;
  sensors: FiveSensors;
  hardware: IndianIrrigationHardware;
  onAddSchedule: (
    schedule: Omit<FertilizerSchedule, "id" | "createdTimestamp" | "totalDosedCount">
  ) => void;
  onToggleSchedule: (scheduleId: string) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onTriggerImmediateDose: (recipeId: FertilizerRecipeId, doseKg: number, durationMin: number) => void;
  executionLogs?: FertilizerExecutionLog[];
  isDosingActive: boolean;
  activeDosingRecipe?: string;
}

export const FertilizerScheduler: React.FC<FertilizerSchedulerProps> = ({
  schedules,
  activeZoneId,
  activeZoneName,
  activeCropName,
  sensors,
  hardware,
  onAddSchedule,
  onToggleSchedule,
  onDeleteSchedule,
  onTriggerImmediateDose,
  executionLogs = [],
  isDosingActive,
  activeDosingRecipe,
}) => {
  const { t, language } = useLanguage();
  const fT = t.fertilizerScheduler;

  const [activeTab, setActiveTab] = useState<"schedules" | "create" | "logs">("schedules");

  // Form State
  const [selectedRecipeId, setSelectedRecipeId] = useState<FertilizerRecipeId>("NPK_19_19_19");
  const [doseKg, setDoseKg] = useState<number>(10);
  const [durationMin, setDurationMin] = useState<number>(12);
  const [triggerMode, setTriggerMode] = useState<DosingTriggerMode>("INTERVAL_STEPS");
  const [intervalSteps, setIntervalSteps] = useState<number>(14);
  const [targetNutrient, setTargetNutrient] = useState<"N" | "P" | "K" | "BALANCED">("BALANCED");
  const [thresholdValue, setThresholdValue] = useState<number>(180);

  const curN = sensors.nitrogen;
  const curP = sensors.phosphorus ?? 22;
  const curK = sensors.potassium ?? 195;
  const curEc = sensors.ec ?? 0.85;
  const curPh = sensors.pH ?? 6.8;

  // Agronomic Benchmark evaluation
  const isNDeficit = curN < 180;
  const isPDeficit = curP < 16;
  const isKDeficit = curK < 160;
  const isInterlocked =
    hardware.feederPhaseStatus !== "3-PHASE_HEALTHY" ||
    hardware.lineVoltage < 340 ||
    hardware.pumpStatus === "TRIPPED_VOLTAGE";

  // Filter schedules for the current active zone
  const zoneSchedules = schedules.filter((s) => s.zoneId === activeZoneId);

  // Recommended preset helper
  const handleApplyPreset = () => {
    if (isNDeficit) {
      setSelectedRecipeId("UREA_46_0_0");
      setDoseKg(12);
      setDurationMin(10);
      setTriggerMode("THRESHOLD_DEFICIT");
      setTargetNutrient("N");
      setThresholdValue(180);
    } else if (isPDeficit) {
      setSelectedRecipeId("DAP_18_46_0");
      setDoseKg(12);
      setDurationMin(15);
      setTriggerMode("THRESHOLD_DEFICIT");
      setTargetNutrient("P");
      setThresholdValue(18);
    } else if (isKDeficit) {
      setSelectedRecipeId("MOP_0_0_60");
      setDoseKg(10);
      setDurationMin(12);
      setTriggerMode("THRESHOLD_DEFICIT");
      setTargetNutrient("K");
      setThresholdValue(170);
    } else {
      setSelectedRecipeId("NPK_19_19_19");
      setDoseKg(10);
      setDurationMin(12);
      setTriggerMode("INTERVAL_STEPS");
      setIntervalSteps(16);
      setTargetNutrient("BALANCED");
      setThresholdValue(190);
    }
    setActiveTab("create");
  };

  const handleCreateScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipe = FERTILIZER_RECIPES[selectedRecipeId];
    onAddSchedule({
      zoneId: activeZoneId,
      recipeId: selectedRecipeId,
      recipeName: recipe.name,
      doseKgPerHa: doseKg,
      injectionDurationMin: durationMin,
      triggerMode,
      intervalSteps,
      stepsUntilNext: intervalSteps,
      targetNutrient,
      thresholdValue,
      status: "ACTIVE",
    });
    setActiveTab("schedules");
  };

  return (
    <div className="bg-stone-950 rounded-lg border border-stone-800 p-3.5 space-y-4 font-mono text-xs">
      {/* Header with Venturi live animation and Crop Context */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-stone-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-stone-200 text-sm">{fT.title}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[10px] font-semibold">
                Jain Venturi 3/4"
              </span>
            </div>
            <div className="text-[11px] text-stone-400 font-sans">
              {activeZoneName} • <strong className="text-stone-300">{activeCropName}</strong>
            </div>
          </div>
        </div>

        {/* Live Venturi Status Indicator */}
        <div className="flex items-center space-x-2">
          {isDosingActive ? (
            <div className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 flex items-center gap-1.5 animate-pulse shadow-sm shadow-emerald-900">
              <Droplets className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              <span className="text-[11px] font-bold">
                {activeDosingRecipe || fT.dosingActive}
              </span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-400 flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-stone-600" />
              <span>Venturi Chem-Inject: Standby</span>
            </div>
          )}
        </div>
      </div>

      {/* Safety Interlock Banner if Voltage Fault */}
      {isInterlocked && (
        <div className="p-2.5 rounded bg-amber-950/70 border border-amber-700 text-amber-200 text-[11px] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">{fT.interlockNotice}</span>
            <span className="block text-[10px] text-amber-300/80 font-sans mt-0.5">
              Venturi injector draws chem-concentrate through differential pressure created by the
              submersible pump. Dosing schedules pause safely while line voltage is {hardware.lineVoltage}V.
            </span>
          </div>
        </div>
      )}

      {/* Soil NPK Sensor Telemetry Bar & Deficit Evaluation */}
      <div className="bg-stone-900/80 rounded-lg p-3 border border-stone-800/90 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-stone-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{fT.soilNpkStatus}</span>
          </span>
          <button
            id="fertilizer-auto-preset-btn"
            onClick={handleApplyPreset}
            className="px-2 py-0.5 rounded bg-emerald-900/50 hover:bg-emerald-800/60 border border-emerald-700 text-emerald-300 text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>{fT.autoPreset}</span>
          </button>
        </div>

        {/* N-P-K Telemetry Cards */}
        <div className="grid grid-cols-3 gap-2">
          {/* Nitrogen N */}
          <div
            className={`p-2 rounded border ${
              isNDeficit
                ? "bg-rose-950/40 border-rose-800/70 text-rose-200"
                : "bg-stone-950/70 border-stone-800 text-stone-300"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
              <span className="font-bold text-stone-200">Nitrogen (N)</span>
              <span className={isNDeficit ? "text-rose-400 font-bold" : "text-emerald-400"}>
                {isNDeficit ? "Deficit" : "Optimal"}
              </span>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-base font-bold font-mono">{curN}</span>
              <span className="text-[10px] text-stone-500">kg/ha</span>
            </div>
            <div className="text-[9px] text-stone-500 font-sans mt-0.5">Opt: 180–240 kg/ha</div>
            <div className="w-full h-1 rounded bg-stone-800 overflow-hidden mt-1.5">
              <div
                className={`h-full ${isNDeficit ? "bg-rose-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(100, (curN / 260) * 100)}%` }}
              />
            </div>
          </div>

          {/* Phosphorus P */}
          <div
            className={`p-2 rounded border ${
              isPDeficit
                ? "bg-amber-950/40 border-amber-800/70 text-amber-200"
                : "bg-stone-950/70 border-stone-800 text-stone-300"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
              <span className="font-bold text-stone-200">Phosphate (P)</span>
              <span className={isPDeficit ? "text-amber-400 font-bold" : "text-emerald-400"}>
                {isPDeficit ? "Low" : "Optimal"}
              </span>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-base font-bold font-mono">{curP}</span>
              <span className="text-[10px] text-stone-500">kg/ha</span>
            </div>
            <div className="text-[9px] text-stone-500 font-sans mt-0.5">Opt: 15–25 kg/ha</div>
            <div className="w-full h-1 rounded bg-stone-800 overflow-hidden mt-1.5">
              <div
                className={`h-full ${isPDeficit ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(100, (curP / 30) * 100)}%` }}
              />
            </div>
          </div>

          {/* Potassium K */}
          <div
            className={`p-2 rounded border ${
              isKDeficit
                ? "bg-amber-950/40 border-amber-800/70 text-amber-200"
                : "bg-stone-950/70 border-stone-800 text-stone-300"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
              <span className="font-bold text-stone-200">Potash (K)</span>
              <span className={isKDeficit ? "text-amber-400 font-bold" : "text-emerald-400"}>
                {isKDeficit ? "Low" : "Optimal"}
              </span>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-base font-bold font-mono">{curK}</span>
              <span className="text-[10px] text-stone-500">kg/ha</span>
            </div>
            <div className="text-[9px] text-stone-500 font-sans mt-0.5">Opt: 150–220 kg/ha</div>
            <div className="w-full h-1 rounded bg-stone-800 overflow-hidden mt-1.5">
              <div
                className={`h-full ${isKDeficit ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(100, (curK / 240) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Salinity & pH guard */}
        <div className="flex items-center justify-between text-[11px] pt-1 text-stone-400 border-t border-stone-800/60 font-sans">
          <span>
            Soil EC: <strong className="text-stone-200 font-mono">{curEc} dS/m</strong> (Safe &lt; 1.4)
          </span>
          <span>
            pH: <strong className="text-stone-200 font-mono">{curPh}</strong> (Optimal 6.5–7.5)
          </span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Fertigation Safe</span>
          </span>
        </div>
      </div>

      {/* Tab Controls: Active Schedules / New Schedule / Execution Logs */}
      <div className="flex items-center justify-between bg-stone-900/90 p-1 rounded-lg border border-stone-800">
        <div className="flex items-center space-x-1 text-[11px]">
          <button
            id="sched-tab-active-btn"
            onClick={() => setActiveTab("schedules")}
            className={`px-3 py-1 rounded cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === "schedules"
                ? "bg-emerald-700 text-white font-bold shadow-sm"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>
              {fT.activeSchedules} ({zoneSchedules.length})
            </span>
          </button>
          <button
            id="sched-tab-create-btn"
            onClick={() => setActiveTab("create")}
            className={`px-3 py-1 rounded cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === "create"
                ? "bg-emerald-700 text-white font-bold shadow-sm"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Plus className="w-3 h-3" />
            <span>{fT.newSchedule}</span>
          </button>
          <button
            id="sched-tab-logs-btn"
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-1 rounded cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === "logs"
                ? "bg-emerald-700 text-white font-bold shadow-sm"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>
              {fT.dosingLogs} ({executionLogs.length})
            </span>
          </button>
        </div>

        {/* Quick Manual Dose Button */}
        <button
          id="manual-dose-quick-btn"
          onClick={() => onTriggerImmediateDose("NPK_19_19_19", 10, 12)}
          disabled={isInterlocked}
          className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-[11px] font-semibold disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
          title="Trigger immediate 10kg 19:19:19 injection via Venturi"
        >
          <Play className="w-3 h-3" />
          <span>{fT.doseNow} (19:19:19)</span>
        </button>
      </div>

      {/* Tab 1: Active Schedules List */}
      {activeTab === "schedules" && (
        <div className="space-y-2">
          {zoneSchedules.length === 0 ? (
            <div className="text-center py-6 text-stone-500 bg-stone-900/40 rounded border border-stone-800/80">
              <p>No automated fertilizer schedules configured for this zone.</p>
              <button
                onClick={() => setActiveTab("create")}
                className="mt-2 px-3 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Create Automated NPK Schedule</span>
              </button>
            </div>
          ) : (
            zoneSchedules.map((sched) => {
              const recipe = FERTILIZER_RECIPES[sched.recipeId];
              const isCountdownDueSoon = sched.triggerMode === "INTERVAL_STEPS" && sched.stepsUntilNext <= 3;
              return (
                <div
                  key={sched.id}
                  className={`p-2.5 rounded-lg border transition-all ${
                    sched.status === "DOSING_NOW"
                      ? "bg-emerald-950/60 border-emerald-500 shadow-md shadow-emerald-950"
                      : sched.status === "ACTIVE"
                      ? "bg-stone-900/80 border-stone-800 hover:border-stone-700"
                      : "bg-stone-900/30 border-stone-800/50 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${recipe.colorClass}`}>
                          {recipe.name}
                        </span>
                        <span className="text-[11px] font-semibold text-stone-200">
                          {sched.doseKgPerHa} kg/ha • {sched.injectionDurationMin} min Venturi
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            sched.status === "DOSING_NOW"
                              ? "bg-emerald-900 text-emerald-300 animate-pulse"
                              : sched.status === "ACTIVE"
                              ? "bg-emerald-950 border border-emerald-800 text-emerald-400"
                              : "bg-stone-800 text-stone-400"
                          }`}
                        >
                          {sched.status}
                        </span>
                      </div>

                      {/* Trigger condition & countdown description */}
                      <div className="text-[11px] text-stone-400 flex items-center gap-2 font-sans">
                        {sched.triggerMode === "INTERVAL_STEPS" ? (
                          <span className="flex items-center gap-1 text-stone-300">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span>
                              Interval: Every <strong>{sched.intervalSteps} steps</strong> (
                              <span
                                className={`font-mono font-bold ${
                                  isCountdownDueSoon ? "text-amber-400 animate-pulse" : "text-stone-300"
                                }`}
                              >
                                {sched.stepsUntilNext} steps remaining
                              </span>
                              )
                            </span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-stone-300">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>
                              Sensor Trigger: Auto-dose when Soil {sched.targetNutrient} &lt;{" "}
                              <strong>{sched.thresholdValue} kg/ha</strong>
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-500 font-sans">
                        {recipe.recommendedFor} • Total Dosed: {sched.totalDosedCount} times
                      </div>
                    </div>

                    {/* Schedule Actions */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() =>
                          onTriggerImmediateDose(sched.recipeId, sched.doseKgPerHa, sched.injectionDurationMin)
                        }
                        disabled={isInterlocked}
                        className="p-1.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        title="Dose Now manually"
                      >
                        <Play className="w-3 h-3" />
                        <span>{fT.doseNow}</span>
                      </button>

                      <button
                        onClick={() => onToggleSchedule(sched.id)}
                        className={`p-1.5 rounded border text-[10px] font-semibold flex items-center gap-1 cursor-pointer ${
                          sched.status === "ACTIVE"
                            ? "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"
                            : "bg-emerald-950 border-emerald-800 text-emerald-300 hover:bg-emerald-900"
                        }`}
                        title={sched.status === "ACTIVE" ? fT.pause : fT.resume}
                      >
                        {sched.status === "ACTIVE" ? (
                          <>
                            <Pause className="w-3 h-3" />
                            <span>{fT.pause}</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            <span>{fT.resume}</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onDeleteSchedule(sched.id)}
                        className="p-1.5 rounded bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800 text-rose-300 cursor-pointer"
                        title={fT.delete}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: New Schedule Creation Form */}
      {activeTab === "create" && (
        <form onSubmit={handleCreateScheduleSubmit} className="space-y-3 bg-stone-900/60 p-3 rounded-lg border border-stone-800">
          <div className="text-[11px] font-bold text-stone-200 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Configure Automated NPK Dosing Schedule for {activeZoneName}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Recipe Selection */}
            <div>
              <label className="block text-[10px] text-stone-400 uppercase font-semibold mb-1">
                {fT.recipe}
              </label>
              <select
                value={selectedRecipeId}
                onChange={(e) => {
                  const id = e.target.value as FertilizerRecipeId;
                  setSelectedRecipeId(id);
                  const r = FERTILIZER_RECIPES[id];
                  setDoseKg(r.defaultDoseKgPerHa);
                  setDurationMin(r.injectionDurationMin);
                }}
                className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-xs text-stone-200 font-mono focus:border-emerald-500 focus:outline-none"
              >
                {Object.values(FERTILIZER_RECIPES).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (N:{r.nRatio} P:{r.pRatio} K:{r.kRatio})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-stone-500 font-sans mt-1">
                {FERTILIZER_RECIPES[selectedRecipeId].description}
              </p>
            </div>

            {/* Trigger Mode */}
            <div>
              <label className="block text-[10px] text-stone-400 uppercase font-semibold mb-1">
                Trigger Method
              </label>
              <select
                value={triggerMode}
                onChange={(e) => setTriggerMode(e.target.value as DosingTriggerMode)}
                className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-xs text-stone-200 font-mono focus:border-emerald-500 focus:outline-none"
              >
                <option value="INTERVAL_STEPS">Periodic Interval Cadence (Steps)</option>
                <option value="THRESHOLD_DEFICIT">Soil Sensor Deficit Threshold (Auto-Trigger)</option>
              </select>
              <p className="text-[10px] text-stone-500 font-sans mt-1">
                {triggerMode === "INTERVAL_STEPS"
                  ? "Executes automatically every N simulation cycles."
                  : "Monitors live soil sensors and injects when nutrient drops."}
              </p>
            </div>

            {/* Dosage & Duration */}
            <div>
              <label className="block text-[10px] text-stone-400 uppercase font-semibold mb-1">
                Dose Volume (kg/ha)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min={4}
                  max={25}
                  step={1}
                  value={doseKg}
                  onChange={(e) => setDoseKg(Number(e.target.value))}
                  className="flex-1 accent-emerald-500"
                />
                <span className="font-bold text-stone-200 font-mono w-12 text-right">
                  {doseKg} kg
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-stone-400 uppercase font-semibold mb-1">
                Venturi Duration (Minutes)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min={5}
                  max={25}
                  step={1}
                  value={durationMin}
                  onChange={(e) => setDurationMin(Number(e.target.value))}
                  className="flex-1 accent-emerald-500"
                />
                <span className="font-bold text-stone-200 font-mono w-12 text-right">
                  {durationMin} m
                </span>
              </div>
            </div>

            {/* Dynamic trigger parameters based on triggerMode */}
            {triggerMode === "INTERVAL_STEPS" ? (
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-stone-400 uppercase font-semibold mb-1">
                  Simulation Interval Cadence (Steps between injections)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min={6}
                    max={30}
                    step={2}
                    value={intervalSteps}
                    onChange={(e) => setIntervalSteps(Number(e.target.value))}
                    className="flex-1 accent-emerald-500"
                  />
                  <span className="font-bold text-stone-200 font-mono w-16 text-right">
                    {intervalSteps} steps
                  </span>
                </div>
              </div>
            ) : (
              <div className="sm:col-span-2 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-stone-400 uppercase font-semibold mb-1">
                    Target Sensor Nutrient
                  </label>
                  <select
                    value={targetNutrient}
                    onChange={(e) => setTargetNutrient(e.target.value as any)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-xs text-stone-200 font-mono focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="N">Soil Nitrogen (N)</option>
                    <option value="P">Soil Phosphate (P)</option>
                    <option value="K">Soil Potash (K)</option>
                    <option value="BALANCED">Composite NPK Deficit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-stone-400 uppercase font-semibold mb-1">
                    Trigger Below Threshold (kg/ha)
                  </label>
                  <input
                    type="number"
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-xs text-stone-200 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-800">
            <button
              type="button"
              onClick={() => setActiveTab("schedules")}
              className="px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{fT.createSchedule}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Execution Logs */}
      {activeTab === "logs" && (
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
          {executionLogs.length === 0 ? (
            <div className="text-center py-6 text-stone-500 bg-stone-900/40 rounded border border-stone-800/80">
              No fertigation cycles executed yet in current session.
            </div>
          ) : (
            executionLogs.map((log) => (
              <div
                key={log.id}
                className="p-2 rounded bg-stone-900/70 border border-stone-800 flex items-center justify-between text-[11px]"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400 font-bold">{log.recipeName}</span>
                    <span className="text-stone-300 font-mono">
                      {log.doseKg} kg ({log.durationMin}m)
                    </span>
                    <span className="text-[10px] text-stone-500 font-sans">
                      {log.triggerReason}
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                    N: {log.soilNBefore} ➔{" "}
                    <span className="text-emerald-400 font-bold">{log.soilNAfter} kg/ha</span> |
                    P: {log.soilPBefore} ➔{" "}
                    <span className="text-amber-400 font-bold">{log.soilPAfter} kg/ha</span> |
                    K: {log.soilKBefore} ➔{" "}
                    <span className="text-purple-400 font-bold">{log.soilKAfter} kg/ha</span>
                  </div>
                </div>
                <div className="text-[10px] text-stone-500 font-mono shrink-0">
                  {log.timeStr}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
