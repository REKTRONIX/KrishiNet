export interface FiveSensors {
  shallowMoisture: number; // 15cm root zone (% VWC, optimal 28-36%)
  deepMoisture: number; // 45cm root zone (% VWC, optimal 30-40%)
  nitrogen: number; // Available N in soil (kg/ha or ppm, optimal 180-240 kg/ha)
  phosphorus: number; // Available P (kg/ha, optimal 15-25 kg/ha)
  potassium: number; // Available K (kg/ha, optimal 150-220 kg/ha)
  ec: number; // Electrical conductivity (dS/m or mS/cm, optimal 0.6 - 1.2)
  pH: number; // Soil pH (optimal 6.5 - 7.5)
  soilTemperature: number; // °C
}

export interface ClimateTelemetry {
  ambientTemp: number; // °C
  humidity: number; // % RH
  solarRadiation: number; // W/m²
  vpd: number; // Vapor Pressure Deficit in kPa
  windSpeed: number; // km/h
  et0: number; // Reference evapotranspiration mm/day
  rainRate: number; // mm/hr
}

export type CropType =
  | "Basmati Rice (PB-1121)"
  | "Bt Cotton (Bollgard II)"
  | "Sugarcane (Co-0238)"
  | "Wheat (HD-2967)"
  | "Polyhouse Tomato (Arka Rakshak)";

export type SoilType =
  | "Black Cotton Soil (Vertisol - High clay, heavy water retention)"
  | "Indo-Gangetic Alluvial (Loam - Balanced drainage)"
  | "Red Sandy Loam (Alfisol - Rapid infiltration, low nutrient buffer)";

export interface FarmZone {
  id: string;
  name: string;
  location: string;
  crop: CropType;
  cropStage: "Vegetative" | "Flowering/Booting" | "Yield Formation" | "Maturity";
  soilType: SoilType;
  areaAcres: number;
  dripType: "Inline 2.2 LPH Jain Drip" | "Finolex 4.0 LPH Online" | "Micro-sprinkler";
  pumpAssigned: string;
  healthScore: number; // 0-100
  stressStatus: CropStressType;
  cctvAngle: string;
}

export type CropStressType =
  | "HEALTHY"
  | "WATER_DEFICIT"
  | "NITROGEN_DEFICIENCY"
  | "THERMAL_HEAT_STRESS"
  | "WATERLOGGING"
  | "SALINITY_STRESS";

export type VisionDetectionClass =
  | "optimal"
  | "stress"
  | "chlorosis"
  | "pest_bollworm"
  | "pest_aphids"
  | "pest_whitefly"
  | "pest_stem_borer";

export interface PestClassificationDetail {
  pestType: "BOLLWORM" | "APHIDS" | "WHITEFLY" | "STEM_BORER";
  commonName: string;
  scientificName: string;
  affectedCrops: string;
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  densityPerSqMeter: number;
  economicThresholdCrossed: boolean;
  recommendedOrganicAction: string;
  recommendedChemicalAction: string;
}

export interface CCTVVisionData {
  cameraId: string;
  resolution: string;
  mode: "RGB" | "NDVI" | "THERMAL";
  ndviScore: number; // -1.0 to 1.0 (0.65-0.85 healthy)
  variScore: number; // Visible Atmospherically Resistant Index
  cwsi: number; // Crop Water Stress Index 0.0 to 1.0
  canopyTemp: number; // °C
  canopyDepression: number; // Tc - Ta (°C)
  anomalyDetected: boolean;
  anomalyDescription: string;
  pestInfestationDetected?: boolean;
  primaryPestClass?: "BOLLWORM" | "APHIDS" | "WHITEFLY" | "STEM_BORER" | "NONE";
  pestDetails?: PestClassificationDetail[];
  boundingBoxes: Array<{
    id: string;
    label: string;
    confidence: number;
    x: number;
    y: number;
    w: number;
    h: number;
    type: "stress" | "pest" | "chlorosis" | "optimal" | "pest_bollworm" | "pest_aphids" | "pest_whitefly" | "pest_stem_borer";
    severity?: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    count?: number;
  }>;
}

export interface KalmanState {
  raw: number;
  filtered: number;
  estimateError: number; // P
  kalmanGain: number; // K
  processNoise: number; // Q
  measurementNoise: number; // R
  history: Array<{ time: number; raw: number; filtered: number; trueVal: number }>;
}

export type AgentAction =
  | "IDLE_MONITOR"
  | "PULSE_DRIP_IRRIGATION"
  | "DEEP_DRIP_SOAK"
  | "FERTIGATION_VENTURI_NPK"
  | "CANOPY_MICRO_MIST";

export interface AgentActionSpec {
  id: AgentAction;
  name: string;
  waterVolLiters: number;
  npkGrams: number;
  durationMinutes: number;
  costInr: number;
  description: string;
}

export interface QTableEntry {
  stateKey: string;
  stateLabel: string;
  qValues: Record<AgentAction, number>;
  visitCount: number;
}

export interface ReflexRuleLog {
  id: string;
  timestamp: string;
  type: "SAFETY_TRIP" | "RAPID_REFLEX" | "OPTIMIZATION" | "POWER_MANAGEMENT";
  trigger: string;
  actionTaken: string;
  overriddenRL: boolean;
  status: "EXECUTED" | "STANDBY" | "INTERVENED";
}

export interface IndianIrrigationHardware {
  pumpMake: "Kirloskar 5HP Submersible" | "Texmo 7.5HP Borewell" | "Crompton Solar 3HP";
  pumpStatus: "OFF" | "RUNNING" | "TRIPPED_DRY_RUN" | "TRIPPED_VOLTAGE";
  motorCurrentAmps: number; // Normal 7.2A - 8.5A
  lineVoltage: number; // 415V 3-phase (Alert if <340V)
  feederPhaseStatus: "3-PHASE_HEALTHY" | "SINGLE_PHASING_FAULT" | "GRID_OUTAGE_SOLAR_ACTIVE";
  starterType: "Auto-Switch DOL Starter" | "Star-Delta Relay with GSM Controller";
  manifoldPressureBar: number; // 1.2 - 2.0 bar normal
  venturiStatus: "CLOSED" | "INJECTING_19_19_19" | "INJECTING_MICRONUTRIENTS";
  solenoids: Array<{ id: string; zoneId: string; status: "OPEN" | "CLOSED"; flowRateLpm: number }>;
  localGatewayStatus: "ONLINE_MQTT" | "OFFLINE_LOCAL_STORE_FORWARD";
  storedLocalTelemetryPackets: number;
  lastMqttTopic: string;
  lastMqttPayload: string;
}

export type MqttPacketType =
  | "TELEMETRY"
  | "COMMAND"
  | "HEARTBEAT"
  | "ALARM_FAULT"
  | "BUFFERED_SYNC";

export interface MqttTrafficBucket {
  id: string;
  minuteOffset: number; // e.g. -55, -50, ..., 0
  timeLabel: string; // e.g. "11:15", "-35m", etc.
  telemetryCount: number;
  commandCount: number;
  heartbeatCount: number;
  alarmCount: number;
  bufferedCount: number;
  totalPackets: number;
  avgLatencyMs: number;
  packetLossPercent: number;
  isBottleneck: boolean;
  bottleneckType?: "HEALTHY" | "RETRY_SPIKE" | "OFFLINE_BACKPRESSURE" | "VOLTAGE_FLICKER_BURST" | "CHANNEL_CONGESTION";
  bottleneckReason?: string;
  recommendedAction?: string;
}

export interface MqttGatewayMetrics {
  totalPacketsLastHour: number;
  packetsPerMinute: number;
  successRatePercent: number;
  avgLatencyMs: number;
  bottleneckEventsCount: number;
  activeBottleneck: string | null;
  bufferUsagePercent: number;
}

export interface YieldProjection {
  currentProjectedYield: number; // Quintals / acre
  baselineYield: number;
  waterSavedTotalLiters: number;
  electricityUnitsSavedKwh: number;
  npkOptimizedKg: number;
  gddAccumulated: number; // Growing degree days
  resourceEfficiencyIndex: number; // %
}

export interface YieldHistoryPoint {
  step: number;
  timestamp: number;
  projectedYield: number; // Quintals / acre
  baselineYield: number;
  cwsi: number;
  actionTaken: string;
}

export interface ForecastDay {
  day: number; // 1 to 7
  dayLabel: string; // "Day +1", "Day +2", etc.
  dateStr: string; // e.g. "Sep 14"
  fullDateStr: string; // e.g. "Mon, 14 Sep"
  step: number; // projected step index for chart plotting
  timestamp: number;
  predictedYield: number; // Quintals / Acre
  lowerBound: number; // 95% confidence interval min
  upperBound: number; // 95% confidence interval max
  deltaFromCurrent: number;
  deltaFromBaseline: number;
  predictedCwsi: number;
  cwsiStatus: "Optimal" | "Mild Deficit" | "Severe Stress";
  phenologyNote?: string;
}

export interface YieldRegressionSummary {
  slopePerStep: number;
  slopePerDay: number; // Qtl / acre / day
  intercept: number;
  rSquared: number; // 0 to 1 coefficient of determination
  standardError: number;
  trendDirection: "RISING" | "STABLE" | "DECLINING";
  currentYield: number;
  day7ProjectedYield: number;
  day7Delta: number;
  day7GainPercent: number;
  confidenceScore: number; // 0 to 100%
  agronomicAssessment: string;
  forecastDays: ForecastDay[];
}

export type ToastSeverity = "critical" | "warning" | "info" | "success";

export interface AgroToast {
  id: string;
  title: string;
  message: string;
  severity: ToastSeverity;
  subsystem: string;
  timestamp: number;
  timeStr: string;
  actionTaken?: string;
  telemetryMetric?: string;
  ruleId?: string;
  autoDismissMs?: number;
}

export type IrrigationForecastAction =
  | "IRRIGATE_NORMAL"
  | "HOLD_FOR_RAIN"
  | "BOOST_PULSE"
  | "REDUCE_RATE"
  | "DEFICIT_AERATION";

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface DailyForecastDay {
  dayName: string;
  date: string;
  condition: string;
  tempMax: number;
  tempMin: number;
  rainProb: number;
  rainMm: number;
  humidity: number;
  windSpeedKmH: number;
  et0Mm: number;
  action: IrrigationForecastAction;
  rationale: string;
}

export interface LocalizedWeatherForecast {
  location: string;
  headline: string;
  irrigationRecommendation: string;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  monsoonOrRainAlert: boolean;
  totalExpectedRainMm: number;
  avgDailyEt0: number;
  days: DailyForecastDay[];
  isGrounded?: boolean;
  searchQueries?: string[];
  groundingSources?: GroundingSource[];
  fetchedAt?: string;
  fallbackReason?: string;
}

export interface ZoneSectorEfficiency {
  id: string;
  label: string;
  sectorCode: string;
  efficiencyIndex: number; // 0 - 100
  waterEfficiency: number; // %
  cwsi: number; // 0.0 - 1.0
  moistureVwc: number; // % VWC
  pressureBar: number; // bar
  isUnderperforming: boolean;
  bottleneckReason?: string;
  remedialDirective?: string;
}

export interface ZoneEfficiencySummary {
  zoneId: string;
  compositeEfficiency: number; // 0 - 100
  status: "OPTIMAL" | "NOMINAL" | "WARNING" | "CRITICAL";
  sectors: ZoneSectorEfficiency[];
  underperformingCount: number;
  primaryDeficit?: string;
  recommendedTweak?: string;
  primaryStressFactor: string;
  primaryStressType: "MOISTURE" | "VPD" | "NITROGEN" | "PRESSURE" | "GRID" | "OPTIMAL";
  stressMetricValue: string;
  stressBenchmarkTarget: string;
  efficiencyImpactDescription: string;
}

export type FertilizerRecipeId =
  | "NPK_19_19_19"
  | "UREA_46_0_0"
  | "DAP_18_46_0"
  | "MOP_0_0_60"
  | "MICRONUTRIENT_ZINC_BORON";

export type DosingTriggerMode =
  | "INTERVAL_STEPS"
  | "THRESHOLD_DEFICIT"
  | "MANUAL_ONE_OFF";

export interface FertilizerRecipe {
  id: FertilizerRecipeId;
  name: string;
  nRatio: number;
  pRatio: number;
  kRatio: number;
  description: string;
  recommendedFor: string;
  defaultDoseKgPerHa: number;
  injectionDurationMin: number;
  colorClass: string;
}

export interface FertilizerSchedule {
  id: string;
  zoneId: string;
  recipeId: FertilizerRecipeId;
  recipeName: string;
  doseKgPerHa: number;
  injectionDurationMin: number;
  triggerMode: DosingTriggerMode;
  intervalSteps: number;
  stepsUntilNext: number;
  targetNutrient: "N" | "P" | "K" | "BALANCED";
  thresholdValue: number;
  status: "ACTIVE" | "PAUSED" | "DOSING_NOW" | "COMPLETED";
  lastDosedTimestamp?: number;
  totalDosedCount: number;
  createdTimestamp: number;
}

export interface FertilizerExecutionLog {
  id: string;
  timestamp: number;
  timeStr: string;
  scheduleId?: string;
  zoneId?: string;
  recipeId: FertilizerRecipeId;
  recipeName: string;
  doseKg: number;
  durationMin: number;
  triggerReason: string;
  soilNBefore: number;
  soilNAfter: number;
  soilPBefore: number;
  soilPAfter: number;
  soilKBefore: number;
  soilKAfter: number;
}
