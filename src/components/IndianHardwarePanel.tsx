import React, { useState } from "react";
import {
  Wrench,
  Zap,
  ZapOff,
  RotateCcw,
  Radio,
  Wifi,
  WifiOff,
  Server,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  Terminal,
  BarChart3,
  Activity,
  List,
  FlaskConical,
  Sparkles,
  ArrowRight,
  Clock,
} from "lucide-react";
import {
  IndianIrrigationHardware,
  MqttTrafficBucket,
  MqttGatewayMetrics,
  FertilizerSchedule,
  FertilizerRecipeId,
  FertilizerExecutionLog,
  FiveSensors,
} from "../types";
import { MqttPacket } from "../utils/mqttSimulator";
import { MqttTrafficHourlyChart } from "./MqttTrafficHourlyChart";
import { FertilizerScheduler } from "./FertilizerScheduler";
import { useLanguage } from "../context/LanguageContext";

interface IndianHardwarePanelProps {
  hardware: IndianIrrigationHardware;
  mqttPackets: MqttPacket[];
  isGatewayOnline: boolean;
  onToggleGatewayConnection: () => void;
  onTriggerManualPump: (action: "START" | "STOP") => void;
  onClearMqttLogs: () => void;
  onResetVoltageFault?: () => void;
  onSimulateVoltageTrip?: () => void;
  mqttTrafficBuckets?: MqttTrafficBucket[];
  mqttGatewayMetrics?: MqttGatewayMetrics;
  onSimulateBottleneck?: (type: "RETRY_SPIKE" | "OFFLINE_BACKPRESSURE" | "CHANNEL_CONGESTION") => void;
  // Fertilizer Scheduler Props
  schedules?: FertilizerSchedule[];
  activeZoneId?: string;
  activeZoneName?: string;
  activeCropName?: string;
  sensors?: FiveSensors;
  onAddFertilizerSchedule?: (
    schedule: Omit<FertilizerSchedule, "id" | "createdTimestamp" | "totalDosedCount">
  ) => void;
  onToggleFertilizerSchedule?: (scheduleId: string) => void;
  onDeleteFertilizerSchedule?: (scheduleId: string) => void;
  onTriggerImmediateDose?: (recipeId: FertilizerRecipeId, doseKg: number, durationMin: number) => void;
  fertilizerExecutionLogs?: FertilizerExecutionLog[];
  isDosingActive?: boolean;
  activeDosingRecipe?: string;
}

export const IndianHardwarePanel: React.FC<IndianHardwarePanelProps> = ({
  hardware,
  mqttPackets,
  isGatewayOnline,
  onToggleGatewayConnection,
  onTriggerManualPump,
  onClearMqttLogs,
  onResetVoltageFault,
  onSimulateVoltageTrip,
  mqttTrafficBuckets,
  mqttGatewayMetrics,
  onSimulateBottleneck,
  schedules = [],
  activeZoneId = "zone-1",
  activeZoneName = "Active Block",
  activeCropName = "Crop",
  sensors,
  onAddFertilizerSchedule,
  onToggleFertilizerSchedule,
  onDeleteFertilizerSchedule,
  onTriggerImmediateDose,
  fertilizerExecutionLogs = [],
  isDosingActive = false,
  activeDosingRecipe,
}) => {
  const { t, language } = useLanguage();
  const [selectedMqttTopic, setSelectedMqttTopic] = useState<string>("all");
  const [gatewayViewMode, setGatewayViewMode] = useState<"split" | "chart" | "stream">("split");
  const [activeMainTab, setActiveMainTab] = useState<"hardware" | "fertilizer">("hardware");

  const filteredPackets =
    selectedMqttTopic === "all"
      ? mqttPackets
      : mqttPackets.filter((p) => p.topic.includes(selectedMqttTopic));

  // Fallback default buckets and metrics if not provided
  const safeBuckets: MqttTrafficBucket[] = mqttTrafficBuckets || [];
  const safeMetrics: MqttGatewayMetrics = mqttGatewayMetrics || {
    totalPacketsLastHour: mqttPackets.length * 12,
    packetsPerMinute: Number((mqttPackets.length / 5).toFixed(1)),
    successRatePercent: isGatewayOnline ? 98.4 : 88.0,
    avgLatencyMs: isGatewayOnline ? 38 : 190,
    bottleneckEventsCount: isGatewayOnline ? 1 : 2,
    activeBottleneck: isGatewayOnline ? null : "OFFLINE_BACKPRESSURE",
    bufferUsagePercent: Math.min(100, hardware.storedLocalTelemetryPackets * 4),
  };

  const getPumpStatusLabel = (status: string) => {
    if (status === "RUNNING") return t.hardware.pumpRunning;
    if (status === "TRIPPED_VOLTAGE") return t.hardware.pumpTripped;
    return t.hardware.pumpStandby;
  };

  return (
    <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-stone-950 px-4 py-2.5 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wrench className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-xs tracking-wider uppercase text-stone-200">
            {t.hardware.title}
          </h3>
          <span className="text-[11px] font-mono text-stone-400 px-2 py-0.5 rounded bg-stone-800 hidden sm:inline">
            Kirloskar / Texmo Relay • Jain Drip Manifold
          </span>
        </div>

        {/* Offline Gateway Simulator Button */}
        <button
          onClick={onToggleGatewayConnection}
          className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
            isGatewayOnline
              ? "bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900/60"
              : "bg-amber-950/70 border-amber-600 text-amber-300 hover:bg-amber-900/70 animate-pulse"
          }`}
        >
          {isGatewayOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gateway: Online MQTT</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Offline: Store & Forward ({hardware.storedLocalTelemetryPackets} buffered)</span>
            </>
          )}
        </button>
      </div>

      {/* Sub-header Navigation Tabs */}
      <div className="bg-stone-950/90 px-4 py-2 border-b border-stone-800 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
        <div className="flex items-center space-x-2">
          <button
            id="tab-hardware-relays-btn"
            onClick={() => setActiveMainTab("hardware")}
            className={`px-3 py-1 rounded-md cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeMainTab === "hardware"
                ? "bg-stone-800 text-stone-100 font-bold border border-stone-700 shadow-sm"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>Pump & Gateway Relays</span>
          </button>
          <button
            id="tab-fertilizer-scheduler-btn"
            onClick={() => setActiveMainTab("fertilizer")}
            className={`px-3 py-1 rounded-md cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeMainTab === "fertilizer"
                ? "bg-emerald-950 text-emerald-200 font-bold border border-emerald-700 shadow-sm"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
            <span>Automated Fertilizer Scheduler</span>
            {isDosingActive ? (
              <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-stone-950 text-[9px] font-bold animate-pulse">
                DOSING NOW
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 text-[10px] font-mono">
                {schedules.length}
              </span>
            )}
          </button>
        </div>

        {/* Quick Soil NPK Bar summary */}
        {sensors && (
          <div className="hidden sm:flex items-center space-x-2 text-[11px] bg-stone-900/60 px-2.5 py-0.5 rounded border border-stone-800/80">
            <span className="text-stone-500">In-Situ NPK:</span>
            <span
              className={`font-bold ${
                sensors.nitrogen < 180 ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              N: {sensors.nitrogen}
            </span>
            <span className="text-stone-600">|</span>
            <span className="text-stone-300 font-mono">P: {sensors.phosphorus ?? 22}</span>
            <span className="text-stone-600">|</span>
            <span className="text-stone-300 font-mono">K: {sensors.potassium ?? 195}</span>
            <span className="text-[10px] text-stone-500">kg/ha</span>
          </div>
        )}
      </div>

      {activeMainTab === "fertilizer" ? (
        <div className="p-4">
          {sensors ? (
            <FertilizerScheduler
              schedules={schedules}
              activeZoneId={activeZoneId}
              activeZoneName={activeZoneName}
              activeCropName={activeCropName}
              sensors={sensors}
              hardware={hardware}
              onAddSchedule={onAddFertilizerSchedule || (() => {})}
              onToggleSchedule={onToggleFertilizerSchedule || (() => {})}
              onDeleteSchedule={onDeleteFertilizerSchedule || (() => {})}
              onTriggerImmediateDose={onTriggerImmediateDose || (() => {})}
              executionLogs={fertilizerExecutionLogs}
              isDosingActive={isDosingActive}
              activeDosingRecipe={activeDosingRecipe}
            />
          ) : (
            <div className="p-8 text-center text-stone-500">Telemetry unavailable.</div>
          )}
        </div>
      ) : (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Hardware Status Panel */}
          <div className="space-y-3">
          {/* Submersible Pump Unit Card */}
          <div className="bg-stone-950/80 rounded-lg p-3 border border-stone-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {hardware.pumpMake}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  hardware.pumpStatus === "RUNNING"
                    ? "bg-emerald-950/70 border-emerald-700 text-emerald-300"
                    : hardware.pumpStatus === "TRIPPED_VOLTAGE"
                    ? "bg-red-950/70 border-red-700 text-red-300"
                    : "bg-stone-800 border-stone-700 text-stone-400"
                }`}
              >
                {getPumpStatusLabel(hardware.pumpStatus)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-2">
              <div className="bg-stone-900 p-2 rounded">
                <span className="text-stone-500 text-[10px] block">Motor Current</span>
                <span className="text-stone-100 font-bold">{hardware.motorCurrentAmps} A</span>
                <span className="text-[9px] text-stone-500 ml-1">(Rated 8.5A)</span>
              </div>
              <div className="bg-stone-900 p-2 rounded">
                <span className="text-stone-500 text-[10px] block">{t.hardware.lineVoltage}</span>
                <span
                  className={`font-bold ${
                    hardware.lineVoltage < 340 ? "text-red-400" : "text-stone-100"
                  }`}
                >
                  {hardware.lineVoltage} V
                </span>
                <span className="text-[9px] text-stone-500 ml-1">(415V target)</span>
              </div>
            </div>

            <div className="text-[11px] text-stone-400 font-mono mb-3">
              Starter: <strong>{hardware.starterType}</strong>
            </div>

            {/* Manual Pump Override / Voltage Fault Reset */}
            {hardware.pumpStatus === "TRIPPED_VOLTAGE" ? (
              <div className="space-y-2">
                <div className="p-2 rounded bg-rose-950/80 border border-rose-700 text-[11px] text-rose-200 flex items-center gap-1.5">
                  <ZapOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>DOL Starter tripped on voltage sag ({hardware.lineVoltage}V).</span>
                </div>
                {onResetVoltageFault && (
                  <button
                    id="reset-voltage-relay-btn"
                    onClick={onResetVoltageFault}
                    className="w-full py-1.5 rounded bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-950"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.hardware.resetFault}</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <button
                    id="start-pump-btn"
                    onClick={() => onTriggerManualPump("START")}
                    disabled={hardware.pumpStatus === "RUNNING" || hardware.feederPhaseStatus !== "3-PHASE_HEALTHY"}
                    className="flex-1 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    {language === "mr" ? "पंप सुरू करा" : language === "hi" ? "पंप चालू करें" : "Start Pump"}
                  </button>
                  <button
                    id="stop-pump-btn"
                    onClick={() => onTriggerManualPump("STOP")}
                    disabled={hardware.pumpStatus === "OFF"}
                    className="flex-1 py-1.5 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    {language === "mr" ? "पंप बंद करा" : language === "hi" ? "पंप बंद करें" : "Stop Pump"}
                  </button>
                </div>
                {onSimulateVoltageTrip && (
                  <button
                    id="simulate-voltage-trip-btn"
                    onClick={onSimulateVoltageTrip}
                    className="w-full mt-2 py-1 text-[11px] font-mono text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/60 rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <ZapOff className="w-3 h-3 text-rose-400" />
                    <span>{t.hardware.simulateTrip} (Sag to 312V)</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Drip Manifold & Venturi Fertigation */}
          <div className="bg-stone-950/80 rounded-lg p-3 border border-stone-800 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Manifold Pressure:</span>
              <span className="text-stone-200 font-bold">{hardware.manifoldPressureBar} bar</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Venturi Chem-Inject:</span>
              <span
                className={`font-bold ${
                  hardware.venturiStatus === "CLOSED" ? "text-stone-400" : "text-emerald-400"
                }`}
              >
                {hardware.venturiStatus}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Rural Feeder Grid:</span>
              <span
                className={`font-bold ${
                  hardware.feederPhaseStatus === "3-PHASE_HEALTHY"
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {hardware.feederPhaseStatus}
              </span>
            </div>

            {/* Quick Link to Fertilizer Scheduler */}
            <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
              <span className="text-stone-400 text-[10px]">Automated Dosing:</span>
              <button
                id="open-fert-scheduler-shortcut-btn"
                onClick={() => setActiveMainTab("fertilizer")}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <FlaskConical className="w-3 h-3 text-emerald-400" />
                <span>Configure NPK ({schedules.length}) ➔</span>
              </button>
            </div>
          </div>
        </div>

        {/* Local MQTT Gateway Terminal & Hourly Traffic Analyzer */}
        <div className="lg:col-span-2 bg-stone-950 rounded-lg border border-stone-800 flex flex-col justify-between overflow-hidden">
          {/* Section Header with View Modes */}
          <div className="bg-stone-900/95 px-3 py-2 border-b border-stone-800 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-stone-200 font-bold">Local Edge Mosquitto Gateway</span>
              <span className="hidden sm:inline text-[10px] text-stone-500">tcp://192.168.1.100:1883</span>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-stone-950 p-0.5 rounded border border-stone-800 text-[11px]">
              <button
                id="view-mode-split-btn"
                onClick={() => setGatewayViewMode("split")}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                  gatewayViewMode === "split"
                    ? "bg-emerald-700 text-white font-semibold"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>{t.hardware.splitView}</span>
              </button>
              <button
                id="view-mode-chart-btn"
                onClick={() => setGatewayViewMode("chart")}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                  gatewayViewMode === "chart"
                    ? "bg-emerald-700 text-white font-semibold"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                <span>{t.hardware.trafficChart}</span>
                {safeMetrics.bottleneckEventsCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
              <button
                id="view-mode-stream-btn"
                onClick={() => setGatewayViewMode("stream")}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                  gatewayViewMode === "stream"
                    ? "bg-emerald-700 text-white font-semibold"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <List className="w-3 h-3" />
                <span>{t.hardware.packetStream}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onClearMqttLogs}
                className="text-[10px] text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                Clear Log
              </button>
            </div>
          </div>

          {/* Body Content depending on view mode */}
          <div className="p-3 space-y-3">
            {/* 1-Hour Packet Frequency & Bottleneck Chart */}
            {(gatewayViewMode === "split" || gatewayViewMode === "chart") && (
              <div>
                <div className="flex items-center justify-between mb-1 text-[11px] font-mono text-stone-400">
                  <span className="flex items-center gap-1.5 text-stone-300 font-semibold">
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>MQTT Packet Frequency & Gateway Bottleneck Analysis (Last 60 Min)</span>
                  </span>
                  <span className="text-[10px] text-stone-500">5-Min Resolution Buckets</span>
                </div>
                <MqttTrafficHourlyChart
                  buckets={safeBuckets}
                  metrics={safeMetrics}
                  isGatewayOnline={isGatewayOnline}
                  onSimulateBottleneck={onSimulateBottleneck}
                />
              </div>
            )}

            {/* Live Packet Terminal Stream */}
            {(gatewayViewMode === "split" || gatewayViewMode === "stream") && (
              <div className="bg-stone-900/60 rounded-lg border border-stone-800/90 p-2 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono border-b border-stone-800 pb-1.5">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-3 h-3 text-cyan-400" />
                    <span className="text-stone-300 font-bold text-[11px]">
                      Live Mosquitto Stream ({filteredPackets.length} frames)
                    </span>
                  </div>

                  {/* Topic Filter selector */}
                  <div className="flex items-center space-x-1 text-[10px]">
                    <span className="text-stone-500">Filter:</span>
                    <button
                      onClick={() => setSelectedMqttTopic("all")}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${
                        selectedMqttTopic === "all"
                          ? "bg-stone-700 text-stone-100 font-bold"
                          : "text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setSelectedMqttTopic("telemetry")}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${
                        selectedMqttTopic === "telemetry"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold"
                          : "text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      Telemetry
                    </button>
                    <button
                      onClick={() => setSelectedMqttTopic("pump")}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${
                        selectedMqttTopic === "pump"
                          ? "bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold"
                          : "text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      Pump/Cmd
                    </button>
                    <button
                      onClick={() => setSelectedMqttTopic("alert")}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${
                        selectedMqttTopic === "alert"
                          ? "bg-rose-950 text-rose-300 border border-rose-800 font-bold"
                          : "text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      Alerts
                    </button>
                  </div>
                </div>

                <div
                  className={`font-mono text-xs overflow-y-auto space-y-1.5 scrollbar-thin ${
                    gatewayViewMode === "stream" ? "max-h-96" : "max-h-48"
                  }`}
                >
                  {filteredPackets.length === 0 ? (
                    <div className="text-stone-500 text-center py-6 text-xs">
                      Awaiting telemetry frames...
                    </div>
                  ) : (
                    filteredPackets.map((pkt, idx) => (
                      <div
                        key={`${pkt.id}-${idx}`}
                        className={`p-1.5 rounded border text-[11px] transition-colors ${
                          pkt.gatewayCached
                            ? "bg-amber-950/20 border-amber-800/50 text-amber-200"
                            : pkt.packetType === "ALARM_FAULT"
                            ? "bg-rose-950/20 border-rose-800/50 text-rose-200"
                            : pkt.packetType === "COMMAND"
                            ? "bg-cyan-950/20 border-cyan-800/50 text-cyan-200"
                            : "bg-stone-900/60 border-stone-800 text-stone-300"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-stone-500 mb-0.5">
                          <span className="text-emerald-400 font-semibold">{pkt.topic}</span>
                          <div className="flex items-center space-x-2">
                            {pkt.gatewayCached && (
                              <span className="px-1 py-0.2 rounded bg-amber-900/80 text-amber-300 text-[9px]">
                                STORED_LOCAL
                              </span>
                            )}
                            {pkt.packetType && (
                              <span className="text-[9px] font-mono text-stone-400">
                                {pkt.packetType}
                              </span>
                            )}
                            <span>QoS:{pkt.qos}</span>
                            <span>{pkt.timestamp}</span>
                          </div>
                        </div>
                        <div className="text-stone-400 truncate">
                          {JSON.stringify(pkt.payload)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Edge Gateway Status Footer */}
          <div className="bg-stone-900/70 px-3 py-2 border-t border-stone-800 flex items-center justify-between text-[11px] font-mono text-stone-400">
            <div className="flex items-center space-x-1.5">
              <Server className="w-3.5 h-3.5 text-stone-400" />
              <span>
                Edge Node: <strong>ESP32-S3 Gateway (Dual-Core 240MHz)</strong>
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <span>
                Protocol: <strong>MQTT v3.1.1 + LoRaWAN 868MHz</strong>
              </span>
              <span className="hidden sm:inline text-stone-500">
                Buffer: {hardware.storedLocalTelemetryPackets}/50
              </span>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
