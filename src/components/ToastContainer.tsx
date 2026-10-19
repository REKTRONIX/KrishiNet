import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertOctagon,
  AlertTriangle,
  ZapOff,
  Zap,
  Droplets,
  ThermometerSun,
  CloudRain,
  Info,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Trash2,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { AgroToast, ToastSeverity } from "../types";

interface ToastContainerProps {
  toasts: AgroToast[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onInspectToast?: (toast: AgroToast) => void;
}

interface ToastItemProps {
  toast: AgroToast;
  onDismiss: (id: string) => void;
  onInspect?: (toast: AgroToast) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss, onInspect }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.autoDismissMs || (toast.severity === "critical" ? 8000 : 6000);
  const startTimeRef = useRef<number>(Date.now());
  const remainingRef = useRef<number>(duration);

  useEffect(() => {
    let animFrame: number;

    const update = () => {
      if (!isPaused) {
        const elapsedSinceResume = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, remainingRef.current - elapsedSinceResume);
        const pct = (remaining / duration) * 100;
        setProgress(pct);

        if (remaining <= 0) {
          onDismiss(toast.id);
          return;
        }
      }
      animFrame = requestAnimationFrame(update);
    };

    animFrame = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [isPaused, duration, onDismiss, toast.id]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    // update remaining time stored
    const elapsedSinceResume = Date.now() - startTimeRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsedSinceResume);
  };

  const handleMouseLeave = () => {
    startTimeRef.current = Date.now();
    setIsPaused(false);
  };

  // Severity-specific color palettes and icons
  const getSeverityConfig = (severity: ToastSeverity, title: string) => {
    const isVoltage = title.toLowerCase().includes("voltage") || title.toLowerCase().includes("pump");
    const isThermal = title.toLowerCase().includes("thermal") || title.toLowerCase().includes("heat");
    const isWater = title.toLowerCase().includes("water") || title.toLowerCase().includes("wilting") || title.toLowerCase().includes("deficit");
    const isRain = title.toLowerCase().includes("rain") || title.toLowerCase().includes("monsoon");

    switch (severity) {
      case "critical":
        return {
          icon: isVoltage ? ZapOff : isThermal ? ThermometerSun : AlertOctagon,
          bg: "bg-stone-950/95 border-rose-600/80 shadow-rose-950/60",
          accentBg: "bg-rose-950/80 border-rose-800 text-rose-300",
          headerColor: "text-rose-100",
          iconColor: "text-rose-400",
          subsystemBadge: "bg-rose-950/90 text-rose-300 border-rose-800",
          progressBar: "bg-rose-500",
          pingColor: "bg-rose-500",
          severityLabel: "CRITICAL ALARM",
        };
      case "warning":
        return {
          icon: isWater ? Droplets : isThermal ? ThermometerSun : AlertTriangle,
          bg: "bg-stone-950/95 border-amber-500/70 shadow-amber-950/50",
          accentBg: "bg-amber-950/80 border-amber-800 text-amber-300",
          headerColor: "text-amber-100",
          iconColor: "text-amber-400",
          subsystemBadge: "bg-amber-950/90 text-amber-300 border-amber-800",
          progressBar: "bg-amber-500",
          pingColor: "bg-amber-500",
          severityLabel: "WARNING INTERVENTION",
        };
      case "info":
        return {
          icon: isRain ? CloudRain : Info,
          bg: "bg-stone-950/95 border-cyan-500/70 shadow-cyan-950/50",
          accentBg: "bg-cyan-950/80 border-cyan-800 text-cyan-300",
          headerColor: "text-cyan-100",
          iconColor: "text-cyan-400",
          subsystemBadge: "bg-cyan-950/90 text-cyan-300 border-cyan-800",
          progressBar: "bg-cyan-500",
          pingColor: "bg-cyan-500",
          severityLabel: "SYSTEM NOTICE",
        };
      case "success":
      default:
        return {
          icon: CheckCircle2,
          bg: "bg-stone-950/95 border-emerald-500/70 shadow-emerald-950/50",
          accentBg: "bg-emerald-950/80 border-emerald-800 text-emerald-300",
          headerColor: "text-emerald-100",
          iconColor: "text-emerald-400",
          subsystemBadge: "bg-emerald-950/90 text-emerald-300 border-emerald-800",
          progressBar: "bg-emerald-500",
          pingColor: "bg-emerald-500",
          severityLabel: "OPTIMAL STATUS",
        };
    }
  };

  const config = getSeverityConfig(toast.severity, toast.title);
  const IconComponent = config.icon;

  return (
    <motion.div
      id={`agro-toast-${toast.id}`}
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94, x: 20 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, x: 40, scale: 0.9, transition: { duration: 0.22, ease: "easeOut" } }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-xl border shadow-2xl backdrop-blur-md overflow-hidden pointer-events-auto select-none ${config.bg}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="p-3.5 sm:p-4">
        {/* Top bar with subsystem and time */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pingColor}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${config.pingColor}`} />
            </span>
            <span
              id={`toast-subsystem-${toast.id}`}
              className={`text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded border truncate ${config.subsystemBadge}`}
            >
              {toast.subsystem}
            </span>
            <span
              id={`toast-severity-${toast.id}`}
              className="text-[9px] font-mono tracking-wider font-semibold text-stone-400 hidden sm:inline"
            >
              [{config.severityLabel}]
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono text-stone-400">{toast.timeStr}</span>
            <button
              id={`toast-dismiss-${toast.id}`}
              onClick={() => onDismiss(toast.id)}
              className="w-5 h-5 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-100 flex items-center justify-center transition-colors cursor-pointer"
              title="Dismiss alert"
              aria-label="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content body with Icon & Text */}
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg border shrink-0 ${config.accentBg}`}>
            <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h4 id={`toast-title-${toast.id}`} className={`text-xs sm:text-sm font-bold leading-tight ${config.headerColor}`}>
                {toast.title}
              </h4>
              {toast.telemetryMetric && (
                <span
                  id={`toast-telemetry-${toast.id}`}
                  className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-200 shrink-0"
                >
                  {toast.telemetryMetric}
                </span>
              )}
            </div>

            <p id={`toast-message-${toast.id}`} className="text-xs text-stone-300 mt-1 leading-relaxed">
              {toast.message}
            </p>

            {/* Action Taken by Reflex Layer */}
            {toast.actionTaken && (
              <div
                id={`toast-action-${toast.id}`}
                className="mt-2 text-[11px] font-mono p-1.5 rounded bg-stone-900/90 border border-stone-800 flex items-center gap-1.5 text-stone-300"
              >
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-stone-400">Action:</span>
                <span className="font-medium text-emerald-300 truncate">{toast.actionTaken}</span>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Footer */}
        {onInspect && (
          <div className="mt-2.5 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px]">
            <span className="text-stone-500 font-mono">
              {isPaused ? "Timer paused (hovering)" : "Auto-dismiss active"}
            </span>
            <button
              id={`toast-inspect-btn-${toast.id}`}
              onClick={() => onInspect(toast)}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Inspect Telemetry</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Animated countdown progress bar */}
      <div className="h-1 w-full bg-stone-900/90 overflow-hidden">
        <div
          className={`h-full transition-all duration-100 ease-linear ${config.progressBar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  onClearAll,
  isMuted,
  onToggleMute,
  onInspectToast,
}) => {
  return (
    <div
      id="agro-toast-container"
      className="fixed top-16 right-3 sm:right-5 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none"
    >
      {/* Quick controls bar when multiple alerts are active */}
      <AnimatePresence>
        {toasts.length > 0 && (
          <motion.div
            id="toast-control-bar"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-stone-950/90 border border-stone-800 backdrop-blur-md shadow-lg pointer-events-auto text-xs text-stone-300"
          >
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Agro-Reflex Alerts: <strong className="text-white font-bold">{toasts.length}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="toast-mute-btn"
                onClick={onToggleMute}
                className={`p-1 rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer border ${
                  isMuted
                    ? "bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200"
                    : "bg-emerald-950/80 border-emerald-800 text-emerald-300 hover:bg-emerald-900"
                }`}
                title={isMuted ? "Unmute alert chimes" : "Mute alert chimes"}
                aria-label={isMuted ? "Unmute alert chimes" : "Mute alert chimes"}
              >
                {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                <span className="text-[10px]">{isMuted ? "Muted" : "Chime"}</span>
              </button>

              {toasts.length > 1 && (
                <button
                  id="toast-clear-all-btn"
                  onClick={onClearAll}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer border border-stone-700"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Individual Toast Items */}
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={onDismiss}
            onInspect={onInspectToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
