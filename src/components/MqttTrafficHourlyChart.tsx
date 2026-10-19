import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  Radio,
  RefreshCw,
  Server,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap,
  ZapOff,
} from "lucide-react";
import { MqttPacketType, MqttTrafficBucket, MqttGatewayMetrics } from "../types";

interface MqttTrafficHourlyChartProps {
  buckets: MqttTrafficBucket[];
  metrics: MqttGatewayMetrics;
  isGatewayOnline: boolean;
  onSimulateBottleneck?: (type: "RETRY_SPIKE" | "OFFLINE_BACKPRESSURE" | "CHANNEL_CONGESTION") => void;
  onRefresh?: () => void;
}

interface PacketTypeMeta {
  type: MqttPacketType;
  label: string;
  color: string;
  hoverColor: string;
  badgeBg: string;
}

const PACKET_TYPE_CONFIG: PacketTypeMeta[] = [
  {
    type: "TELEMETRY",
    label: "Telemetry (Sensors/VPD)",
    color: "#10b981", // Emerald 500
    hoverColor: "#34d399",
    badgeBg: "bg-emerald-950/70 border-emerald-700 text-emerald-300",
  },
  {
    type: "COMMAND",
    label: "Commands (Pump/Valve)",
    color: "#06b6d4", // Cyan 500
    hoverColor: "#22d3ee",
    badgeBg: "bg-cyan-950/70 border-cyan-700 text-cyan-300",
  },
  {
    type: "HEARTBEAT",
    label: "Heartbeat (ESP32/LoRa)",
    color: "#8b5cf6", // Purple 500
    hoverColor: "#a78bfa",
    badgeBg: "bg-purple-950/70 border-purple-700 text-purple-300",
  },
  {
    type: "ALARM_FAULT",
    label: "Alarms & Fault Trips",
    color: "#f43f5e", // Rose 500
    hoverColor: "#fb7185",
    badgeBg: "bg-rose-950/70 border-rose-700 text-rose-300",
  },
  {
    type: "BUFFERED_SYNC",
    label: "Buffered / Retried Frames",
    color: "#f59e0b", // Amber 500
    hoverColor: "#fbbf24",
    badgeBg: "bg-amber-950/70 border-amber-700 text-amber-300",
  },
];

export const MqttTrafficHourlyChart: React.FC<MqttTrafficHourlyChartProps> = ({
  buckets,
  metrics,
  isGatewayOnline,
  onSimulateBottleneck,
  onRefresh,
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<MqttPacketType | "ALL">("ALL");
  const [hoveredBucket, setHoveredBucket] = useState<MqttTrafficBucket | null>(null);
  const [pinnedBucketId, setPinnedBucketId] = useState<string | null>(null);

  // Default to inspected pinned bucket or last bottleneck bucket or current bucket
  const pinnedBucket = buckets.find((b) => b.id === pinnedBucketId);
  const worstBottleneckBucket = [...buckets].reverse().find((b) => b.isBottleneck);
  const activeInspection = hoveredBucket || pinnedBucket || worstBottleneckBucket || buckets[buckets.length - 1];

  // SVG Chart Geometry
  const chartWidth = 560;
  const chartHeight = 160;
  const paddingLeft = 36;
  const paddingRight = 14;
  const paddingTop = 22;
  const paddingBottom = 26;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Compute maximum stack height across all buckets for scale
  const maxBucketTotal = Math.max(
    50,
    ...buckets.map((b) => {
      if (selectedTypeFilter === "ALL") return b.totalPackets;
      if (selectedTypeFilter === "TELEMETRY") return b.telemetryCount;
      if (selectedTypeFilter === "COMMAND") return b.commandCount;
      if (selectedTypeFilter === "HEARTBEAT") return b.heartbeatCount;
      if (selectedTypeFilter === "ALARM_FAULT") return b.alarmCount;
      return b.bufferedCount;
    })
  );
  const yDomainMax = Math.ceil(maxBucketTotal / 10) * 10;

  const slotWidth = plotWidth / buckets.length;
  const barWidth = Math.max(16, Math.min(30, slotWidth * 0.68));

  // Latency line points
  const maxLatency = Math.max(260, ...buckets.map((b) => b.avgLatencyMs));
  const latencyPoints = buckets.map((b, idx) => {
    const x = paddingLeft + idx * slotWidth + slotWidth / 2;
    const y = paddingTop + plotHeight - (b.avgLatencyMs / maxLatency) * (plotHeight * 0.85);
    return { x, y, latency: b.avgLatencyMs };
  });

  const latencyPathD = latencyPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, "");

  return (
    <div className="bg-stone-950 rounded-lg border border-stone-800 p-3 flex flex-col space-y-3 font-sans">
      {/* Top Diagnostics KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-stone-900/90 p-2 rounded border border-stone-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
            <span>Total 1h Packets</span>
            <Activity className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="text-base font-mono font-bold text-stone-100">
              {metrics.totalPacketsLastHour}
            </span>
            <span className="text-[10px] text-stone-400 font-mono">
              ({metrics.packetsPerMinute} /min)
            </span>
          </div>
        </div>

        <div className="bg-stone-900/90 p-2 rounded border border-stone-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
            <span>Edge Gateway Latency</span>
            <Clock className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span
              className={`text-base font-mono font-bold ${
                metrics.avgLatencyMs > 150
                  ? "text-rose-400"
                  : metrics.avgLatencyMs > 80
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {metrics.avgLatencyMs} ms
            </span>
            <span className="text-[10px] text-stone-400 font-mono">RTT</span>
          </div>
        </div>

        <div className="bg-stone-900/90 p-2 rounded border border-stone-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
            <span>QoS 1 Ack Success</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="text-base font-mono font-bold text-stone-100">
              {metrics.successRatePercent}%
            </span>
            <span className="text-[10px] text-stone-500 font-mono">Delivery</span>
          </div>
        </div>

        <div
          className={`p-2 rounded border flex flex-col justify-between transition-all ${
            metrics.bottleneckEventsCount > 0
              ? "bg-amber-950/40 border-amber-800/70 text-amber-200"
              : "bg-stone-900/90 border-stone-800/80 text-stone-200"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-stone-400">Gateway Bottlenecks</span>
            {metrics.bottleneckEventsCount > 0 ? (
              <AlertTriangle className="w-3 h-3 text-amber-400 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            )}
          </div>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="text-base font-mono font-bold">
              {metrics.bottleneckEventsCount} {metrics.bottleneckEventsCount === 1 ? "Event" : "Events"}
            </span>
            <span className="text-[10px] font-mono text-amber-400/90">
              {metrics.activeBottleneck ? "Active" : "Resolved"}
            </span>
          </div>
        </div>
      </div>

      {/* Packet Type Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-1.5 pt-0.5">
        <div className="flex items-center space-x-1 overflow-x-auto text-[11px] font-mono py-0.5">
          <button
            id="filter-all-packets-btn"
            onClick={() => setSelectedTypeFilter("ALL")}
            className={`px-2 py-0.5 rounded cursor-pointer transition-colors border ${
              selectedTypeFilter === "ALL"
                ? "bg-stone-200 text-stone-900 font-bold border-stone-100"
                : "bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200"
            }`}
          >
            All Types
          </button>
          {PACKET_TYPE_CONFIG.map((cfg) => (
            <button
              key={cfg.type}
              id={`filter-${cfg.type.toLowerCase()}-btn`}
              onClick={() =>
                setSelectedTypeFilter(selectedTypeFilter === cfg.type ? "ALL" : cfg.type)
              }
              className={`px-2 py-0.5 rounded cursor-pointer transition-all border flex items-center space-x-1 ${
                selectedTypeFilter === cfg.type
                  ? `${cfg.badgeBg} font-bold ring-1 ring-stone-400/30`
                  : "bg-stone-900/80 text-stone-400 border-stone-800/80 hover:text-stone-200"
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: cfg.color }}
              />
              <span className="truncate max-w-[110px]">{cfg.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Latency Legend Indicator */}
        <div className="flex items-center space-x-1.5 text-[10px] font-mono text-stone-400">
          <span className="inline-block w-3 h-0.5 bg-rose-400" />
          <span>Latency (ms)</span>
        </div>
      </div>

      {/* SVG Stacked Bar & Latency Chart */}
      <div className="relative bg-stone-900/60 rounded border border-stone-800/90 p-1.5 overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
            const y = paddingTop + plotHeight * (1 - ratio);
            const val = Math.round(yDomainMax * ratio);
            return (
              <g key={`grid-${ratio}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#333333"
                  strokeDasharray="2 3"
                  strokeWidth="0.75"
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="8"
                  fontFamily="monospace"
                  fill="#78716c"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Stacked Bars for each bucket */}
          {buckets.map((b, idx) => {
            const slotX = paddingLeft + idx * slotWidth;
            const barX = slotX + (slotWidth - barWidth) / 2;
            const isHovered = hoveredBucket?.id === b.id;
            const isPinned = pinnedBucketId === b.id;

            // Stack components
            let currentBottomY = paddingTop + plotHeight;

            // Define segment values according to filter
            const showTelem = selectedTypeFilter === "ALL" || selectedTypeFilter === "TELEMETRY";
            const showCmd = selectedTypeFilter === "ALL" || selectedTypeFilter === "COMMAND";
            const showHb = selectedTypeFilter === "ALL" || selectedTypeFilter === "HEARTBEAT";
            const showAlarm = selectedTypeFilter === "ALL" || selectedTypeFilter === "ALARM_FAULT";
            const showBuf = selectedTypeFilter === "ALL" || selectedTypeFilter === "BUFFERED_SYNC";

            const segments: Array<{ key: string; color: string; count: number }> = [];

            if (showTelem && b.telemetryCount > 0) {
              segments.push({ key: "telem", color: "#10b981", count: b.telemetryCount });
            }
            if (showCmd && b.commandCount > 0) {
              segments.push({ key: "cmd", color: "#06b6d4", count: b.commandCount });
            }
            if (showHb && b.heartbeatCount > 0) {
              segments.push({ key: "hb", color: "#8b5cf6", count: b.heartbeatCount });
            }
            if (showAlarm && b.alarmCount > 0) {
              segments.push({ key: "alarm", color: "#f43f5e", count: b.alarmCount });
            }
            if (showBuf && b.bufferedCount > 0) {
              segments.push({ key: "buf", color: "#f59e0b", count: b.bufferedCount });
            }

            return (
              <g
                key={b.id}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredBucket(b)}
                onMouseLeave={() => setHoveredBucket(null)}
                onClick={() => setPinnedBucketId(isPinned ? null : b.id)}
              >
                {/* Column highlight area on hover/pin */}
                {(isHovered || isPinned) && (
                  <rect
                    x={slotX}
                    y={paddingTop - 12}
                    width={slotWidth}
                    height={plotHeight + 28}
                    fill={isPinned ? "rgba(16, 185, 129, 0.08)" : "rgba(255, 255, 255, 0.04)"}
                    stroke={isPinned ? "rgba(16, 185, 129, 0.4)" : "none"}
                    strokeDasharray={isPinned ? "2 2" : "none"}
                    rx="3"
                  />
                )}

                {/* Stacked bar rectangles */}
                {segments.map((seg) => {
                  const segHeight = Math.max(1.5, (seg.count / yDomainMax) * plotHeight);
                  const segY = currentBottomY - segHeight;
                  currentBottomY = segY;

                  return (
                    <rect
                      key={`${b.id}-${seg.key}`}
                      x={barX}
                      y={segY}
                      width={barWidth}
                      height={segHeight}
                      fill={seg.color}
                      opacity={isHovered ? 1.0 : 0.85}
                      rx="1"
                    />
                  );
                })}

                {/* Bottleneck Indicator Marker */}
                {b.isBottleneck && (
                  <g transform={`translate(${barX + barWidth / 2}, ${currentBottomY - 8})`}>
                    <circle r="3.5" fill="#f59e0b" />
                    <circle r="6.5" fill="none" stroke="#f59e0b" strokeWidth="0.8" opacity="0.6">
                      <animate
                        attributeName="r"
                        values="3.5;7.5;3.5"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.8;0.1;0.8"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>
                )}

                {/* Time Axis Labels */}
                <text
                  x={slotX + slotWidth / 2}
                  y={paddingTop + plotHeight + 14}
                  textAnchor="middle"
                  fontSize="8"
                  fontFamily="monospace"
                  fill={isPinned ? "#34d399" : isHovered ? "#f5f5f4" : "#78716c"}
                  fontWeight={isPinned || isHovered ? "bold" : "normal"}
                >
                  {b.minuteOffset === 0 ? "Now" : `${b.minuteOffset}m`}
                </text>
              </g>
            );
          })}

          {/* Latency Curve */}
          <path
            d={latencyPathD}
            fill="none"
            stroke="#fb7185"
            strokeWidth="1.2"
            strokeDasharray="3 2"
            opacity="0.8"
          />

          {/* Latency Data Dots */}
          {latencyPoints.map((pt, idx) => {
            const b = buckets[idx];
            const isTarget = hoveredBucket?.id === b.id || pinnedBucketId === b.id;
            return (
              <circle
                key={`lat-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r={isTarget ? 3.5 : 1.8}
                fill="#fb7185"
                stroke="#1c1917"
                strokeWidth="1"
              />
            );
          })}
        </svg>

        {/* Hover / Pinned Floating Info Tooltip */}
        {activeInspection && (
          <div className="absolute top-2 right-2 max-w-[210px] bg-stone-900/95 border border-stone-700/80 rounded p-2 text-[10px] font-mono shadow-xl backdrop-blur pointer-events-none z-10 space-y-1">
            <div className="flex items-center justify-between border-b border-stone-800 pb-1">
              <span className="font-bold text-stone-200">
                {activeInspection.minuteOffset === 0 ? "Now (Active)" : `${activeInspection.minuteOffset}m ago`} ({activeInspection.timeLabel})
              </span>
              <span
                className={`px-1 py-0.2 rounded font-bold text-[9px] ${
                  activeInspection.isBottleneck
                    ? "bg-amber-950 text-amber-300 border border-amber-800"
                    : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                }`}
              >
                {activeInspection.isBottleneck ? "Bottleneck" : "Healthy"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-stone-300">
              <span className="text-stone-400">Total Frames:</span>
              <span className="font-bold text-right text-stone-100">{activeInspection.totalPackets}</span>
              <span className="text-emerald-400">Telemetry:</span>
              <span className="text-right">{activeInspection.telemetryCount}</span>
              <span className="text-cyan-400">Commands:</span>
              <span className="text-right">{activeInspection.commandCount}</span>
              <span className="text-purple-400">Heartbeats:</span>
              <span className="text-right">{activeInspection.heartbeatCount}</span>
              {activeInspection.alarmCount > 0 && (
                <>
                  <span className="text-rose-400">Alarms/Trips:</span>
                  <span className="text-right font-bold text-rose-300">{activeInspection.alarmCount}</span>
                </>
              )}
              {activeInspection.bufferedCount > 0 && (
                <>
                  <span className="text-amber-400">Buffered/Sync:</span>
                  <span className="text-right font-bold text-amber-300">{activeInspection.bufferedCount}</span>
                </>
              )}
              <span className="text-stone-400">RTT Latency:</span>
              <span className="font-bold text-right text-stone-100">{activeInspection.avgLatencyMs} ms</span>
              <span className="text-stone-400">Packet Loss:</span>
              <span className="text-right text-stone-300">{activeInspection.packetLossPercent}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottleneck Deep-Dive Diagnostic Card */}
      <div
        className={`p-2.5 rounded-lg border text-xs font-mono transition-all ${
          activeInspection.isBottleneck
            ? "bg-amber-950/40 border-amber-800/80 text-amber-200"
            : "bg-stone-900/80 border-stone-800 text-stone-300"
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-2">
            {activeInspection.isBottleneck ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="font-bold text-stone-200">
              Gateway Diagnostic:{" "}
              {activeInspection.minuteOffset === 0
                ? "Active Time Window (Now)"
                : `${activeInspection.minuteOffset}m Window (${activeInspection.timeLabel})`}
            </span>
          </div>

          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
              activeInspection.bottleneckType === "OFFLINE_BACKPRESSURE"
                ? "bg-rose-950/80 border-rose-700 text-rose-300"
                : activeInspection.bottleneckType === "VOLTAGE_FLICKER_BURST"
                ? "bg-amber-950/80 border-amber-700 text-amber-300"
                : activeInspection.bottleneckType === "RETRY_SPIKE"
                ? "bg-orange-950/80 border-orange-700 text-orange-300"
                : "bg-emerald-950/80 border-emerald-700 text-emerald-300"
            }`}
          >
            {activeInspection.bottleneckType || "NORMAL_FLOW"}
          </span>
        </div>

        <p className="text-[11px] text-stone-300 leading-relaxed">
          {activeInspection.bottleneckReason ||
            "Edge gateway operating with nominal RSSI and zero buffer queue backlog."}
        </p>

        {activeInspection.recommendedAction && (
          <div className="mt-1.5 pt-1.5 border-t border-stone-800/80 text-[10.5px] text-amber-300/90 flex items-start gap-1">
            <span className="font-bold text-stone-400 shrink-0">Edge Mitigation:</span>
            <span>{activeInspection.recommendedAction}</span>
          </div>
        )}
      </div>

      {/* Edge Bottleneck Simulation Quick Actions */}
      {onSimulateBottleneck && (
        <div className="bg-stone-900/50 p-2 rounded border border-stone-800/80 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
          <span className="text-stone-400 text-[11px] flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-stone-400" />
            <span>Test Edge Stress Scenarios:</span>
          </span>

          <div className="flex items-center space-x-1.5 flex-wrap">
            <button
              id="simulate-retry-spike-btn"
              onClick={() => onSimulateBottleneck("RETRY_SPIKE")}
              className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[10px] text-orange-300 border border-stone-700 hover:border-orange-600 transition-colors cursor-pointer"
            >
              LoRa Retry Spike
            </button>
            <button
              id="simulate-backpressure-btn"
              onClick={() => onSimulateBottleneck("OFFLINE_BACKPRESSURE")}
              className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[10px] text-amber-300 border border-stone-700 hover:border-amber-600 transition-colors cursor-pointer"
            >
              Cellular Fade Backpressure
            </button>
            <button
              id="simulate-congestion-btn"
              onClick={() => onSimulateBottleneck("CHANNEL_CONGESTION")}
              className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[10px] text-cyan-300 border border-stone-700 hover:border-cyan-600 transition-colors cursor-pointer"
            >
              Reflex Command Burst
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
