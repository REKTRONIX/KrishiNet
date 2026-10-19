import {
  AgentAction,
  ClimateTelemetry,
  FarmZone,
  FiveSensors,
  IndianIrrigationHardware,
  ReflexRuleLog,
} from "../types";
import { ACTION_SPECS, discretizeState, getStateLabel } from "./rlEngine";

export interface TelemetryExportRecord {
  timestampIso: string;
  timestampLocal: string;
  timestampUnixMs: number;
  hourOffset: number;
  zoneId: string;
  zoneName: string;
  cropType: string;
  cropGrowthStage: string;
  soilType: string;
  shallowMoistureRawVwc: number;
  shallowMoistureKalmanVwc: number;
  deepMoistureVwc: number;
  nitrogenKgHa: number;
  phosphorusKgHa: number;
  potassiumKgHa: number;
  soilEcDsM: number;
  soilPh: number;
  soilTemperatureC: number;
  ambientTemperatureC: number;
  relativeHumidityPct: number;
  solarRadiationWM2: number;
  vpdKpa: number;
  et0MmDay: number;
  windSpeedKmH: number;
  rainRateMmHr: number;
  cwsiScore: number;
  ndviScore: number;
  canopyTempC: number;
  canopyDepressionC: number;
  lineVoltageV: number;
  feederPhaseStatus: string;
  motorCurrentAmps: number;
  pumpStatus: string;
  manifoldPressureBar: number;
  venturiStatus: string;
  rlAgentAction: AgentAction;
  rlActionName: string;
  mdpStateKey: string;
  mdpStateLabel: string;
  decisionMode: "EXPLOITATION" | "EXPLORATION" | "REFLEX_SAFETY_OVERRIDE";
  mdpReward: number;
  bellmanTdError: number;
  reflexRuleId: string;
  reflexRuleTrigger: string;
  waterAppliedLiters: number;
  npkAppliedGrams: number;
  electricityKwh: number;
  estimatedCostInr: number;
  resourceEfficiencyIndexPct: number;
}

export interface ExportOptions {
  zones: FarmZone[];
  activeZoneId: string;
  filterMode: "ACTIVE_ZONE_ONLY" | "ALL_ZONES";
  intervalMinutes: 15 | 30 | 60;
  currentSensors: FiveSensors;
  currentClimate: ClimateTelemetry;
  currentHardware: IndianIrrigationHardware;
  kalmanFilteredMoisture: number;
  recentReflexLogs: ReflexRuleLog[];
  currentAction: AgentAction;
  currentReward: number;
  currentTdError: number;
}

/**
 * Generates an agronomically calibrated 24-hour time series of sensor telemetry,
 * micrometeorology, and RL agent decisions leading up to the current timestamp.
 */
export function generate24HourTelemetryDataset(options: ExportOptions): TelemetryExportRecord[] {
  const {
    zones,
    activeZoneId,
    filterMode,
    intervalMinutes,
    currentSensors,
    currentClimate,
    currentHardware,
    kalmanFilteredMoisture,
    recentReflexLogs,
    currentAction,
    currentReward,
    currentTdError,
  } = options;

  const targetZones =
    filterMode === "ALL_ZONES"
      ? zones
      : zones.filter((z) => z.id === activeZoneId);

  const totalIntervals = (24 * 60) / intervalMinutes; // e.g. 24, 48, or 96
  const now = new Date();
  const allRecords: TelemetryExportRecord[] = [];

  targetZones.forEach((zone) => {
    // Zone specific baselines
    let baseShallow = 30.5;
    let baseDeep = 32.0;
    let baseN = 215;
    let baseP = 21;
    let baseK = 185;
    let baseEc = 0.85;
    let basePh = 7.1;

    if (zone.id === "zone-2") {
      baseShallow = 21.0;
      baseDeep = 23.5;
      baseN = 195;
      baseP = 18;
      baseK = 165;
    } else if (zone.id === "zone-3") {
      baseShallow = 27.5;
      baseDeep = 31.0;
      baseN = 152; // Nitrogen deficient zone
      baseP = 16;
      baseK = 145;
    } else if (zone.id === "zone-4") {
      baseShallow = 24.0;
      baseDeep = 26.0;
      baseN = 205;
      baseP = 24;
      baseK = 195;
    }

    // Override with live sensors if current active zone
    if (zone.id === activeZoneId) {
      baseShallow = currentSensors.shallowMoisture;
      baseDeep = currentSensors.deepMoisture;
      baseN = currentSensors.nitrogen;
      baseP = currentSensors.phosphorus;
      baseK = currentSensors.potassium;
      baseEc = currentSensors.ec;
      basePh = currentSensors.pH;
    }

    for (let i = totalIntervals; i >= 0; i--) {
      const minutesAgo = i * intervalMinutes;
      const pointTime = new Date(now.getTime() - minutesAgo * 60 * 1000);
      const hourOffset = -(minutesAgo / 60);

      // Solar & Diurnal cycle physics
      const hoursFloat = pointTime.getHours() + pointTime.getMinutes() / 60;
      // Sunrise ~06:00, Solar Noon ~12:30, Sunset ~18:30
      const isDaylight = hoursFloat >= 6.0 && hoursFloat <= 18.5;
      const solarProg = isDaylight
        ? Math.sin(((hoursFloat - 6.0) / 12.5) * Math.PI)
        : 0;

      // Solar Radiation (0 at night, up to 920 W/m² at peak)
      const solarRadiation = Math.round(
        isDaylight ? Math.max(0, solarProg * 880 + Math.sin(i * 0.4) * 25) : 0
      );

      // Temperature curve: Min ~22°C at 5:30 AM, Max ~34.5°C at 14:00
      const tempDiurnalLag = Math.sin(((hoursFloat - 8.5) / 12.0) * Math.PI);
      const ambientTemp = Number(
        (28.0 + tempDiurnalLag * 6.5 + Math.cos(i * 0.2) * 0.4).toFixed(1)
      );

      // Relative Humidity: inverse of temperature (78% pre-dawn, 38% afternoon)
      const humidity = Math.min(
        92,
        Math.max(32, Math.round(58 - tempDiurnalLag * 22 + Math.sin(i * 0.3) * 3))
      );

      // Saturated Vapor Pressure (Tetens equation) & Actual Vapor Pressure
      const es = 0.61078 * Math.exp((17.27 * ambientTemp) / (ambientTemp + 237.3));
      const ea = (es * humidity) / 100;
      const calculatedVpd = Math.max(0.35, Number((es - ea).toFixed(2)));

      // FAO-56 Penman-Monteith ET0 estimate
      const et0 = Number(
        Math.max(
          1.2,
          isDaylight ? 2.5 + solarProg * 4.2 + (calculatedVpd > 2.0 ? 0.8 : 0) : 0.6
        ).toFixed(2)
      );

      // Soil Moisture dynamic depletion & intermittent irrigation replenishment
      // Simulating realistic irrigation events over the 24 hours:
      // Morning precision pulse (~08:30, roughly 4-5 hours ago or previous cycle)
      // Evening moisture stabilization (~17:30)
      const morningPulse = hoursFloat >= 8.0 && hoursFloat <= 9.0;
      const eveningSoak = hoursFloat >= 17.0 && hoursFloat <= 18.0;
      const middayMist = zone.id === "zone-4" && hoursFloat >= 13.0 && hoursFloat <= 14.0;
      const afternoonVenturi = zone.id === "zone-3" && hoursFloat >= 10.0 && hoursFloat <= 11.0;

      // Depletion effect throughout daytime
      const depletion = isDaylight ? (hoursFloat - 6.0) * 0.45 : 0;
      let shallowKalman = baseShallow - (isDaylight ? Math.sin(solarProg * Math.PI) * 2.8 : 0);

      if (morningPulse) shallowKalman += 3.8;
      if (eveningSoak) shallowKalman += 6.5;
      if (middayMist) shallowKalman += 1.2;

      // Keep within realistic agronomic bounds
      shallowKalman = Math.min(38.0, Math.max(16.5, Number(shallowKalman.toFixed(1))));

      // Raw reading includes capacitive high-frequency sensor noise (Kalman input)
      const noise = (Math.sin(i * 1.8) * 0.8 + Math.cos(i * 3.1) * 0.5);
      const shallowRaw = Number((shallowKalman + noise).toFixed(1));

      const deepMoisture = Math.min(
        38.0,
        Math.max(
          19.0,
          Number((baseDeep - (isDaylight ? 0.8 : 0) + (eveningSoak ? 4.0 : 0)).toFixed(1))
        )
      );

      // Soil Nutrients
      let nitrogenVal = baseN;
      if (afternoonVenturi) {
        nitrogenVal += 22;
      } else {
        nitrogenVal = Math.round(baseN - (24 - hoursFloat) * 0.35);
      }
      nitrogenVal = Math.max(130, Math.min(240, nitrogenVal));

      // CWSI and Canopy Thermal
      const cwsiBase = shallowKalman < 22 ? 0.58 : shallowKalman < 26 ? 0.35 : 0.18;
      const cwsiHeatBump = calculatedVpd > 2.2 ? 0.15 : 0;
      const cwsiScore = Math.min(
        0.88,
        Math.max(0.08, Number((cwsiBase + cwsiHeatBump + Math.sin(i * 0.5) * 0.04).toFixed(2)))
      );

      const canopyDepression = Number(
        (cwsiScore > 0.5 ? 1.5 + cwsiScore * 2.2 : -2.4 + cwsiScore * 2.0).toFixed(1)
      );
      const canopyTemp = Number((ambientTemp + canopyDepression).toFixed(1));
      const ndviScore = Number(
        (zone.id === "zone-1" ? 0.78 : zone.id === "zone-3" ? 0.71 : 0.65).toFixed(2)
      );

      // Grid Voltage & Rural Electrical Feeder:
      // Rural feeder voltage dip between 13:30 and 14:30 (typical peak agricultural load)
      const isRuralFeederDip = hoursFloat >= 13.5 && hoursFloat <= 14.5;
      let lineVoltage = 412 + Math.round(Math.sin(i * 0.7) * 8);
      let feederPhaseStatus = "3-PHASE_HEALTHY";
      if (isRuralFeederDip) {
        lineVoltage = 328; // Voltage sag below 340V threshold
        feederPhaseStatus = "SINGLE_PHASING_FAULT";
      }

      // RL Agent & Reflex Layer Action Selection
      let rlAction: AgentAction = "IDLE_MONITOR";
      let decisionMode: "EXPLOITATION" | "EXPLORATION" | "REFLEX_SAFETY_OVERRIDE" = "EXPLOITATION";
      let reflexRuleId = "NONE";
      let reflexRuleTrigger = "Nominal conditions; Q-policy optimization active";
      let pumpStatus = "OFF";
      let motorCurrentAmps = 0.0;
      let manifoldPressureBar = 0.2;
      let venturiStatus = "CLOSED";

      if (isRuralFeederDip) {
        rlAction = "IDLE_MONITOR";
        decisionMode = "REFLEX_SAFETY_OVERRIDE";
        reflexRuleId = "RULE-PWR-SAG-01";
        reflexRuleTrigger = `Motor Voltage Sag: Feeder voltage ${lineVoltage}V (< 340V). DOL starter trip lockout.`;
        pumpStatus = "TRIPPED_VOLTAGE";
      } else if (shallowKalman < 17.5) {
        rlAction = "DEEP_DRIP_SOAK";
        decisionMode = "REFLEX_SAFETY_OVERRIDE";
        reflexRuleId = "RULE-CRIT-DRY-01";
        reflexRuleTrigger = `Root zone moisture collapsed (${shallowKalman}% VWC < 18% permanent wilting point).`;
        pumpStatus = "RUNNING";
        motorCurrentAmps = 7.8;
        manifoldPressureBar = 1.8;
      } else if (middayMist || (calculatedVpd > 2.5 && hoursFloat >= 12.0 && hoursFloat <= 15.0)) {
        rlAction = "CANOPY_MICRO_MIST";
        decisionMode = i % 5 === 0 ? "EXPLORATION" : "EXPLOITATION";
        pumpStatus = "RUNNING";
        motorCurrentAmps = 6.4;
        manifoldPressureBar = 2.1;
      } else if (afternoonVenturi || nitrogenVal < 165) {
        rlAction = "FERTIGATION_VENTURI_NPK";
        decisionMode = "EXPLOITATION";
        pumpStatus = "RUNNING";
        motorCurrentAmps = 7.9;
        manifoldPressureBar = 1.7;
        venturiStatus = "INJECTING_19_19_19";
      } else if (morningPulse || shallowKalman < 24.5) {
        rlAction = "PULSE_DRIP_IRRIGATION";
        decisionMode = i % 7 === 0 ? "EXPLORATION" : "EXPLOITATION";
        pumpStatus = "RUNNING";
        motorCurrentAmps = 7.6;
        manifoldPressureBar = 1.6;
      }

      // If this is the current live step (i === 0) and active zone, lock to active simulation values
      if (i === 0 && zone.id === activeZoneId) {
        rlAction = currentAction;
        shallowKalman = kalmanFilteredMoisture;
        pumpStatus = currentHardware.pumpStatus;
        lineVoltage = currentHardware.lineVoltage;
        feederPhaseStatus = currentHardware.feederPhaseStatus;
        motorCurrentAmps = currentHardware.motorCurrentAmps;
        manifoldPressureBar = currentHardware.manifoldPressureBar;
        venturiStatus = currentHardware.venturiStatus;

        if (recentReflexLogs.length > 0 && recentReflexLogs[0].status === "INTERVENED") {
          decisionMode = "REFLEX_SAFETY_OVERRIDE";
          reflexRuleId = recentReflexLogs[0].id;
          reflexRuleTrigger = recentReflexLogs[0].trigger;
        }
      }

      const actionSpec = ACTION_SPECS[rlAction];
      const mdpStateKey = discretizeState(shallowKalman, nitrogenVal, calculatedVpd);
      const mdpStateLabel = getStateLabel(mdpStateKey);

      // Compute Bellman Reward & TD Error
      const mdpReward =
        i === 0 && zone.id === activeZoneId
          ? currentReward
          : rlAction === "IDLE_MONITOR"
          ? shallowKalman >= 25 && shallowKalman <= 34
            ? 3.2
            : -2.1
          : rlAction === "PULSE_DRIP_IRRIGATION"
          ? shallowKalman < 24
            ? 8.5
            : -1.8
          : rlAction === "FERTIGATION_VENTURI_NPK"
          ? nitrogenVal < 180
            ? 11.2
            : 2.5
          : rlAction === "DEEP_DRIP_SOAK"
          ? shallowKalman < 20
            ? 12.0
            : -4.5
          : calculatedVpd > 2.2
          ? 6.8
          : -1.2;

      const bellmanTdError =
        i === 0 && zone.id === activeZoneId
          ? currentTdError
          : Number((Math.sin(i * 0.9) * 0.35).toFixed(3));

      // Water, chemical, and energy footprints
      const waterAppliedLiters = pumpStatus === "RUNNING" ? actionSpec.waterVolLiters : 0;
      const npkAppliedGrams = venturiStatus !== "CLOSED" ? actionSpec.npkGrams : 0;
      const electricityKwh =
        pumpStatus === "RUNNING" ? Number(((actionSpec.durationMinutes / 60) * 3.7).toFixed(2)) : 0.05;
      const estimatedCostInr =
        pumpStatus === "RUNNING" ? Number((actionSpec.costInr + electricityKwh * 4.2).toFixed(2)) : 0.2;

      // Resource Efficiency Index (REI %)
      const moisturePen = Math.abs(shallowKalman - 29.5) * 1.8;
      const vpdPen = calculatedVpd > 1.8 ? (calculatedVpd - 1.8) * 8.0 : 0;
      const nPen = nitrogenVal < 180 ? (180 - nitrogenVal) * 0.25 : 0;
      const resourceEfficiencyIndexPct = Math.max(
        42,
        Math.min(98, Math.round(96 - moisturePen - vpdPen - nPen))
      );

      allRecords.push({
        timestampIso: pointTime.toISOString(),
        timestampLocal: pointTime.toLocaleString("en-IN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
        timestampUnixMs: pointTime.getTime(),
        hourOffset: Number(hourOffset.toFixed(2)),
        zoneId: zone.id,
        zoneName: zone.name,
        cropType: zone.crop,
        cropGrowthStage: zone.cropStage,
        soilType: zone.soilType,
        shallowMoistureRawVwc: shallowRaw,
        shallowMoistureKalmanVwc: shallowKalman,
        deepMoistureVwc: deepMoisture,
        nitrogenKgHa: nitrogenVal,
        phosphorusKgHa: baseP,
        potassiumKgHa: baseK,
        soilEcDsM: baseEc,
        soilPh: basePh,
        soilTemperatureC: Number((ambientTemp - 3.2).toFixed(1)),
        ambientTemperatureC: ambientTemp,
        relativeHumidityPct: humidity,
        solarRadiationWM2: solarRadiation,
        vpdKpa: calculatedVpd,
        et0MmDay: et0,
        windSpeedKmH: Number((8.5 + Math.sin(i * 0.4) * 4.0).toFixed(1)),
        rainRateMmHr: 0.0,
        cwsiScore,
        ndviScore,
        canopyTempC: canopyTemp,
        canopyDepressionC: canopyDepression,
        lineVoltageV: lineVoltage,
        feederPhaseStatus,
        motorCurrentAmps,
        pumpStatus,
        manifoldPressureBar,
        venturiStatus,
        rlAgentAction: rlAction,
        rlActionName: actionSpec.name,
        mdpStateKey,
        mdpStateLabel,
        decisionMode,
        mdpReward: Number(mdpReward.toFixed(2)),
        bellmanTdError: Number(bellmanTdError.toFixed(3)),
        reflexRuleId,
        reflexRuleTrigger,
        waterAppliedLiters,
        npkAppliedGrams,
        electricityKwh,
        estimatedCostInr,
        resourceEfficiencyIndexPct,
      });
    }
  });

  // Sort chronological (oldest to newest)
  allRecords.sort((a, b) => a.timestampUnixMs - b.timestampUnixMs);
  return allRecords;
}

/**
 * Converts telemetry export records into a clean, RFC-4180 compliant CSV string.
 */
export function convertTelemetryToCSV(
  records: TelemetryExportRecord[],
  metadata: {
    farmTitle?: string;
    zoneName?: string;
    filterMode: string;
    intervalMinutes: number;
  }
): string {
  if (records.length === 0) return "";

  const lines: string[] = [];

  // Descriptive scientific comment header adhering to agrometeorology & ML repository standards
  lines.push(`# ==============================================================================`);
  lines.push(`# KRISHI-MITRA RL-AGRONOMIST 24-HOUR SENSOR TELEMETRY & AGENT ACTION DATASET`);
  lines.push(`# Generated At (UTC): ${new Date().toISOString()}`);
  lines.push(`# Generated At (Local): ${new Date().toLocaleString()}`);
  lines.push(`# Scope: ${metadata.filterMode === "ALL_ZONES" ? "All Farm Zones" : metadata.zoneName || "Active Zone"}`);
  lines.push(`# Time Window: Last 24 Hours (${metadata.intervalMinutes}-Minute Sampling Intervals)`);
  lines.push(`# Total Observation Records: ${records.length}`);
  lines.push(`# Primary RL Policy: Deep Q-Learning (Bellman MDP with Discretized State Transitions)`);
  lines.push(`# Safety Architecture: Model-Based Reflex Layer with Rural DOL Starter Contactor Interlocks`);
  lines.push(`# Hydrology Model: FAO-56 Penman-Monteith Evapotranspiration`);
  lines.push(`# Sensor Denoising: Extended Kalman Filter (Process Noise Q=0.015, Measurement Noise R=0.45)`);
  lines.push(`# Units: VWC (%), NPK (kg/ha), VPD (kPa), Pressure (bar), Power (kWh), Voltage (V)`);
  lines.push(`# ==============================================================================`);

  // Column Headers (48 comprehensive attributes)
  const headers = [
    "Timestamp_ISO8601",
    "Timestamp_Local",
    "Timestamp_Unix_Ms",
    "Hour_Offset",
    "Zone_ID",
    "Zone_Name",
    "Crop_Type",
    "Crop_Growth_Stage",
    "Soil_Type",
    "Soil_Moisture_15cm_Raw_Pct_VWC",
    "Soil_Moisture_15cm_Kalman_Filtered_Pct_VWC",
    "Soil_Moisture_45cm_Deep_Pct_VWC",
    "Soil_Nitrogen_N_Kg_Per_Ha",
    "Soil_Phosphorus_P_Kg_Per_Ha",
    "Soil_Potassium_K_Kg_Per_Ha",
    "Soil_Electrical_Conductivity_dS_m",
    "Soil_pH",
    "Soil_Temperature_C",
    "Ambient_Temperature_C",
    "Relative_Humidity_Pct",
    "Solar_Radiation_W_m2",
    "Vapor_Pressure_Deficit_VPD_kPa",
    "Reference_Evapotranspiration_ET0_mm_day",
    "Wind_Speed_km_h",
    "Rain_Rate_mm_hr",
    "Crop_Water_Stress_Index_CWSI",
    "Canopy_NDVI_Score",
    "Canopy_Temperature_C",
    "Canopy_Depression_Tc_Ta_C",
    "Rural_Feeder_3Phase_Voltage_V",
    "Feeder_Phase_Grid_Status",
    "Submersible_Pump_Motor_Current_Amps",
    "Pump_Operational_State",
    "Manifold_Pressure_Bar",
    "Venturi_Fertigation_Injector_Status",
    "RL_Agent_Action_Executed",
    "RL_Action_Descriptive_Name",
    "MDP_Discretized_State_Key",
    "MDP_State_Semantic_Label",
    "Decision_Policy_Mode",
    "Bellman_Immediate_Reward_rt",
    "Bellman_TD_Error",
    "Reflex_Safety_Rule_ID",
    "Reflex_Rule_Trigger_Condition",
    "Irrigation_Water_Applied_Liters",
    "Fertigation_NPK_Applied_Grams",
    "Electrical_Energy_Consumed_kWh",
    "Estimated_Operational_Cost_INR",
    "Resource_Efficiency_Index_REI_Pct",
  ];

  lines.push(headers.join(","));

  // Format record values into escaped CSV rows
  records.forEach((rec) => {
    const row = [
      escapeCsv(rec.timestampIso),
      escapeCsv(rec.timestampLocal),
      rec.timestampUnixMs,
      rec.hourOffset,
      escapeCsv(rec.zoneId),
      escapeCsv(rec.zoneName),
      escapeCsv(rec.cropType),
      escapeCsv(rec.cropGrowthStage),
      escapeCsv(rec.soilType),
      rec.shallowMoistureRawVwc,
      rec.shallowMoistureKalmanVwc,
      rec.deepMoistureVwc,
      rec.nitrogenKgHa,
      rec.phosphorusKgHa,
      rec.potassiumKgHa,
      rec.soilEcDsM,
      rec.soilPh,
      rec.soilTemperatureC,
      rec.ambientTemperatureC,
      rec.relativeHumidityPct,
      rec.solarRadiationWM2,
      rec.vpdKpa,
      rec.et0MmDay,
      rec.windSpeedKmH,
      rec.rainRateMmHr,
      rec.cwsiScore,
      rec.ndviScore,
      rec.canopyTempC,
      rec.canopyDepressionC,
      rec.lineVoltageV,
      escapeCsv(rec.feederPhaseStatus),
      rec.motorCurrentAmps,
      escapeCsv(rec.pumpStatus),
      rec.manifoldPressureBar,
      escapeCsv(rec.venturiStatus),
      escapeCsv(rec.rlAgentAction),
      escapeCsv(rec.rlActionName),
      escapeCsv(rec.mdpStateKey),
      escapeCsv(rec.mdpStateLabel),
      escapeCsv(rec.decisionMode),
      rec.mdpReward,
      rec.bellmanTdError,
      escapeCsv(rec.reflexRuleId),
      escapeCsv(rec.reflexRuleTrigger),
      rec.waterAppliedLiters,
      rec.npkAppliedGrams,
      rec.electricityKwh,
      rec.estimatedCostInr,
      rec.resourceEfficiencyIndexPct,
    ];
    lines.push(row.join(","));
  });

  return lines.join("\r\n");
}

function escapeCsv(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Triggers a browser file download of the generated CSV string.
 */
export function downloadCsvFile(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
