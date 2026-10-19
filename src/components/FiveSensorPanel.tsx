import React from "react";
import {
  Droplets,
  Layers,
  FlaskConical,
  Gauge,
  Thermometer,
  CloudSun,
  Wind,
  CloudRain,
  Activity,
  Sliders,
  Download,
} from "lucide-react";
import { ClimateTelemetry, FiveSensors } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface FiveSensorPanelProps {
  sensors: FiveSensors;
  climate: ClimateTelemetry;
  kalmanMoistureFiltered: number;
  onSimulateSensorDrift: () => void;
  onManualAdjustSensor: (field: keyof FiveSensors, delta: number) => void;
  onExportTelemetry?: () => void;
}

export const FiveSensorPanel: React.FC<FiveSensorPanelProps> = ({
  sensors,
  climate,
  kalmanMoistureFiltered,
  onSimulateSensorDrift,
  onManualAdjustSensor,
  onExportTelemetry,
}) => {
  const { t, language } = useLanguage();

  // Moisture health helpers with multi-language labels
  const getMoistureBadge = (val: number) => {
    if (val < 20) {
      const label = language === "mr" ? "गंभीर तूट" : language === "hi" ? "गंभीर कमी" : "CRITICAL DEFICIT";
      return { label, color: "text-red-400 bg-red-950/60 border-red-800" };
    }
    if (val < 25) {
      const label = language === "mr" ? "मध्यम ताण" : language === "hi" ? "मध्यम तनाव" : "MODERATE STRESS";
      return { label, color: "text-amber-400 bg-amber-950/60 border-amber-800" };
    }
    if (val <= 36) {
      const label = language === "mr" ? "इष्टतम ओलावा" : language === "hi" ? "अनुकूलतम नमी" : "OPTIMAL VWC";
      return { label, color: "text-emerald-400 bg-emerald-950/60 border-emerald-800" };
    }
    const label = language === "mr" ? "जास्त पाणी / संतृप्त" : language === "hi" ? "अधिक जल / संतृप्त" : "SATURATED / HIGH";
    return { label, color: "text-blue-400 bg-blue-950/60 border-blue-800" };
  };

  const getNitrogenBadge = (val: number) => {
    if (val < 160) {
      const label = language === "mr" ? "कमतरता" : language === "hi" ? "कमी" : "DEFICIENT";
      return { label, color: "text-amber-400 bg-amber-950/60 border-amber-800" };
    }
    if (val <= 230) {
      const label = language === "mr" ? "संतुलित" : language === "hi" ? "संतुलित" : "BALANCED";
      return { label, color: "text-emerald-400 bg-emerald-950/60 border-emerald-800" };
    }
    const label = language === "mr" ? "अतिरिक्त" : language === "hi" ? "अतिरिक्त" : "SURPLUS";
    return { label, color: "text-purple-400 bg-purple-950/60 border-purple-800" };
  };

  const shallowStatus = getMoistureBadge(sensors.shallowMoisture);
  const deepStatus = getMoistureBadge(sensors.deepMoisture);
  const nStatus = getNitrogenBadge(sensors.nitrogen);

  return (
    <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-stone-950 px-4 py-2.5 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-teal-400" />
          <h3 className="font-semibold text-xs tracking-wider uppercase text-stone-200">
            {t.sensors.title}
          </h3>
          <span className="text-[11px] font-mono text-stone-400 px-2 py-0.5 rounded bg-stone-800 hidden sm:inline">
            FDR Capacitive + Optical NPK
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {onExportTelemetry && (
            <button
              id="sensors-export-24h-csv-btn"
              onClick={onExportTelemetry}
              className="text-[11px] px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-cyan-300 hover:text-white flex items-center gap-1 border border-stone-700 transition-all cursor-pointer shadow-sm"
              title="Export 24-hour calibrated sensor telemetry time series as CSV"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">{t.common.export} (24h CSV)</span>
              <span className="sm:hidden">24h CSV</span>
            </button>
          )}

          <button
            onClick={onSimulateSensorDrift}
            className="text-[11px] px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center gap-1 border border-stone-700 transition-all cursor-pointer"
            title="Inject measurement noise spike to evaluate Kalman Filter rejection"
          >
            <Sliders className="w-3 h-3 text-stone-400" />
            <span>{t.sensors.simulateDrift}</span>
          </button>
        </div>
      </div>

      {/* 5 Core Sensors Grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Sensor 1: Shallow Moisture */}
        <div className="bg-stone-950/70 rounded-lg p-3 border border-stone-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
              <span className="flex items-center gap-1 font-medium" title={t.sensors.shallowMoisture}>
                <Droplets className="w-3.5 h-3.5 text-cyan-400" /> {t.sensors.shallowMoisture.split("(")[0]}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${shallowStatus.color}`}>
                {shallowStatus.label}
              </span>
            </div>
            <div className="flex items-baseline space-x-2 my-1">
              <span className="text-2xl font-bold font-mono text-stone-100">
                {sensors.shallowMoisture.toFixed(1)}%
              </span>
              <span className="text-xs text-stone-400">VWC</span>
            </div>
            <div className="text-[11px] text-teal-400/90 font-mono">
              {t.sensors.kalmanFiltered}: <strong>{kalmanMoistureFiltered.toFixed(1)}%</strong>
            </div>
          </div>

          {/* Micro adjust */}
          <div className="flex items-center space-x-1 mt-2 pt-2 border-t border-stone-800/60">
            <button
              onClick={() => onManualAdjustSensor("shallowMoisture", -2)}
              className="flex-1 py-0.5 text-xs bg-stone-800 hover:bg-stone-700 rounded text-stone-300 font-mono cursor-pointer"
            >
              -2%
            </button>
            <button
              onClick={() => onManualAdjustSensor("shallowMoisture", +2)}
              className="flex-1 py-0.5 text-xs bg-stone-800 hover:bg-stone-700 rounded text-stone-300 font-mono cursor-pointer"
            >
              +2%
            </button>
          </div>
        </div>

        {/* Sensor 2: Deep Root Moisture (45cm) */}
        <div className="bg-stone-950/70 rounded-lg p-3 border border-stone-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
              <span className="flex items-center gap-1 font-medium">
                <Layers className="w-3.5 h-3.5 text-blue-400" /> Sensor 2: Deep (45cm)
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${deepStatus.color}`}>
                {deepStatus.label}
              </span>
            </div>
            <div className="flex items-baseline space-x-2 my-1">
              <span className="text-2xl font-bold font-mono text-stone-100">
                {sensors.deepMoisture.toFixed(1)}%
              </span>
              <span className="text-xs text-stone-400">VWC</span>
            </div>
            <div className="text-[11px] text-stone-400 font-mono">
              Subsoil taproot reserve buffer
            </div>
          </div>

          <div className="flex items-center space-x-1 mt-2 pt-2 border-t border-stone-800/60">
            <button
              onClick={() => onManualAdjustSensor("deepMoisture", -2)}
              className="flex-1 py-0.5 text-xs bg-stone-800 hover:bg-stone-700 rounded text-stone-300 font-mono cursor-pointer"
            >
              -2%
            </button>
            <button
              onClick={() => onManualAdjustSensor("deepMoisture", +2)}
              className="flex-1 py-0.5 text-xs bg-stone-800 hover:bg-stone-700 rounded text-stone-300 font-mono cursor-pointer"
            >
              +2%
            </button>
          </div>
        </div>

        {/* Sensor 3: Soil Nitrogen (N) */}
        <div className="bg-stone-950/70 rounded-lg p-3 border border-stone-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
              <span className="flex items-center gap-1 font-medium">
                <FlaskConical className="w-3.5 h-3.5 text-emerald-400" /> Sensor 3: Nitrogen (N)
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${nStatus.color}`}>
                {nStatus.label}
              </span>
            </div>
            <div className="flex items-baseline space-x-2 my-1">
              <span className="text-2xl font-bold font-mono text-stone-100">
                {sensors.nitrogen.toFixed(0)}
              </span>
              <span className="text-xs text-stone-400">kg/ha</span>
            </div>
            <div className="text-[11px] text-stone-400 font-mono">
              Target: 180-220 kg/ha
            </div>
          </div>

          <div className="flex items-center space-x-1 mt-2 pt-2 border-t border-stone-800/60">
            <button
              onClick={() => onManualAdjustSensor("nitrogen", -15)}
              className="flex-1 py-0.5 text-xs bg-stone-800 hover:bg-stone-700 rounded text-stone-300 font-mono cursor-pointer"
            >
              -15 N
            </button>
            <button
              onClick={() => onManualAdjustSensor("nitrogen", +15)}
              className="flex-1 py-0.5 text-xs bg-stone-800 hover:bg-stone-700 rounded text-stone-300 font-mono cursor-pointer"
            >
              +15 N
            </button>
          </div>
        </div>

        {/* Sensor 4: Phosphorus & Potassium (P & K) */}
        <div className="bg-stone-950/70 rounded-lg p-3 border border-stone-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
              <span className="flex items-center gap-1 font-medium">
                <FlaskConical className="w-3.5 h-3.5 text-amber-400" /> Sensor 4: P & K
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800">
                ACTIVE
              </span>
            </div>
            <div className="flex items-baseline justify-between my-1">
              <div>
                <span className="text-xs text-stone-400 mr-1">P:</span>
                <span className="text-lg font-bold font-mono text-stone-100">{sensors.phosphorus}</span>
                <span className="text-[10px] text-stone-400 ml-1">kg/ha</span>
              </div>
              <div>
                <span className="text-xs text-stone-400 mr-1">K:</span>
                <span className="text-lg font-bold font-mono text-stone-100">{sensors.potassium}</span>
                <span className="text-[10px] text-stone-400 ml-1">kg/ha</span>
              </div>
            </div>
            <div className="text-[11px] text-stone-400 font-mono">
              P: 15-25 • K: 150-200 kg/ha
            </div>
          </div>

          <div className="flex items-center space-x-1 mt-2 pt-2 border-t border-stone-800/60">
            <button
              onClick={() => onManualAdjustSensor("potassium", -10)}
              className="flex-1 py-0.5 text-xs bg-stone-800 hover:bg-stone-700 rounded text-stone-300 font-mono cursor-pointer"
            >
              -10 K
            </button>
            <button
              onClick={() => onManualAdjustSensor("potassium", +10)}
              className="flex-1 py-0.5 text-xs bg-stone-800 hover:bg-stone-700 rounded text-stone-300 font-mono cursor-pointer"
            >
              +10 K
            </button>
          </div>
        </div>

        {/* Sensor 5: EC & pH */}
        <div className="bg-stone-950/70 rounded-lg p-3 border border-stone-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
              <span className="flex items-center gap-1 font-medium">
                <Gauge className="w-3.5 h-3.5 text-purple-400" /> Sensor 5: EC & pH
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800">
                CALIBRATED
              </span>
            </div>
            <div className="flex items-baseline justify-between my-1">
              <div>
                <span className="text-xs text-stone-400 mr-1">EC:</span>
                <span className="text-lg font-bold font-mono text-stone-100">{sensors.ec.toFixed(2)}</span>
                <span className="text-[10px] text-stone-400 ml-1">dS/m</span>
              </div>
              <div>
                <span className="text-xs text-stone-400 mr-1">pH:</span>
                <span className="text-lg font-bold font-mono text-stone-100">{sensors.pH.toFixed(1)}</span>
              </div>
            </div>
            <div className="text-[11px] text-stone-400 font-mono">
              Salinity index: {sensors.ec > 1.8 ? "HIGH SALINITY" : "SAFE ROOT EC"}
            </div>
          </div>

          <div className="flex items-center space-x-1 mt-2 pt-2 border-t border-stone-800/60">
            <button
              onClick={() => onManualAdjustSensor("ec", -0.1)}
              className="flex-1 py-0.5 text-xs bg-stone-800 hover:bg-stone-700 rounded text-stone-300 font-mono cursor-pointer"
            >
              -EC
            </button>
            <button
              onClick={() => onManualAdjustSensor("ec", +0.2)}
              className="flex-1 py-0.5 text-xs bg-stone-800 hover:bg-stone-700 rounded text-stone-300 font-mono cursor-pointer"
            >
              +EC
            </button>
          </div>
        </div>
      </div>

      {/* Climate & Micro-environment Bar */}
      <div className="bg-stone-950/90 px-4 py-2.5 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-1 text-stone-400 font-medium">
          <CloudSun className="w-3.5 h-3.5 text-amber-400" />
          <span>Micro-Climate:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-stone-300 font-mono">
          <span className="flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
            Temp: <strong className="text-white">{climate.ambientTemp.toFixed(1)}°C</strong>
          </span>
          <span className="flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            RH: <strong className="text-white">{climate.humidity.toFixed(0)}%</strong>
          </span>
          <span className="flex items-center gap-1" title="Vapor Pressure Deficit (crucial for stomatal conductance)">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            VPD: <strong className={`${climate.vpd > 2.2 ? "text-amber-400 font-bold" : "text-white"}`}>{climate.vpd.toFixed(2)} kPa</strong>
          </span>
          <span className="flex items-center gap-1">
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            Wind: <strong className="text-white">{climate.windSpeed.toFixed(1)} km/h</strong>
          </span>
          <span className="flex items-center gap-1">
            <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
            Rain: <strong className={`${climate.rainRate > 0 ? "text-cyan-300 font-bold" : "text-stone-400"}`}>{climate.rainRate.toFixed(1)} mm/hr</strong>
          </span>
          <span className="flex items-center gap-1 text-stone-400">
            Penman ET₀: <strong className="text-stone-200">{climate.et0.toFixed(2)} mm/d</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
