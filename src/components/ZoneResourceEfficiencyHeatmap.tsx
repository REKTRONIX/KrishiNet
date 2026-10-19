import React, { useState, useMemo } from "react";
import {
  Layers,
  AlertTriangle,
  TrendingUp,
  Droplets,
  Gauge,
  Thermometer,
  Zap,
  CheckCircle2,
  Filter,
  ArrowUpRight,
  Info,
  Sparkles,
  Target,
  Activity,
} from "lucide-react";
import {
  FarmZone,
  FiveSensors,
  ClimateTelemetry,
  IndianIrrigationHardware,
  AgentAction,
  ZoneSectorEfficiency,
  ZoneEfficiencySummary,
} from "../types";
import { useLanguage } from "../context/LanguageContext";

interface ZoneResourceEfficiencyHeatmapProps {
  zones: FarmZone[];
  activeZoneId: string;
  onSelectZone: (zoneId: string) => void;
  activeAction: AgentAction;
  activeSensors: FiveSensors;
  activeClimate: ClimateTelemetry;
  activeHardware: IndianIrrigationHardware;
  onRemediateUnderperforming?: (zoneId: string, actionDirective: string) => void;
  onOpenAiDiagnosis?: () => void;
}

export const ZoneResourceEfficiencyHeatmap: React.FC<ZoneResourceEfficiencyHeatmapProps> = ({
  zones,
  activeZoneId,
  onSelectZone,
  activeAction,
  activeSensors,
  activeClimate,
  activeHardware,
  onRemediateUnderperforming,
  onOpenAiDiagnosis,
}) => {
  const { t, translateCrop } = useLanguage();
  const [filterMode, setFilterMode] = useState<"ALL" | "UNDERPERFORMING">("ALL");
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [hoveredSector, setHoveredSector] = useState<{
    zone: FarmZone;
    sector: ZoneSectorEfficiency;
  } | null>(null);

  // Compute live multi-zone sector efficiencies dynamically
  const zoneSummaries: ZoneEfficiencySummary[] = useMemo(() => {
    return zones.map((zone) => {
      const isCurrentActive = zone.id === activeZoneId;

      // Base sector parameters depending on zone characteristics
      let baseEfficiencies: number[] = [88, 85, 84, 80];
      let baseMoistures: number[] = [28.5, 27.8, 27.2, 25.4];
      let basePressures: number[] = [1.8, 1.65, 1.6, 1.35];
      let baseCwsis: number[] = [0.22, 0.28, 0.3, 0.38];
      let primaryDeficit = "";
      let recommendedTweak = "";

      if (zone.id === "zone-1") {
        // Block A: Basmati Rice - Karnal (Indo-Gangetic Alluvial, Jain Inline Drip)
        baseEfficiencies = [94, 91, 89, 85];
        baseMoistures = [31.0, 30.2, 29.8, 28.5];
        basePressures = [1.9, 1.8, 1.75, 1.6];
        baseCwsis = [0.18, 0.22, 0.24, 0.29];
        primaryDeficit = "Minimal variance across lateral runs";
        recommendedTweak = "Current Jain 2.2 LPH schedule is optimal for vegetative tillering";
      } else if (zone.id === "zone-2") {
        // Block B: Bt Cotton - Wardha (Vertisol, Finolex Online Drip - Water Deficit)
        baseEfficiencies = [76, 68, 63, 51];
        baseMoistures = [22.4, 19.8, 18.5, 15.2];
        basePressures = [1.6, 1.45, 1.3, 1.05];
        baseCwsis = [0.42, 0.52, 0.58, 0.72];
        primaryDeficit = "Friction head loss causing tail-end lateral pressure sag (< 1.1 bar)";
        recommendedTweak = "Boost manifold operating pressure to 1.8 bar or pulse duration +15m";
      } else if (zone.id === "zone-3") {
        // Block C: Sugarcane - Kolhapur (Heavy Vertisol, High water table, Nitrogen Leaching)
        baseEfficiencies = [82, 75, 72, 66];
        baseMoistures = [34.2, 33.0, 32.5, 30.0];
        basePressures = [1.75, 1.65, 1.6, 1.45];
        baseCwsis = [0.25, 0.32, 0.35, 0.44];
        primaryDeficit = "Nitrate leaching at tail furrow; soil available N dropped to 142 kg/ha";
        recommendedTweak = "Engage Venturi 19:19:19 fertigation pulse with inline drip manifold";
      } else if (zone.id === "zone-4") {
        // Block D: Polyhouse Tomato - Pune (Alfisol, Micro-sprinkler, Thermal Heat Stress)
        baseEfficiencies = [75, 69, 53, 67];
        baseMoistures = [26.0, 24.5, 20.8, 23.5];
        basePressures = [2.1, 2.0, 1.85, 1.95];
        baseCwsis = [0.38, 0.48, 0.69, 0.52];
        primaryDeficit = "Unshaded south bay microclimate hotspot; VPD 2.9 kPa causing stomatal closure";
        recommendedTweak = "Trigger micro-mist evaporative canopy cooling cycle";
      }

      // If this is the active zone, modulate live with current sensors & hardware state!
      if (isCurrentActive) {
        const m = activeSensors.shallowMoisture;
        const p = activeHardware.manifoldPressureBar;
        const isPumping = activeHardware.pumpStatus === "RUNNING";
        const isFault = activeHardware.feederPhaseStatus !== "3-PHASE_HEALTHY";

        // Dynamic adjustment factor based on live shallow moisture vs optimal 30%
        const moistureDelta = (m - 28) * 1.5;
        // Pumping boost or penalty
        const pumpingBoost = isPumping ? 4.0 : isFault ? -8.0 : 0.0;
        // Active Action synergy
        const actionBonus =
          activeAction === "PULSE_DRIP_IRRIGATION" || activeAction === "DEEP_DRIP_SOAK"
            ? 3.0
            : activeAction === "FERTIGATION_VENTURI_NPK" && zone.id === "zone-3"
            ? 6.0
            : activeAction === "CANOPY_MICRO_MIST" && zone.id === "zone-4"
            ? 8.0
            : 0.0;

        baseEfficiencies = baseEfficiencies.map((val, idx) => {
          // tail end (idx === 3) experiences higher volatility
          const tailScale = idx === 3 ? 1.4 : idx === 0 ? 0.7 : 1.0;
          const adjusted = val + moistureDelta * tailScale + pumpingBoost + actionBonus;
          return Math.min(99, Math.max(28, Math.round(adjusted)));
        });

        // Update live pressures and moistures
        basePressures = basePressures.map((press, idx) =>
          Number((p * (1 - idx * 0.12)).toFixed(2))
        );
        baseMoistures = baseMoistures.map((moist, idx) =>
          Number((m - idx * 1.8).toFixed(1))
        );
      }

      // Compute specific primary stress factor currently causing the efficiency score
      let primaryStressFactor = "";
      let primaryStressType: "MOISTURE" | "VPD" | "NITROGEN" | "PRESSURE" | "GRID" | "OPTIMAL" = "OPTIMAL";
      let stressMetricValue = "";
      let stressBenchmarkTarget = "";
      let efficiencyImpactDescription = "";

      if (isCurrentActive) {
        if (activeHardware.feederPhaseStatus !== "3-PHASE_HEALTHY" || activeHardware.lineVoltage < 340) {
          primaryStressFactor = t.heatmap.stressFactors.gridSag;
          primaryStressType = "GRID";
          stressMetricValue = `${activeHardware.lineVoltage}V (${activeHardware.feederPhaseStatus.replace(/_/g, " ")})`;
          stressBenchmarkTarget = "415V (3-Phase Balanced)";
          efficiencyImpactDescription = "Phase imbalance or voltage sag creates pump motor trip risk, suspending automated irrigation and lowering REI score.";
        } else if (activeSensors.shallowMoisture < 22) {
          primaryStressFactor = t.heatmap.stressFactors.lowMoisture;
          primaryStressType = "MOISTURE";
          stressMetricValue = `${activeSensors.shallowMoisture.toFixed(1)}% VWC`;
          stressBenchmarkTarget = "26.0 - 32.0% VWC (Field Capacity)";
          efficiencyImpactDescription = `Root zone soil moisture is severely depleted (${activeSensors.shallowMoisture.toFixed(1)}% VWC), causing an estimated -${Math.round((28 - activeSensors.shallowMoisture) * 2.5)}% efficiency penalty due to plant water stress.`;
        } else if (activeClimate.vpd > 2.2 || (zone.id === "zone-4" && activeClimate.vpd > 1.8)) {
          primaryStressFactor = t.heatmap.stressFactors.highVpd;
          primaryStressType = "VPD";
          stressMetricValue = `${activeClimate.vpd.toFixed(2)} kPa VPD`;
          stressBenchmarkTarget = "< 1.40 kPa VPD (Optimal Transpiration)";
          efficiencyImpactDescription = `High atmospheric vapor pressure deficit (${activeClimate.vpd.toFixed(2)} kPa) drives excessive evaporative pull, forcing stomatal closure and depressing the efficiency score.`;
        } else if (activeSensors.nitrogen < 170) {
          primaryStressFactor = t.heatmap.stressFactors.lowNitrogen;
          primaryStressType = "NITROGEN";
          stressMetricValue = `${activeSensors.nitrogen} kg/ha N`;
          stressBenchmarkTarget = "200 - 240 kg/ha N (Recommended)";
          efficiencyImpactDescription = `Soil available nitrogen is deficient (${activeSensors.nitrogen} kg/ha), restricting vegetative nutrient assimilation and reducing fertigation delivery efficiency.`;
        } else if (activeHardware.manifoldPressureBar < 1.3) {
          primaryStressFactor = t.heatmap.stressFactors.lowPressure;
          primaryStressType = "PRESSURE";
          stressMetricValue = `${activeHardware.manifoldPressureBar.toFixed(2)} bar`;
          stressBenchmarkTarget = "1.80 - 2.20 bar (Nominal Drip Pressure)";
          efficiencyImpactDescription = `Low manifold pressure (${activeHardware.manifoldPressureBar.toFixed(2)} bar) starves lateral emitters along the tail run, reducing water distribution uniformity across the zone.`;
        } else if (activeSensors.shallowMoisture > 38) {
          primaryStressFactor = t.heatmap.stressFactors.waterlogging;
          primaryStressType = "MOISTURE";
          stressMetricValue = `${activeSensors.shallowMoisture.toFixed(1)}% VWC`;
          stressBenchmarkTarget = "< 34.0% VWC";
          efficiencyImpactDescription = "Excessive soil moisture saturation causes poor root aeration and potential denitrification, suppressing the efficiency score.";
        } else {
          primaryStressFactor = t.heatmap.stressFactors.optimalEquilibrium;
          primaryStressType = "OPTIMAL";
          stressMetricValue = `${activeSensors.shallowMoisture.toFixed(1)}% VWC / ${activeHardware.manifoldPressureBar.toFixed(1)} bar`;
          stressBenchmarkTarget = "Optimal Agronomic Buffer";
          efficiencyImpactDescription = "Root zone moisture buffer, nutrient concentration, and hydraulic manifold pressure are operating within optimal agronomic targets.";
        }
      } else {
        if (zone.id === "zone-2") {
          primaryStressFactor = t.heatmap.stressFactors.lowMoisture;
          primaryStressType = "MOISTURE";
          stressMetricValue = "18.5% VWC (Deficit)";
          stressBenchmarkTarget = "26.0 - 32.0% VWC (Vertisol Field Capacity)";
          efficiencyImpactDescription = "Root zone moisture deficit below critical wilting threshold (-26% REI score), exacerbated by tail-end lateral friction pressure drop (< 1.1 bar).";
        } else if (zone.id === "zone-3") {
          primaryStressFactor = t.heatmap.stressFactors.lowNitrogen;
          primaryStressType = "NITROGEN";
          stressMetricValue = "142 kg/ha N (Deficient)";
          stressBenchmarkTarget = "200 - 240 kg/ha N (ICAR Sugarcane Rec)";
          efficiencyImpactDescription = "Sub-surface nitrate leaching in high-percolation furrow (-22% REI score) depresses nutrient uptake and biomass accumulation.";
        } else if (zone.id === "zone-4") {
          primaryStressFactor = t.heatmap.stressFactors.highVpd;
          primaryStressType = "VPD";
          stressMetricValue = "2.90 kPa VPD / +2.8°C";
          stressBenchmarkTarget = "< 1.40 kPa VPD (Optimal Stomatal Window)";
          efficiencyImpactDescription = "Excessive atmospheric evaporative demand in unshaded south bay (-28% REI score) triggers stomatal aperture closure and thermal leaf stress.";
        } else {
          primaryStressFactor = t.heatmap.stressFactors.optimalEquilibrium;
          primaryStressType = "OPTIMAL";
          stressMetricValue = "30.2% VWC / 1.80 bar";
          stressBenchmarkTarget = "28.0 - 34.0% VWC";
          efficiencyImpactDescription = "Jain 2.2 LPH inline drip schedule delivers balanced moisture buffer and optimal vegetative tillering across all lateral runs.";
        }
      }

      const sectorLabels = [
        { code: "1", title: t.heatmap.lateralHeader },
        { code: "2", title: `${t.heatmap.midLateral} N` },
        { code: "3", title: `${t.heatmap.midLateral} S` },
        { code: "4", title: t.heatmap.tailEnd },
      ];

      const prefix = zone.name.includes("Block A")
        ? "A"
        : zone.name.includes("Block B")
        ? "B"
        : zone.name.includes("Block C")
        ? "C"
        : "D";

      const sectors: ZoneSectorEfficiency[] = baseEfficiencies.map((eff, idx) => {
        const sectorCode = `${prefix}${sectorLabels[idx].code}`;
        const isUnderperforming = eff < 75;
        const waterEff = Math.min(100, Math.round(eff * 1.05 - 2));

        let bottleneckReason = "";
        let remedialDirective = "";

        if (eff < 58) {
          if (zone.id === "zone-2") {
            bottleneckReason = "Severe line friction loss: Emitter delivery < 1.4 LPH vs 4.0 LPH nominal";
            remedialDirective = "Flush lateral line & bump pump pressure to 1.8 bar";
          } else if (zone.id === "zone-4") {
            bottleneckReason = "Extreme canopy microclimate hotspot (VPD 2.9 kPa, Leaf Temp +2.8°C)";
            remedialDirective = "Pulse micro-mist sprinklers for 3 minutes to suppress leaf deficit";
          } else {
            bottleneckReason = "Critical irrigation deficit under active strategy";
            remedialDirective = "Direct pulsed drip cycle to lateral manifold";
          }
        } else if (eff < 75) {
          if (zone.id === "zone-3") {
            bottleneckReason = "Sub-surface nutrient leaching in high-percolation furrow";
            remedialDirective = "Inject water-soluble NPK 19:19:19 via Venturi";
          } else {
            bottleneckReason = "Sub-optimal soil moisture buffer (below 22% VWC)";
            remedialDirective = "Extend drip irrigation pulse window by 20 minutes";
          }
        }

        return {
          id: `${zone.id}-sec-${idx + 1}`,
          sectorCode,
          label: sectorLabels[idx].title,
          efficiencyIndex: eff,
          waterEfficiency: waterEff,
          cwsi: baseCwsis[idx],
          moistureVwc: baseMoistures[idx],
          pressureBar: basePressures[idx],
          isUnderperforming,
          bottleneckReason: bottleneckReason || undefined,
          remedialDirective: remedialDirective || undefined,
        };
      });

      const avgEff = Math.round(
        sectors.reduce((sum, s) => sum + s.efficiencyIndex, 0) / sectors.length
      );

      const underCount = sectors.filter((s) => s.isUnderperforming).length;
      let status: "OPTIMAL" | "NOMINAL" | "WARNING" | "CRITICAL" = "OPTIMAL";
      if (avgEff < 60 || sectors.some((s) => s.efficiencyIndex < 55)) {
        status = "CRITICAL";
      } else if (avgEff < 75 || underCount > 0) {
        status = "WARNING";
      } else if (avgEff < 85) {
        status = "NOMINAL";
      }

      return {
        zoneId: zone.id,
        compositeEfficiency: avgEff,
        status,
        sectors,
        underperformingCount: underCount,
        primaryDeficit,
        recommendedTweak,
        primaryStressFactor,
        primaryStressType,
        stressMetricValue,
        stressBenchmarkTarget,
        efficiencyImpactDescription,
      };
    });
  }, [
    zones,
    activeZoneId,
    activeSensors.shallowMoisture,
    activeSensors.nitrogen,
    activeClimate.vpd,
    activeHardware.manifoldPressureBar,
    activeHardware.pumpStatus,
    activeHardware.feederPhaseStatus,
    activeHardware.lineVoltage,
    activeAction,
    t,
  ]);

  // Overall farm metrics
  const totalSectorsCount = zoneSummaries.reduce((acc, z) => acc + z.sectors.length, 0);
  const underperformingSectorsCount = zoneSummaries.reduce(
    (acc, z) => acc + z.underperformingCount,
    0
  );
  const overallMeanREI = Math.round(
    zoneSummaries.reduce((sum, z) => sum + z.compositeEfficiency, 0) / zoneSummaries.length
  );

  // Strategy description
  const strategyLabel = useMemo(() => {
    switch (activeAction) {
      case "PULSE_DRIP_IRRIGATION":
        return "Pulsed Drip Irrigation (2.2 LPH Jain Inline)";
      case "DEEP_DRIP_SOAK":
        return "Deep Root Zone Drip Soak (1.8 Bar)";
      case "FERTIGATION_VENTURI_NPK":
        return "Venturi Fertigation (NPK 19:19:19)";
      case "CANOPY_MICRO_MIST":
        return "Canopy Micro-Mist Evaporative Cooling";
      case "IDLE_MONITOR":
      default:
        return activeHardware.pumpStatus === "RUNNING"
          ? "Manual Continuous Pump Override"
          : "Baseline Sensor Monitoring & Conservation";
    }
  }, [activeAction, activeHardware.pumpStatus]);

  // Filtered zones
  const displayedZoneSummaries = useMemo(() => {
    if (filterMode === "UNDERPERFORMING") {
      return zoneSummaries.filter(
        (z) => z.underperformingCount > 0 || z.compositeEfficiency < 75
      );
    }
    return zoneSummaries;
  }, [zoneSummaries, filterMode]);

  // Helper for cell styling
  const getCellTheme = (eff: number) => {
    if (eff >= 85) {
      return {
        bg: "bg-emerald-500/20 hover:bg-emerald-500/30",
        border: "border-emerald-500/50",
        text: "text-emerald-300",
        badge: "bg-emerald-950 text-emerald-300 border-emerald-800",
        glow: "",
      };
    }
    if (eff >= 75) {
      return {
        bg: "bg-teal-500/20 hover:bg-teal-500/30",
        border: "border-teal-500/40",
        text: "text-teal-300",
        badge: "bg-teal-950 text-teal-300 border-teal-800",
        glow: "",
      };
    }
    if (eff >= 60) {
      return {
        bg: "bg-amber-500/20 hover:bg-amber-500/30",
        border: "border-amber-500/50",
        text: "text-amber-300",
        badge: "bg-amber-950 text-amber-300 border-amber-800",
        glow: "shadow-sm shadow-amber-900/30",
      };
    }
    return {
      bg: "bg-rose-500/25 hover:bg-rose-500/35",
      border: "border-rose-500/60",
      text: "text-rose-300",
      badge: "bg-rose-950 text-rose-300 border-rose-800",
      glow: "shadow-md shadow-rose-950/60 animate-pulse",
    };
  };

  // Stress Factor Icon Helper
  const getStressIcon = (type: ZoneEfficiencySummary["primaryStressType"]) => {
    switch (type) {
      case "MOISTURE":
        return <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case "VPD":
        return <Thermometer className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case "NITROGEN":
        return <Zap className="w-3.5 h-3.5 text-teal-400 shrink-0" />;
      case "PRESSURE":
        return <Gauge className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case "GRID":
        return <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
      case "OPTIMAL":
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
  };

  // Stress Factor Badge Color Helper
  const getStressBadgeStyle = (type: ZoneEfficiencySummary["primaryStressType"]) => {
    switch (type) {
      case "MOISTURE":
        return "bg-cyan-950/80 text-cyan-200 border-cyan-700/80";
      case "VPD":
        return "bg-rose-950/80 text-rose-200 border-rose-700/80";
      case "NITROGEN":
        return "bg-teal-950/80 text-teal-200 border-teal-700/80";
      case "PRESSURE":
        return "bg-amber-950/80 text-amber-200 border-amber-700/80";
      case "GRID":
        return "bg-yellow-950/80 text-yellow-200 border-yellow-700/80";
      case "OPTIMAL":
      default:
        return "bg-emerald-950/80 text-emerald-200 border-emerald-700/80";
    }
  };

  // Currently hovered zone summary
  const hoveredZoneSummary = useMemo(() => {
    if (!hoveredZoneId) return null;
    return zoneSummaries.find((z) => z.zoneId === hoveredZoneId) || null;
  }, [hoveredZoneId, zoneSummaries]);

  return (
    <section
      id="resource-efficiency-heatmap"
      aria-label="Resource Efficiency Index Heatmap"
      className="bg-stone-900/90 border border-stone-800/90 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-4"
    >
      {/* Top Header & Context Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-stone-800">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-stone-100 tracking-tight">
                {t.heatmap.title}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-emerald-400" />
                {t.heatmap.resourceEfficiencyIndex}
              </span>
              {underperformingSectorsCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-700 flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  {underperformingSectorsCount} {t.heatmap.underperformingBadge}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              {t.heatmap.subtitle}
            </p>
          </div>
        </div>

        {/* Global Strategy Alignment & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Irrigation Strategy Tag */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-950/70 border border-stone-800 text-xs">
            <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-stone-400">{t.heatmap.currentStrategy}:</span>
            <span className="text-cyan-300 font-medium truncate max-w-[200px] sm:max-w-[260px]">
              {strategyLabel}
            </span>
          </div>

          {/* Farm-wide Mean REI Gauge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-950/70 border border-stone-800 text-xs font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-stone-400">{t.heatmap.overallMean}:</span>
            <span
              className={`font-bold ${
                overallMeanREI >= 80
                  ? "text-emerald-400"
                  : overallMeanREI >= 70
                  ? "text-teal-300"
                  : "text-amber-400"
              }`}
            >
              {overallMeanREI}%
            </span>
            <span className="text-stone-500 text-[10px]">
              (Target ≥ 80%)
            </span>
          </div>

          {/* Filter Segmented Control */}
          <div className="flex items-center bg-stone-950/80 p-1 rounded-lg border border-stone-800">
            <button
              id="heatmap-filter-all-btn"
              onClick={() => setFilterMode("ALL")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterMode === "ALL"
                  ? "bg-stone-800 text-white shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>{t.common.details} (4)</span>
            </button>
            <button
              id="heatmap-filter-under-btn"
              onClick={() => setFilterMode("UNDERPERFORMING")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterMode === "UNDERPERFORMING"
                  ? "bg-rose-950/80 text-rose-200 border border-rose-800/80 shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>{t.heatmap.underperformingBadge} ({underperformingSectorsCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Heatmap Grid of Farm Zones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {displayedZoneSummaries.map((summary, idx) => {
          const zone = zones.find((z) => z.id === summary.zoneId)!;
          const isSelected = zone.id === activeZoneId;
          const isCritical = summary.status === "CRITICAL";
          const isWarning = summary.status === "WARNING";
          const isHovered = hoveredZoneId === zone.id;

          return (
            <div
              key={summary.zoneId}
              id={`zone-heatmap-card-${zone.id}`}
              onClick={() => onSelectZone(zone.id)}
              onMouseEnter={() => setHoveredZoneId(zone.id)}
              onMouseLeave={() => setHoveredZoneId((prev) => (prev === zone.id ? null : prev))}
              onFocus={() => setHoveredZoneId(zone.id)}
              onBlur={() => setHoveredZoneId((prev) => (prev === zone.id ? null : prev))}
              tabIndex={0}
              className={`group relative rounded-xl p-3.5 border transition-all cursor-pointer select-none flex flex-col justify-between ${
                isHovered ? "z-30 shadow-2xl" : "z-10"
              } ${
                isSelected
                  ? "bg-stone-800/90 border-emerald-500/80 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30"
                  : "bg-stone-950/60 border-stone-800 hover:bg-stone-900/80 hover:border-stone-700"
              }`}
            >
              {/* Active Zone Pip */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold tracking-wider uppercase shadow-md flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Active Zone
                </div>
              )}

              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-stone-100 truncate group-hover:text-emerald-400 transition-colors">
                      {zone.name}
                    </h3>
                    <p className="text-[11px] text-stone-400 truncate mt-0.5">
                      {translateCrop(zone.crop)} • {zone.areaAcres} Ac
                    </p>
                  </div>

                  {/* Composite REI Pill */}
                  <div
                    className={`shrink-0 px-2 py-1 rounded-lg border text-right font-mono text-xs ${
                      summary.compositeEfficiency >= 80
                        ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                        : summary.compositeEfficiency >= 68
                        ? "bg-amber-950/60 border-amber-800 text-amber-300"
                        : "bg-rose-950/80 border-rose-700 text-rose-200 animate-pulse"
                    }`}
                  >
                    <div className="text-[9px] uppercase tracking-wider text-stone-400 font-sans font-medium">
                      REI
                    </div>
                    <div className="font-bold text-sm">
                      {summary.compositeEfficiency}%
                    </div>
                  </div>
                </div>

                {/* Irrigation Spec */}
                <div className="mt-2 text-[10px] text-stone-400 flex items-center justify-between border-t border-stone-800/60 pt-1.5">
                  <span className="truncate">{zone.dripType}</span>
                  <span className="text-stone-500 shrink-0 font-mono">
                    {zone.cctvAngle.split(" ")[0]}
                  </span>
                </div>

                {/* Primary Stress Factor Diagnostic Tag */}
                <div
                  className="mt-2.5 pt-2 border-t border-stone-800/80 flex items-center justify-between gap-2"
                  title={`${t.heatmap.primaryStressFactor}: ${summary.primaryStressFactor}`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider font-mono shrink-0">
                      {t.heatmap.limitingFactor}:
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border truncate flex items-center gap-1 ${getStressBadgeStyle(
                        summary.primaryStressType
                      )}`}
                    >
                      {getStressIcon(summary.primaryStressType)}
                      <span className="truncate">{summary.primaryStressFactor}</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 shrink-0">
                    {summary.stressMetricValue.split(" ")[0]}
                  </span>
                </div>

                {/* 2x2 Spatial Heatmap Matrix for the Zone */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono mb-1.5">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-stone-500" />
                      Lateral Sectors (1-4)
                    </span>
                    <span className="text-stone-500">
                      {summary.underperformingCount > 0
                        ? `${summary.underperformingCount} deficient`
                        : "Uniform"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {summary.sectors.map((sector) => {
                      const theme = getCellTheme(sector.efficiencyIndex);
                      const isHovered =
                        hoveredSector?.sector.id === sector.id;

                      return (
                        <div
                          key={sector.id}
                          onMouseEnter={() =>
                            setHoveredSector({ zone, sector })
                          }
                          onMouseLeave={() => setHoveredSector(null)}
                          className={`relative p-2 rounded-lg border transition-all cursor-pointer ${theme.bg} ${theme.border} ${theme.glow} ${
                            isHovered ? "ring-2 ring-white/60 scale-[1.02]" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-stone-300">
                              {sector.sectorCode}
                            </span>
                            <span
                              className={`text-[11px] font-mono font-bold ${theme.text}`}
                            >
                              {sector.efficiencyIndex}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-1 text-[9px] text-stone-400">
                            <span className="truncate max-w-[55px]">
                              {sector.label.split(" ")[0]}
                            </span>
                            <span className="font-mono text-stone-300">
                              {sector.pressureBar} bar
                            </span>
                          </div>

                          {/* Mini Efficiency Fill Bar */}
                          <div className="w-full bg-stone-900/80 rounded-full h-1 mt-1.5 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                sector.efficiencyIndex >= 80
                                  ? "bg-emerald-400"
                                  : sector.efficiencyIndex >= 65
                                  ? "bg-amber-400"
                                  : "bg-rose-500"
                              }`}
                              style={{ width: `${sector.efficiencyIndex}%` }}
                            />
                          </div>

                          {/* Critical Pulsing Dot */}
                          {sector.isUnderperforming && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Floating Diagnostic Tooltip on Zone Hover */}
              {isHovered && !hoveredSector && (
                <div
                  role="tooltip"
                  id={`zone-stress-tooltip-${zone.id}`}
                  className={`absolute z-50 pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95 w-72 sm:w-80 ${
                    idx === 0
                      ? "left-0 top-[calc(100%+8px)]"
                      : idx === displayedZoneSummaries.length - 1
                      ? "right-0 top-[calc(100%+8px)]"
                      : "left-1/2 -translate-x-1/2 top-[calc(100%+8px)]"
                  }`}
                >
                  <div className="relative bg-stone-950/98 border border-stone-700/90 rounded-xl p-3.5 shadow-2xl shadow-black/90 backdrop-blur-xl text-left text-xs space-y-2.5 ring-1 ring-white/10">
                    {/* Caret pointing upwards to the card */}
                    <div
                      className={`absolute -top-1.5 w-3 h-3 bg-stone-950 border-t border-l border-stone-700/90 rotate-45 ${
                        idx === 0
                          ? "left-6"
                          : idx === displayedZoneSummaries.length - 1
                          ? "right-6"
                          : "left-1/2 -translate-x-1/2"
                      }`}
                    />

                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-stone-800/80 pb-2">
                      <div>
                        <div className="font-bold text-stone-100 text-xs flex items-center gap-1.5">
                          <span>{zone.name}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          {translateCrop(zone.crop)} • {zone.areaAcres} Ac • {zone.dripType}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[9px] uppercase tracking-wider text-stone-500 font-mono">
                          REI Score
                        </div>
                        <div
                          className={`font-mono font-bold text-sm ${
                            summary.compositeEfficiency >= 80
                              ? "text-emerald-400"
                              : summary.compositeEfficiency >= 65
                              ? "text-amber-400"
                              : "text-rose-400 animate-pulse"
                          }`}
                        >
                          {summary.compositeEfficiency}%
                        </div>
                      </div>
                    </div>

                    {/* Primary Stress Factor Highlight */}
                    <div>
                      <div className="text-[10px] text-stone-400 uppercase tracking-wider font-mono font-semibold flex items-center gap-1 mb-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>{t.heatmap.primaryStressFactor}</span>
                      </div>
                      <div
                        className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-2 font-medium ${getStressBadgeStyle(
                          summary.primaryStressType
                        )}`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          {getStressIcon(summary.primaryStressType)}
                          <span>{summary.primaryStressFactor}</span>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/10 uppercase">
                          {summary.primaryStressType === "OPTIMAL" ? "Optimal" : "Limiting Factor"}
                        </span>
                      </div>
                    </div>

                    {/* Limiting Metric vs Benchmark Target */}
                    <div className="bg-stone-900/90 border border-stone-800 rounded-lg p-2 font-mono text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400 text-[10px] flex items-center gap-1">
                          <Activity className="w-3 h-3 text-stone-500" />
                          {t.heatmap.stressMetric}:
                        </span>
                        <span className="text-stone-100 font-bold">{summary.stressMetricValue}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-stone-800/80 pt-1">
                        <span className="text-stone-400 text-[10px] flex items-center gap-1">
                          <Target className="w-3 h-3 text-emerald-500" />
                          {t.heatmap.benchmarkTarget}:
                        </span>
                        <span className="text-emerald-400 font-semibold">{summary.stressBenchmarkTarget}</span>
                      </div>
                    </div>

                    {/* Root Cause & Efficiency Impact */}
                    <div>
                      <div className="text-[10px] text-stone-400 font-mono uppercase tracking-wider mb-0.5">
                        {t.heatmap.efficiencyImpact}
                      </div>
                      <p className="text-[11px] text-stone-300 leading-relaxed bg-stone-900/50 p-2 rounded-lg border border-stone-800/60">
                        {summary.efficiencyImpactDescription}
                      </p>
                    </div>

                    {/* Recommended Tactical Action */}
                    {summary.recommendedTweak && (
                      <div className="pt-1 text-[10px] text-emerald-300/90 flex items-start gap-1.5 border-t border-stone-800/60">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-emerald-400">{t.heatmap.recommendedRemediation}:</strong>{" "}
                          {summary.recommendedTweak}
                        </span>
                      </div>
                    )}

                    {/* Inspect Hint */}
                    <div className="text-[9px] text-stone-500 text-center italic border-t border-stone-800/40 pt-1">
                      {t.heatmap.hoverTooltipHint}
                    </div>
                  </div>
                </div>
              )}

              {/* Card Footer: Diagnostic Status & Remedial Prompt */}
              <div className="mt-3 pt-2 border-t border-stone-800/80 text-[11px]">
                {summary.underperformingCount > 0 ? (
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-1 text-rose-300">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                      <span className="text-[10px] leading-tight line-clamp-2">
                        {summary.primaryDeficit || "Lateral delivery mismatch detected under current strategy."}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectZone(zone.id);
                        if (onRemediateUnderperforming && summary.recommendedTweak) {
                          onRemediateUnderperforming(zone.id, summary.recommendedTweak);
                        }
                      }}
                      className="w-full py-1 px-2 rounded-md bg-rose-950/70 hover:bg-rose-900/80 text-rose-200 border border-rose-800 text-[10px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                    >
                      <ArrowUpRight className="w-3 h-3 text-rose-300" />
                      <span>{t.heatmap.applyOptimization}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-stone-400 text-[10px]">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      {t.heatmap.optimalBadge}
                    </span>
                    <span className="font-mono text-stone-500">
                      Uniformity: 92%
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover Tooltip / Detail Inspector Bar */}
      {hoveredSector ? (
        <div className="bg-stone-950/90 border border-emerald-500/40 rounded-xl p-3 text-xs shadow-xl animate-fadeIn flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start md:items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-mono font-bold text-sm shrink-0">
              {hoveredSector.sector.sectorCode}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-100">
                  {hoveredSector.zone.name} • {hoveredSector.sector.label}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                    hoveredSector.sector.efficiencyIndex >= 80
                      ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                      : hoveredSector.sector.efficiencyIndex >= 65
                      ? "bg-amber-950 text-amber-300 border-amber-800"
                      : "bg-rose-950 text-rose-300 border-rose-800 animate-pulse"
                  }`}
                >
                  REI: {hoveredSector.sector.efficiencyIndex}%
                </span>
              </div>
              <p className="text-stone-400 text-[11px] mt-0.5">
                {hoveredSector.sector.bottleneckReason
                  ? `⚠️ Bottleneck: ${hoveredSector.sector.bottleneckReason}`
                  : "✓ Hydraulic delivery and root zone soil moisture in optimal dynamic equilibrium."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-stone-300 shrink-0 border-t md:border-t-0 border-stone-800 pt-2 md:pt-0">
            <div className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>Moist: <strong className="text-white">{hoveredSector.sector.moistureVwc}%</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>Press: <strong className="text-white">{hoveredSector.sector.pressureBar} bar</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
              <span>CWSI: <strong className="text-white">{hoveredSector.sector.cwsi}</strong></span>
            </div>
          </div>
        </div>
      ) : hoveredZoneSummary ? (
        /* Zone-level Primary Stress Factor Inspector Bar */
        <div className="bg-stone-950/95 border border-stone-700/80 rounded-xl p-3 text-xs shadow-xl animate-fadeIn flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start md:items-center gap-3">
            <div
              className={`p-2 rounded-lg border font-mono font-bold text-sm shrink-0 flex items-center justify-center ${getStressBadgeStyle(
                hoveredZoneSummary.primaryStressType
              )}`}
            >
              {getStressIcon(hoveredZoneSummary.primaryStressType)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-stone-100">
                  {zones.find((z) => z.id === hoveredZoneSummary.zoneId)?.name}
                </span>
                <span className="text-stone-500">•</span>
                <span className="text-stone-400 font-medium text-[11px]">
                  {t.heatmap.primaryStressFactor}:
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 ${getStressBadgeStyle(
                    hoveredZoneSummary.primaryStressType
                  )}`}
                >
                  {getStressIcon(hoveredZoneSummary.primaryStressType)}
                  <span>{hoveredZoneSummary.primaryStressFactor}</span>
                </span>
                <span className="text-stone-400 font-mono text-[11px]">
                  (REI: {hoveredZoneSummary.compositeEfficiency}%)
                </span>
              </div>
              <p className="text-stone-300 text-[11px] mt-0.5 max-w-2xl">
                {hoveredZoneSummary.efficiencyImpactDescription}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-stone-300 shrink-0 border-t md:border-t-0 border-stone-800 pt-2 md:pt-0">
            <div className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-stone-400" />
              <span>
                {t.heatmap.stressMetric}:{" "}
                <strong className="text-white">{hoveredZoneSummary.stressMetricValue}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {t.heatmap.benchmarkTarget}:{" "}
                <strong className="text-emerald-300">
                  {hoveredZoneSummary.stressBenchmarkTarget}
                </strong>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Heatmap Legend & Strategic Benchmark Bar */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-400 pt-1">
          {/* Color Scale Legend */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              REI Index Scale:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500/80 inline-block" />
              <span className="text-[11px]">≥ 85% ({t.common.optimal})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-teal-500/80 inline-block" />
              <span className="text-[11px]">75-84% ({t.common.normal})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/80 inline-block" />
              <span className="text-[11px]">60-74% ({t.common.warning})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500/80 inline-block" />
              <span className="text-[11px]">&lt; 60% ({t.common.critical})</span>
            </div>
          </div>

          {/* Quick AI Diagnostic Trigger */}
          {onOpenAiDiagnosis && (
            <button
              onClick={onOpenAiDiagnosis}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze Zone Bottlenecks via Gemini</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
};
