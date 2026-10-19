/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "./components/Header";
import { CCTVFeed } from "./components/CCTVFeed";
import { FiveSensorPanel } from "./components/FiveSensorPanel";
import { KalmanFilterView } from "./components/KalmanFilterView";
import { QLearningMDPView } from "./components/QLearningMDPView";
import { IndianHardwarePanel } from "./components/IndianHardwarePanel";
import { YieldAndClimateModel } from "./components/YieldAndClimateModel";
import { GeminiAgronomistModal } from "./components/GeminiAgronomistModal";
import { StressSimulatorModal } from "./components/StressSimulatorModal";
import { ExportTelemetryModal } from "./components/ExportTelemetryModal";
import { ToastContainer } from "./components/ToastContainer";
import { ZoneResourceEfficiencyHeatmap } from "./components/ZoneResourceEfficiencyHeatmap";

import {
  CCTVVisionData,
  ClimateTelemetry,
  FarmZone,
  FiveSensors,
  IndianIrrigationHardware,
  KalmanState,
  ReflexRuleLog,
  YieldProjection,
  YieldHistoryPoint,
  AgentAction,
  AgroToast,
  IrrigationForecastAction,
  MqttTrafficBucket,
  MqttGatewayMetrics,
  FertilizerSchedule,
  FertilizerRecipeId,
  FertilizerExecutionLog,
  PestClassificationDetail,
} from "./types";
import { INITIAL_FARM_ZONES } from "./utils/mockFarmData";
import { SingleKalmanFilter } from "./utils/kalman";
import { INDIAN_PEST_PROFILES } from "./utils/pestKnowledge";
import {
  ALL_ACTIONS,
  discretizeState,
  QLearningReflexEngine,
} from "./utils/rlEngine";
import { LocalEdgeGatewayMqtt, MqttPacket } from "./utils/mqttSimulator";
import { playAlertChime } from "./utils/audioAlerts";
import {
  INITIAL_FERTILIZER_SCHEDULES,
  calculateNutrientBoost,
  FERTILIZER_RECIPES,
} from "./utils/fertilizerRecipes";

export default function App() {
  // Farm Zones
  const [zones, setZones] = useState<FarmZone[]>(INITIAL_FARM_ZONES);
  const [activeZoneId, setActiveZoneId] = useState<string>("zone-1");
  const activeZone = zones.find((z) => z.id === activeZoneId) || zones[0];

  // 5-Sensor In-Situ Soil Telemetry
  const [sensors, setSensors] = useState<FiveSensors>({
    shallowMoisture: 23.4, // % VWC (slightly dry)
    deepMoisture: 28.1,
    nitrogen: 165, // kg/ha (sub-optimal)
    phosphorus: 18,
    potassium: 172,
    ec: 0.85,
    pH: 7.2,
    soilTemperature: 26.5,
  });

  // Micro-climate Telemetry
  const [climate, setClimate] = useState<ClimateTelemetry>({
    ambientTemp: 34.2,
    humidity: 48,
    solarRadiation: 780,
    vpd: 2.35,
    windSpeed: 12.4,
    et0: 5.6,
    rainRate: 0.0,
  });

  // CCTV Vision State
  const [activePestScenario, setActivePestScenario] = useState<"BOLLWORM" | "APHIDS" | "NONE">("NONE");

  const [cctvData, setCctvData] = useState<CCTVVisionData>({
    cameraId: "CAM-01 [PTZ-4K]",
    resolution: "1080p @ 24fps",
    mode: "RGB",
    ndviScore: 0.61,
    variScore: 0.28,
    cwsi: 0.54,
    canopyTemp: 35.8,
    canopyDepression: 1.6,
    anomalyDetected: true,
    anomalyDescription: "Early stomatal closure & slight nitrogen chlorosis detected",
    pestInfestationDetected: false,
    primaryPestClass: "NONE",
    pestDetails: [],
    boundingBoxes: [
      {
        id: "b1",
        label: "Stomatal Wilting",
        confidence: 0.91,
        x: 0.22,
        y: 0.42,
        w: 0.28,
        h: 0.35,
        type: "stress",
      },
      {
        id: "b2",
        label: "Nitrogen Chlorosis",
        confidence: 0.86,
        x: 0.62,
        y: 0.51,
        w: 0.24,
        h: 0.32,
        type: "chlorosis",
      },
    ],
  });

  // Decision Making Instances (refs so they persist across renders)
  const kalmanRef = useRef<SingleKalmanFilter>(new SingleKalmanFilter(23.4, 0.04, 0.75));
  const rlEngineRef = useRef<QLearningReflexEngine>(new QLearningReflexEngine());
  const mqttGatewayRef = useRef<LocalEdgeGatewayMqtt>(new LocalEdgeGatewayMqtt());

  // Reactive UI State for Kalman, RL, and Hardware
  const [kalmanState, setKalmanState] = useState<KalmanState>(kalmanRef.current.getState());
  const [lastAction, setLastAction] = useState<AgentAction>("IDLE_MONITOR");
  const [isExploration, setIsExploration] = useState<boolean>(false);
  const [lastReward, setLastReward] = useState<number>(0);
  const [lastTdError, setLastTdError] = useState<number>(0);
  const [currentStateKey, setCurrentStateKey] = useState<string>("DRY__LOW_N__HIGH_VPD");
  const [reflexLogs, setReflexLogs] = useState<ReflexRuleLog[]>([]);
  const [mqttPackets, setMqttPackets] = useState<MqttPacket[]>([]);
  const [isGatewayOnline, setIsGatewayOnline] = useState<boolean>(true);
  const [mqttTrafficBuckets, setMqttTrafficBuckets] = useState<MqttTrafficBucket[]>(() =>
    mqttGatewayRef.current.getHourlyTraffic()
  );
  const [mqttGatewayMetrics, setMqttGatewayMetrics] = useState<MqttGatewayMetrics>(() =>
    mqttGatewayRef.current.getGatewayMetrics()
  );

  // Indian Irrigation Hardware State
  const [hardware, setHardware] = useState<IndianIrrigationHardware>({
    pumpMake: "Kirloskar 5HP Submersible",
    pumpStatus: "OFF",
    motorCurrentAmps: 0.0,
    lineVoltage: 412,
    feederPhaseStatus: "3-PHASE_HEALTHY",
    starterType: "Auto-Switch DOL Starter",
    manifoldPressureBar: 0.2,
    venturiStatus: "CLOSED",
    solenoids: [
      { id: "SOL-1", zoneId: "zone-1", status: "CLOSED", flowRateLpm: 0 },
      { id: "SOL-2", zoneId: "zone-2", status: "CLOSED", flowRateLpm: 0 },
    ],
    localGatewayStatus: "ONLINE_MQTT",
    storedLocalTelemetryPackets: 0,
    lastMqttTopic: "farm/zone1/sensors/kalman",
    lastMqttPayload: "{}",
  });

  // Predictive Yield Model State
  const [yieldProjection, setYieldProjection] = useState<YieldProjection>({
    currentProjectedYield: 49.2,
    baselineYield: 45.0,
    waterSavedTotalLiters: 48600,
    electricityUnitsSavedKwh: 312.4,
    npkOptimizedKg: 38.5,
    gddAccumulated: 1140,
    resourceEfficiencyIndex: 91,
  });

  // Historical simulation data for D3.js trend visualization
  const [yieldHistory, setYieldHistory] = useState<YieldHistoryPoint[]>(() => {
    const base = 45.0;
    const initial: YieldHistoryPoint[] = [];
    const now = Date.now();
    for (let i = 24; i >= 0; i--) {
      const progress = (24 - i) / 24;
      // Realistic historical curve reflecting agent optimization from 44.5 to 49.2 Qtl/Acre
      const val = 44.5 + progress * 4.6 + Math.sin(i * 0.65) * 0.22;
      initial.push({
        step: 24 - i,
        timestamp: now - i * 2500,
        projectedYield: Number(val.toFixed(1)),
        baselineYield: base,
        cwsi: Math.max(0.12, Number((0.48 - progress * 0.28).toFixed(2))),
        actionTaken:
          i % 4 === 0
            ? "FERTIGATION_VENTURI_NPK"
            : i % 2 === 0
            ? "PULSE_DRIP_IRRIGATION"
            : "IDLE_MONITOR",
      });
    }
    return initial;
  });

  // Simulation Controls
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1); // 1x, 2x, 5x

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isStressModalOpen, setIsStressModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isAiDiagnosing, setIsAiDiagnosing] = useState<boolean>(false);
  const [aiDiagnosisData, setAiDiagnosisData] = useState<any>(null);
  const [isRefiningYield, setIsRefiningYield] = useState<boolean>(false);
  const [isExplainingAi, setIsExplainingAi] = useState<boolean>(false);

  // Fertilizer Scheduler State
  const [fertilizerSchedules, setFertilizerSchedules] = useState<FertilizerSchedule[]>(
    INITIAL_FERTILIZER_SCHEDULES
  );
  const [fertilizerLogs, setFertilizerLogs] = useState<FertilizerExecutionLog[]>([
    {
      id: "fert-seed-1",
      scheduleId: "sched-npk-1",
      recipeId: "NPK_19_19_19",
      recipeName: "19:19:19 NPK Water Soluble",
      doseKg: 10,
      durationMin: 12,
      timeStr: "08:30 AM",
      timestamp: Date.now() - 7200000,
      soilNBefore: 152,
      soilNAfter: 178,
      soilPBefore: 16,
      soilPAfter: 22,
      soilKBefore: 168,
      soilKAfter: 194,
      triggerReason: "Automated Interval Cadence (14 steps)",
    },
    {
      id: "fert-seed-2",
      scheduleId: "sched-urea-auto",
      recipeId: "UREA_46_0_0",
      recipeName: "Urea 46:0:0 High-N Booster",
      doseKg: 12,
      durationMin: 10,
      timeStr: "06:15 AM",
      timestamp: Date.now() - 14400000,
      soilNBefore: 138,
      soilNAfter: 184,
      soilPBefore: 18,
      soilPAfter: 18,
      soilKBefore: 172,
      soilKAfter: 172,
      triggerReason: "Soil Nitrogen Sensor Deficit Trigger (< 175 kg/ha)",
    },
  ]);
  const [isDosingActive, setIsDosingActive] = useState<boolean>(false);
  const [activeDosingRecipe, setActiveDosingRecipe] = useState<string | undefined>(undefined);

  // Synchronized refs for discrete simulation execution
  const sensorsRef = useRef(sensors);
  sensorsRef.current = sensors;
  const climateRef = useRef(climate);
  climateRef.current = climate;
  const hardwareRef = useRef(hardware);
  hardwareRef.current = hardware;
  const fertilizerSchedulesRef = useRef(fertilizerSchedules);
  fertilizerSchedulesRef.current = fertilizerSchedules;

  // Toast Notifications State & Dispatcher
  const [toasts, setToasts] = useState<AgroToast[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const lastTriggeredReflexTimesRef = useRef<Record<string, number>>({});

  const pushToast = useCallback(
    (
      toastData: Omit<AgroToast, "id" | "timestamp" | "timeStr"> & {
        id?: string;
        cooldownKey?: string;
        cooldownMs?: number;
      }
    ) => {
      const now = Date.now();
      const cooldownKey = toastData.cooldownKey || toastData.title;
      const cooldownMs = toastData.cooldownMs ?? 8000;

      if (
        lastTriggeredReflexTimesRef.current[cooldownKey] &&
        now - lastTriggeredReflexTimesRef.current[cooldownKey] < cooldownMs
      ) {
        return;
      }

      lastTriggeredReflexTimesRef.current[cooldownKey] = now;

      const id = toastData.id || `toast-${now}-${Math.random().toString(36).substring(2, 6)}`;
      const timeStr = new Date().toLocaleTimeString();

      const newToast: AgroToast = {
        id,
        title: toastData.title,
        message: toastData.message,
        severity: toastData.severity,
        subsystem: toastData.subsystem,
        timestamp: now,
        timeStr,
        actionTaken: toastData.actionTaken,
        telemetryMetric: toastData.telemetryMetric,
        ruleId: toastData.ruleId,
        autoDismissMs: toastData.autoDismissMs,
      };

      setToasts((prev) => [newToast, ...prev.filter((t) => t.id !== id)].slice(0, 5));
      playAlertChime(toastData.severity, isMutedRef.current);
    },
    []
  );

  const handleDismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleClearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Discrete Simulation Step Function
  const stepSimulation = useCallback(() => {
    const curSensors = sensorsRef.current;
    const curClimate = climateRef.current;
    const curHw = hardwareRef.current;

    // 1. Natural Soil Dynamics (Drainage & Evaporation & Nutrient Uptake)
    let trueMoisture = curSensors.shallowMoisture;
    let trueDeep = curSensors.deepMoisture;
    let trueN = curSensors.nitrogen;
    let trueP = curSensors.phosphorus ?? 22;
    let trueK = curSensors.potassium ?? 195;
    let trueEc = curSensors.ec ?? 0.85;
    let truePh = curSensors.pH ?? 6.8;

    // Base evapotranspiration loss
    const hourlyEtLoss = (curClimate.et0 / 24) * (curClimate.vpd / 2.0) * 0.15;
    trueMoisture = Math.max(12, trueMoisture - hourlyEtLoss + (curClimate.rainRate > 0 ? curClimate.rainRate * 0.4 : 0));
    trueDeep = Math.max(18, trueDeep - hourlyEtLoss * 0.4);
    // Gradual plant uptake of nutrients
    trueN = Math.max(115, trueN - 0.2);
    trueP = Math.max(10, trueP - 0.04);
    trueK = Math.max(120, trueK - 0.15);

    // Add realistic measurement noise to raw capacitive sensor (simulate electromagnetic interference)
    const noise = (Math.random() - 0.5) * 2.8;
    const rawMeasured = Math.max(8, Math.min(50, trueMoisture + noise));

    // 2. Kalman Filter Update (Noise Suppression)
    const kalmanFiltered = kalmanRef.current.update(rawMeasured, trueMoisture);
    const kState = kalmanRef.current.getState();
    setKalmanState(kState);

    // 3. Compute Crop Water Stress Index (CWSI) and NDVI
    const tc = curClimate.ambientTemp + (kalmanFiltered < 24 ? 2.2 : kalmanFiltered < 30 ? 0.6 : -1.2);
    const canopyDepression = Number((tc - curClimate.ambientTemp).toFixed(1));
    const cwsi = Math.max(0.1, Math.min(0.95, (34 - kalmanFiltered) / 20 + (curClimate.vpd > 2.5 ? 0.15 : 0)));
    const ndvi = Math.max(0.35, Math.min(0.88, 0.4 + (kalmanFiltered / 100) * 0.6 + (trueN / 300) * 0.4));

    // 4. Update CCTV Vision State (Multi-Class Vision Model: Stress + Indian Agricultural Pests)
    const isWilted = cwsi > 0.5;
    const isChlorotic = trueN < 170;
    const boxes: any[] = [];
    const detectedPests: PestClassificationDetail[] = [];

    // Check for simulated pest outbreaks
    if (activePestScenario === "BOLLWORM") {
      detectedPests.push({
        pestType: "BOLLWORM",
        commonName: "Pink Bollworm (गुलाबी बोंडअळी)",
        scientificName: "Pectinophora gossypiella",
        affectedCrops: "Bt Cotton / Tomato",
        severity: "CRITICAL",
        densityPerSqMeter: 8,
        economicThresholdCrossed: true,
        recommendedOrganicAction: "Pheromone traps @ 5/acre + Neem oil 10,000 ppm (2ml/L)",
        recommendedChemicalAction: "Emamectin benzoate 5% SG @ 4g/10L or Chlorantraniliprole 18.5% SC @ 3ml/10L",
      });

      boxes.push({
        id: "pest-bw-1",
        label: "Bollworm Larva (ETL Breach)",
        confidence: 0.94,
        x: 0.42,
        y: 0.35,
        w: 0.22,
        h: 0.26,
        type: "pest_bollworm",
        severity: "CRITICAL",
        count: 5,
      });

      boxes.push({
        id: "pest-bw-2",
        label: "Boll Square Entry Hole",
        confidence: 0.89,
        x: 0.26,
        y: 0.58,
        w: 0.18,
        h: 0.22,
        type: "pest_bollworm",
        severity: "HIGH",
        count: 3,
      });
    } else if (activePestScenario === "APHIDS") {
      detectedPests.push({
        pestType: "APHIDS",
        commonName: "Cotton Aphids / Jassids (माहू / मावा)",
        scientificName: "Aphis gossypii",
        affectedCrops: "Bt Cotton / Wheat / Vegetables",
        severity: "HIGH",
        densityPerSqMeter: 24,
        economicThresholdCrossed: true,
        recommendedOrganicAction: "Yellow sticky traps @ 10/acre + Verticillium lecanii @ 5g/L",
        recommendedChemicalAction: "Thiamethoxam 25% WG @ 2g/10L or Imidacloprid 17.8% SL @ 3ml/10L",
      });

      boxes.push({
        id: "pest-aph-1",
        label: "Aphid Colony Cluster",
        confidence: 0.96,
        x: 0.55,
        y: 0.38,
        w: 0.25,
        h: 0.28,
        type: "pest_aphids",
        severity: "HIGH",
        count: 18,
      });

      boxes.push({
        id: "pest-aph-2",
        label: "Abaxial Leaf Curling",
        confidence: 0.91,
        x: 0.18,
        y: 0.48,
        w: 0.20,
        h: 0.24,
        type: "pest_aphids",
        severity: "MODERATE",
        count: 6,
      });
    }

    if (isWilted) {
      boxes.push({
        id: "b-wilt",
        label: "Stomatal Wilting",
        confidence: Number((0.85 + cwsi * 0.1).toFixed(2)),
        x: 0.22,
        y: 0.42,
        w: 0.28,
        h: 0.35,
        type: "stress",
      });
    }
    if (isChlorotic) {
      boxes.push({
        id: "b-n",
        label: "N-Chlorosis",
        confidence: Number((0.8 + (180 - trueN) * 0.001).toFixed(2)),
        x: 0.62,
        y: 0.51,
        w: 0.24,
        h: 0.32,
        type: "chlorosis",
      });
    }
    if (!isWilted && !isChlorotic && boxes.length === 0) {
      boxes.push({
        id: "b-opt",
        label: "Optimal Canopy",
        confidence: 0.96,
        x: 0.35,
        y: 0.45,
        w: 0.3,
        h: 0.35,
        type: "optimal",
      });
    }

    const hasPests = detectedPests.length > 0;
    const primaryPest = hasPests ? detectedPests[0].pestType : "NONE";

    let anomalyDesc = "Lush uniform vegetative canopy.";
    if (hasPests && primaryPest === "BOLLWORM") {
      anomalyDesc = "PEST ALERT: Pink Bollworm (गुलाबी बोंडअळी) detected. ETL exceeded (>5% square damage).";
    } else if (hasPests && primaryPest === "APHIDS") {
      anomalyDesc = "PEST ALERT: Severe Aphid & Jassid colonies (मावा कीड) clustering under lower foliage.";
    } else if (isWilted && isChlorotic) {
      anomalyDesc = "Compound Stress: Severe water deficit with basal leaf nitrogen chlorosis.";
    } else if (isWilted) {
      anomalyDesc = "Canopy water deficit & elevated leaf temperature detected.";
    } else if (isChlorotic) {
      anomalyDesc = "Nitrogen chlorosis thinning detected on lower leaves.";
    }

    setCctvData((prev) => ({
      ...prev,
      ndviScore: Number(ndvi.toFixed(2)),
      cwsi: Number(cwsi.toFixed(2)),
      canopyTemp: Number(tc.toFixed(1)),
      canopyDepression,
      anomalyDetected: isWilted || isChlorotic || hasPests,
      anomalyDescription: anomalyDesc,
      pestInfestationDetected: hasPests,
      primaryPestClass: primaryPest,
      pestDetails: detectedPests,
      boundingBoxes: boxes,
    }));

    // 5. Model-Based Reflex Layer Arbitration
    const reflexCheck = rlEngineRef.current.evaluateReflexRules(
      kalmanFiltered,
      curHw.feederPhaseStatus,
      curHw.lineVoltage,
      curClimate.rainRate,
      tc,
      curClimate.ambientTemp
    );

    let selectedAction: AgentAction = "IDLE_MONITOR";
    let exploreFlag = false;

    // Discretize current MDP state
    const stateKey = discretizeState(kalmanFiltered, trueN, curClimate.vpd);
    setCurrentStateKey(stateKey);

    if (reflexCheck.override && reflexCheck.action) {
      selectedAction = reflexCheck.action;
      if (reflexCheck.rule) {
        const newRule = reflexCheck.rule;
        setReflexLogs((prevLogs) => [
          newRule,
          ...prevLogs.filter((item) => item.id !== newRule.id),
        ].slice(0, 20));

        // Trigger visual alerts when reflex layer detects critical anomalies
        if (newRule.type === "SAFETY_TRIP" || newRule.id.includes("PWR")) {
          pushToast({
            title: "Reflex Safety Cutout: Motor Voltage Sag",
            message: `Emergency DOL motor cutoff engaged. Feeder voltage dropped to ${curHw.lineVoltage}V (< 340V safe limit) or single-phasing detected.`,
            severity: "critical",
            subsystem: "MODEL-BASED REFLEX LAYER",
            telemetryMetric: `${curHw.lineVoltage}V`,
            actionTaken: "Emergency motor cutout (RL override)",
            ruleId: newRule.id,
            cooldownKey: "reflex-safety-trip",
            cooldownMs: 8000,
          });
        } else if (newRule.id.includes("RULE-CRIT-DRY")) {
          pushToast({
            title: "Reflex Critical Anomaly: Root Moisture Collapse",
            message: `Root zone moisture collapsed to ${kalmanFiltered.toFixed(1)}% VWC (below permanent wilting point < 14%). Overriding policy with deep drip soak.`,
            severity: "critical",
            subsystem: "REFLEX AGENT • ROOT ZONE",
            telemetryMetric: `${kalmanFiltered.toFixed(1)}% VWC`,
            actionTaken: "Emergency DEEP_DRIP_SOAK override",
            ruleId: newRule.id,
            cooldownKey: "reflex-crit-dry",
            cooldownMs: 10000,
          });
        } else if (newRule.id.includes("RULE-THERMAL")) {
          pushToast({
            title: "Reflex Anomaly: Extreme Canopy Heat Shock",
            message: `Canopy temperature spiked to ${tc.toFixed(1)}°C with leaf-ambient delta > 3.0°C. Overriding with micro-mist canopy evaporative cooling.`,
            severity: "warning",
            subsystem: "REFLEX AGENT • MICROMETEOROLOGY",
            telemetryMetric: `${tc.toFixed(1)}°C Canopy`,
            actionTaken: "Emergency CANOPY_MICRO_MIST override",
            ruleId: newRule.id,
            cooldownKey: "reflex-thermal",
            cooldownMs: 10000,
          });
        } else if (newRule.id.includes("RULE-RAIN")) {
          pushToast({
            title: "Reflex Optimization: Monsoon Lockout",
            message: `Torrential rainfall detected (${curClimate.rainRate} mm/hr). All irrigation valves locked out to conserve pumping power and prevent root waterlogging.`,
            severity: "info",
            subsystem: "REFLEX AGENT • WEATHER LOCKOUT",
            telemetryMetric: `${curClimate.rainRate} mm/hr`,
            actionTaken: "Inhibit all irrigation valves (IDLE_MONITOR)",
            ruleId: newRule.id,
            cooldownKey: "reflex-rain",
            cooldownMs: 12000,
          });
        }
      }
    } else {
      // Exploit / Explore via Q-Learning Policy
      const choice = rlEngineRef.current.selectAction(stateKey, true);
      selectedAction = choice.action;
      exploreFlag = choice.isExploration;
    }

    setLastAction(selectedAction);
    setIsExploration(exploreFlag);

    // 6. Actuation & State Transition Effect
    const isVoltageFault =
      curHw.feederPhaseStatus === "SINGLE_PHASING_FAULT" || curHw.lineVoltage < 330;

    let newShallowMoisture = trueMoisture;
    let newDeepMoisture = trueDeep;
    let newNitrogen = trueN;
    let newPhosphorus = trueP;
    let newPotassium = trueK;
    let newEc = trueEc;
    let newPh = truePh;
    let pumpActive = false;
    let venturiActive = "CLOSED" as any;

    // Automated Fertilizer Scheduler Integration
    let scheduledDoseResult: {
      schedule: FertilizerSchedule;
      boost: ReturnType<typeof calculateNutrientBoost>;
      prevN: number;
    } | null = null;

    if (!isVoltageFault) {
      const currentSchedules = fertilizerSchedulesRef.current;
      let triggeredSchedule: FertilizerSchedule | null = null;

      const nextSchedules = currentSchedules.map((sched) => {
        if (sched.zoneId !== activeZoneId || sched.status !== "ACTIVE") {
          return sched;
        }

        let isDue = false;
        let nextSteps = sched.stepsUntilNext;

        if (sched.triggerMode === "INTERVAL_STEPS") {
          nextSteps = Math.max(0, sched.stepsUntilNext - 1);
          if (nextSteps === 0) {
            isDue = true;
            nextSteps = sched.intervalSteps;
          }
        } else if (sched.triggerMode === "THRESHOLD_DEFICIT") {
          const val =
            sched.targetNutrient === "N"
              ? newNitrogen
              : sched.targetNutrient === "P"
              ? newPhosphorus
              : sched.targetNutrient === "K"
              ? newPotassium
              : Math.min(newNitrogen / 200, newPhosphorus / 20, newPotassium / 180) * 190;
          if (val <= sched.thresholdValue) {
            isDue = true;
          }
        }

        if (isDue && !triggeredSchedule) {
          triggeredSchedule = sched;
          return {
            ...sched,
            stepsUntilNext: nextSteps,
            totalDosedCount: sched.totalDosedCount + 1,
            status: "ACTIVE" as const,
          };
        }

        return {
          ...sched,
          stepsUntilNext: nextSteps,
        };
      });

      setFertilizerSchedules(nextSchedules);

      if (triggeredSchedule) {
        const sched = triggeredSchedule as FertilizerSchedule;
        const boost = calculateNutrientBoost(sched.recipeId, sched.doseKgPerHa);
        const prevN = newNitrogen;

        newNitrogen = Math.min(260, Math.round(newNitrogen + boost.deltaN));
        newPhosphorus = Math.min(35, Math.round(newPhosphorus + boost.deltaP));
        newPotassium = Math.min(250, Math.round(newPotassium + boost.deltaK));
        newEc = Number(Math.min(1.4, newEc + boost.deltaEc).toFixed(2));
        pumpActive = true;
        venturiActive = `INJECTING_${sched.recipeId}`;

        scheduledDoseResult = {
          schedule: sched,
          boost,
          prevN,
        };
      }
    }

    // Voltage Fault Trip Detection
    if (isVoltageFault) {
      pumpActive = false;
      // Trigger pump trip toast alert when pump was running or when entering tripped condition
      if (curHw.pumpStatus !== "TRIPPED_VOLTAGE") {
        pushToast({
          title: "Irrigation Pump Tripped: Voltage Sag Fault",
          message: `Kirloskar 5HP Submersible pump auto-tripped by Auto-Switch DOL starter. Line voltage sagged to ${curHw.lineVoltage}V (safe threshold > 340V). Phase imbalance detected.`,
          severity: "critical",
          subsystem: "PUMP MOTOR PROTECTION",
          telemetryMetric: `${curHw.lineVoltage}V (Sag)`,
          actionTaken: "Emergency DOL Motor Cutout",
          cooldownKey: "pump-voltage-trip",
          cooldownMs: 6000,
        });
      }
    } else {
      if (selectedAction === "PULSE_DRIP_IRRIGATION") {
        newShallowMoisture = Math.min(38, newShallowMoisture + 3.8);
        pumpActive = true;
      } else if (selectedAction === "DEEP_DRIP_SOAK") {
        newShallowMoisture = Math.min(42, newShallowMoisture + 7.5);
        newDeepMoisture = Math.min(40, newDeepMoisture + 5.0);
        pumpActive = true;
      } else if (selectedAction === "FERTIGATION_VENTURI_NPK") {
        newShallowMoisture = Math.min(38, newShallowMoisture + 2.5);
        newNitrogen = Math.min(240, newNitrogen + 24);
        newPhosphorus = Math.min(32, newPhosphorus + 4);
        newPotassium = Math.min(230, newPotassium + 14);
        pumpActive = true;
        if (venturiActive === "CLOSED") {
          venturiActive = "INJECTING_19_19_19";
        }
      } else if (selectedAction === "CANOPY_MICRO_MIST") {
        pumpActive = true;
      }
    }

    // Process automated schedule execution effects (Logs, MQTT packet, and Toasts)
    if (scheduledDoseResult) {
      const { schedule: sched, boost, prevN } = scheduledDoseResult;
      setIsDosingActive(true);
      setActiveDosingRecipe(sched.recipeName);

      const logEntry: FertilizerExecutionLog = {
        id: `fert-exec-${Date.now()}`,
        scheduleId: sched.id,
        recipeId: sched.recipeId,
        recipeName: sched.recipeName,
        doseKg: sched.doseKgPerHa,
        durationMin: sched.injectionDurationMin,
        timeStr: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        timestamp: Date.now(),
        soilNBefore: prevN,
        soilNAfter: newNitrogen,
        soilPBefore: newPhosphorus - boost.deltaP,
        soilPAfter: newPhosphorus,
        soilKBefore: newPotassium - boost.deltaK,
        soilKAfter: newPotassium,
        triggerReason:
          sched.triggerMode === "INTERVAL_STEPS"
            ? `Cadence Interval (${sched.intervalSteps} steps)`
            : `Deficit Sensor Trigger (${sched.targetNutrient} < ${sched.thresholdValue})`,
      };
      setFertilizerLogs((prev) => [logEntry, ...prev.slice(0, 29)]);

      mqttGatewayRef.current.publish(
        `farm/${activeZoneId}/fertigation/venturi_dose`,
        {
          timestamp: Date.now(),
          zone: activeZoneId,
          recipe: sched.recipeName,
          doseKgPerHa: sched.doseKgPerHa,
          soilN: newNitrogen,
          soilP: newPhosphorus,
          soilK: newPotassium,
          ec: newEc,
          method: "JAIN_VENTURI_CHEM_INJECTOR",
        },
        1
      );

      pushToast({
        title: "Automated NPK Fertigation Dosing Executed",
        message: `Venturi chemical-injector completed a pulse of ${sched.doseKgPerHa} kg/ha ${sched.recipeName} for ${activeZone.crop}. Soil Nitrogen restored from ${prevN} to ${newNitrogen} kg/ha.`,
        severity: "info",
        subsystem: "FERTIGATION VENTURI DOSER",
        telemetryMetric: `+${boost.deltaN} N (Now ${newNitrogen})`,
        actionTaken: `Automated ${sched.recipeName} Injection`,
        cooldownKey: `fert-dose-${sched.id}`,
        cooldownMs: 8000,
      });

      setTimeout(() => {
        setIsDosingActive(false);
        setActiveDosingRecipe(undefined);
      }, 1800);
    }

    // Edge vision anomaly toast if severe stress is detected
    if (boxes.length > 0 && cwsi > 0.65) {
      pushToast({
        title: "Vision Anomaly: Crop Stress Detected",
        message: `Edge camera detected foliage stress signatures (CWSI: ${cwsi.toFixed(2)}). Stomatal closure identified on vegetative canopy.`,
        severity: "warning",
        subsystem: "CCTV VISION EDGE AGENT",
        telemetryMetric: `CWSI ${cwsi.toFixed(2)}`,
        actionTaken: "Escalating root zone irrigation",
        cooldownKey: "cctv-foliage-stress",
        cooldownMs: 15000,
      });
    }

    // Vision Pest Infestation Alerting Toast
    if (hasPests && detectedPests.length > 0) {
      const topPest = detectedPests[0];
      pushToast({
        title: `Vision Alert: ${topPest.commonName}`,
        message: `YOLOv8 vision classifier identified active ${topPest.commonName} infestation (${topPest.densityPerSqMeter}/m²). Economic threshold (ETL) breached. Recommended: ${topPest.recommendedOrganicAction}.`,
        severity: topPest.severity === "CRITICAL" ? "critical" : "warning",
        subsystem: "MULTI-CLASS PEST VISION CLASSIFIER",
        telemetryMetric: `${topPest.pestType} (${topPest.densityPerSqMeter}/m²)`,
        actionTaken: `Flagged for IPM / ${topPest.recommendedChemicalAction.split(" ")[0]} treatment`,
        cooldownKey: `cctv-pest-${topPest.pestType}`,
        cooldownMs: 12000,
      });
    }

    // 7. Compute MDP Reward & Update Q-Table
    const reward = rlEngineRef.current.computeReward(
      kalmanFiltered,
      newShallowMoisture,
      newNitrogen,
      curClimate.vpd,
      selectedAction,
      cwsi
    );
    setLastReward(reward);

    const nextStateKey = discretizeState(newShallowMoisture, newNitrogen, curClimate.vpd);
    const updateRes = rlEngineRef.current.updateQ(stateKey, selectedAction, reward, nextStateKey);
    setLastTdError(updateRes.tdError);

    // 8. Publish Local Edge MQTT Telemetry
    const packet = mqttGatewayRef.current.publish(
      `farm/${activeZoneId}/telemetry/kalman`,
      {
        timestamp: Date.now(),
        zone: activeZoneId,
        shallowMoisture: Number(kalmanFiltered.toFixed(2)),
        nitrogen: Math.round(newNitrogen),
        cwsi: Number(cwsi.toFixed(2)),
        action: selectedAction,
        reward,
        pumpStatus: pumpActive ? "ON" : isVoltageFault ? "TRIPPED" : "OFF",
      },
      1
    );

    setMqttPackets(mqttGatewayRef.current.getStatus().recentPackets);
    setMqttTrafficBuckets(mqttGatewayRef.current.getHourlyTraffic());
    setMqttGatewayMetrics(mqttGatewayRef.current.getGatewayMetrics());

    const nextPumpStatus = isVoltageFault
      ? "TRIPPED_VOLTAGE"
      : pumpActive
      ? "RUNNING"
      : "OFF";
    const nextMotorCurrent = isVoltageFault ? 0.0 : pumpActive ? 7.8 : 0.0;
    const nextManifoldPressure = isVoltageFault ? 0.2 : pumpActive ? 1.6 : 0.2;

    setHardware((prevHw) => ({
      ...prevHw,
      pumpStatus: nextPumpStatus,
      motorCurrentAmps: nextMotorCurrent,
      manifoldPressureBar: nextManifoldPressure,
      venturiStatus: venturiActive,
      storedLocalTelemetryPackets: mqttGatewayRef.current.getStatus().bufferedCount,
      lastMqttTopic: packet.topic,
      lastMqttPayload: JSON.stringify(packet.payload),
    }));

    // 9. Update Predictive Yield & Historical Simulation Timeline
    let updatedProjYield = 49.2;
    setYieldProjection((prevYield) => {
      const stressPenalty = cwsi > 0.6 ? 0.08 : -0.05;
      const newProj = Math.min(58, Math.max(32, prevYield.currentProjectedYield - stressPenalty));
      updatedProjYield = Number(newProj.toFixed(1));
      return {
        ...prevYield,
        currentProjectedYield: updatedProjYield,
        waterSavedTotalLiters: prevYield.waterSavedTotalLiters + (pumpActive ? 40 : 120),
        electricityUnitsSavedKwh: Number((prevYield.electricityUnitsSavedKwh + 0.35).toFixed(1)),
        gddAccumulated: Number((prevYield.gddAccumulated + 0.5).toFixed(1)),
      };
    });

    setYieldHistory((prevHistory) => {
      const lastStep = prevHistory.length > 0 ? prevHistory[prevHistory.length - 1].step : 0;
      const newPt: YieldHistoryPoint = {
        step: lastStep + 1,
        timestamp: Date.now(),
        projectedYield: updatedProjYield,
        baselineYield: 45.0,
        cwsi: Number(cwsi.toFixed(2)),
        actionTaken: selectedAction,
      };
      // Maintain rolling history of latest 40 simulation steps
      return [...prevHistory.slice(-39), newPt];
    });

    // 10. Update Sensor State
    setSensors((prevSensors) => ({
      ...prevSensors,
      shallowMoisture: Number(newShallowMoisture.toFixed(1)),
      deepMoisture: Number(newDeepMoisture.toFixed(1)),
      nitrogen: Math.round(newNitrogen),
      phosphorus: Math.round(newPhosphorus),
      potassium: Math.round(newPotassium),
      ec: newEc,
      pH: newPh,
    }));
  }, [activeZoneId, pushToast]);

  // Main Simulation Interval Loop
  useEffect(() => {
    if (!isRunning) return;
    const intervalMs = Math.max(400, Math.floor(1800 / speed));
    const interval = setInterval(stepSimulation, intervalMs);
    return () => clearInterval(interval);
  }, [isRunning, speed, stepSimulation]);

  // Zone Switch Handler
  const handleSelectZone = (zoneId: string) => {
    setActiveZoneId(zoneId);
    const target = zones.find((z) => z.id === zoneId);
    if (!target) return;

    // Reset moisture/nitrogen to zone baseline
    let baseM = 28;
    let baseN = 210;
    if (target.stressStatus === "WATER_DEFICIT") {
      baseM = 18.2;
    } else if (target.stressStatus === "NITROGEN_DEFICIENCY") {
      baseN = 145;
    }

    setSensors((prev) => ({
      ...prev,
      shallowMoisture: baseM,
      nitrogen: baseN,
    }));
    kalmanRef.current.reset(baseM);
    setKalmanState(kalmanRef.current.getState());
  };

  // Toggle Gateway Offline mode
  const handleToggleGateway = () => {
    const online = mqttGatewayRef.current.toggleGatewayNetwork();
    setIsGatewayOnline(online);
    setHardware((prev) => ({
      ...prev,
      localGatewayStatus: online ? "ONLINE_MQTT" : "OFFLINE_LOCAL_STORE_FORWARD",
      storedLocalTelemetryPackets: mqttGatewayRef.current.getStatus().bufferedCount,
    }));
    setMqttPackets(mqttGatewayRef.current.getStatus().recentPackets);
    setMqttTrafficBuckets(mqttGatewayRef.current.getHourlyTraffic());
    setMqttGatewayMetrics(mqttGatewayRef.current.getGatewayMetrics());
  };

  // Manual Pump Override
  const handleTriggerManualPump = (action: "START" | "STOP") => {
    if (action === "START") {
      if (
        hardware.feederPhaseStatus !== "3-PHASE_HEALTHY" ||
        hardware.lineVoltage < 340 ||
        hardware.pumpStatus === "TRIPPED_VOLTAGE"
      ) {
        pushToast({
          title: "Manual Pump Start Aborted: Voltage Fault",
          message: `Cannot engage Kirloskar 5HP motor under single-phasing or voltage sag conditions (${hardware.lineVoltage}V). Feeder relay is in trip lockout state.`,
          severity: "critical",
          subsystem: "STARTER INTERLOCK",
          telemetryMetric: `${hardware.lineVoltage}V (Fault)`,
          actionTaken: "DOL Starter Lockout Enforced",
          cooldownKey: "pump-start-abort",
          cooldownMs: 3000,
        });
        return;
      }
      setHardware((prev) => ({
        ...prev,
        pumpStatus: "RUNNING",
        motorCurrentAmps: 7.9,
        manifoldPressureBar: 1.8,
      }));
      setSensors((prev) => ({ ...prev, shallowMoisture: prev.shallowMoisture + 3.0 }));

      mqttGatewayRef.current.publish(
        `farm/${activeZoneId}/pump/command`,
        {
          command: "START_MOTOR",
          pumpMake: hardware.pumpMake,
          targetCurrentAmps: 7.9,
          timestamp: Date.now(),
        },
        1,
        false,
        "COMMAND"
      );
      setMqttPackets(mqttGatewayRef.current.getStatus().recentPackets);
      setMqttTrafficBuckets(mqttGatewayRef.current.getHourlyTraffic());
      setMqttGatewayMetrics(mqttGatewayRef.current.getGatewayMetrics());

      pushToast({
        title: "Manual Override: Pump Started",
        message: "Kirloskar 5HP pump manually engaged. Drawing 7.9A at 415V. Manifold pressure 1.8 bar.",
        severity: "info",
        subsystem: "MANUAL OVERRIDE",
        telemetryMetric: "7.9A / 1.8 bar",
        actionTaken: "Manual start override",
        cooldownKey: "manual-pump-start",
        cooldownMs: 3000,
      });
    } else {
      setHardware((prev) => ({
        ...prev,
        pumpStatus: "OFF",
        motorCurrentAmps: 0.0,
        manifoldPressureBar: 0.2,
      }));

      mqttGatewayRef.current.publish(
        `farm/${activeZoneId}/pump/command`,
        {
          command: "STOP_MOTOR",
          pumpMake: hardware.pumpMake,
          reason: "OPERATOR_STOP",
          timestamp: Date.now(),
        },
        1,
        false,
        "COMMAND"
      );
      setMqttPackets(mqttGatewayRef.current.getStatus().recentPackets);
      setMqttTrafficBuckets(mqttGatewayRef.current.getHourlyTraffic());
      setMqttGatewayMetrics(mqttGatewayRef.current.getGatewayMetrics());

      pushToast({
        title: "Manual Override: Pump Stopped",
        message: "Irrigation pump manually shut down. Returned to autonomous agent standby.",
        severity: "info",
        subsystem: "MANUAL OVERRIDE",
        telemetryMetric: "0.0A Standby",
        actionTaken: "Manual stop",
        cooldownKey: "manual-pump-stop",
        cooldownMs: 3000,
      });
    }
  };

  // Reset DOL Voltage Relay after a trip fault
  const handleResetVoltageFault = () => {
    setHardware((prev) => ({
      ...prev,
      lineVoltage: 415,
      feederPhaseStatus: "3-PHASE_HEALTHY",
      pumpStatus: "OFF",
      motorCurrentAmps: 0.0,
      manifoldPressureBar: 0.2,
    }));

    mqttGatewayRef.current.publish(
      `farm/${activeZoneId}/relay/reset`,
      {
        event: "RELAY_TRIP_CLEARED",
        lineVoltage: 415,
        feederStatus: "3-PHASE_HEALTHY",
        timestamp: Date.now(),
      },
      1,
      false,
      "COMMAND"
    );
    setMqttPackets(mqttGatewayRef.current.getStatus().recentPackets);
    setMqttTrafficBuckets(mqttGatewayRef.current.getHourlyTraffic());
    setMqttGatewayMetrics(mqttGatewayRef.current.getGatewayMetrics());

    pushToast({
      title: "DOL Voltage Relay Reset",
      message: "Grid line voltage restored to balanced 415V. Feeder phase status healthy. Pump trip condition cleared.",
      severity: "success",
      subsystem: "PUMP MOTOR PROTECTION",
      telemetryMetric: "415V Restored",
      actionTaken: "Relay trip cleared",
      cooldownKey: "voltage-reset",
      cooldownMs: 2000,
    });
  };

  // Quick test simulation for pump voltage sag trip
  const handleSimulateVoltageTrip = () => {
    handleApplyScenario("RURAL_SINGLE_PHASING");
    mqttGatewayRef.current.publish(
      `farm/${activeZoneId}/alert/voltage-sag`,
      {
        faultType: "SINGLE_PHASING_VOLTAGE_SAG",
        measuredVoltage: 312,
        action: "DOL_STARTER_TRIP_LOCKOUT",
        timestamp: Date.now(),
      },
      1,
      false,
      "ALARM_FAULT"
    );
    setMqttPackets(mqttGatewayRef.current.getStatus().recentPackets);
    setMqttTrafficBuckets(mqttGatewayRef.current.getHourlyTraffic());
    setMqttGatewayMetrics(mqttGatewayRef.current.getGatewayMetrics());
  };

  // Fertilizer Scheduler Handlers
  const handleAddFertilizerSchedule = useCallback(
    (scheduleData: Omit<FertilizerSchedule, "id" | "createdTimestamp" | "totalDosedCount">) => {
      const newSchedule: FertilizerSchedule = {
        ...scheduleData,
        id: `sched-${Date.now()}`,
        createdTimestamp: Date.now(),
        totalDosedCount: 0,
      };
      setFertilizerSchedules((prev) => [newSchedule, ...prev]);
      pushToast({
        title: "Automated Fertilizer Schedule Created",
        message: `Configured ${newSchedule.doseKgPerHa} kg/ha of ${newSchedule.recipeName} (${
          newSchedule.triggerMode === "INTERVAL_STEPS"
            ? `Every ${newSchedule.intervalSteps} steps`
            : `Deficit Trigger (${newSchedule.targetNutrient} < ${newSchedule.thresholdValue})`
        }).`,
        severity: "info",
        subsystem: "FERTIGATION SCHEDULER",
        telemetryMetric: `${newSchedule.doseKgPerHa} kg/ha`,
        actionTaken: "Schedule Activated",
      });
    },
    [pushToast]
  );

  const handleToggleFertilizerSchedule = useCallback((scheduleId: string) => {
    setFertilizerSchedules((prev) =>
      prev.map((s) => {
        if (s.id === scheduleId) {
          const nextStatus = s.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  }, []);

  const handleDeleteFertilizerSchedule = useCallback((scheduleId: string) => {
    setFertilizerSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
  }, []);

  const handleTriggerImmediateDose = useCallback(
    (recipeId: FertilizerRecipeId, doseKg: number, durationMin: number) => {
      const curHw = hardwareRef.current;
      const isVoltageFault =
        curHw.feederPhaseStatus === "SINGLE_PHASING_FAULT" ||
        curHw.lineVoltage < 340 ||
        curHw.pumpStatus === "TRIPPED_VOLTAGE";

      const recipe = FERTILIZER_RECIPES[recipeId];

      if (isVoltageFault) {
        pushToast({
          title: "Fertigation Inhibit: Voltage Sag Fault",
          message: `Cannot inject ${recipe.name}. DOL Motor starter is interlocked due to line voltage (${curHw.lineVoltage}V < 340V).`,
          severity: "critical",
          subsystem: "DOL MOTOR INTERLOCK",
          telemetryMetric: `${curHw.lineVoltage}V Fault`,
          actionTaken: "Venturi Injection Inhibited",
          cooldownKey: "interlock-fert-blocked",
          cooldownMs: 4000,
        });
        return;
      }

      const boost = calculateNutrientBoost(recipeId, doseKg);
      const curSensors = sensorsRef.current;

      const prevN = curSensors.nitrogen;
      const prevP = curSensors.phosphorus ?? 22;
      const prevK = curSensors.potassium ?? 195;

      const newN = Math.min(260, Math.round(prevN + boost.deltaN));
      const newP = Math.min(35, Math.round(prevP + boost.deltaP));
      const newK = Math.min(250, Math.round(prevK + boost.deltaK));
      const newEc = Number(Math.min(1.4, (curSensors.ec ?? 0.85) + boost.deltaEc).toFixed(2));

      setSensors((prev) => ({
        ...prev,
        nitrogen: newN,
        phosphorus: newP,
        potassium: newK,
        ec: newEc,
      }));

      setHardware((prev) => ({
        ...prev,
        pumpStatus: "RUNNING",
        motorCurrentAmps: 8.2,
        manifoldPressureBar: 1.8,
        venturiStatus: `INJECTING_${recipeId}` as any,
      }));

      setIsDosingActive(true);
      setActiveDosingRecipe(recipe.name);

      const logEntry: FertilizerExecutionLog = {
        id: `fert-manual-${Date.now()}`,
        scheduleId: "manual-trigger",
        recipeId,
        recipeName: recipe.name,
        doseKg,
        durationMin,
        timeStr: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        timestamp: Date.now(),
        soilNBefore: prevN,
        soilNAfter: newN,
        soilPBefore: prevP,
        soilPAfter: newP,
        soilKBefore: prevK,
        soilKAfter: newK,
        triggerReason: "Manual Venturi Pulse Triggered by Operator",
      };
      setFertilizerLogs((prev) => [logEntry, ...prev.slice(0, 29)]);

      mqttGatewayRef.current.publish(
        `farm/${activeZoneId}/fertigation/venturi_dose`,
        {
          timestamp: Date.now(),
          zone: activeZoneId,
          recipe: recipe.name,
          doseKgPerHa: doseKg,
          soilN: newN,
          soilP: newP,
          soilK: newK,
          method: "MANUAL_OPERATOR_VENTURI",
        },
        1
      );

      pushToast({
        title: "Manual Venturi Fertigation Pulse Executed",
        message: `Injected ${doseKg} kg/ha of ${recipe.name}. Soil Nitrogen boosted by +${boost.deltaN} kg/ha (Now ${newN} kg/ha).`,
        severity: "info",
        subsystem: "VENTURI CHEMICAL INJECTOR",
        telemetryMetric: `+${boost.deltaN} N (Now ${newN})`,
        actionTaken: "Manual Venturi Pulse",
      });

      setTimeout(() => {
        setIsDosingActive(false);
        setActiveDosingRecipe(undefined);
      }, 2000);
    },
    [activeZoneId, pushToast]
  );

  // Inspect Toast Telemetry navigation helper
  const handleInspectToast = (toast: AgroToast) => {
    const title = toast.title.toLowerCase();
    const subsystem = toast.subsystem.toLowerCase();

    if (
      title.includes("pump") ||
      title.includes("voltage") ||
      subsystem.includes("pump") ||
      subsystem.includes("starter")
    ) {
      document.getElementById("hardware-panel")?.scrollIntoView({ behavior: "smooth" });
    } else if (
      title.includes("reflex") ||
      subsystem.includes("reflex") ||
      title.includes("policy")
    ) {
      document.getElementById("rl-reflex-panel")?.scrollIntoView({ behavior: "smooth" });
    } else if (
      title.includes("moisture") ||
      title.includes("wilting") ||
      title.includes("nitrogen")
    ) {
      document.getElementById("sensors-panel")?.scrollIntoView({ behavior: "smooth" });
    } else if (
      title.includes("cctv") ||
      title.includes("vision") ||
      title.includes("canopy") ||
      title.includes("heat") ||
      title.includes("pest") ||
      title.includes("bollworm") ||
      title.includes("aphid")
    ) {
      document.getElementById("cctv-panel")?.scrollIntoView({ behavior: "smooth" });
    } else {
      document.getElementById("yield-panel")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Export 24-Hour Telemetry & RL Action Dataset
  const handleExportData = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  const handleSuccessExport = useCallback(
    (filename: string, recordCount: number) => {
      pushToast({
        title: "24-Hour Telemetry Dataset Exported",
        message: `${recordCount} observation rows exported to ${filename} (${activeZone.name}). Includes 24h calibrated 5-sensor telemetry, agrometeorology, and RL agent actions.`,
        severity: "success",
        subsystem: "TELEMETRY EXPORT ENGINE",
        telemetryMetric: "24h CSV Download",
        actionTaken: `Saved ${filename}`,
        cooldownKey: "export-telemetry-dataset",
        cooldownMs: 2000,
      });
    },
    [activeZone.name, pushToast]
  );

  // Apply Irrigation Directive based on 7-Day Weather Forecast
  const handleApplyIrrigationRule = useCallback(
    (action: IrrigationForecastAction, rationale: string) => {
      if (action === "HOLD_FOR_RAIN" || action === "DEFICIT_AERATION") {
        setHardware((prev) => ({
          ...prev,
          pumpRunning: false,
          solenoidValveOpen: false,
        }));
        pushToast({
          title: "Weather Context: Irrigation Held (Rain/Aeration)",
          message: `${rationale} (Autonomous irrigation hold activated to prevent soil saturation and save energy).`,
          severity: "info",
          subsystem: "Irrigation Controller",
          telemetryMetric: "Rain Lockout",
          actionTaken: "PUMP_HOLD_FOR_RAIN",
          cooldownKey: "weather-irrigation-rule",
          cooldownMs: 2500,
        });
      } else if (action === "BOOST_PULSE") {
        setHardware((prev) => ({
          ...prev,
          pumpRunning: true,
          solenoidValveOpen: true,
          flowRateLpm: 46,
        }));
        pushToast({
          title: "Weather Context: Pulse Drip Boosted",
          message: `${rationale} (Scheduled multi-stage cooling pulses for high VPD demand).`,
          severity: "warning",
          subsystem: "Irrigation Controller",
          telemetryMetric: "VPD Compensation",
          actionTaken: "PULSE_BOOST",
          cooldownKey: "weather-irrigation-rule",
          cooldownMs: 2500,
        });
      } else {
        pushToast({
          title: "Weather Context: Optimal Baseline Applied",
          message: `${rationale} (Standard automated pulse drip scheduled).`,
          severity: "success",
          subsystem: "Irrigation Controller",
          telemetryMetric: "Optimal Baseline",
          actionTaken: "NORMAL_DRIP",
          cooldownKey: "weather-irrigation-rule",
          cooldownMs: 2500,
        });
      }
    },
    [pushToast]
  );

  // Apply Stress Scenario from Modal
  const handleApplyScenario = (scenarioId: string) => {
    if (scenarioId === "PEST_BOLLWORM_OUTBREAK") {
      setActivePestScenario("BOLLWORM");
      pushToast({
        title: "Pest Attack Injected: Pink Bollworm (गुलाबी बोंडअळी)",
        message: "Multi-class CCTV edge model switched to high-resolution canopy inspection. Detected Pink Bollworm square entry holes and larval boring at 8 larvae/m².",
        severity: "critical",
        subsystem: "EDGE VISION PEST MODEL",
        telemetryMetric: "BOLLWORM (8/m²)",
        actionTaken: "Triggered pest warning & IPM trap advisory",
        cooldownKey: "pest-bollworm-sim",
        cooldownMs: 2000,
      });
    } else if (scenarioId === "PEST_APHIDS_INFESTATION") {
      setActivePestScenario("APHIDS");
      pushToast({
        title: "Pest Attack Injected: Cotton Aphids (मावा कीड)",
        message: "Vision classifier identified heavy sap-sucking aphid colony clustering on abaxial leaf surfaces with curling symptoms.",
        severity: "warning",
        subsystem: "EDGE VISION PEST MODEL",
        telemetryMetric: "APHIDS (24/m²)",
        actionTaken: "Triggered yellow sticky trap & bio-spray alert",
        cooldownKey: "pest-aphids-sim",
        cooldownMs: 2000,
      });
    } else if (scenarioId === "HEATWAVE_DRY_SPELL") {
      setClimate((prev) => ({
        ...prev,
        ambientTemp: 42.0,
        humidity: 24,
        vpd: 3.4,
        et0: 8.2,
        rainRate: 0,
      }));
      setSensors((prev) => ({ ...prev, shallowMoisture: 16.5 }));
      pushToast({
        title: "Microclimate Shock: 42°C Heatwave Injected",
        message: "Ambient temperature spiked to 42.0°C and VPD escalated to 3.4 kPa. Reflex canopy misting & root irrigation vigilance engaged.",
        severity: "warning",
        subsystem: "FIELD DISTURBANCE SIMULATOR",
        telemetryMetric: "42.0°C / 3.4 kPa",
        actionTaken: "Escalating thermal vigilance",
        cooldownKey: "heatwave-sim",
        cooldownMs: 2000,
      });
    } else if (scenarioId === "RURAL_SINGLE_PHASING") {
      setHardware((prev) => ({
        ...prev,
        lineVoltage: 312,
        feederPhaseStatus: "SINGLE_PHASING_FAULT",
        pumpStatus: "TRIPPED_VOLTAGE",
        motorCurrentAmps: 0.0,
        manifoldPressureBar: 0.2,
      }));
      pushToast({
        title: "Irrigation Pump Tripped: Voltage Sag Fault",
        message: "Kirloskar 5HP Submersible pump auto-tripped by Auto-Switch DOL starter. Rural line voltage collapsed to 312V (< 340V safe threshold). Single-phasing fault detected.",
        severity: "critical",
        subsystem: "PUMP MOTOR PROTECTION",
        telemetryMetric: "312V (-103V Sag)",
        actionTaken: "Emergency DOL Motor Cutout",
        cooldownKey: "pump-voltage-trip",
        cooldownMs: 2000,
      });
      pushToast({
        title: "Reflex Safety Cutout: Motor Stator Protection",
        message: "Reflex layer triggered: Emergency cutout overriding Q-Learning actions to protect 3-phase pump windings from thermal burnout.",
        severity: "critical",
        subsystem: "MODEL-BASED REFLEX LAYER",
        telemetryMetric: "SINGLE-PHASING",
        actionTaken: "Bypass RL exploration -> Forced IDLE_MONITOR",
        cooldownKey: "reflex-safety-trip",
        cooldownMs: 2000,
      });
    } else if (scenarioId === "SUDDEN_CLOUDBURST") {
      setClimate((prev) => ({
        ...prev,
        rainRate: 24.5,
        humidity: 94,
        ambientTemp: 24.0,
        vpd: 0.4,
      }));
      setSensors((prev) => ({ ...prev, shallowMoisture: 38.0 }));
      pushToast({
        title: "Reflex Optimization: Monsoon Lockout",
        message: "Torrential cloudburst detected (24.5 mm/hr). Natural precipitation threshold exceeded. All irrigation valves locked out.",
        severity: "info",
        subsystem: "REFLEX AGENT • WEATHER LOCKOUT",
        telemetryMetric: "24.5 mm/hr",
        actionTaken: "Forced IDLE_MONITOR valve lockout",
        cooldownKey: "reflex-rain",
        cooldownMs: 2000,
      });
    } else if (scenarioId === "SENSOR_ELECTROMAGNETIC_NOISE") {
      // Temporarily inject high measurement noise
      kalmanRef.current.setNoiseParameters(0.01, 2.5);
      setKalmanState(kalmanRef.current.getState());
      pushToast({
        title: "Sensor Noise Injected: EM Interference",
        message: "High capacitive soil probe noise injected (R=2.5). Kalman filter covariance converging to suppress measurement drift.",
        severity: "warning",
        subsystem: "KALMAN SIGNAL PROCESSING",
        telemetryMetric: "R = 2.5 (High)",
        actionTaken: "Dynamic Kalman gain adaptation",
        cooldownKey: "noise-sim",
        cooldownMs: 2000,
      });
    } else if (scenarioId === "NITROGEN_DEFICIENCY") {
      setSensors((prev) => ({ ...prev, nitrogen: 125 }));
      pushToast({
        title: "Nitrogen Chlorosis Induced",
        message: "Soil available nitrogen reduced to 125 mg/kg (critical deficit threshold). Venturi fertigation standing by for NPK injection.",
        severity: "warning",
        subsystem: "FERTIGATION TELEMETRY",
        telemetryMetric: "125 mg/kg N",
        actionTaken: "Venturi injection armed",
        cooldownKey: "n-deficiency-sim",
        cooldownMs: 2000,
      });
    } else if (scenarioId === "RESTORE_OPTIMAL") {
      setClimate({
        ambientTemp: 29.5,
        humidity: 58,
        solarRadiation: 720,
        vpd: 1.8,
        windSpeed: 10.0,
        et0: 4.8,
        rainRate: 0.0,
      });
      setHardware((prev) => ({
        ...prev,
        lineVoltage: 415,
        feederPhaseStatus: "3-PHASE_HEALTHY",
        pumpStatus: "OFF",
        motorCurrentAmps: 0.0,
        manifoldPressureBar: 0.2,
      }));
      setSensors({
        shallowMoisture: 30.5,
        deepMoisture: 32.0,
        nitrogen: 215,
        phosphorus: 20,
        potassium: 185,
        ec: 0.9,
        pH: 7.0,
        soilTemperature: 25.0,
      });
      kalmanRef.current.setNoiseParameters(0.05, 0.8);
      kalmanRef.current.reset(30.5);
      setKalmanState(kalmanRef.current.getState());
      setActivePestScenario("NONE");
      pushToast({
        title: "System Restored: 3-Phase 415V Healthy",
        message: "Grid line voltage normalized to 415V, phase symmetry healthy, soil moisture restored to 30.5% VWC, and canopy pest clearing verified. Autonomous RL policy resumed.",
        severity: "success",
        subsystem: "SYSTEM RESTORATION",
        telemetryMetric: "415V Balanced",
        actionTaken: "Normal autonomous operation",
        cooldownKey: "restore-optimal",
        cooldownMs: 2000,
      });
    }
  };

  // Run Gemini AI Crop Diagnosis
  const handleRunAiDiagnosis = async () => {
    setIsAiDiagnosing(true);
    setIsAiModalOpen(true);
    try {
      const response = await fetch("/api/ai/diagnose-crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropType: activeZone.crop,
          zoneName: activeZone.name,
          cropStage: activeZone.cropStage,
          sensorData: sensors,
          thermalCanopyDiff: cctvData.canopyDepression,
          ndviScore: cctvData.ndviScore,
          observedSymptoms: cctvData.anomalyDescription,
          pestData: {
            detected: !!cctvData.pestInfestationDetected,
            primaryPest: cctvData.primaryPestClass,
            pestDetails: cctvData.pestDetails,
          },
        }),
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const data = await response.json();
      setAiDiagnosisData(data);
    } catch (err: any) {
      console.warn("[KrishiNet UI] Remote AI diagnostic unavailable, rendering field telemetry analysis.");
      const m = sensors.shallowMoisture;
      const n = sensors.nitrogen;
      const hasPest = !!cctvData.pestInfestationDetected;
      const pestType = cctvData.primaryPestClass || "BOLLWORM";
      setAiDiagnosisData({
        diagnosis: hasPest
          ? `${pestType === "BOLLWORM" ? "American/Pink Bollworm (गुलाबी बोंडअळी)" : "Cotton Aphid (मावा कीड)"} infestation detected on vegetative canopy surpassing economic injury threshold. Immediate bio-control or targeted chemical intervention advised.`
          : m < 22
          ? "Acute root zone water deficit detected with elevated canopy temperature and early stomatal closure."
          : n < 175
          ? "Nitrogen deficiency chlorosis identified on basal leaves with reduced chlorophyll reflectance."
          : "Vegetative canopy in stable equilibrium with moderate evapotranspirative demand.",
        confidence: 0.94,
        primaryStress: hasPest
          ? (pestType === "BOLLWORM" ? "Pink Bollworm Infestation" : "Cotton Aphid Outbreak")
          : m < 22 ? "Acute Water Deficit" : n < 175 ? "Nitrogen Deficiency" : "Optimal",
        ndviAnalysis: `NDVI score of ${cctvData.ndviScore.toFixed(2)} reflects canopy density under current soil water potential.`,
        recommendedAction: {
          irrigationLitersPerSqM: m < 22 ? 6.8 : 3.2,
          npkFertigationRatio:
            n < 175 ? "19:19:19 water-soluble @ 5kg/ha via Venturi" : "Balanced 12:61:00 mono-ammonium phosphate",
          urgency: hasPest ? "CRITICAL" : m < 20 ? "HIGH" : "MEDIUM",
          reflexOverrideRequired: hasPest || m < 15,
        },
        indianFarmingContext: hasPest
          ? "Deploy pheromone traps @ 5/acre or yellow sticky cards. Spray Azadirachtin (Neem oil 10,000 ppm) during early evening hours."
          : "Execute drip pulse during the rural 3-phase power window (11:00 PM - 05:00 AM or midday solar). Maintain Jain drip lateral pressure at 1.4 bar.",
        qLearningRewardImpact: hasPest ? "-25.0 pest penalty applied to state action space" : "+18.2 expected reward points in MDP state transition.",
      });
    } finally {
      setIsAiDiagnosing(false);
    }
  };

  // Run AI Yield Model Refinement
  const handleRefineYield = async () => {
    setIsRefiningYield(true);
    try {
      const response = await fetch("/api/ai/refine-yield-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop: activeZone.crop,
          baselineYield: yieldProjection.baselineYield,
          accumulatedStressDays: cctvData.anomalyDetected ? 4 : 1,
          waterSavedPercent: 42,
          gdd: yieldProjection.gddAccumulated,
        }),
      });
      const data = await response.json();
      if (data.predictedYield) {
        setYieldProjection((prev) => ({
          ...prev,
          currentProjectedYield: data.predictedYield,
        }));
      }
    } catch (e) {
      console.warn("Yield model refinement notice:", e);
    } finally {
      setIsRefiningYield(false);
    }
  };

  // Explain RL Decision via AI
  const handleExplainDecision = async () => {
    setIsExplainingAi(true);
    setIsAiModalOpen(true);
    try {
      const response = await fetch("/api/ai/explain-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: currentStateKey,
          action: lastAction,
          qValues: rlEngineRef.current.getQValues(currentStateKey),
          kalmanGain: kalmanState.kalmanGain,
          reward: lastReward,
        }),
      });
      const data = await response.json();
      setAiDiagnosisData({
        diagnosis: data.explanation,
        confidence: 0.98,
        recommendedAction: {
          irrigationLitersPerSqM: 4.5,
          npkFertigationRatio: "19:19:19 via Venturi",
          urgency: "OPTIMAL",
        },
        punjabMaharashtraContext: data.mathematicalJustification,
      });
    } catch (err) {
      console.warn("RL decision explanation notice:", err);
    } finally {
      setIsExplainingAi(false);
    }
  };

  // Remediate Underperforming Area Strategy
  const handleRemediateZoneUnderperforming = (zoneId: string, directive: string) => {
    handleSelectZone(zoneId);
    const targetZone = zones.find((z) => z.id === zoneId);
    const zoneName = targetZone?.name || zoneId;

    if (zoneId === "zone-2") {
      // Block B: bump manifold pressure and trigger pulsed drip to overcome tail friction loss
      setHardware((prev) => ({
        ...prev,
        manifoldPressureBar: 1.8,
        pumpStatus: "RUNNING",
        motorCurrentAmps: 7.8,
      }));
      setSensors((prev) => ({
        ...prev,
        shallowMoisture: Math.min(34, prev.shallowMoisture + 4.8),
      }));
      setLastAction("PULSE_DRIP_IRRIGATION");
      pushToast({
        title: "Irrigation Strategy Remediated: Block B",
        message:
          "Manifold operating pressure elevated to 1.8 bar. Initiated 2.2 LPH pulsed drip cycle to overcome tail-end lateral friction loss in Vertisol soil.",
        severity: "info",
        subsystem: "ZONE RESOURCE EFFICIENCY OPTIMIZER",
        telemetryMetric: "1.8 Bar / +4.8% VWC",
        actionTaken: "BUMP_PRESSURE_PULSE_DRIP",
        cooldownKey: "remediate-zone-2",
        cooldownMs: 4000,
      });
    } else if (zoneId === "zone-4") {
      // Block D: micro-mist evaporative canopy cooling
      setSensors((prev) => ({
        ...prev,
        shallowMoisture: Math.min(30, prev.shallowMoisture + 2.2),
      }));
      setCctvData((prev) => ({
        ...prev,
        canopyTemp: Math.max(26, prev.canopyTemp - 3.8),
        canopyDepression: -0.8,
        cwsi: Math.max(0.18, prev.cwsi - 0.28),
      }));
      setLastAction("CANOPY_MICRO_MIST");
      pushToast({
        title: "Thermal Stress Remediated: Block D Polyhouse",
        message:
          "Micro-mist evaporative cooling pulse engaged. Canopy temperature depressed by -3.8°C; stomatal conductance and VPD normalized.",
        severity: "info",
        subsystem: "ZONE RESOURCE EFFICIENCY OPTIMIZER",
        telemetryMetric: "-3.8°C Canopy Temp",
        actionTaken: "CANOPY_MICRO_MIST",
        cooldownKey: "remediate-zone-4",
        cooldownMs: 4000,
      });
    } else if (zoneId === "zone-3") {
      // Block C: Venturi fertigation
      setSensors((prev) => ({
        ...prev,
        nitrogen: Math.min(235, prev.nitrogen + 38),
      }));
      setHardware((prev) => ({
        ...prev,
        venturiStatus: "INJECTING_19_19_19",
      }));
      setLastAction("FERTIGATION_VENTURI_NPK");
      pushToast({
        title: "Nutrient Deficit Remediated: Block C",
        message:
          "Venturi 19:19:19 fertigation suction activated. Soil available nitrogen replenished to mitigate tail furrow leaching in Sugarcane block.",
        severity: "info",
        subsystem: "ZONE RESOURCE EFFICIENCY OPTIMIZER",
        telemetryMetric: "+38 kg/ha Nitrogen",
        actionTaken: "FERTIGATION_VENTURI_NPK",
        cooldownKey: "remediate-zone-3",
        cooldownMs: 4000,
      });
    } else {
      pushToast({
        title: `Strategy Remediated: ${zoneName}`,
        message: directive,
        severity: "info",
        subsystem: "ZONE RESOURCE EFFICIENCY OPTIMIZER",
        telemetryMetric: "Uniform Delivery",
        actionTaken: "OPTIMIZE_SCHEDULE",
        cooldownKey: `remediate-${zoneId}`,
        cooldownMs: 4000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        zones={zones}
        activeZoneId={activeZoneId}
        onSelectZone={handleSelectZone}
        isRunning={isRunning}
        onToggleRunning={() => setIsRunning(!isRunning)}
        onStepTick={stepSimulation}
        speed={speed}
        onSetSpeed={setSpeed}
        isGatewayOnline={isGatewayOnline}
        onToggleGateway={handleToggleGateway}
        gridStatus={hardware.feederPhaseStatus}
        voltage={hardware.lineVoltage}
        onOpenStressModal={() => setIsStressModalOpen(true)}
        onOpenAiModal={handleRunAiDiagnosis}
        activeReflexCount={reflexLogs.length}
        alertsCount={toasts.length}
        onViewAlerts={() => {
          if (toasts.length > 0) {
            handleInspectToast(toasts[0]);
          } else {
            document.getElementById("hardware-panel")?.scrollIntoView({ behavior: "smooth" });
          }
        }}
        onExportData={handleExportData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Resource Efficiency Index Mini-Heatmap Across All Farm Zones */}
        <ZoneResourceEfficiencyHeatmap
          zones={zones}
          activeZoneId={activeZoneId}
          onSelectZone={handleSelectZone}
          activeAction={lastAction}
          activeSensors={sensors}
          activeClimate={climate}
          activeHardware={hardware}
          onRemediateUnderperforming={handleRemediateZoneUnderperforming}
          onOpenAiDiagnosis={handleRunAiDiagnosis}
        />

        {/* Row 1: CCTV Vision Live Feed (Col 1-2) + 5-Sensor Telemetry Matrix (Col 3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* CCTV Feed */}
          <div id="cctv-panel" className="lg:col-span-6 scroll-mt-20">
            <CCTVFeed
              zone={activeZone}
              cctvData={cctvData}
              sensors={sensors}
              onModeChange={(mode) => setCctvData((prev) => ({ ...prev, mode }))}
              onTriggerAiDiagnosis={handleRunAiDiagnosis}
              isAiDiagnosing={isAiDiagnosing}
            />
          </div>

          {/* 5-Sensor Telemetry */}
          <div id="sensors-panel" className="lg:col-span-6 scroll-mt-20">
            <FiveSensorPanel
              sensors={sensors}
              climate={climate}
              kalmanMoistureFiltered={kalmanState.filtered}
              onSimulateSensorDrift={() => {
                kalmanRef.current.setNoiseParameters(0.02, 2.8);
                setKalmanState(kalmanRef.current.getState());
              }}
              onManualAdjustSensor={(field, delta) => {
                setSensors((prev) => ({
                  ...prev,
                  [field]: Math.max(0, prev[field] + delta),
                }));
              }}
              onExportTelemetry={() => setIsExportModalOpen(true)}
            />
          </div>
        </div>

        {/* Row 2: Kalman Filter Signal Processing & Indian Farming Hardware */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Kalman Filter View */}
          <div id="kalman-panel" className="lg:col-span-6 scroll-mt-20">
            <KalmanFilterView
              kalmanState={kalmanState}
              onUpdateNoise={(q, r) => {
                kalmanRef.current.setNoiseParameters(q, r);
                setKalmanState(kalmanRef.current.getState());
              }}
              targetSensorName="Shallow Soil Moisture (15cm VWC)"
            />
          </div>

          {/* Indian Farming Hardware & MQTT Gateway */}
          <div id="hardware-panel" className="lg:col-span-6 scroll-mt-20">
            <IndianHardwarePanel
              hardware={hardware}
              mqttPackets={mqttPackets}
              isGatewayOnline={isGatewayOnline}
              onToggleGatewayConnection={handleToggleGateway}
              onTriggerManualPump={handleTriggerManualPump}
              onClearMqttLogs={() => {
                mqttGatewayRef.current.clearLogs();
                setMqttPackets([]);
              }}
              onResetVoltageFault={handleResetVoltageFault}
              onSimulateVoltageTrip={handleSimulateVoltageTrip}
              mqttTrafficBuckets={mqttTrafficBuckets}
              mqttGatewayMetrics={mqttGatewayMetrics}
              onSimulateBottleneck={(type) => {
                mqttGatewayRef.current.simulateBottleneckEvent(type);
                setMqttPackets(mqttGatewayRef.current.getStatus().recentPackets);
                setMqttTrafficBuckets(mqttGatewayRef.current.getHourlyTraffic());
                setMqttGatewayMetrics(mqttGatewayRef.current.getGatewayMetrics());
              }}
              schedules={fertilizerSchedules}
              activeZoneId={activeZoneId}
              activeZoneName={activeZone.name}
              activeCropName={activeZone.crop}
              sensors={sensors}
              onAddFertilizerSchedule={handleAddFertilizerSchedule}
              onToggleFertilizerSchedule={handleToggleFertilizerSchedule}
              onDeleteFertilizerSchedule={handleDeleteFertilizerSchedule}
              onTriggerImmediateDose={handleTriggerImmediateDose}
              fertilizerExecutionLogs={fertilizerLogs}
              isDosingActive={isDosingActive}
              activeDosingRecipe={activeDosingRecipe}
            />
          </div>
        </div>

        {/* Row 3: Reinforcement Learning (MDP & Q-Table) + Predictive Yield Model with D3 Trend Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Q-Learning MDP View */}
          <div id="rl-reflex-panel" className="lg:col-span-7 scroll-mt-20">
            <QLearningMDPView
              currentStateKey={currentStateKey}
              lastAction={lastAction}
              isExploration={isExploration}
              lastReward={lastReward}
              lastTdError={lastTdError}
              qTableEntries={rlEngineRef.current.getTableEntries()}
              stats={rlEngineRef.current.getStats()}
              reflexLogs={reflexLogs}
              onExplainDecision={handleExplainDecision}
              isExplainingAi={isExplainingAi}
              onExportTelemetry={() => setIsExportModalOpen(true)}
            />
          </div>

          {/* Predictive Yield & Agrometeorology Model */}
          <div id="yield-panel" className="lg:col-span-5 scroll-mt-20">
            <YieldAndClimateModel
              yieldData={yieldProjection}
              climate={climate}
              cropName={activeZone.crop}
              location={activeZone.location}
              yieldHistory={yieldHistory}
              onRefineYieldModel={handleRefineYield}
              isRefiningYield={isRefiningYield}
              onApplyIrrigationRule={handleApplyIrrigationRule}
            />
          </div>
        </div>
      </main>

      {/* Floating Interactive Toast Notifications System */}
      <ToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
        onClearAll={handleClearAllToasts}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted((prev) => !prev)}
        onInspectToast={handleInspectToast}
      />

      {/* Modals */}
      <GeminiAgronomistModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        zone={activeZone}
        cctvData={cctvData}
        sensors={sensors}
        diagnosisData={aiDiagnosisData}
        isLoading={isAiDiagnosing || isExplainingAi}
        onRunDiagnosis={handleRunAiDiagnosis}
      />

      <StressSimulatorModal
        isOpen={isStressModalOpen}
        onClose={() => setIsStressModalOpen(false)}
        onApplyScenario={handleApplyScenario}
      />

      {/* 24-Hour Telemetry & RL Action Dataset Export Modal */}
      <ExportTelemetryModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        zones={zones}
        activeZoneId={activeZoneId}
        currentSensors={sensors}
        currentClimate={climate}
        currentHardware={hardware}
        kalmanFilteredMoisture={kalmanState.filtered}
        recentReflexLogs={reflexLogs}
        currentAction={lastAction}
        currentReward={lastReward}
        currentTdError={lastTdError}
        onSuccessExport={handleSuccessExport}
      />
    </div>
  );
}
