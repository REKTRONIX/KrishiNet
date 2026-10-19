import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import {
  TrendingUp,
  Droplets,
  Zap,
  Sparkles,
  Calendar,
  CalendarDays,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Radio,
  Pin,
  PinOff,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sliders,
  Eye,
  Download,
  Check,
  LineChart,
  Info,
  CloudSun,
  MapPin,
  Search,
} from "lucide-react";
import {
  ClimateTelemetry,
  YieldProjection,
  YieldHistoryPoint,
  ForecastDay,
  YieldRegressionSummary,
  IrrigationForecastAction,
} from "../types";
import { calculateYieldRegression } from "../utils/yieldRegression";
import { LocalizedWeatherForecastWidget } from "./LocalizedWeatherForecastWidget";
import { useLanguage } from "../context/LanguageContext";

interface YieldAndClimateModelProps {
  yieldData: YieldProjection;
  climate: ClimateTelemetry;
  cropName: string;
  location?: string;
  yieldHistory?: YieldHistoryPoint[];
  onRefineYieldModel: () => void;
  isRefiningYield: boolean;
  onApplyIrrigationRule?: (action: IrrigationForecastAction, rationale: string) => void;
}

export const YieldAndClimateModel: React.FC<YieldAndClimateModelProps> = ({
  yieldData,
  climate,
  cropName,
  location = "Wardha, Vidarbha Agro-Climatic Zone",
  yieldHistory = [],
  onRefineYieldModel,
  isRefiningYield,
  onApplyIrrigationRule,
}) => {
  const { t, translateCrop, translateLocation } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Interactive Hover and Pinning State
  const [hoveredPoint, setHoveredPoint] = useState<YieldHistoryPoint | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [pinnedPoint, setPinnedPoint] = useState<YieldHistoryPoint | null>(null);

  // Display toggles & 7-Day Forecast state
  const [showCwsiOverlay, setShowCwsiOverlay] = useState<boolean>(false);
  const [showForecast, setShowForecast] = useState<boolean>(true);
  const [stepRange, setStepRange] = useState<"all" | "20" | "10">("all");
  const [hasExported, setHasExported] = useState<boolean>(false);
  const [selectedForecastDay, setSelectedForecastDay] = useState<number | null>(null);
  const [hoveredForecastPoint, setHoveredForecastPoint] = useState<ForecastDay | null>(null);
  const [activeTab, setActiveTab] = useState<"yield-model" | "weather-trends">("yield-model");

  // Measure container width with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const w = entry.contentRect.width;
      if (w > 0) {
        setContainerWidth(w);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Build full historical timeline or default data
  const rawChartData = useMemo<YieldHistoryPoint[]>(() => {
    if (yieldHistory && yieldHistory.length > 0) {
      return yieldHistory;
    }
    const base = yieldData.baselineYield || 45.0;
    const current = yieldData.currentProjectedYield || 49.2;
    const pts: YieldHistoryPoint[] = [];
    const now = Date.now();
    for (let i = 16; i >= 0; i--) {
      const frac = (16 - i) / 16;
      pts.push({
        step: 16 - i,
        timestamp: now - i * 2500,
        projectedYield: Number((base + (current - base) * frac + Math.sin(i * 0.7) * 0.15).toFixed(1)),
        baselineYield: base,
        cwsi: Math.max(0.12, Number((0.42 - frac * 0.24).toFixed(2))),
        actionTaken:
          i % 4 === 0
            ? "FERTIGATION_VENTURI_NPK"
            : i % 2 === 0
            ? "PULSE_DRIP_IRRIGATION"
            : "IDLE_MONITOR",
      });
    }
    return pts;
  }, [yieldHistory, yieldData.baselineYield, yieldData.currentProjectedYield]);

  // 7-Day Ordinary Least Squares (OLS) Predictive Yield Regression Engine
  const regression = useMemo<YieldRegressionSummary>(() => {
    return calculateYieldRegression(
      rawChartData,
      yieldData.baselineYield,
      yieldData.currentProjectedYield,
      cropName
    );
  }, [rawChartData, yieldData.baselineYield, yieldData.currentProjectedYield, cropName]);

  // Filter chart data by selected step range window
  const chartData = useMemo<YieldHistoryPoint[]>(() => {
    if (stepRange === "10") {
      return rawChartData.slice(-10);
    }
    if (stepRange === "20") {
      return rawChartData.slice(-20);
    }
    return rawChartData;
  }, [rawChartData, stepRange]);

  // The active point being displayed (either pinned or hovered, or default to the latest)
  const activeInspectionPoint = hoveredPoint || pinnedPoint || (chartData.length > 0 ? chartData[chartData.length - 1] : null);

  // Helper to format action names with icons and friendly text
  const formatActionName = (action?: string) => {
    if (!action) return "Idle Monitor";
    switch (action) {
      case "PULSE_DRIP_IRRIGATION":
        return "Pulse Drip Irrigation";
      case "FERTIGATION_VENTURI_NPK":
        return "Venturi Fertigation (NPK)";
      case "CANOPY_MIST_COOLING":
        return "Canopy Mist Cooling";
      case "DEEP_AQUIFER_RECHARGE":
        return "Deep Aquifer Recharge";
      case "IDLE_MONITOR":
        return "Autonomous Sensor Watch";
      default:
        return action.replace(/_/g, " ");
    }
  };

  // Helper for CWSI stress level classification
  const getCwsiStatus = (cwsi: number) => {
    if (cwsi < 0.22) {
      return { label: "Optimal (Hydrated)", colorClass: "text-emerald-400 bg-emerald-950/70 border-emerald-800" };
    }
    if (cwsi < 0.45) {
      return { label: "Mild Deficit", colorClass: "text-amber-400 bg-amber-950/70 border-amber-800" };
    }
    return { label: "Severe Stress", colorClass: "text-rose-400 bg-rose-950/70 border-rose-800" };
  };

  // Step navigation helpers
  const handleStepPrev = () => {
    if (chartData.length === 0) return;
    const currentIdx = activeInspectionPoint
      ? chartData.findIndex((p) => p.step === activeInspectionPoint.step)
      : chartData.length - 1;
    const nextIdx = Math.max(0, currentIdx - 1);
    setPinnedPoint(chartData[nextIdx]);
  };

  const handleStepNext = () => {
    if (chartData.length === 0) return;
    const currentIdx = activeInspectionPoint
      ? chartData.findIndex((p) => p.step === activeInspectionPoint.step)
      : chartData.length - 1;
    const nextIdx = Math.min(chartData.length - 1, currentIdx + 1);
    setPinnedPoint(chartData[nextIdx]);
  };

  // Export current yieldHistory and 7-day forecast dataset as CSV for offline agronomic & hydrological analysis
  const handleExportCSV = () => {
    // Prefer the complete yieldHistory dataset
    const pointsToExport =
      yieldHistory && yieldHistory.length > 0
        ? yieldHistory
        : rawChartData.length > 0
        ? rawChartData
        : chartData;

    if (!pointsToExport || pointsToExport.length === 0) return;

    // Structured CSV header columns adhering to agronomy & micrometeorology standards
    const headers = [
      "Record_Type",
      "Simulation_Step",
      "Timestamp_ISO",
      "Timestamp_Unix_Ms",
      "Date_Formatted",
      "Crop_Name",
      "Harvest_Yield_Qtl_Per_Acre",
      "District_Baseline_Yield_Qtl",
      "Yield_Delta_Qtl",
      "Yield_Gain_Percent",
      "CWSI_Stress_Index",
      "CWSI_Hydration_Status",
      "Autonomous_Action_Taken",
    ];

    const historicalRows = pointsToExport.map((pt) => {
      const isoDate = new Date(pt.timestamp).toISOString();
      const dateFormatted = new Date(pt.timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const delta = (pt.projectedYield - pt.baselineYield).toFixed(2);
      const gainPct = (
        ((pt.projectedYield - pt.baselineYield) / pt.baselineYield) *
        100
      ).toFixed(2);
      const cwsiClass =
        pt.cwsi < 0.22 ? "Optimal (Hydrated)" : pt.cwsi < 0.45 ? "Mild Deficit" : "Severe Stress";
      const cleanCrop = cropName.replace(/"/g, '""');
      const cleanAction = (pt.actionTaken || "IDLE_MONITOR").replace(/"/g, '""');

      return [
        "YIELD_HISTORY",
        `Step #${pt.step}`,
        `"${isoDate}"`,
        pt.timestamp,
        `"${dateFormatted}"`,
        `"${cleanCrop}"`,
        pt.projectedYield.toFixed(2),
        pt.baselineYield.toFixed(2),
        delta,
        gainPct,
        pt.cwsi.toFixed(3),
        `"${cwsiClass}"`,
        `"${cleanAction}"`,
      ].join(",");
    });

    const forecastRows = (regression?.forecastDays || []).map((f) => {
      const isoDate = new Date(f.timestamp).toISOString();
      const delta = f.deltaFromBaseline.toFixed(2);
      const gainPct = ((f.deltaFromBaseline / yieldData.baselineYield) * 100).toFixed(2);
      const cleanCrop = cropName.replace(/"/g, '""');
      const cleanNote = (f.phenologyNote || "").replace(/"/g, '""');

      return [
        "7_DAY_OLS_FORECAST",
        `Day +${f.day}`,
        `"${isoDate}"`,
        f.timestamp,
        `"${f.dateStr} (${cleanNote})"`,
        `"${cleanCrop}"`,
        f.predictedYield.toFixed(2),
        yieldData.baselineYield.toFixed(2),
        delta,
        gainPct,
        f.predictedCwsi.toFixed(3),
        `"${f.cwsiStatus}"`,
        `"FORECAST_HORIZON"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...historicalRows, ...forecastRows].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sanitizedCrop = cropName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `yield_history_${sanitizedCrop}_${dateStr}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setHasExported(true);
    setTimeout(() => {
      setHasExported(false);
    }, 2500);
  };

  // Render D3.js Line Chart & Interactivity
  useEffect(() => {
    if (!svgRef.current || containerWidth <= 0 || chartData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous drawing

    const chartHeight = 225;
    const margin = {
      top: 20,
      right: showCwsiOverlay ? 44 : 26,
      bottom: 30,
      left: 42,
    };
    const innerWidth = Math.max(50, containerWidth - margin.left - margin.right);
    const innerHeight = Math.max(50, chartHeight - margin.top - margin.bottom);

    // X Scale (Simulation Steps)
    const minStep: number = d3.min(chartData, (d: YieldHistoryPoint) => d.step) ?? 0;
    const maxHistoricalStep: number = d3.max(chartData, (d: YieldHistoryPoint) => d.step) ?? 1;
    const maxForecastStep =
      showForecast && regression.forecastDays.length > 0
        ? regression.forecastDays[regression.forecastDays.length - 1].step
        : maxHistoricalStep;
    const maxStep = Math.max(maxHistoricalStep, maxForecastStep);

    const xScale = d3
      .scaleLinear()
      .domain([minStep, maxStep === minStep ? minStep + 1 : maxStep])
      .range([margin.left, margin.left + innerWidth]);

    // Primary Y Scale (Projected Harvest Yield in Quintals / Acre)
    const baseline = yieldData.baselineYield || 45.0;
    const minHistoricalYield: number = d3.min(chartData, (d: YieldHistoryPoint) => d.projectedYield) ?? 40;
    const maxHistoricalYieldVal: number = d3.max(chartData, (d: YieldHistoryPoint) => d.projectedYield) ?? 52;

    const minForecastYield: number =
      showForecast && regression.forecastDays.length > 0
        ? (d3.min(regression.forecastDays, (d: ForecastDay) => d.lowerBound) as number) ?? minHistoricalYield
        : minHistoricalYield;

    const maxForecastYield: number =
      showForecast && regression.forecastDays.length > 0
        ? (d3.max(regression.forecastDays, (d: ForecastDay) => d.upperBound) as number) ?? maxHistoricalYieldVal
        : maxHistoricalYieldVal;

    const domainMin = Math.min(baseline - 1.8, minHistoricalYield - 1.2, minForecastYield - 0.6);
    const domainMax = Math.max(baseline + 1.8, maxHistoricalYieldVal + 1.4, maxForecastYield + 0.8);

    const yScale = d3
      .scaleLinear()
      .domain([domainMin, domainMax])
      .nice()
      .range([margin.top + innerHeight, margin.top]);

    // Secondary Y Scale for CWSI Stress (0.00 to 1.00)
    const cwsiScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([margin.top + innerHeight, margin.top]);

    // Gradient definition for area fill
    const defs = svg.append("defs");
    const areaGradient = defs
      .append("linearGradient")
      .attr("id", "yieldAreaGradientEnhanced")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    areaGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#10b981")
      .attr("stop-opacity", 0.4);

    areaGradient
      .append("stop")
      .attr("offset", "80%")
      .attr("stop-color", "#10b981")
      .attr("stop-opacity", 0.06);

    areaGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#10b981")
      .attr("stop-opacity", 0.0);

    // Subtle drop shadow filter for points
    const filter = defs
      .append("filter")
      .attr("id", "pointGlow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "2.5")
      .attr("result", "blur");
    filter
      .append("feComposite")
      .attr("in", "SourceGraphic")
      .attr("in2", "blur")
      .attr("operator", "over");

    // Background horizontal grid lines
    const yAxisGrid = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickSize(-innerWidth)
      .tickFormat(() => "");

    const gridG = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .attr("class", "grid-lines")
      .call(yAxisGrid);

    gridG.select(".domain").remove();
    gridG
      .selectAll(".tick line")
      .attr("stroke", "#292524")
      .attr("stroke-dasharray", "3 3")
      .attr("stroke-opacity", 0.7);

    // Baseline Reference Line (District Average)
    const baselineY = yScale(baseline);
    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("y1", baselineY)
      .attr("x2", margin.left + innerWidth)
      .attr("y2", baselineY)
      .attr("stroke", "#d97706")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4 4")
      .attr("opacity", 0.85);

    // Baseline label on chart
    svg
      .append("text")
      .attr("x", margin.left + innerWidth - 4)
      .attr("y", baselineY - 4)
      .attr("text-anchor", "end")
      .attr("fill", "#fbbf24")
      .attr("font-size", "9px")
      .attr("font-family", "monospace")
      .attr("font-weight", "600")
      .text(`District Baseline (${baseline} Qtl/Ac)`);

    // D3 Area Fill for Yield
    const areaGenerator = d3
      .area<YieldHistoryPoint>()
      .x((d) => xScale(d.step))
      .y0(yScale(domainMin))
      .y1((d) => yScale(d.projectedYield))
      .curve(d3.curveMonotoneX);

    svg
      .append("path")
      .datum(chartData)
      .attr("fill", "url(#yieldAreaGradientEnhanced)")
      .attr("d", areaGenerator);

    // D3 Primary Yield Line
    const lineGenerator = d3
      .line<YieldHistoryPoint>()
      .x((d) => xScale(d.step))
      .y((d) => yScale(d.projectedYield))
      .curve(d3.curveMonotoneX);

    svg
      .append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "#34d399")
      .attr("stroke-width", 2.5)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("d", lineGenerator);

    // 7-Day Predictive Forecast Area & Trajectory Line (OLS Regression)
    if (showForecast && regression.forecastDays.length > 0 && chartData.length > 0) {
      const lastHistorical = chartData[chartData.length - 1];

      // 1. Forecast 95% Confidence Interval Corridor (Shaded Polygon)
      const corridorPoints = [
        {
          step: lastHistorical.step,
          lower: lastHistorical.projectedYield,
          upper: lastHistorical.projectedYield,
        },
        ...regression.forecastDays.map((f) => ({
          step: f.step,
          lower: f.lowerBound,
          upper: f.upperBound,
        })),
      ];

      const corridorGenerator = d3
        .area<{ step: number; lower: number; upper: number }>()
        .x((d) => xScale(d.step))
        .y0((d) => yScale(d.lower))
        .y1((d) => yScale(d.upper))
        .curve(d3.curveMonotoneX);

      svg
        .append("path")
        .datum(corridorPoints)
        .attr("fill", "#06b6d4")
        .attr("fill-opacity", 0.12)
        .attr("stroke", "#0891b2")
        .attr("stroke-opacity", 0.3)
        .attr("stroke-dasharray", "2 2")
        .attr("stroke-width", 1)
        .attr("d", corridorGenerator);

      // 2. Forecast Trend Dashed Vector Line
      const forecastLinePoints: { step: number; projectedYield: number }[] = [
        { step: lastHistorical.step, projectedYield: lastHistorical.projectedYield },
        ...regression.forecastDays.map((f) => ({
          step: f.step,
          projectedYield: f.predictedYield,
        })),
      ];

      const forecastLineGenerator = d3
        .line<{ step: number; projectedYield: number }>()
        .x((d) => xScale(d.step))
        .y((d) => yScale(d.projectedYield))
        .curve(d3.curveMonotoneX);

      svg
        .append("path")
        .datum(forecastLinePoints)
        .attr("fill", "none")
        .attr("stroke", "#22d3ee") // cyan-400
        .attr("stroke-width", 2.2)
        .attr("stroke-dasharray", "4 3")
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("d", forecastLineGenerator);

      // 3. Vertical Dividing Horizon Marker ("TODAY / 7D PROJECTION")
      const dividerX = xScale(lastHistorical.step);
      if (Number.isFinite(dividerX)) {
        svg
          .append("line")
          .attr("x1", dividerX)
          .attr("y1", margin.top)
          .attr("x2", dividerX)
          .attr("y2", margin.top + innerHeight)
          .attr("stroke", "#06b6d4")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3 2")
          .attr("opacity", 0.65);

        svg
          .append("text")
          .attr("x", dividerX + 4)
          .attr("y", margin.top + 9)
          .attr("fill", "#22d3ee")
          .attr("font-size", "8.5px")
          .attr("font-family", "monospace")
          .attr("font-weight", "600")
          .text("7D FORECAST HORIZON");
      }

      // 4. Forecast Marker Nodes
      const forecastMarkersGroup = svg.append("g").attr("class", "forecast-markers");
      forecastMarkersGroup
        .selectAll("circle.forecast-marker")
        .data(regression.forecastDays)
        .enter()
        .append("circle")
        .attr("class", "forecast-marker")
        .attr("cx", (d: ForecastDay) => xScale(d.step))
        .attr("cy", (d: ForecastDay) => yScale(d.predictedYield))
        .attr("r", (d: ForecastDay) => (selectedForecastDay === d.day ? 5.5 : 3.5))
        .attr("fill", (d: ForecastDay) => (selectedForecastDay === d.day ? "#22d3ee" : "#0891b2"))
        .attr("stroke", "#ecfeff")
        .attr("stroke-width", (d: ForecastDay) => (selectedForecastDay === d.day ? 2 : 1.2))
        .attr("cursor", "pointer")
        .on("mouseenter", (_event, d: ForecastDay) => {
          activateForecastHover(d);
        })
        .on("mouseleave", () => {
          deactivateHover();
        })
        .on("click", (event: any, d: ForecastDay) => {
          event.stopPropagation();
          setSelectedForecastDay((prev) => (prev === d.day ? null : d.day));
          activateForecastHover(d);
        });
    }

    // Optional Secondary CWSI Stress Curve
    if (showCwsiOverlay) {
      const cwsiLineGenerator = d3
        .line<YieldHistoryPoint>()
        .x((d) => xScale(d.step))
        .y((d) => cwsiScale(d.cwsi))
        .curve(d3.curveMonotoneX);

      svg
        .append("path")
        .datum(chartData)
        .attr("fill", "none")
        .attr("stroke", "#38bdf8")
        .attr("stroke-width", 1.8)
        .attr("stroke-dasharray", "3 2")
        .attr("opacity", 0.85)
        .attr("d", cwsiLineGenerator);

      // Right CWSI Axis
      const cwsiAxis = d3
        .axisRight(cwsiScale)
        .ticks(4)
        .tickFormat((d) => `${d}`);

      const cwsiAxisG = svg
        .append("g")
        .attr("transform", `translate(${margin.left + innerWidth}, 0)`)
        .call(cwsiAxis);

      cwsiAxisG.select(".domain").attr("stroke", "#0284c7");
      cwsiAxisG
        .selectAll(".tick text")
        .attr("fill", "#38bdf8")
        .attr("font-size", "9px")
        .attr("font-family", "monospace");
      cwsiAxisG.selectAll(".tick line").attr("stroke", "#0369a1");

      svg
        .append("text")
        .attr("x", margin.left + innerWidth + 4)
        .attr("y", margin.top - 6)
        .attr("text-anchor", "start")
        .attr("fill", "#38bdf8")
        .attr("font-size", "9px")
        .attr("font-family", "monospace")
        .text("CWSI");
    }

    // Bottom X-Axis (Simulation Steps + Forecast Days)
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.max(4, Math.floor(innerWidth / 60)))
      .tickFormat((d) => {
        const stepNum = typeof d === "number" ? d : Number(d);
        if (showForecast && stepNum > maxHistoricalStep) {
          const dayOffset = Math.round(stepNum - maxHistoricalStep);
          return `+${dayOffset}d`;
        }
        return `S-${stepNum}`;
      });

    const xAxisG = svg
      .append("g")
      .attr("transform", `translate(0, ${margin.top + innerHeight})`)
      .call(xAxis);

    xAxisG.select(".domain").attr("stroke", "#44403c");
    xAxisG
      .selectAll(".tick text")
      .attr("fill", "#78716c")
      .attr("font-size", "10px")
      .attr("font-family", "monospace");
    xAxisG.selectAll(".tick line").attr("stroke", "#44403c");

    // Left Y-Axis (Yield in Qtl/Acre)
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => `${d}`);

    const yAxisG = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(yAxis);

    yAxisG.select(".domain").attr("stroke", "#44403c");
    yAxisG
      .selectAll(".tick text")
      .attr("fill", "#78716c")
      .attr("font-size", "10px")
      .attr("font-family", "monospace");
    yAxisG.selectAll(".tick line").attr("stroke", "#44403c");

    // Y-Axis Unit Label
    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", margin.top - 6)
      .attr("text-anchor", "start")
      .attr("fill", "#a8a29e")
      .attr("font-size", "9px")
      .attr("font-family", "monospace")
      .text("Qtl/Acre");

    // Interactive Hover Elements (Crosshairs and Focus Halo)
    const crosshairVertical = svg
      .append("line")
      .attr("y1", margin.top)
      .attr("y2", margin.top + innerHeight)
      .attr("stroke", "#34d399")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3 3")
      .attr("opacity", 0)
      .attr("pointer-events", "none");

    const crosshairHorizontal = svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", margin.left + innerWidth)
      .attr("stroke", "#34d399")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3 3")
      .attr("opacity", 0)
      .attr("pointer-events", "none");

    const focusHalo = svg
      .append("circle")
      .attr("r", 9)
      .attr("fill", "#10b981")
      .attr("fill-opacity", 0.25)
      .attr("stroke", "#34d399")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0)
      .attr("pointer-events", "none");

    const focusCircle = svg
      .append("circle")
      .attr("r", 5)
      .attr("fill", "#10b981")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("opacity", 0)
      .attr("filter", "url(#pointGlow)")
      .attr("pointer-events", "none");

    // Group for individual data points
    const pointsGroup = svg.append("g").attr("class", "data-points");

    // Standard Point Circles
    pointsGroup
      .selectAll<SVGCircleElement, YieldHistoryPoint>("circle.point-marker")
      .data(chartData)
      .enter()
      .append("circle")
      .attr("class", "point-marker")
      .attr("cx", (d: YieldHistoryPoint) => xScale(d.step))
      .attr("cy", (d: YieldHistoryPoint) => yScale(d.projectedYield))
      .attr("r", (d: YieldHistoryPoint, i: number) => {
        if (pinnedPoint && pinnedPoint.step === d.step) return 6;
        if (i === chartData.length - 1) return 4.5;
        return 2.5;
      })
      .attr("fill", (d: YieldHistoryPoint, i: number) => {
        if (pinnedPoint && pinnedPoint.step === d.step) return "#34d399";
        if (i === chartData.length - 1) return "#10b981";
        return "#059669";
      })
      .attr("stroke", (d: YieldHistoryPoint) => (pinnedPoint && pinnedPoint.step === d.step ? "#ffffff" : "#022c22"))
      .attr("stroke-width", (d: YieldHistoryPoint) => (pinnedPoint && pinnedPoint.step === d.step ? 2 : 1.5));

    // Latest Point Pulsing Glow Animation
    const latestPoint = chartData[chartData.length - 1];
    if (latestPoint && (!pinnedPoint || pinnedPoint.step === latestPoint.step)) {
      const latestX = xScale(latestPoint.step);
      const latestY = yScale(latestPoint.projectedYield);

      const pulseCircle = svg
        .append("circle")
        .attr("cx", latestX)
        .attr("cy", latestY)
        .attr("r", 7)
        .attr("fill", "none")
        .attr("stroke", "#34d399")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.7)
        .attr("pointer-events", "none");

      pulseCircle
        .append("animate")
        .attr("attributeName", "r")
        .attr("values", "5;10;5")
        .attr("dur", "2.2s")
        .attr("repeatCount", "indefinite");

      pulseCircle
        .append("animate")
        .attr("attributeName", "opacity")
        .attr("values", "0.85;0.15;0.85")
        .attr("dur", "2.2s")
        .attr("repeatCount", "indefinite");
    }

    // Function to activate hover state for a historical data point
    const activateHover = (d: YieldHistoryPoint) => {
      if (!d) return;
      const cx = xScale(d.step);
      const cy = yScale(d.projectedYield);
      if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;

      crosshairVertical
        .attr("x1", cx)
        .attr("x2", cx)
        .attr("opacity", 0.75);

      crosshairHorizontal
        .attr("y1", cy)
        .attr("y2", cy)
        .attr("opacity", 0.5);

      focusHalo
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("opacity", 1);

      focusCircle
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("opacity", 1);

      setHoveredForecastPoint(null);
      setHoveredPoint(d);
      setHoverPosition({ x: cx, y: cy });
    };

    // Function to activate hover state for a 7-day forecast data point
    const activateForecastHover = (f: ForecastDay) => {
      if (!f) return;
      const cx = xScale(f.step);
      const cy = yScale(f.predictedYield);
      if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;

      crosshairVertical
        .attr("x1", cx)
        .attr("x2", cx)
        .attr("opacity", 0.75);

      crosshairHorizontal
        .attr("y1", cy)
        .attr("y2", cy)
        .attr("opacity", 0.5);

      focusHalo
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("opacity", 1);

      focusCircle
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("opacity", 1);

      setHoveredPoint(null);
      setHoveredForecastPoint(f);
      setHoverPosition({ x: cx, y: cy });
    };

    const deactivateHover = () => {
      if (pinnedPoint) {
        // Fall back to pinned point display
        activateHover(pinnedPoint);
        return;
      }
      crosshairVertical.attr("opacity", 0);
      crosshairHorizontal.attr("opacity", 0);
      focusHalo.attr("opacity", 0);
      focusCircle.attr("opacity", 0);
      setHoveredPoint(null);
      setHoveredForecastPoint(null);
      setHoverPosition(null);
    };

    // If a point is currently pinned, show its crosshair right away
    if (pinnedPoint) {
      const p = chartData.find((pt) => pt.step === pinnedPoint.step) || pinnedPoint;
      activateHover(p);
    }

    // Hit-target circles for direct hover / tap on individual historical points
    const hitTargetsGroup = svg.append("g").attr("class", "hit-targets");

    hitTargetsGroup
      .selectAll<SVGCircleElement, YieldHistoryPoint>("circle.point-hit-target")
      .data(chartData)
      .enter()
      .append("circle")
      .attr("class", "point-hit-target")
      .attr("cx", (d: YieldHistoryPoint) => xScale(d.step))
      .attr("cy", (d: YieldHistoryPoint) => yScale(d.projectedYield))
      .attr("r", 14) // Enlarged invisible hit radius for seamless mouse & touch interaction
      .attr("fill", "transparent")
      .attr("cursor", "pointer")
      .on("mouseenter", (_event, d: YieldHistoryPoint) => {
        activateHover(d);
      })
      .on("mouseleave", () => {
        deactivateHover();
      })
      .on("click", (event, d: YieldHistoryPoint) => {
        event.stopPropagation();
        if (pinnedPoint && pinnedPoint.step === d.step) {
          setPinnedPoint(null); // Unpin if clicking same
        } else {
          setPinnedPoint(d); // Pin point
          activateHover(d);
        }
      });

    // Continuous mouse/touch-tracking rect for smooth bisecting across historical & forecast horizon
    const bisect = d3.bisector<YieldHistoryPoint, number>((d) => d.step).center;

    svg
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .attr("cursor", "crosshair")
      .lower() // Keep behind hit-targets
      .on("mousemove touchmove", function (event: any) {
        let pointerTarget: any = event;
        if (event.touches && event.touches.length > 0) {
          pointerTarget = event.touches[0];
        } else if (event.changedTouches && event.changedTouches.length > 0) {
          pointerTarget = event.changedTouches[0];
        }

        if (
          !pointerTarget ||
          typeof pointerTarget.clientX !== "number" ||
          !Number.isFinite(pointerTarget.clientX)
        ) {
          return;
        }

        try {
          const coords = d3.pointer(pointerTarget, this);
          if (!coords || !Number.isFinite(coords[0])) return;
          const pointerX = coords[0];
          const stepVal = xScale.invert(pointerX);
          if (!Number.isFinite(stepVal)) return;

          // If mouse is inside the 7-day forecast horizon:
          if (showForecast && regression.forecastDays.length > 0 && stepVal > maxHistoricalStep) {
            let closestF: ForecastDay = regression.forecastDays[0];
            let minDiff = Math.abs(closestF.step - stepVal);
            for (const f of regression.forecastDays) {
              const diff = Math.abs(f.step - stepVal);
              if (diff < minDiff) {
                minDiff = diff;
                closestF = f;
              }
            }
            activateForecastHover(closestF);
          } else {
            const idx = bisect(chartData, stepVal);
            const d = chartData[idx];
            if (d) {
              activateHover(d);
            }
          }
        } catch {
          // Gracefully suppress any non-finite coordinate transformations
        }
      })
      .on("mouseleave touchend", function () {
        deactivateHover();
      })
      .on("click", function () {
        // Clicking on canvas background clears pinned state
        setPinnedPoint(null);
        deactivateHover();
      });
  }, [
    chartData,
    containerWidth,
    yieldData.baselineYield,
    showCwsiOverlay,
    showForecast,
    selectedForecastDay,
    pinnedPoint,
    regression,
  ]);

  // Overall Gain percentage calculation
  const yieldGainPercent = (
    ((yieldData.currentProjectedYield - yieldData.baselineYield) / yieldData.baselineYield) *
    100
  ).toFixed(1);

  // Trend slope over the current displayed window
  const windowDelta = useMemo(() => {
    if (chartData.length < 2) return 0;
    const first = chartData[0].projectedYield;
    const last = chartData[chartData.length - 1].projectedYield;
    return Number((last - first).toFixed(2));
  }, [chartData]);

  const maxHistoricalYield = useMemo(() => {
    if (chartData.length === 0) return yieldData.currentProjectedYield;
    return Math.max(...chartData.map((d) => d.projectedYield)).toFixed(1);
  }, [chartData, yieldData.currentProjectedYield]);

  // Active tooltip point is either hovered or pinned
  const tooltipData = hoveredPoint || pinnedPoint;

  return (
    <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-xl overflow-hidden flex flex-col">
      {/* Top Header */}
      <div className="bg-stone-950 px-4 py-3 border-b border-stone-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5 min-w-0">
          <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
          <h3 className="font-semibold text-xs tracking-wider uppercase text-stone-200 truncate">
            {t.yield.title}
          </h3>
          <span className="text-[10px] font-mono text-emerald-400/90 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 hidden xl:inline shrink-0">
            FAO-56 Penman-Monteith
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Prominent, Highly Visible Export Data Button */}
          <button
            id="export-yield-data-btn"
            onClick={handleExportCSV}
            aria-label="Export Yield History Data as CSV"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer shadow-md ${
              hasExported
                ? "bg-emerald-700 border-emerald-500 text-white shadow-emerald-950/60"
                : "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border-emerald-500 hover:border-emerald-400 shadow-emerald-950/50 hover:shadow-emerald-900/60"
            }`}
            title="Download current yieldHistory state as a CSV file for offline analysis"
          >
            {hasExported ? (
              <>
                <Check className="w-3.5 h-3.5 text-white animate-bounce" />
                <span>{t.common.save}</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-white" />
                <span>{t.common.export}</span>
              </>
            )}
          </button>

          <button
            onClick={onRefineYieldModel}
            disabled={isRefiningYield}
            className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 border border-stone-700 transition-all cursor-pointer disabled:opacity-50"
            title="Run generative agro-meteorology inference"
          >
            <Sparkles className={`w-3.5 h-3.5 text-emerald-400 ${isRefiningYield ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isRefiningYield ? t.yield.refining : t.yield.refineModel}</span>
            <span className="sm:hidden">{isRefiningYield ? "..." : "AI"}</span>
          </button>
        </div>
      </div>

      {/* View Switcher Sub-Header */}
      <div className="bg-stone-950/90 px-4 py-2 border-b border-stone-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-1.5 bg-stone-900 p-1 rounded-lg border border-stone-800">
          <button
            id="tab-yield-model-btn"
            onClick={() => setActiveTab("yield-model")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "yield-model"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-950/40"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t.yield.trendTitle}</span>
          </button>
          <button
            id="tab-weather-trends-btn"
            onClick={() => setActiveTab("weather-trends")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "weather-trends"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-950/40"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <CloudSun className="w-3.5 h-3.5" />
            <span>{t.weather.title}</span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
              Live Search
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-400">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-stone-300 font-medium truncate max-w-[240px]">{translateLocation(location)}</span>
        </div>
      </div>

      {activeTab === "weather-trends" ? (
        <div className="p-3.5">
          <LocalizedWeatherForecastWidget
            location={location}
            cropName={cropName}
            currentVpd={climate.vpd}
            currentEt0={climate.et0}
            currentTemp={climate.ambientTemp}
            currentHumidity={climate.humidity}
            onApplyIrrigationRule={onApplyIrrigationRule}
          />
        </div>
      ) : (
        <div className="p-3.5 space-y-3.5">
        {/* Core Telemetry Cards Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Main Projected Yield Card */}
          <div className="bg-stone-950/80 rounded-lg p-2.5 border border-stone-800 flex flex-col justify-between">
            <div>
              <div className="text-[11px] text-stone-400 mb-0.5 flex items-center justify-between">
                <span className="font-medium">Harvest Projection</span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  +{yieldGainPercent}%
                </span>
              </div>
              <div className="flex items-baseline space-x-1.5 my-0.5">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {yieldData.currentProjectedYield.toFixed(1)}
                </span>
                <span className="text-[11px] text-stone-300">Qtl / Acre</span>
              </div>
              <div className="text-[10px] text-stone-400 font-mono">
                Baseline: {yieldData.baselineYield} Qtl/Acre
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px] text-stone-400">
              <span className="truncate max-w-[90px]">{cropName.split("(")[0]}</span>
              <span className="text-emerald-400 font-mono font-medium">
                {yieldData.resourceEfficiencyIndex}% Eff.
              </span>
            </div>
          </div>

          {/* Water Savings Metric */}
          <div className="bg-stone-950/80 rounded-lg p-2.5 border border-stone-800 flex flex-col justify-between">
            <div>
              <div className="text-[11px] text-stone-400 mb-0.5 flex items-center gap-1 font-medium">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>Water Conserved</span>
              </div>
              <div className="flex items-baseline space-x-1.5 my-0.5">
                <span className="text-2xl font-bold font-mono text-cyan-300">
                  {(yieldData.waterSavedTotalLiters / 1000).toFixed(1)}k
                </span>
                <span className="text-[11px] text-stone-300">Liters</span>
              </div>
              <div className="text-[10px] text-stone-400 font-mono">
                ~42% vs flood furrow
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-stone-800/80 text-[10px] text-teal-400 font-mono truncate">
              Aquifer preservation active
            </div>
          </div>

          {/* Electricity Saved Metric */}
          <div className="bg-stone-950/80 rounded-lg p-2.5 border border-stone-800 flex flex-col justify-between">
            <div>
              <div className="text-[11px] text-stone-400 mb-0.5 flex items-center gap-1 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Power Saved</span>
              </div>
              <div className="flex items-baseline space-x-1.5 my-0.5">
                <span className="text-2xl font-bold font-mono text-amber-300">
                  {yieldData.electricityUnitsSavedKwh.toFixed(1)}
                </span>
                <span className="text-[11px] text-stone-300">kWh</span>
              </div>
              <div className="text-[10px] text-stone-400 font-mono">
                Feeder hours optimized
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-stone-800/80 text-[10px] text-amber-400 font-mono">
              ₹{(yieldData.electricityUnitsSavedKwh * 4.5).toFixed(0)} tariff saved
            </div>
          </div>

          {/* Atmospheric Demand & GDD */}
          <div className="bg-stone-950/80 rounded-lg p-2.5 border border-stone-800 flex flex-col justify-between font-mono text-[11px]">
            <div>
              <div className="text-stone-400 mb-0.5 flex items-center gap-1 font-sans font-medium">
                <Calendar className="w-3.5 h-3.5 text-rose-400" />
                <span>Atmospheric Demand</span>
              </div>
              <div className="space-y-0.5 my-1 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">ET₀:</span>
                  <span className="text-stone-200 font-bold">{climate.et0.toFixed(1)} mm/d</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">VPD:</span>
                  <span className="text-stone-200 font-bold">{climate.vpd.toFixed(2)} kPa</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-stone-400 border-t border-stone-800/80 pt-1 flex justify-between items-center">
              <span>GDD:</span>
              <span className="text-stone-200 font-bold">{yieldData.gddAccumulated.toFixed(0)} °C·d</span>
            </div>
          </div>
        </div>

        {/* D3.js Projected Yield Trend Line Chart with Rich Interactivity */}
        <div className="bg-stone-950/90 rounded-lg p-3 border border-stone-800 relative flex flex-col space-y-2.5">
          {/* Chart Header & Interactive Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 pb-2">
            <div className="flex items-center space-x-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                Yield Trajectory (D3.js Vector Canvas)
              </span>
            </div>

            {/* Interactive Horizon Filter & Overlay Controls */}
            <div className="flex items-center space-x-1.5 font-mono text-[10px]">
              {/* Range Selector */}
              <div className="flex items-center bg-stone-900 rounded p-0.5 border border-stone-800">
                {(["all", "20", "10"] as const).map((rng) => (
                  <button
                    key={rng}
                    onClick={() => setStepRange(rng)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      stepRange === rng
                        ? "bg-emerald-700 text-white"
                        : "text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    {rng === "all" ? "All" : `Last ${rng}`}
                  </button>
                ))}
              </div>

              {/* CWSI Curve Overlay Toggle */}
              <button
                onClick={() => setShowCwsiOverlay(!showCwsiOverlay)}
                className={`flex items-center space-x-1 px-1.5 py-0.8 rounded border transition-colors ${
                  showCwsiOverlay
                    ? "bg-sky-950/80 text-sky-300 border-sky-700"
                    : "bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-300"
                }`}
                title="Toggle Crop Water Stress Index overlay line"
              >
                <Eye className="w-2.5 h-2.5" />
                <span>CWSI</span>
              </button>

              {/* 7-Day Forecast Overlay Toggle */}
              <button
                id="toggle-7d-forecast-btn"
                onClick={() => setShowForecast(!showForecast)}
                className={`flex items-center space-x-1 px-1.5 py-0.8 rounded border transition-colors cursor-pointer ${
                  showForecast
                    ? "bg-cyan-950/80 text-cyan-300 border-cyan-700 shadow-sm"
                    : "bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-300"
                }`}
                title="Toggle 7-day predictive yield regression trajectory on chart"
              >
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                <span>7D Forecast</span>
              </button>

              {/* Quick CSV Export */}
              <button
                id="export-csv-quick-btn"
                onClick={handleExportCSV}
                aria-label="Download Yield History CSV"
                className="flex items-center space-x-1 px-2.5 py-1 rounded-md border bg-emerald-950/80 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900 hover:text-white transition-colors cursor-pointer text-xs font-semibold shadow-sm"
                title="Download current yieldHistory state as CSV"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>Export CSV</span>
              </button>

              {/* Window delta indicator */}
              <div
                className={`flex items-center space-x-0.5 px-1.5 py-0.8 rounded border ${
                  windowDelta >= 0
                    ? "bg-emerald-950/70 text-emerald-300 border-emerald-800/80"
                    : "bg-rose-950/70 text-rose-300 border-rose-800/80"
                }`}
              >
                {windowDelta >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-rose-400" />
                )}
                <span>
                  {windowDelta >= 0 ? `+${windowDelta}` : windowDelta} Qtl
                </span>
              </div>
            </div>
          </div>

          {/* D3 Vector Canvas Container with Hover & Touch Interactivity */}
          <div
            ref={containerRef}
            className="relative w-full h-[225px] select-none overflow-hidden"
          >
            <svg
              ref={svgRef}
              width={containerWidth || "100%"}
              height={225}
              className="w-full h-full block"
            />

            {/* Rich Interactive Floating Tooltip displaying Yield, Timestamps, CWSI & Autonomous Actions */}
            {(hoveredForecastPoint || (tooltipData && hoverPosition)) && hoverPosition && (
              <div
                className="absolute pointer-events-none z-20 bg-stone-950/95 backdrop-blur-md border border-stone-700/90 rounded-lg p-2.5 shadow-2xl text-[11px] font-mono transition-all duration-75 min-w-[205px] max-w-[250px]"
                style={{
                  // Constrain horizontally so it never exceeds chart bounding box
                  left: `${Math.max(
                    12,
                    Math.min(
                      (containerWidth || 340) - 220,
                      hoverPosition.x - 100
                    )
                  )}px`,
                  // Flip vertically above or below point depending on cursor height
                  top:
                    hoverPosition.y < 95
                      ? `${hoverPosition.y + 16}px`
                      : `${hoverPosition.y - 12}px`,
                  transform: hoverPosition.y < 95 ? "none" : "translateY(-100%)",
                }}
              >
                {hoveredForecastPoint ? (
                  <div className="space-y-1.5">
                    {/* Forecast Tooltip Header */}
                    <div className="flex items-center justify-between border-b border-cyan-800/80 pb-1.5 mb-1.5 text-cyan-300">
                      <div className="flex items-center space-x-1.5">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span className="font-bold text-cyan-200">
                          {hoveredForecastPoint.dayLabel} ({hoveredForecastPoint.dateStr})
                        </span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-semibold">
                        7D OLS
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-stone-400 text-[10px] uppercase font-sans font-semibold">
                        Predicted Yield:
                      </span>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-base font-bold text-cyan-300">
                          {hoveredForecastPoint.predictedYield.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-stone-400">Qtl/Acre</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] bg-cyan-950/40 px-1.5 py-0.8 rounded border border-cyan-900/60">
                      <span className="text-stone-400">95% CI Range:</span>
                      <span className="font-mono text-cyan-200">
                        [{hoveredForecastPoint.lowerBound} - {hoveredForecastPoint.upperBound}]
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-stone-400">Delta vs Today:</span>
                      <span
                        className={`font-semibold ${
                          hoveredForecastPoint.deltaFromCurrent >= 0
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                      >
                        {hoveredForecastPoint.deltaFromCurrent >= 0 ? "+" : ""}
                        {hoveredForecastPoint.deltaFromCurrent.toFixed(1)} Qtl
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-0.5">
                      <span className="text-stone-400">Projected Stress:</span>
                      <span
                        className={`px-1 py-0.2 rounded border text-[9px] font-semibold ${
                          getCwsiStatus(hoveredForecastPoint.predictedCwsi).colorClass
                        }`}
                      >
                        {hoveredForecastPoint.predictedCwsi.toFixed(2)} • {hoveredForecastPoint.cwsiStatus.split(" ")[0]}
                      </span>
                    </div>

                    {hoveredForecastPoint.phenologyNote && (
                      <div className="text-[9.5px] text-stone-300 bg-stone-900/90 p-1.5 rounded border border-stone-800">
                        <span className="text-stone-400 font-sans block text-[9px] uppercase font-medium">
                          Phenology Stage:
                        </span>
                        {hoveredForecastPoint.phenologyNote}
                      </div>
                    )}
                  </div>
                ) : tooltipData ? (
                  <div>
                    {/* Tooltip Header: Step, Time & Pin Status */}
                    <div className="flex items-center justify-between border-b border-stone-800 pb-1.5 mb-1.5 text-stone-400">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-stone-200">
                          Step #{tooltipData.step}
                        </span>
                        {pinnedPoint && pinnedPoint.step === tooltipData.step && (
                          <span className="px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[9px] font-semibold flex items-center gap-0.5">
                            <Pin className="w-2 h-2" /> Pinned
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {new Date(tooltipData.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Specific Yield Value & Comparison */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-stone-400 text-[10px] uppercase font-sans font-semibold">
                          Projected Yield:
                        </span>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-base font-bold text-emerald-400">
                            {tooltipData.projectedYield.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-stone-400">Qtl/Acre</span>
                        </div>
                      </div>

                      {/* Comparison with district baseline */}
                      <div className="flex items-center justify-between text-[10px] bg-stone-900/80 px-1.5 py-0.8 rounded border border-stone-800/80">
                        <span className="text-stone-400">vs Baseline ({tooltipData.baselineYield}):</span>
                        <span
                          className={`font-semibold ${
                            tooltipData.projectedYield >= tooltipData.baselineYield
                              ? "text-emerald-300"
                              : "text-amber-400"
                          }`}
                        >
                          {tooltipData.projectedYield - tooltipData.baselineYield >= 0 ? "+" : ""}
                          {(tooltipData.projectedYield - tooltipData.baselineYield).toFixed(1)} Qtl (
                          {(
                            ((tooltipData.projectedYield - tooltipData.baselineYield) /
                              tooltipData.baselineYield) *
                            100
                          ).toFixed(1)}
                          %)
                        </span>
                      </div>

                      {/* CWSI Stress Reading */}
                      <div className="flex items-center justify-between text-[10px] pt-0.5">
                        <span className="text-stone-400">Crop Stress (CWSI):</span>
                        <span
                          className={`px-1 py-0.2 rounded border text-[9px] font-semibold ${
                            getCwsiStatus(tooltipData.cwsi).colorClass
                          }`}
                        >
                          {tooltipData.cwsi.toFixed(2)} • {getCwsiStatus(tooltipData.cwsi).label.split(" ")[0]}
                        </span>
                      </div>

                      {/* Autonomous Action Taken */}
                      {tooltipData.actionTaken && (
                        <div className="text-[10px] text-cyan-300 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-900/60 truncate">
                          <span className="text-stone-400 mr-1">Action:</span>
                          {formatActionName(tooltipData.actionTaken)}
                        </div>
                      )}

                      {/* Click to Pin / Unpin prompt */}
                      <div className="text-[9px] text-stone-400 text-center border-t border-stone-800/60 pt-1">
                        {pinnedPoint && pinnedPoint.step === tooltipData.step
                          ? "Click point again to unpin"
                          : "Click point to pin inspection"}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Interactive Point Inspector & Stepper Strip */}
          <div className="bg-stone-900/80 rounded-lg p-2 border border-stone-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            {/* Left: Step navigation buttons & Pin Status */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleStepPrev}
                className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 cursor-pointer disabled:opacity-40"
                title="Previous step point"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                onClick={handleStepNext}
                className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 cursor-pointer disabled:opacity-40"
                title="Next step point"
              >
                <ChevronRight className="w-3 h-3" />
              </button>

              {pinnedPoint ? (
                <button
                  onClick={() => setPinnedPoint(null)}
                  className="flex items-center space-x-1 px-1.5 py-0.8 rounded bg-amber-950/70 border border-amber-800 text-amber-300 text-[10px] hover:bg-amber-900/80 cursor-pointer"
                  title="Unpin and return to live tracking"
                >
                  <PinOff className="w-2.5 h-2.5" />
                  <span>Unpin</span>
                </button>
              ) : (
                <div className="flex items-center space-x-1 px-1.5 py-0.8 rounded bg-stone-950 text-stone-400 border border-stone-800 text-[10px]">
                  <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                  <span>Live Hover Active</span>
                </div>
              )}
            </div>

            {/* Center / Right: Detailed Inspection readout for currently hovered or pinned point */}
            {activeInspectionPoint ? (
              <div className="flex flex-wrap items-center gap-2 text-stone-300 text-[10px]">
                <div>
                  <span className="text-stone-400">Step:</span>{" "}
                  <strong className="text-stone-200">#{activeInspectionPoint.step}</strong>
                </div>
                <div>
                  <span className="text-stone-400">Time:</span>{" "}
                  <span className="text-stone-300">
                    {new Date(activeInspectionPoint.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400">Yield:</span>{" "}
                  <strong className="text-emerald-400 font-bold">
                    {activeInspectionPoint.projectedYield.toFixed(1)} Qtl
                  </strong>
                </div>
                <div>
                  <span className="text-stone-400">CWSI:</span>{" "}
                  <span className="text-cyan-300">{activeInspectionPoint.cwsi.toFixed(2)}</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* D3 Chart Legend & High Watermark Footer */}
          <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono pt-1 border-t border-stone-800/80">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-0.5 bg-emerald-400 rounded-full inline-block" />
                <span>Yield Trajectory</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-0.5 bg-amber-400 rounded-full inline-block stroke-dasharray" />
                <span>Baseline (45 Qtl)</span>
              </span>
              {showCwsiOverlay && (
                <span className="flex items-center space-x-1 text-sky-400">
                  <span className="w-2.5 h-0.5 bg-sky-400 rounded-full inline-block" />
                  <span>CWSI Stress</span>
                </span>
              )}
              {showForecast && (
                <span className="flex items-center space-x-1 text-cyan-400">
                  <span className="w-2.5 h-0.5 bg-cyan-400 rounded-full inline-block border-t border-dashed border-cyan-300" />
                  <span>7D Forecast (OLS)</span>
                </span>
              )}
            </div>
            <div>
              Window Peak: <strong className="text-stone-200">{maxHistoricalYield} Qtl</strong>
            </div>
          </div>
        </div>

        {/* 7-Day Predictive Harvest Yield Forecast Panel (OLS Regression) */}
        <div
          id="seven-day-yield-forecast-panel"
          className="bg-stone-950/90 rounded-lg p-3.5 border border-cyan-900/40 relative flex flex-col space-y-3"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-md bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-200">
                    7-Day Predictive Harvest Yield Forecast
                  </h4>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[9.5px] font-mono">
                    OLS Trend Model
                  </span>
                </div>
                <p className="text-[10px] text-stone-400">
                  Continuous regression trajectory based on current historical trends & microclimatic response
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Trend Direction Badge */}
              <span
                className={`px-2 py-0.5 rounded border text-[10.5px] font-mono flex items-center gap-1.5 font-semibold ${
                  regression.trendDirection === "RISING"
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                    : regression.trendDirection === "DECLINING"
                    ? "bg-rose-950/80 text-rose-300 border-rose-800"
                    : "bg-cyan-950/80 text-cyan-300 border-cyan-800"
                }`}
              >
                {regression.trendDirection === "RISING" ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                ) : regression.trendDirection === "DECLINING" ? (
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>
                  {regression.trendDirection === "RISING"
                    ? `Accumulating (+${regression.slopePerDay.toFixed(2)} Qtl/d)`
                    : regression.trendDirection === "DECLINING"
                    ? `Deficit Slope (${regression.slopePerDay.toFixed(2)} Qtl/d)`
                    : `Equilibrium (±${Math.abs(regression.slopePerDay).toFixed(2)} Qtl/d)`}
                </span>
              </span>

              {/* Toggle on canvas */}
              <button
                id="toggle-forecast-canvas-btn"
                onClick={() => setShowForecast((prev) => !prev)}
                className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors cursor-pointer flex items-center space-x-1 ${
                  showForecast
                    ? "bg-cyan-900/40 text-cyan-300 border-cyan-700"
                    : "bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200"
                }`}
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>{showForecast ? "Vector Active" : "Overlay"}</span>
              </button>
            </div>
          </div>

          {/* 4 Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
            {/* Day 7 Target Harvest Yield */}
            <div className="bg-stone-900/90 rounded-md p-2.5 border border-cyan-900/40 flex flex-col justify-between">
              <div className="text-[10px] text-stone-400 uppercase font-sans font-medium flex items-center justify-between">
                <span>Day-7 Target Yield</span>
                <Sparkles className="w-3 h-3 text-cyan-400" />
              </div>
              <div className="my-1">
                <div className="text-base sm:text-lg font-bold text-cyan-300">
                  {regression.day7ProjectedYield.toFixed(1)}{" "}
                  <span className="text-[10px] font-normal text-stone-400">Qtl/Ac</span>
                </div>
              </div>
              <div className="text-[10px] flex items-center space-x-1 font-semibold">
                <span className={regression.day7Delta >= 0 ? "text-emerald-400" : "text-amber-400"}>
                  {regression.day7Delta >= 0 ? "+" : ""}
                  {regression.day7Delta.toFixed(1)} Qtl ({regression.day7GainPercent >= 0 ? "+" : ""}
                  {regression.day7GainPercent}%)
                </span>
                <span className="text-stone-400 text-[9px] font-normal font-sans">vs current</span>
              </div>
            </div>

            {/* Daily Growth Velocity */}
            <div className="bg-stone-900/90 rounded-md p-2.5 border border-stone-800 flex flex-col justify-between">
              <div className="text-[10px] text-stone-400 uppercase font-sans font-medium flex items-center justify-between">
                <span>Daily Velocity (Slope)</span>
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="my-1">
                <div className="text-base sm:text-lg font-bold text-emerald-400">
                  {regression.slopePerDay >= 0 ? "+" : ""}
                  {regression.slopePerDay.toFixed(2)}{" "}
                  <span className="text-[10px] font-normal text-stone-400">Qtl/d</span>
                </div>
              </div>
              <div className="text-[10px] text-stone-400 font-sans">
                Biomass accumulation rate
              </div>
            </div>

            {/* Model Fit Quality (R^2) */}
            <div className="bg-stone-900/90 rounded-md p-2.5 border border-stone-800 flex flex-col justify-between">
              <div className="text-[10px] text-stone-400 uppercase font-sans font-medium flex items-center justify-between">
                <span>Model Fit (R² & SE)</span>
                <LineChart className="w-3 h-3 text-sky-400" />
              </div>
              <div className="my-1">
                <div className="text-base sm:text-lg font-bold text-sky-300">
                  R² = {regression.rSquared.toFixed(2)}
                </div>
              </div>
              <div className="text-[10px] text-stone-400 flex items-center justify-between">
                <span>SE ±{regression.standardError.toFixed(2)} Qtl</span>
                <span className="text-cyan-400 font-bold">{regression.confidenceScore}% conf.</span>
              </div>
            </div>

            {/* CWSI Stress Outlook */}
            <div className="bg-stone-900/90 rounded-md p-2.5 border border-stone-800 flex flex-col justify-between">
              <div className="text-[10px] text-stone-400 uppercase font-sans font-medium flex items-center justify-between">
                <span>Stress Outlook (Day 7)</span>
                <Droplets className="w-3 h-3 text-blue-400" />
              </div>
              <div className="my-1">
                <div className="text-base sm:text-lg font-bold text-stone-200">
                  {regression.forecastDays[6].predictedCwsi.toFixed(2)}{" "}
                  <span className="text-[10px] font-normal text-stone-400">CWSI</span>
                </div>
              </div>
              <div className="text-[10px]">
                <span
                  className={`px-1.5 py-0.2 rounded border text-[9px] font-semibold ${
                    getCwsiStatus(regression.forecastDays[6].predictedCwsi).colorClass
                  }`}
                >
                  {regression.forecastDays[6].cwsiStatus}
                </span>
              </div>
            </div>
          </div>

          {/* 7-Day Day-by-Day Horizon Cards */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-[10px] text-stone-400">
              <span className="font-medium uppercase tracking-wider text-stone-400 font-sans">
                Daily Horizon Trajectory (Click any day to inspect)
              </span>
              <span className="font-mono text-[9px] text-cyan-400">
                Continuous OLS Projection Window
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
              {regression.forecastDays.map((f) => {
                const isSelected = selectedForecastDay === f.day;
                return (
                  <button
                    key={f.day}
                    id={`forecast-day-card-${f.day}`}
                    onClick={() => setSelectedForecastDay((prev) => (prev === f.day ? null : f.day))}
                    className={`text-left p-2 rounded-md border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-cyan-950/80 border-cyan-500 shadow-md ring-1 ring-cyan-500/50"
                        : "bg-stone-900/70 border-stone-800/90 hover:bg-stone-900 hover:border-stone-700"
                    }`}
                  >
                    <div>
                      {/* Day Header */}
                      <div className="flex items-center justify-between text-[10px] mb-1 font-mono">
                        <span className={`font-bold ${isSelected ? "text-cyan-200" : "text-stone-300"}`}>
                          {f.dayLabel}
                        </span>
                        <span className="text-stone-400 text-[9px]">{f.dateStr}</span>
                      </div>

                      {/* Predicted Yield */}
                      <div className="my-0.5">
                        <div className="text-sm font-bold font-mono text-cyan-300">
                          {f.predictedYield.toFixed(1)}{" "}
                          <span className="text-[9px] font-normal text-stone-400">Qtl</span>
                        </div>
                        <div className="text-[9px] text-stone-400 font-mono">
                          [{f.lowerBound} - {f.upperBound}]
                        </div>
                      </div>
                    </div>

                    <div className="mt-1.5 pt-1 border-t border-stone-800/80 space-y-1">
                      {/* Delta Chip */}
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span className="text-stone-400">Δ Today:</span>
                        <span
                          className={
                            f.deltaFromCurrent >= 0 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"
                          }
                        >
                          {f.deltaFromCurrent >= 0 ? "+" : ""}
                          {f.deltaFromCurrent.toFixed(1)}
                        </span>
                      </div>

                      {/* CWSI Pill */}
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="text-stone-400 font-mono">{f.predictedCwsi.toFixed(2)}</span>
                        <span
                          className={`px-1 py-0.2 rounded text-[8px] font-semibold border ${
                            getCwsiStatus(f.predictedCwsi).colorClass
                          }`}
                        >
                          {f.cwsiStatus.split(" ")[0]}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Selected Forecast Day Deep-Dive (if selected or default Day 7) */}
          {(() => {
            const focusDay = selectedForecastDay
              ? regression.forecastDays.find((f) => f.day === selectedForecastDay)
              : regression.forecastDays[6]; // default to Day 7

            if (!focusDay) return null;

            return (
              <div className="bg-stone-900/60 rounded-md p-2.5 border border-cyan-900/30 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-[11px]">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-[10px] font-bold">
                      {focusDay.dayLabel} Inspection ({focusDay.fullDateStr})
                    </span>
                    <span className="text-stone-300 font-mono font-bold">
                      Projected Harvest: {focusDay.predictedYield.toFixed(2)} Qtl/Acre
                    </span>
                  </div>
                  <p className="text-[10.5px] text-stone-400">
                    <strong className="text-stone-300 font-medium">Phenological Target:</strong>{" "}
                    {focusDay.phenologyNote || "Vegetative biomass conversion & grain sink formation."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                  <div className="bg-stone-950/80 px-2 py-1 rounded border border-stone-800">
                    <span className="text-stone-400 mr-1">95% Confidence Band:</span>
                    <span className="text-cyan-300 font-bold">
                      {focusDay.lowerBound} to {focusDay.upperBound} Qtl
                    </span>
                  </div>
                  <div className="bg-stone-950/80 px-2 py-1 rounded border border-stone-800">
                    <span className="text-stone-400 mr-1">Expected CWSI:</span>
                    <span className="text-stone-200 font-bold">
                      {focusDay.predictedCwsi.toFixed(2)} ({focusDay.cwsiStatus})
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Agronomic Advisory Assessment Notice */}
          <div className="bg-cyan-950/20 border border-cyan-900/40 rounded-md p-2.5 flex items-start space-x-2 text-[10.5px]">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-stone-300 leading-relaxed">
              <span className="font-semibold text-cyan-200">Agronomic Advisory: </span>
              {regression.agronomicAssessment}
            </div>
          </div>

          {/* Quick Data Export Bar at Card Bottom */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800/80 text-xs">
            <span className="text-stone-400 font-mono text-[11px]">
              Telemetry Log: <strong className="text-emerald-400">{yieldHistory?.length || rawChartData.length}</strong> points recorded
            </span>
            <button
              onClick={handleExportCSV}
              aria-label="Export Full Yield History as CSV"
              className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-emerald-500 transition-all cursor-pointer shadow-sm"
              title="Download yieldHistory state as CSV file"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>{hasExported ? "Exported!" : "Export History (CSV)"}</span>
            </button>
          </div>
        </div>

        {/* Integrated 7-Day Localized Weather Context for Irrigation Decisions */}
        <LocalizedWeatherForecastWidget
          location={location}
          cropName={cropName}
          currentVpd={climate.vpd}
          currentEt0={climate.et0}
          currentTemp={climate.ambientTemp}
          currentHumidity={climate.humidity}
          onApplyIrrigationRule={onApplyIrrigationRule}
        />
      </div>
    )}
  </div>
);
};
