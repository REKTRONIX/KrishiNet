/**
 * Agricultural Hardware & Reflex Alert Synthesizer
 * Uses Web Audio API oscillator for pleasant, non-jarring industrial telemetry alerts.
 */

import { ToastSeverity } from "../types";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Play a short alert chime matching the severity of the agronomic event.
 */
export function playAlertChime(severity: ToastSeverity, isMuted: boolean = false): void {
  if (isMuted) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    if (severity === "critical") {
      // Urgent dual-tone chime: 740 Hz -> 580 Hz with quick decay
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();

      osc1.type = "sine";
      osc2.type = "triangle";

      osc1.frequency.setValueAtTime(740, now);
      osc1.frequency.exponentialRampToValueAtTime(580, now + 0.18);

      osc2.frequency.setValueAtTime(580, now + 0.18);
      osc2.frequency.exponentialRampToValueAtTime(440, now + 0.38);

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.08, now + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      osc1.connect(gainNode);
      osc2.connect(gainNode);

      osc1.start(now);
      osc1.stop(now + 0.2);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.42);
    } else if (severity === "warning") {
      // Warm cautionary chime: 520 Hz -> 660 Hz
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.22);

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.06, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Gentle notification pulse
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(620, now);

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.04, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch {
    // Gracefully ignore audio autoplay constraints
  }
}
