import React, { useRef, useEffect, useState } from "react";
import {
  Camera,
  Maximize2,
  Minimize2,
  Scan,
  Thermometer,
  Eye,
  Sparkles,
  AlertCircle,
  Crosshair,
  RotateCw,
  Sun,
  ShieldCheck,
  Bug,
  HelpCircle,
} from "lucide-react";
import { CCTVVisionData, FarmZone, FiveSensors } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { INDIAN_PEST_PROFILES } from "../utils/pestKnowledge";

interface CCTVFeedProps {
  zone: FarmZone;
  cctvData: CCTVVisionData;
  sensors: FiveSensors;
  onModeChange: (mode: "RGB" | "NDVI" | "THERMAL") => void;
  onTriggerAiDiagnosis: () => void;
  isAiDiagnosing: boolean;
}

export const CCTVFeed: React.FC<CCTVFeedProps> = ({
  zone,
  cctvData,
  sensors,
  onModeChange,
  onTriggerAiDiagnosis,
  isAiDiagnosing,
}) => {
  const { t, translateCrop } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [timeString, setTimeString] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
          " " +
          now.toLocaleTimeString("en-IN", { hour12: false }) +
          "." +
          String(Math.floor(now.getMilliseconds() / 100)).padStart(2, "0")
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
  }, []);

  // Canvas drawing loop for live crop foliage animation with NDVI / Thermal filters
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let frame = 0;

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      // Background Sky & Field Horizon
      if (cctvData.mode === "RGB") {
        // Natural sunny sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.4);
        skyGrad.addColorStop(0, "#38bdf8");
        skyGrad.addColorStop(1, "#bae6fd");
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h * 0.4);

        // Soil ground gradient based on moisture
        const groundGrad = ctx.createLinearGradient(0, h * 0.35, 0, h);
        const soilMoisture = sensors.shallowMoisture;
        if (soilMoisture < 20) {
          groundGrad.addColorStop(0, "#a88158"); // dry dusty brown
          groundGrad.addColorStop(1, "#7c5938");
        } else if (soilMoisture > 36) {
          groundGrad.addColorStop(0, "#38291c"); // muddy saturated
          groundGrad.addColorStop(1, "#1c140d");
        } else {
          groundGrad.addColorStop(0, "#6b4e33"); // healthy alluvial/vertisol
          groundGrad.addColorStop(1, "#44301f");
        }
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, h * 0.35, w, h * 0.65);
      } else if (cctvData.mode === "NDVI") {
        // Multispectral NDVI false color: soil is brown/yellowish, healthy canopy is intense neon green
        ctx.fillStyle = "#1e1b18";
        ctx.fillRect(0, 0, w, h);
      } else {
        // Thermal FLIR mode: Ironbow palette (deep purple/blue for cool, orange/yellow/white for hot)
        const flirGrad = ctx.createLinearGradient(0, 0, 0, h);
        flirGrad.addColorStop(0, "#0f051d");
        flirGrad.addColorStop(0.5, "#2d0b5a");
        flirGrad.addColorStop(1, "#65146b");
        ctx.fillStyle = flirGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // Draw Drip Lateral Irrigation Pipe
      ctx.beginPath();
      ctx.moveTo(0, h * 0.85);
      ctx.lineTo(w, h * 0.85);
      ctx.lineWidth = 6;
      ctx.strokeStyle = cctvData.mode === "THERMAL" ? "#3b0764" : "#171717";
      ctx.stroke();

      // Drip emitters with slight pulsing droplets if moist
      for (let i = 40; i < w; i += 70) {
        ctx.fillStyle = "#09090b";
        ctx.fillRect(i - 4, h * 0.84, 8, 8);
        if (sensors.shallowMoisture > 26) {
          ctx.beginPath();
          ctx.arc(i, h * 0.87 + Math.sin(frame * 0.1 + i) * 2, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = cctvData.mode === "THERMAL" ? "#06b6d4" : "#38bdf8";
          ctx.fill();
        }
      }

      // Draw Crop Plants (Rows of crops swaying slightly in wind)
      const plantRows = [
        { y: h * 0.45, scale: 0.55, count: 12 },
        { y: h * 0.58, scale: 0.8, count: 9 },
        { y: h * 0.72, scale: 1.1, count: 7 },
      ];

      plantRows.forEach((row, rowIdx) => {
        const spacing = w / (row.count + 1);
        for (let col = 1; col <= row.count; col++) {
          const x = spacing * col + panOffset.x * 0.2;
          const baseY = row.y;
          const sway = Math.sin(frame * 0.04 + col * 1.3 + rowIdx) * 6 * row.scale;

          // Stem
          ctx.beginPath();
          ctx.moveTo(x, baseY + 40 * row.scale);
          ctx.quadraticCurveTo(x + sway * 0.5, baseY, x + sway, baseY - 60 * row.scale);
          ctx.lineWidth = 4 * row.scale;
          ctx.strokeStyle = cctvData.mode === "THERMAL" ? "#9333ea" : "#2d5a27";
          ctx.stroke();

          // Leaves / Canopy clusters
          const leafAngles = [-0.6, -0.2, 0.3, 0.7];
          leafAngles.forEach((angle, lIdx) => {
            ctx.save();
            ctx.translate(x + sway * 0.7, baseY - 30 * row.scale * (lIdx + 1));
            ctx.rotate(angle + Math.sin(frame * 0.05 + col) * 0.1);

            // Determine Leaf Color based on mode and health
            let leafColor = "#15803d"; // Healthy deep green
            if (cctvData.mode === "RGB") {
              if (sensors.shallowMoisture < 20) {
                leafColor = "#854d0e"; // wilted brown/yellow
              } else if (sensors.nitrogen < 170) {
                leafColor = "#ca8a04"; // nitrogen chlorosis
              } else if (sensors.shallowMoisture > 38) {
                leafColor = "#166534"; // dark wet
              } else {
                leafColor = lIdx % 2 === 0 ? "#16a34a" : "#15803d";
              }
            } else if (cctvData.mode === "NDVI") {
              // High NDVI -> Bright Emerald, Low NDVI -> Red/Yellow
              if (cctvData.ndviScore > 0.7) {
                leafColor = "#22c55e"; // lush vegetative
              } else if (cctvData.ndviScore > 0.5) {
                leafColor = "#eab308"; // moderate stress
              } else {
                leafColor = "#ef4444"; // high stress / low biomass
              }
            } else {
              // Thermal mode: cool transpiring canopy is blue/cyan, hot stressed is orange/yellow
              if (cctvData.canopyDepression > 2.0) {
                leafColor = "#f97316"; // Hot canopy (stomatal closure)
              } else if (cctvData.canopyDepression > 0.5) {
                leafColor = "#eab308";
              } else {
                leafColor = "#06b6d4"; // Cool transpiring canopy
              }
            }

            ctx.fillStyle = leafColor;
            ctx.beginPath();
            ctx.ellipse(
              25 * row.scale,
              0,
              28 * row.scale,
              12 * row.scale,
              0,
              0,
              Math.PI * 2
            );
            ctx.fill();

            ctx.restore();
          });
        }
      });

      // Camera Lens Scanlines / Overlay effects
      if (cctvData.mode === "THERMAL") {
        // Thermal FLIR colorbar legend on right side
        const legW = 14;
        const legH = h * 0.5;
        const legX = w - legW - 16;
        const legY = h * 0.25;

        const flirLegendGrad = ctx.createLinearGradient(0, legY, 0, legY + legH);
        flirLegendGrad.addColorStop(0, "#facc15"); // 42°C Hot
        flirLegendGrad.addColorStop(0.3, "#f97316");
        flirLegendGrad.addColorStop(0.6, "#9333ea");
        flirLegendGrad.addColorStop(1, "#06b6d4"); // 24°C Cool
        ctx.fillStyle = flirLegendGrad;
        ctx.fillRect(legX, legY, legW, legH);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(legX, legY, legW, legH);

        ctx.fillStyle = "#ffffff";
        ctx.font = "9px monospace";
        ctx.fillText("42°C", legX - 28, legY + 8);
        ctx.fillText("24°C", legX - 28, legY + legH);
      }

      // Draw Vision Bounding Boxes
      cctvData.boundingBoxes.forEach((box) => {
        const bx = box.x * w;
        const by = box.y * h;
        const bw = box.w * w;
        const bh = box.h * h;

        ctx.lineWidth = 2;
        let strokeCol = "#22c55e";
        if (box.type === "stress") strokeCol = "#ef4444";
        if (box.type === "chlorosis") strokeCol = "#eab308";
        if (box.type === "pest_bollworm") strokeCol = "#f43f5e";
        if (box.type === "pest_aphids") strokeCol = "#fb923c";
        if (box.type === "pest_whitefly") strokeCol = "#e879f9";
        if (box.type === "pest_stem_borer") strokeCol = "#c084fc";

        ctx.strokeStyle = strokeCol;
        ctx.strokeRect(bx, by, bw, bh);

        // Corner accents
        const cornerLen = 8;
        ctx.beginPath();
        ctx.moveTo(bx, by + cornerLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + cornerLen, by);

        ctx.moveTo(bx + bw - cornerLen, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + cornerLen);

        ctx.moveTo(bx, by + bh - cornerLen);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + cornerLen, by + bh);

        ctx.moveTo(bx + bw - cornerLen, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - cornerLen);
        ctx.stroke();

        // Label tag
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(bx, by - 18, bw, 18);
        ctx.fillStyle = strokeCol;
        ctx.font = "bold 10px monospace";
        ctx.fillText(`${box.label} (${Math.round(box.confidence * 100)}%)`, bx + 4, by - 5);
      });

      // Target Reticle in Center
      const cx = w / 2;
      const cy = h / 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy);
      ctx.lineTo(cx + 15, cy);
      ctx.moveTo(cx, cy - 15);
      ctx.lineTo(cx, cy + 15);
      ctx.stroke();

      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [cctvData, sensors, panOffset, zoomLevel]);

  return (
    <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-xl overflow-hidden flex flex-col">
      {/* CCTV Header & Lens Controls */}
      <div className="bg-stone-950 px-4 py-2.5 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Camera className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-xs tracking-wider uppercase text-stone-200">
            {cctvData.cameraId} • {zone.name}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-950/80 text-red-400 border border-red-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
          </span>
        </div>

        {/* Spectral Band Selector */}
        <div className="flex items-center space-x-1 bg-stone-900 p-1 rounded-lg border border-stone-800 text-xs">
          <button
            onClick={() => onModeChange("RGB")}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer flex items-center gap-1 ${
              cctvData.mode === "RGB"
                ? "bg-stone-700 text-white shadow-sm"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Eye className="w-3 h-3" /> {t.cctv.rgbVisual}
          </button>
          <button
            onClick={() => onModeChange("NDVI")}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer flex items-center gap-1 ${
              cctvData.mode === "NDVI"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Scan className="w-3 h-3" /> {t.cctv.ndviSynthetic}
          </button>
          <button
            onClick={() => onModeChange("THERMAL")}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer flex items-center gap-1 ${
              cctvData.mode === "THERMAL"
                ? "bg-purple-700 text-white shadow-sm"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Thermometer className="w-3 h-3" /> {t.cctv.thermalCanopy}
          </button>
        </div>
      </div>

      {/* Camera Video Surface */}
      <div className="relative w-full aspect-video bg-black overflow-hidden select-none">
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full h-full object-cover"
        />

        {/* HUD Stamp Overlays */}
        <div className="absolute top-2 left-3 font-mono text-[11px] text-emerald-400/90 drop-shadow-md pointer-events-none flex flex-col space-y-0.5">
          <div className="flex items-center gap-2">
            <span>RES: 1080p PTZ</span>
            <span>FPS: 24.8</span>
            <span>ZOOM: {zoomLevel.toFixed(1)}x</span>
          </div>
          <div className="text-stone-300/80">{timeString}</div>
          <div className="text-stone-400 text-[10px]">
            FIELD ANGLE: {zone.cctvAngle}
          </div>
        </div>

        {/* Live Optical Stress Telemetry (Top Right) */}
        <div className="absolute top-2 right-3 font-mono text-xs flex flex-col items-end space-y-1">
          <div className="bg-black/75 backdrop-blur-sm px-2.5 py-1 rounded border border-stone-700 text-stone-200 flex items-center gap-2">
            <span>NDVI:</span>
            <span
              className={`font-bold ${
                cctvData.ndviScore > 0.65
                  ? "text-emerald-400"
                  : cctvData.ndviScore > 0.5
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {cctvData.ndviScore.toFixed(2)}
            </span>
          </div>
          <div className="bg-black/75 backdrop-blur-sm px-2.5 py-1 rounded border border-stone-700 text-stone-200 flex items-center gap-2">
            <span>CWSI (Stress):</span>
            <span
              className={`font-bold ${
                cctvData.cwsi < 0.35
                  ? "text-emerald-400"
                  : cctvData.cwsi < 0.6
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {cctvData.cwsi.toFixed(2)}
            </span>
          </div>
          <div className="bg-black/75 backdrop-blur-sm px-2.5 py-1 rounded border border-stone-700 text-stone-200 flex items-center gap-2">
            <span>Tc - Ta:</span>
            <span
              className={`font-bold ${
                cctvData.canopyDepression < 0.8
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {cctvData.canopyDepression > 0 ? `+${cctvData.canopyDepression.toFixed(1)}` : cctvData.canopyDepression.toFixed(1)}°C
            </span>
          </div>
        </div>

        {/* Quick Pan/Tilt overlay buttons */}
        <div className="absolute bottom-3 left-3 flex items-center space-x-1.5 bg-black/60 backdrop-blur-sm p-1 rounded-lg border border-stone-700/80">
          <button
            onClick={() => setPanOffset((prev) => ({ ...prev, x: prev.x - 20 }))}
            className="w-6 h-6 rounded bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center text-xs cursor-pointer"
            title="Pan Left"
          >
            ←
          </button>
          <button
            onClick={() => setPanOffset((prev) => ({ ...prev, x: prev.x + 20 }))}
            className="w-6 h-6 rounded bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center text-xs cursor-pointer"
            title="Pan Right"
          >
            →
          </button>
          <button
            onClick={() => setPanOffset({ x: 0, y: 0 })}
            className="w-6 h-6 rounded bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center text-xs cursor-pointer"
            title="Reset Pan"
          >
            •
          </button>
        </div>

        {/* Fast Trigger Gemini AI Vision Button */}
        <div className="absolute bottom-3 right-3">
          <button
            onClick={onTriggerAiDiagnosis}
            disabled={isAiDiagnosing}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-500 text-white backdrop-blur-sm border border-emerald-400/40 shadow-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiDiagnosing ? "animate-spin" : ""}`} />
            <span>{isAiDiagnosing ? t.cctv.analyzing : t.cctv.runDiagnosis}</span>
          </button>
        </div>
      </div>

      {/* CCTV Optical Insights Strip */}
      <div className="bg-stone-950/90 px-4 py-2.5 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-stone-400">Computer Vision Status:</span>
          {cctvData.pestInfestationDetected ? (
            <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 flex items-center gap-1.5 font-medium animate-pulse">
              <Bug className="w-3.5 h-3.5 text-rose-400" />
              <span>{cctvData.anomalyDescription}</span>
            </span>
          ) : cctvData.anomalyDetected ? (
            <span className="px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800 text-amber-300 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {cctvData.anomalyDescription}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-300 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t.cctv.healthyCanopy}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4 text-stone-400 font-mono">
          <span>Crop: <strong className="text-stone-200">{translateCrop(zone.crop)}</strong></span>
          <span>Stage: <strong className="text-stone-200">{zone.cropStage}</strong></span>
        </div>
      </div>

      {/* Multi-Class Agricultural Pest Breakdown Card when pests detected */}
      {cctvData.pestDetails && cctvData.pestDetails.length > 0 && (
        <div className="bg-rose-950/20 px-4 py-3 border-t border-rose-900/40 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-rose-300 flex items-center gap-1.5">
              <Bug className="w-4 h-4 text-rose-400" />
              {t.cctv.multiClassTitle || "Agricultural Pest Classification & IPM Directives"}
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-900/60 border border-rose-700 text-rose-200 text-[10px] font-mono">
              YOLOv8-Agro • 94% mAP
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {cctvData.pestDetails.map((pest, idx) => (
              <div key={idx} className="bg-stone-900/80 rounded p-2.5 border border-rose-900/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-200">{pest.commonName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-900 text-rose-200 font-bold">
                    {pest.severity} (ETL Cross)
                  </span>
                </div>
                <div className="text-[11px] text-stone-400 font-mono italic">
                  {pest.scientificName} • {pest.densityPerSqMeter}/m²
                </div>
                <div className="text-[11px] text-emerald-400 pt-0.5">
                  🌿 <strong>{t.cctv.organicRemedy || "Organic/IPM"}:</strong> {pest.recommendedOrganicAction}
                </div>
                <div className="text-[11px] text-amber-400">
                  🧪 <strong>{t.cctv.chemicalRemedy || "Target Chemical"}:</strong> {pest.recommendedChemicalAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
