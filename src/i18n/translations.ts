export type Language = 'en' | 'hi' | 'mr';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeName: string;
  region: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English', region: 'Global / Indian Agro' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी', region: 'उत्तर एवं मध्य भारत' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी', region: 'महाराष्ट्र / विदर्भ' },
];

export interface Translations {
  common: {
    online: string;
    offline: string;
    normal: string;
    critical: string;
    warning: string;
    healthy: string;
    optimal: string;
    error: string;
    refresh: string;
    retry: string;
    close: string;
    apply: string;
    dismiss: string;
    clearAll: string;
    export: string;
    exporting: string;
    save: string;
    success: string;
    details: string;
  };
  header: {
    appTitle: string;
    versionTag: string;
    appSubtitle: string;
    mqttGateway: string;
    gatewayOnline: string;
    gatewayStoreAndForward: string;
    gridStatus: string;
    phaseNormal: string;
    singlePhasing: string;
    reflexPolicy: string;
    intervened: string;
    optimizing: string;
    alerts: string;
    zones: string;
    runAgent: string;
    pauseAgent: string;
    step: string;
    stepTooltip: string;
    speed: string;
    simulateDisturbance: string;
    exportData: string;
    aiAgronomist: string;
    language: string;
  };
  cctv: {
    title: string;
    liveFeed: string;
    rgbVisual: string;
    ndviSynthetic: string;
    thermalCanopy: string;
    edgeDeficit: string;
    healthyCanopy: string;
    waterStress: string;
    nitrogenDeficiency: string;
    heatStress: string;
    ndviScore: string;
    canopyTemp: string;
    runDiagnosis: string;
    analyzing: string;
    cameraActive: string;
    pestDetected: string;
    pestAlert: string;
    multiClassTitle: string;
    bollworm: string;
    aphids: string;
    whitefly: string;
    stemBorer: string;
    economicThreshold: string;
    organicRemedy: string;
    chemicalRemedy: string;
  };
  sensors: {
    title: string;
    subtitle: string;
    shallowMoisture: string;
    shallowDesc: string;
    deepMoisture: string;
    deepDesc: string;
    canopyTemp: string;
    canopyDesc: string;
    ambientHumidity: string;
    humidityDesc: string;
    soilNitrogen: string;
    nitrogenDesc: string;
    kalmanFiltered: string;
    simulateDrift: string;
    vpd: string;
    et0: string;
    optimalRange: string;
  };
  hardware: {
    title: string;
    subtitle: string;
    starterRelay: string;
    pumpRunning: string;
    pumpTripped: string;
    pumpStandby: string;
    gridFeeder: string;
    lineVoltage: string;
    dripValves: string;
    valveOpen: string;
    valveClosed: string;
    manualPump: string;
    resetFault: string;
    simulateTrip: string;
    mqttDiagnostics: string;
    packetRate: string;
    totalPackets: string;
    droppedPackets: string;
    latency: string;
    splitView: string;
    trafficChart: string;
    packetStream: string;
  };
  kalman: {
    title: string;
    subtitle: string;
    rawSignal: string;
    estimatedState: string;
    kalmanGain: string;
    noiseSuppression: string;
    processNoise: string;
    measurementNoise: string;
    filterConvergence: string;
  };
  rl: {
    title: string;
    subtitle: string;
    currentState: string;
    selectedAction: string;
    bellmanReward: string;
    tdError: string;
    explorationRate: string;
    totalTransitions: string;
    explainDecision: string;
    explaining: string;
    actions: {
      optimalDrip: string;
      holdForRain: string;
      boostPulse: string;
      aerationPause: string;
      reduceRate: string;
    };
  };
  yield: {
    title: string;
    subtitle: string;
    projectedYield: string;
    baselineAverage: string;
    waterSaved: string;
    stressDays: string;
    gddAccumulated: string;
    refineModel: string;
    refining: string;
    trendTitle: string;
  };
  weather: {
    title: string;
    searchGrounded: string;
    regionalAgromet: string;
    agrometDirective: string;
    expectedPrecipitation: string;
    avgEt0: string;
    sources: string;
    hideSources: string;
    refresh: string;
    fetching: string;
    agrometEngine: string;
    today: string;
    maxTemp: string;
    minTemp: string;
    rainProb: string;
  };
  stressModal: {
    title: string;
    subtitle: string;
    heatWave: string;
    heatWaveDesc: string;
    canalClosure: string;
    canalClosureDesc: string;
    voltageSag: string;
    voltageSagDesc: string;
    sensorNoise: string;
    sensorNoiseDesc: string;
    monsoonSurge: string;
    monsoonSurgeDesc: string;
    restoreOptimal: string;
    restoreOptimalDesc: string;
    injectButton: string;
    close: string;
  };
  aiModal: {
    title: string;
    subtitle: string;
    reRunAnalysis: string;
    consulting: string;
    primaryStress: string;
    confidence: string;
    ndviAnalysis: string;
    recommendations: string;
    waterDose: string;
    fertigation: string;
    urgency: string;
    contextTitle: string;
    close: string;
  };
  heatmap: {
    title: string;
    subtitle: string;
    resourceEfficiencyIndex: string;
    currentStrategy: string;
    benchmarkTarget: string;
    underperformingAlert: string;
    allZonesView: string;
    underperformingOnly: string;
    waterEfficiency: string;
    cwsiIndex: string;
    lateralPressure: string;
    underperformingBadge: string;
    optimalBadge: string;
    jumpToZone: string;
    applyOptimization: string;
    sectors: string;
    overallMean: string;
    lateralHeader: string;
    midLateral: string;
    tailEnd: string;
    primaryStressFactor: string;
    limitingFactor: string;
    stressMetric: string;
    efficiencyImpact: string;
    recommendedRemediation: string;
    hoverTooltipHint: string;
    stressFactors: {
      lowMoisture: string;
      highVpd: string;
      lowNitrogen: string;
      lowPressure: string;
      gridSag: string;
      waterlogging: string;
      optimalEquilibrium: string;
    };
  };
  exportTelemetry: {
    modalTitle: string;
    modalSubtitle: string;
    downloadCsv: string;
    downloading: string;
    zoneScope: string;
    currentZoneOnly: string;
    allZones: string;
    samplingInterval: string;
    interval15m: string;
    interval30m: string;
    interval60m: string;
    includedSubsystems: string;
    subsystems: {
      sensors: string;
      climate: string;
      hardware: string;
      rlReflex: string;
    };
    previewTitle: string;
    totalRecords: string;
    totalColumns: string;
    timeHorizon: string;
    last24Hours: string;
    fileFormat: string;
    rfcCompliant: string;
    toastTitle: string;
    toastDesc: string;
  };
  fertilizerScheduler: {
    title: string;
    subtitle: string;
    venturiInjector: string;
    soilNpkStatus: string;
    optimalRange: string;
    activeSchedules: string;
    newSchedule: string;
    dosingLogs: string;
    recipe: string;
    doseAmount: string;
    intervalCadence: string;
    deficitThreshold: string;
    nextDoseIn: string;
    doseNow: string;
    pause: string;
    resume: string;
    delete: string;
    createSchedule: string;
    autoPreset: string;
    interlockNotice: string;
    dosingActive: string;
    successDose: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      online: 'ONLINE',
      offline: 'OFFLINE',
      normal: 'Normal',
      critical: 'Critical',
      warning: 'Warning',
      healthy: 'Healthy',
      optimal: 'Optimal',
      error: 'Error',
      refresh: 'Refresh',
      retry: 'Retry',
      close: 'Close',
      apply: 'Apply',
      dismiss: 'Dismiss',
      clearAll: 'Clear All',
      export: 'Export Data',
      exporting: 'Exporting...',
      save: 'Saved / Exported',
      success: 'Success',
      details: 'Details',
    },
    header: {
      appTitle: 'KrishiNet',
      versionTag: 'AGRO-AGENT v3.4',
      appSubtitle:
        'Model-Based Reflex Agent • Kalman State Estimator • Q-Learning & MDP Optimizer • Indian MQTT Edge Gateway',
      mqttGateway: 'MQTT Gateway',
      gatewayOnline: 'ONLINE',
      gatewayStoreAndForward: 'LOCAL STORE & FORWARD',
      gridStatus: '3-Phase Grid',
      phaseNormal: 'Normal',
      singlePhasing: 'Single-Phasing!',
      reflexPolicy: 'Reflex Policy',
      intervened: 'INTERVENED',
      optimizing: 'OPTIMIZING',
      alerts: 'Alerts',
      zones: 'Zones',
      runAgent: 'Run Agent',
      pauseAgent: 'Pause',
      step: 'Step',
      stepTooltip:
        'Execute 1 discrete step (Kalman update -> MDP state evaluation -> Reflex/Q action)',
      speed: 'Speed',
      simulateDisturbance: 'Simulate Disturbance',
      exportData: 'Export Data',
      aiAgronomist: 'AI Agronomist',
      language: 'Language',
    },
    cctv: {
      title: 'CCTV Autonomous Crop Vision',
      liveFeed: 'LIVE CANOPY FEED',
      rgbVisual: 'RGB Visual',
      ndviSynthetic: 'NDVI Synthetic',
      thermalCanopy: 'Thermal Canopy',
      edgeDeficit: 'Edge Deficit Map',
      healthyCanopy: 'Healthy Canopy',
      waterStress: 'Water Deficit Stress',
      nitrogenDeficiency: 'Nitrogen Deficiency',
      heatStress: 'Extreme Heat / VPD Stress',
      ndviScore: 'NDVI Reflectance',
      canopyTemp: 'Canopy Temp',
      runDiagnosis: 'Run AI Vision Diagnosis',
      analyzing: 'Analyzing Canopy...',
      cameraActive: 'Camera Active (1080p IR)',
      pestDetected: 'Pest Infestation Detected',
      pestAlert: 'Agricultural Pest Warning',
      multiClassTitle: 'Multi-Class Neural Vision Detection',
      bollworm: 'Pink / American Bollworm',
      aphids: 'Cotton Aphids / Jassids',
      whitefly: 'Silverleaf Whitefly',
      stemBorer: 'Yellow Stem Borer',
      economicThreshold: 'Economic Threshold (ETL)',
      organicRemedy: 'Organic / IPM Remedy',
      chemicalRemedy: 'Chemical Recommendation',
    },
    sensors: {
      title: '5-Sensor Telemetry Matrix',
      subtitle: 'Root zone & micro-meteorology live signals',
      shallowMoisture: 'Shallow Soil Moisture (15cm VWC)',
      shallowDesc: 'Topsoil drip infiltration layer',
      deepMoisture: 'Deep Root Zone Moisture (45cm VWC)',
      deepDesc: 'Sub-surface percolation reserve',
      canopyTemp: 'Canopy Infrared Temperature',
      canopyDesc: 'Stomatal transpirational cooling indicator',
      ambientHumidity: 'Ambient Relative Humidity',
      humidityDesc: 'Field microclimate sensor',
      soilNitrogen: 'Soil Available Nitrogen (NPK-N)',
      nitrogenDesc: 'Optical spectrophotometric probe',
      kalmanFiltered: 'Kalman Filtered',
      simulateDrift: 'Simulate Sensor Drift',
      vpd: 'Vapor Pressure Deficit',
      et0: 'Evapotranspiration',
      optimalRange: 'Optimal Operating Range',
    },
    hardware: {
      title: 'Indian Farming Hardware & Edge Gateway',
      subtitle: 'Kirloskar/Texmo 3-Phase Starter Relay & Jain Drip Automation',
      starterRelay: 'Starter Relay',
      pumpRunning: 'PUMP RUNNING',
      pumpTripped: 'VOLTAGE TRIP',
      pumpStandby: 'STANDBY',
      gridFeeder: 'Feeder Grid',
      lineVoltage: 'Line Voltage',
      dripValves: 'Jain Drip Solenoids',
      valveOpen: 'OPEN',
      valveClosed: 'CLOSED',
      manualPump: 'Manual Pump Override',
      resetFault: 'Reset Voltage Fault',
      simulateTrip: 'Simulate Phase Trip',
      mqttDiagnostics: 'MQTT Packet Rate & Bottleneck Diagnostics',
      packetRate: 'pkts/sec',
      totalPackets: 'Total Packets',
      droppedPackets: 'Dropped',
      latency: 'Gateway Latency',
      splitView: 'Split View',
      trafficChart: 'Traffic Chart',
      packetStream: 'Packet Stream',
    },
    kalman: {
      title: 'Kalman Filter Signal Processing',
      subtitle: 'Suppresses pump starter capacitive switching spikes & noisy sensor jitter',
      rawSignal: 'Raw Noisy Sensor',
      estimatedState: 'Kalman Filtered State',
      kalmanGain: 'Kalman Gain (K)',
      noiseSuppression: 'Noise Variance Suppression',
      processNoise: 'Process Noise (Q)',
      measurementNoise: 'Measurement Noise (R)',
      filterConvergence: 'Filter Convergence',
    },
    rl: {
      title: 'Model-Based Reflex Agent (MDP + Q-Learning)',
      subtitle: 'Markov Decision Process optimization for Indian water scarcity and yield penalty',
      currentState: 'Current State',
      selectedAction: 'Selected Action',
      bellmanReward: 'Bellman Reward',
      tdError: 'TD Error',
      explorationRate: 'Exploration Rate (ε)',
      totalTransitions: 'Total Transitions',
      explainDecision: 'Explain Decision via AI',
      explaining: 'Explaining...',
      actions: {
        optimalDrip: 'Optimal Pulse Drip',
        holdForRain: 'Hold for Rain',
        boostPulse: 'Boost Pulse Duration',
        aerationPause: 'Root Aeration Pause',
        reduceRate: 'Reduce Drip Rate',
      },
    },
    yield: {
      title: 'Predictive Yield & Agrometeorology Model',
      subtitle: 'Crop evapotranspiration & 7-day regression yield forecasting',
      projectedYield: 'Projected Yield',
      baselineAverage: 'Baseline District Average',
      waterSaved: 'Irrigation Water Saved',
      stressDays: 'Cumulative Stress Days',
      gddAccumulated: 'GDD Accumulated',
      refineModel: 'Refine Model via AI',
      refining: 'Refining...',
      trendTitle: 'Historical Yield Progression',
    },
    weather: {
      title: '7-Day Localized Weather Trends',
      searchGrounded: 'Live Search Grounded',
      regionalAgromet: 'Regional Agromet Model',
      agrometDirective: 'Irrigation Context & Agromet Directive',
      expectedPrecipitation: 'Precipitation expected',
      avgEt0: 'Avg ET0',
      sources: 'Sources',
      hideSources: 'Hide Sources',
      refresh: 'Refresh',
      fetching: 'Fetching...',
      agrometEngine: 'Agromet Engine',
      today: 'Today',
      maxTemp: 'Max',
      minTemp: 'Min',
      rainProb: 'Rain Prob',
    },
    stressModal: {
      title: 'Inject Agronomic Disturbance Scenario',
      subtitle: 'Test reflex agent, Kalman filter resilience, and fallback safety protocols',
      heatWave: 'Vidarbha Heat Spike (43°C & High VPD)',
      heatWaveDesc: 'Elevated canopy temperature, rapid topsoil desiccation, severe stomatal closure risk.',
      canalClosure: 'Canal Water Rationing (Root Zone Drought)',
      canalClosureDesc: 'Both shallow and deep moisture drop below critical wilting points.',
      voltageSag: 'Rural 3-Phase Single Phasing Trip',
      voltageSagDesc: 'Feeder voltage drops to 162V causing starter relay overload trip.',
      sensorNoise: 'Capacitive Starter Sensor Drift',
      sensorNoiseDesc: 'Induces high-frequency electrical jitter into shallow moisture ADC reading.',
      monsoonSurge: 'Pre-Monsoon Cloudburst (Heavy Precipitation)',
      monsoonSurgeDesc: 'Soil saturation waterlogging risk with sudden drop in transpirational demand.',
      restoreOptimal: 'Restore Optimal Conditions',
      restoreOptimalDesc: 'Resets 5-sensor matrix to optimal field capacity (30% VWC, 210 kg/ha N, 415V healthy grid, 28°C ambient, low VPD).',
      injectButton: 'Inject Disturbance',
      close: 'Close',
    },
    aiModal: {
      title: 'AI Agronomist Diagnosis & Technical Consultation',
      subtitle: 'Specialized in ICAR, PAU, and TNAU agronomic guidelines for Indian crops',
      reRunAnalysis: 'Re-run AI Analysis',
      consulting: 'Consulting Gemini Agro-Model...',
      primaryStress: 'Primary Agronomic Stress',
      confidence: 'Model Confidence',
      ndviAnalysis: 'NDVI Reflectance Analysis',
      recommendations: 'Recommended Interventions',
      waterDose: 'Irrigation Liters / m²',
      fertigation: 'NPK Fertigation Recommendation',
      urgency: 'Intervention Urgency',
      contextTitle: 'Indian Agro-Climatic Context',
      close: 'Close',
    },
    heatmap: {
      title: 'Resource Efficiency Heatmap',
      subtitle: 'Zone-level spatial efficiency matrix relative to current irrigation & fertigation strategy',
      resourceEfficiencyIndex: 'Resource Efficiency Index (REI)',
      currentStrategy: 'Current Irrigation Strategy',
      benchmarkTarget: 'Benchmark Target',
      underperformingAlert: 'Underperforming Sectors Detected',
      allZonesView: 'All 4 Farm Zones (16 Lateral Sectors)',
      underperformingOnly: 'Underperforming Areas Only (< 75% REI)',
      waterEfficiency: 'Water Delivery Uniformity',
      cwsiIndex: 'Crop Water Stress (CWSI)',
      lateralPressure: 'Lateral Emitter Pressure',
      underperformingBadge: 'Underperforming',
      optimalBadge: 'Optimal Efficiency',
      jumpToZone: 'Inspect & Select Zone',
      applyOptimization: 'Remediate Strategy',
      sectors: 'Sectors',
      overallMean: 'Farm-wide Mean REI',
      lateralHeader: 'Header Lateral (Inlet)',
      midLateral: 'Mid Lateral Run',
      tailEnd: 'Tail-End Lateral',
      primaryStressFactor: 'Primary Stress Factor',
      limitingFactor: 'Limiting Factor',
      stressMetric: 'Limiting Metric',
      efficiencyImpact: 'Efficiency Impact',
      recommendedRemediation: 'Recommended Action',
      hoverTooltipHint: 'Hover to inspect primary stress factor & root cause',
      stressFactors: {
        lowMoisture: 'Low Soil Moisture',
        highVpd: 'High VPD',
        lowNitrogen: 'Low Nitrogen',
        lowPressure: 'Low Lateral Pressure',
        gridSag: '3-Phase Grid Voltage Sag',
        waterlogging: 'Soil Waterlogging',
        optimalEquilibrium: 'Optimal Dynamic Equilibrium',
      },
    },
    exportTelemetry: {
      modalTitle: 'Export 24-Hour Telemetry & RL Action Dataset',
      modalSubtitle:
        'Download calibrated time-series data of 5-sensor telemetry, micrometeorology, Kalman states, and RL agent actions for professional analysis in Excel, Python/pandas, or R.',
      downloadCsv: 'Download 24h CSV Dataset',
      downloading: 'Compiling Dataset...',
      zoneScope: 'Zone Selection',
      currentZoneOnly: 'Active Zone Only',
      allZones: 'All Farm Zones (All 4 Blocks)',
      samplingInterval: 'Sampling Frequency',
      interval15m: '15-Min Intervals (96 rows/zone)',
      interval30m: '30-Min Intervals (48 rows/zone - Recommended)',
      interval60m: '1-Hour Intervals (24 rows/zone)',
      includedSubsystems: 'Subsystems Included in Dataset',
      subsystems: {
        sensors: 'Root Zone Telemetry (15/45cm VWC, NPK, EC, pH)',
        climate: 'Agrometeorology & Canopy (VPD, Solar, CWSI, ET0)',
        hardware: 'Electrical & Hydraulic (415V, Amps, Pressure, Venturi)',
        rlReflex: 'RL Agent & Reflex Layer (Bellman Rewards, Actions, Rules)',
      },
      previewTitle: 'Dataset Preview (Latest Records)',
      totalRecords: 'Total Records',
      totalColumns: 'Attribute Columns',
      timeHorizon: 'Time Horizon',
      last24Hours: 'Last 24 Hours',
      fileFormat: 'Format',
      rfcCompliant: 'RFC-4180 CSV with Metadata Header',
      toastTitle: '24-Hour Telemetry Dataset Exported',
      toastDesc: '24-hour time series containing sensor telemetry, climate metrics, and RL actions downloaded as CSV.',
    },
    fertilizerScheduler: {
      title: 'Automated NPK Fertilizer Scheduler',
      subtitle: 'Schedule precision Venturi chem-injection cycles driven by real-time soil NPK sensors and crop growth stages.',
      venturiInjector: 'Venturi Dosing System',
      soilNpkStatus: 'Soil NPK Telemetry & Deficit Analysis',
      optimalRange: 'Optimal Range',
      activeSchedules: 'Active Schedules',
      newSchedule: 'New Automated Schedule',
      dosingLogs: 'Injection Logs',
      recipe: 'Fertilizer Formulation',
      doseAmount: 'Dosing Volume',
      intervalCadence: 'Simulation Interval Cadence',
      deficitThreshold: 'Sensor Deficit Threshold',
      nextDoseIn: 'Next dose in',
      doseNow: 'Dose Now',
      pause: 'Pause',
      resume: 'Resume',
      delete: 'Delete',
      createSchedule: 'Save Automated Schedule',
      autoPreset: 'Auto-Recommend for Deficit',
      interlockNotice: 'DOL Pump Interlock: Motor offline due to grid sag (< 340V). Dosing deferred until 415V feeder recovers.',
      dosingActive: 'VENTURI INJECTION ACTIVE',
      successDose: 'Automated NPK fertigation pulse executed successfully.',
    },
  },

  hi: {
    common: {
      online: 'ऑनलाइन',
      offline: 'ऑफलाइन',
      normal: 'सामान्य',
      critical: 'गंभीर / संकटपूर्ण',
      warning: 'चेतावनी',
      healthy: 'स्वस्थ',
      optimal: 'अनुकूलतम',
      error: 'त्रुटि',
      refresh: 'ताज़ा करें',
      retry: 'पुनः प्रयास करें',
      close: 'बंद करें',
      apply: 'लागू करें',
      dismiss: 'हटाएं',
      clearAll: 'सभी हटाएं',
      export: 'डेटा निर्यात करें',
      exporting: 'निर्यात हो रहा है...',
      save: 'सुरक्षित / निर्यातित',
      success: 'सफल',
      details: 'विवरण',
    },
    header: {
      appTitle: 'कृषि-नेट',
      versionTag: 'एग्रो-एजेंट v3.4',
      appSubtitle:
        'मॉडल-आधारित रिफ्लेक्स एजेंट • कालमन स्टेट एस्टिमेटर • क्यू-लर्निंग एवं एमडीपी अनुकूलक • भारतीय एमक्यूटीटी एज गेटवे',
      mqttGateway: 'एमक्यूटीटी गेटवे',
      gatewayOnline: 'ऑनलाइन',
      gatewayStoreAndForward: 'स्थानीय संचय एवं प्रेषण',
      gridStatus: '३-फेज ग्रिड',
      phaseNormal: 'सामान्य',
      singlePhasing: 'सिंगल-फेजिंग फॉल्ट!',
      reflexPolicy: 'रिफ्लेक्स नीति',
      intervened: 'हस्तक्षेप सक्रिय',
      optimizing: 'अनुकूलन जारी',
      alerts: 'अलर्ट',
      zones: 'क्षेत्र (प्लॉट)',
      runAgent: 'एजेंट चलाएं',
      pauseAgent: 'रोकें',
      step: 'एक कदम',
      stepTooltip:
        '१ चरण निष्पादित करें (कालमन अपडेट -> एमडीपी स्थिति मूल्यांकन -> रिफ्लेक्स/क्यू कार्रवाई)',
      speed: 'गति',
      simulateDisturbance: 'तनाव सिमुलेशन',
      exportData: 'डेटा निर्यात',
      aiAgronomist: 'एआई कृषि विशेषज्ञ',
      language: 'भाषा (Language)',
    },
    cctv: {
      title: 'सीसीटीवी स्वायत्त फसल निगरानी',
      liveFeed: 'सजीव वितान (कैनोपी) दृश्य',
      rgbVisual: 'आरजीबी सामान्य दृश्य',
      ndviSynthetic: 'एनडीवीआई सिंथेटिक',
      thermalCanopy: 'कैनोपी थर्मल तापमान',
      edgeDeficit: 'नमी कमी मानचित्र',
      healthyCanopy: 'स्वस्थ फसल वितान',
      waterStress: 'जल तनाव (सूखा)',
      nitrogenDeficiency: 'नाइट्रोजन की कमी',
      heatStress: 'अत्यधिक ताप / वीपीडी तनाव',
      ndviScore: 'एनडीवीआई सूचकांक',
      canopyTemp: 'पत्तियों का तापमान',
      runDiagnosis: 'एआई फसल निदान चलाएं',
      analyzing: 'वितान विश्लेषण जारी...',
      cameraActive: 'कैमरा सक्रिय (1080p आईआर)',
      pestDetected: 'कृषि कीट संक्रमण का पता चला',
      pestAlert: 'हानिकारक कीट चेतावनी',
      multiClassTitle: 'मल्टी-क्लास न्यूरल विज़न पहचान',
      bollworm: 'गुलाबी / अमेरिकन बोंड इल्ली',
      aphids: 'माहू / चेपा कीट',
      whitefly: 'सफेद मक्खी कीट',
      stemBorer: 'पीला तना छेदक',
      economicThreshold: 'आर्थिक क्षति स्तर (ETL)',
      organicRemedy: 'जैविक / आईपीएम उपचार',
      chemicalRemedy: 'रासायनिक कीटनाशक सिफारिश',
    },
    sensors: {
      title: '५-सेंसर टेलीमेट्री मैट्रिक्स',
      subtitle: 'जड़ क्षेत्र एवं सूक्ष्म-मौसम के सजीव सिग्नल',
      shallowMoisture: 'ऊपरी मिट्टी की नमी (१५ सेमी)',
      shallowDesc: 'ड्रिप अंतःस्यंदन ऊपरी परत',
      deepMoisture: 'गहरी जड़ क्षेत्र नमी (४५ सेमी)',
      deepDesc: 'निचली रिसाव जल संचय परत',
      canopyTemp: 'कैनोपी इन्फ्रारेड तापमान',
      canopyDesc: 'रंध्रीय वाष्पोत्सर्जन शीतलन संकेतक',
      ambientHumidity: 'परिवेशी सापेक्ष आर्द्रता',
      humidityDesc: 'खेत का सूक्ष्म-जलवायु सेंसर',
      soilNitrogen: 'मृदा उपलब्ध नाइट्रोजन (NPK-N)',
      nitrogenDesc: 'ऑप्टिकल स्पेक्ट्रोफोटोमेट्रिक जांच',
      kalmanFiltered: 'कालमन द्वारा शुद्ध',
      simulateDrift: 'सेंसर विचलन सिमुलेट करें',
      vpd: 'वाष्प दाब अभाव (VPD)',
      et0: 'वाष्पोत्सर्जन दर (ET0)',
      optimalRange: 'अनुकूलतम संचालन सीमा',
    },
    hardware: {
      title: 'भारतीय कृषि हार्डवेयर एवं एज गेटवे',
      subtitle: 'किर्लोस्कर / टेक्समो ३-फेज स्टार्टर रिले एवं जैन ड्रिप ऑटोमेशन',
      starterRelay: 'स्टार्टर रिले',
      pumpRunning: 'पंप चालू है',
      pumpTripped: 'वोल्टेज ट्रिप!',
      pumpStandby: 'स्टैंडबाय मोड',
      gridFeeder: 'ग्रामीण फीडर बिजली',
      lineVoltage: 'लाइन वोल्टेज',
      dripValves: 'जैन ड्रिप सोलेनोइड वाल्व',
      valveOpen: 'खुला है',
      valveClosed: 'बंद है',
      manualPump: 'मैनुअल पंप स्टार्ट',
      resetFault: 'वोल्टेज फॉल्ट रीसेट',
      simulateTrip: 'फेज ट्रिप सिमुलेट करें',
      mqttDiagnostics: 'एमक्यूटीटी पैकेट दर एवं अड़चन निदान',
      packetRate: 'पैकेट/सेकंड',
      totalPackets: 'कुल पैकेट',
      droppedPackets: 'ड्रॉप पैकेट',
      latency: 'गेटवे विलंबता',
      splitView: 'विभाजित दृश्य',
      trafficChart: 'ट्रैफिक चार्ट',
      packetStream: 'पैकेट स्ट्रीम',
    },
    kalman: {
      title: 'कालमन फिल्टर सिग्नल प्रोसेसिंग',
      subtitle: 'पंप स्टार्टर स्विचिंग स्पाइक्स एवं सेंसर के अवांछित शोर का निवारण',
      rawSignal: 'अपरिष्कृत (शोरयुक्त) सेंसर',
      estimatedState: 'कालमन अनुमानित स्थिति',
      kalmanGain: 'कालमन गेन (K)',
      noiseSuppression: 'शोर प्रसरण निवारण',
      processNoise: 'प्रक्रिया शोर (Q)',
      measurementNoise: 'मापन शोर (R)',
      filterConvergence: 'फिल्टर स्थिरता',
    },
    rl: {
      title: 'मॉडल-आधारित रिफ्लेक्स एजेंट (MDP + Q-Learning)',
      subtitle: 'भारतीय जल संरक्षण एवं फसल उपज अनुकूलन हेतु मार्कोव निर्णय प्रक्रिया',
      currentState: 'वर्तमान स्थिति',
      selectedAction: 'चयनित कार्रवाई',
      bellmanReward: 'बेलमैन प्रतिफल (Reward)',
      tdError: 'टीडी त्रुटि (TD Error)',
      explorationRate: 'अन्वेषण दर (ε)',
      totalTransitions: 'कुल स्थितियां (Transitions)',
      explainDecision: 'निर्णय का कारण समझें (एआई)',
      explaining: 'विश्लेषण जारी...',
      actions: {
        optimalDrip: 'अनुकूल पल्स ड्रिप',
        holdForRain: 'बारिश हेतु सिंचाई रोकें',
        boostPulse: 'पल्स अवधि बढ़ाएं (गर्मी)',
        aerationPause: 'जड़ वातन विराम (ऑक्सीजन)',
        reduceRate: 'ड्रिप प्रवाह दर घटाएं',
      },
    },
    yield: {
      title: 'पैदावार एवं कृषि-मौसम पूर्वानुमान मॉडल',
      subtitle: 'फसल वाष्पोत्सर्जन एवं ७-दिवसीय रिग्रेशन उपज भविष्यवाणी',
      projectedYield: 'अनुमानित उपज',
      baselineAverage: 'जिला औसत आधार उपज',
      waterSaved: 'बचाया गया सिंचाई जल',
      stressDays: 'संचयी तनाव के दिन',
      gddAccumulated: 'संचयी ऊष्मा इकाई (GDD)',
      refineModel: 'एआई द्वारा मॉडल सुधारें',
      refining: 'मॉडल परिष्कृत हो रहा है...',
      trendTitle: 'ऐतिहासिक उपज प्रगति रुझान',
    },
    weather: {
      title: '७-दिवसीय स्थानीय मौसम रुझान',
      searchGrounded: 'सजीव सर्च आधारित',
      regionalAgromet: 'क्षेत्रीय कृषि-मौसम मॉडल',
      agrometDirective: 'सिंचाई संदर्भ एवं मौसम निर्देश',
      expectedPrecipitation: 'अनुमानित कुल वर्षा',
      avgEt0: 'औसत ET0',
      sources: 'मौसम स्रोत',
      hideSources: 'स्रोत छिपाएं',
      refresh: 'ताज़ा करें',
      fetching: 'ला रहे हैं...',
      agrometEngine: 'कृषि-मौसम इंजन',
      today: 'आज',
      maxTemp: 'अधिकतम',
      minTemp: 'न्यूनतम',
      rainProb: 'वर्षा संभावना',
    },
    stressModal: {
      title: 'फसल तनाव (डिस्टर्बेंस) सिमुलेट करें',
      subtitle: 'रिफ्लेक्स एजेंट, कालमन फिल्टर एवं सुरक्षा प्रणालियों की क्षमता परखें',
      heatWave: 'विदर्भ भीषण ताप लहर (४३°C एवं उच्च VPD)',
      heatWaveDesc: 'पत्तियों का तापमान उच्च, ऊपरी मिट्टी का तेज सूखना, रंध्र बंद होने का गंभीर संकट।',
      canalClosure: 'नहर जल बंदी (जड़ क्षेत्र सूखा)',
      canalClosureDesc: 'ऊपरी और गहरी मिट्टी दोनों में नमी मुरझाने की बिंदु से नीचे चली जाती है।',
      voltageSag: 'ग्रामीण ३-फेज सिंगल-फेजिंग ट्रिप',
      voltageSagDesc: 'फीडर वोल्टेज १६२V तक गिरकर स्टार्टर रिले को ओवरलोड ट्रिप करा देता है।',
      sensorNoise: 'स्टार्टर रिले कैपेसिटिव सेंसर विचलन',
      sensorNoiseDesc: 'ऊपरी नमी सेंसर के एडीसी सिग्नल में तेज इलेक्ट्रिकल शोर पैदा करता है।',
      monsoonSurge: 'मानसून पूर्व मूसलाधार बारिश',
      monsoonSurgeDesc: 'मिट्टी में जलभराव का खतरा एवं वाष्पोत्सर्जन मांग में अचानक तीव्र गिरावट।',
      restoreOptimal: 'सामान्य अनुकूलतम स्थिति बहाल करें',
      restoreOptimalDesc: '५-सेंसर मैट्रिक्स को आदर्श खेत क्षमता (३०% VWC, २१० किग्रा/हे. N, ४१५V ग्रिड) पर रीसेट करता है।',
      injectButton: 'तनाव लागू करें',
      close: 'बंद करें',
    },
    aiModal: {
      title: 'एआई कृषि विशेषज्ञ निदान एवं तकनीकी परामर्श',
      subtitle: 'भारतीय कृषि अनुसंधान परिषद (ICAR) एवं पीएयू दिशा-निर्देशों पर आधारित',
      reRunAnalysis: 'पुनः विश्लेषण करें',
      consulting: 'जेमिनी एग्रो-मॉडल से परामर्श जारी...',
      primaryStress: 'प्रमुख कृषि तनाव',
      confidence: 'मॉडल विश्वसनीयता',
      ndviAnalysis: 'एनडीवीआई परावर्तन विश्लेषण',
      recommendations: 'अनुशंसित कृषि उपाय',
      waterDose: 'सिंचाई मात्रा (लीटर / वर्ग मीटर)',
      fertigation: 'एनपीके फर्टिगेशन अनुपात',
      urgency: 'हस्तक्षेप तत्परता',
      contextTitle: 'भारतीय कृषि-जलवायु संदर्भ',
      close: 'बंद करें',
    },
    heatmap: {
      title: 'संसाधन कार्यक्षमता हीटमैप',
      subtitle: 'मौजूदा सिंचाई एवं फर्टिगेशन रणनीति के सापेक्ष सभी कृषि क्षेत्रों का स्थानिक दक्षता मैट्रिक्स',
      resourceEfficiencyIndex: 'संसाधन कार्यक्षमता सूचकांक (REI)',
      currentStrategy: 'सक्रिय सिंचाई रणनीति',
      benchmarkTarget: 'मानक लक्ष्य',
      underperformingAlert: 'कम कार्यक्षमता वाले क्षेत्र पहचाने गए',
      allZonesView: 'सभी ४ कृषि क्षेत्र (१६ लेटरल उप-खंड)',
      underperformingOnly: 'केवल कम कुशल क्षेत्र (< ७५% REI)',
      waterEfficiency: 'जल वितरण एकरूपता',
      cwsiIndex: 'फसल जल तनाव (CWSI)',
      lateralPressure: 'लेटरल एमीटर दबाव',
      underperformingBadge: 'कम कुशल / सुधार आवश्यक',
      optimalBadge: 'अनुकूलतम कार्यक्षमता',
      jumpToZone: 'क्षेत्र चुनें व जांचें',
      applyOptimization: 'रणनीति में सुधार करें',
      sectors: 'उप-खंड',
      overallMean: 'समग्र कृषि औसत REI',
      lateralHeader: 'हेडर लेटरल (प्रवेश)',
      midLateral: 'मध्य लेटरल खंड',
      tailEnd: 'अंतिम छोर (टेल-एंड)',
      primaryStressFactor: 'प्रमुख तनाव कारक',
      limitingFactor: 'बाधक कारक',
      stressMetric: 'सीमित करने वाला माप',
      efficiencyImpact: 'कार्यक्षमता पर प्रभाव',
      recommendedRemediation: 'अनुशंसित उपाय',
      hoverTooltipHint: 'प्रमुख तनाव कारक व मूल कारण देखने के लिए होवर करें',
      stressFactors: {
        lowMoisture: 'कम मिट्टी की नमी (Low Soil Moisture)',
        highVpd: 'उच्च वाष्प दबाव घाटा (High VPD)',
        lowNitrogen: 'कम नाइट्रोजन (Low Nitrogen)',
        lowPressure: 'कम लेटरल दबाव (Low Lateral Pressure)',
        gridSag: '३-फेज ग्रिड वोल्टेज गिरावट',
        waterlogging: 'मिट्टी में जलभराव',
        optimalEquilibrium: 'अनुकूलतम संतुलन (Optimal Dynamic Equilibrium)',
      },
    },
    exportTelemetry: {
      modalTitle: '२४-घंटे का सेंसर टेलीमेट्री एवं RL एजेंट क्रिया डेटा निर्यात करें',
      modalSubtitle:
        'एक्सेल, पायथन/पांडास या आर में पेशेवर कृषि विश्लेषण के लिए ५-सेंसर टेलीमेट्री, सूक्ष्म-मौसम विज्ञान, कालमान फ़िल्टर स्थिति और सुदृढ़ीकरण सीखने के निर्णयों का समय-श्रृंखला डेटा डाउनलोड करें।',
      downloadCsv: '२४-घंटे का CSV डेटासेट डाउनलोड करें',
      downloading: 'डेटासेट तैयार हो रहा है...',
      zoneScope: 'शेत क्षेत्र (ज़ोन) चयन',
      currentZoneOnly: 'केवल सक्रिय क्षेत्र (Active Zone Only)',
      allZones: 'सभी कृषि क्षेत्र (सभी ४ ब्लॉक)',
      samplingInterval: 'नमूना आवृत्ति (Sampling Frequency)',
      interval15m: '१५-मिनट अंतराल (९६ पंक्तियाँ/क्षेत्र)',
      interval30m: '३०-मिनट अंतराल (४८ पंक्तियाँ/क्षेत्र - अनुशंसित)',
      interval60m: '१-घंटा अंतराल (२४ पंक्तियाँ/क्षेत्र)',
      includedSubsystems: 'डेटासेट में शामिल उप-प्रणालियां',
      subsystems: {
        sensors: 'रूट ज़ोन टेलीमेट्री (१५/४५ सेमी VWC, NPK, EC, pH)',
        climate: 'सूक्ष्म मौसम विज्ञान एवं कैनोपी (VPD, सौर, CWSI, ET0)',
        hardware: 'विद्युत एवं हाइड्रोलिक (४१५V, एम्पियर, प्रेशर, वेंचुरी)',
        rlReflex: 'RL एजेंट एवं रिफ्लेक्स परत (बेलमैन रिवॉर्ड्स, क्रियाएं, सुरक्षा नियम)',
      },
      previewTitle: 'डेटासेट पूर्वावलोकन (नवीनतम रिकॉर्ड)',
      totalRecords: 'कुल रिकॉर्ड्स',
      totalColumns: 'विशेषता स्तंभ',
      timeHorizon: 'समय सीमा',
      last24Hours: 'पिछले २४ घंटे',
      fileFormat: 'प्रारूप',
      rfcCompliant: 'RFC-4180 CSV मेटाडेटा हेडर सहित',
      toastTitle: '२४-घंटे का टेलीमेट्री डेटासेट निर्यात किया गया',
      toastDesc: 'सेंसर टेलीमेट्री, जलवायु और RL एजेंट क्रियाओं की २४ घंटे की समय-श्रृंखला CSV के रूप में डाउनलोड की गई।',
    },
    fertilizerScheduler: {
      title: 'स्वचालित NPK उर्वरक शेड्यूलर',
      subtitle: 'वास्तविक समय मिट्टी NPK सेंसर स्तरों एवं फसल विकास चरणों के आधार पर सटीक वेंचुरी रसायन-इंजेक्शन चक्र निर्धारित करें।',
      venturiInjector: 'वेंचुरी खुराक प्रणाली',
      soilNpkStatus: 'मिट्टी NPK टेलीमेट्री एवं कमी विश्लेषण',
      optimalRange: 'अनुकूलतम सीमा',
      activeSchedules: 'सक्रिय शेड्यूल',
      newSchedule: 'नया स्वचालित शेड्यूल',
      dosingLogs: 'इंजेक्शन लॉग्स',
      recipe: 'उर्वरक फॉर्मूलेशन',
      doseAmount: 'खुराक मात्रा',
      intervalCadence: 'सिमुलेशन अंतराल चक्र',
      deficitThreshold: 'सेंसर कमी सीमा',
      nextDoseIn: 'अगली खुराक',
      doseNow: 'अभी खुराक दें',
      pause: 'रोकें',
      resume: 'पुनः शुरू करें',
      delete: 'हटाएं',
      createSchedule: 'स्वचालित शेड्यूल सहेजें',
      autoPreset: 'कमी अनुसार स्वतः शिफारिश',
      interlockNotice: 'DOL मोटर इंटरलॉक: ग्रिड वोल्टेज गिरावट (< 340V) के कारण मोटर बंद। ४१५V आपूर्ति बहाल होने तक स्थगित।',
      dosingActive: 'वेंचुरी इंजेक्शन सक्रिय',
      successDose: 'स्वचालित NPK फर्टिगेशन पल्स सफलतापूर्वक निष्पादित किया गया।',
    },
  },

  mr: {
    common: {
      online: 'ऑनलाइन',
      offline: 'ऑफलाइन',
      normal: 'सुरळीत',
      critical: 'गंभीर / धोक्याचे',
      warning: 'सावधानता',
      healthy: 'उत्तम / निरोगी',
      optimal: 'इष्टतम',
      error: 'त्रुटी',
      refresh: 'ताजे करा',
      retry: 'पुन्हा प्रयत्न करा',
      close: 'बंद करा',
      apply: 'लागू करा',
      dismiss: 'हटवा',
      clearAll: 'सर्व हटवा',
      export: 'डेटा निर्यात करा',
      exporting: 'निर्यात होत आहे...',
      save: 'जतन / निर्यात केले',
      success: 'यशस्वी',
      details: 'तपशील',
    },
    header: {
      appTitle: 'कृषी-नेट',
      versionTag: 'एग्रो-एजंट v3.4',
      appSubtitle:
        'मॉडेल-आधारित रिफ्लेक्स एजंट • कालमन स्टेट एस्टिमेटर • क्यू-लर्निंग आणि एमडीपी ऑप्टिमायझर • भारतीय एमक्यूटीटी एज गेटवे',
      mqttGateway: 'एमक्यूटीटी गेटवे',
      gatewayOnline: 'ऑनलाइन',
      gatewayStoreAndForward: 'स्थानिक संचयन आणि प्रेषण',
      gridStatus: '३-फेज वीज पुरवठा',
      phaseNormal: 'सुरळीत',
      singlePhasing: 'सिंगल-फेजिंग त्रुटी!',
      reflexPolicy: 'रिफ्लेक्स धोरण',
      intervened: 'हस्तक्षेप सक्रिय',
      optimizing: 'अनुकूलन सुरू',
      alerts: 'सूचना (अलर्ट्स)',
      zones: 'शेतीचे विभाग (प्लॉट)',
      runAgent: 'एजंट सुरू करा',
      pauseAgent: 'थांबवा',
      step: 'एक पाऊल',
      stepTooltip:
        '१ टप्पा कार्यान्वित करा (कालमन सुधारणा -> एमडीपी स्थिती मूल्यांकन -> रिफ्लेक्स/क्यू कृती)',
      speed: 'वेग',
      simulateDisturbance: 'ताण सिम्युलेशन',
      exportData: 'डेटा निर्यात',
      aiAgronomist: 'एआय कृषी तज्ज्ञ',
      language: 'भाषा (Language)',
    },
    cctv: {
      title: 'सीसीटीव्ही स्वायत्त पीक निरीक्षण',
      liveFeed: 'थेट पीक वितान (कॅनॉपी) दृश्य',
      rgbVisual: 'आरजीबी प्रत्यक्ष दृश्य',
      ndviSynthetic: 'एनडीव्हीआय सिंथेटिक',
      thermalCanopy: 'पानांचे थर्मल तापमान',
      edgeDeficit: 'ओलावा तूट नकाशा',
      healthyCanopy: 'निरोगी पीक वितान',
      waterStress: 'पाण्याचा ताण (दुष्काळ)',
      nitrogenDeficiency: 'नायट्रोजनची कमतरता',
      heatStress: 'प्रचंड उष्णता / व्हीपीडी ताण',
      ndviScore: 'एनडीव्हीआय निर्देशांक',
      canopyTemp: 'पानांचे तापमान',
      runDiagnosis: 'एआय पीक तपासणी सुरू करा',
      analyzing: 'पीक तपासणी सुरू आहे...',
      cameraActive: 'कॅमेरा सक्रिय (1080p आयआर)',
      pestDetected: 'पिकांवर कीड प्रादुर्भाव आढळला',
      pestAlert: 'हानिकारक कीड इशारा',
      multiClassTitle: 'मल्टी-क्लास न्यूरल व्हिजन तपासणी',
      bollworm: 'गुलाबी / अमेरिकन बोंडअळी',
      aphids: 'मावा कीड / तुडतुडे',
      whitefly: 'पांढरी माशी कीड',
      stemBorer: 'पिवळा खोडकिडा (डेड हार्ट)',
      economicThreshold: 'आर्थिक नुकसान पातळी (ETL)',
      organicRemedy: 'सेंद्रिय / आयपीएम उपाययोजना',
      chemicalRemedy: 'रासायनिक कीटकनाशक शिफारस',
    },
    sensors: {
      title: '५-सेन्सर टेलिमेट्री मॅट्रिक्स',
      subtitle: 'मुळांच्या भागातील व सूक्ष्म-हवामानाचे थेट सिग्नल्स',
      shallowMoisture: 'वरच्या मातीतील ओलावा (१५ सेमी)',
      shallowDesc: 'ठिबक सिंचन झिरपणारा थर',
      deepMoisture: 'खोल मुळांच्या भागातील ओलावा (४५ सेमी)',
      deepDesc: 'जमिनीखालील पाण्याचा राखीव साठा',
      canopyTemp: 'पानांचे इन्फ्रारेड तापमान',
      canopyDesc: 'पर्णरंध्रांच्या बाष्पोत्सर्जन शीतकरणाचे निदर्शक',
      ambientHumidity: 'वातावरणातील सापेक्ष आर्द्रता',
      humidityDesc: 'शेत परिसरातील सूक्ष्म-हवामान सेन्सर',
      soilNitrogen: 'मातीतील उपलब्ध नत्र / नायट्रोजन (NPK-N)',
      nitrogenDesc: 'ऑप्टिकल स्पेक्ट्रोफोटोमेट्रिक तपासणी',
      kalmanFiltered: 'कालमन द्वारे शुद्ध',
      simulateDrift: 'सेन्सर त्रुटी सिम्युलेट करा',
      vpd: 'वाष्प दाब तूट (VPD)',
      et0: 'बाष्पोत्सर्जन दर (ET0)',
      optimalRange: 'इष्टतम कार्यक्षम मर्यादा',
    },
    hardware: {
      title: 'भारतीय कृषी हार्डवेअर आणि एज गेटवे',
      subtitle: 'किर्लोस्कर / टेक्समो ३-फेज स्टार्टर रिले आणि जैन ठिबक ऑटोमेशन',
      starterRelay: 'स्टार्टर रिले',
      pumpRunning: 'पंप चालू आहे',
      pumpTripped: 'व्होल्टेज ट्रिप!',
      pumpStandby: 'स्टँडबाय मोड',
      gridFeeder: 'ग्रामीण फिडर वीज',
      lineVoltage: 'लाइन व्होल्टेज',
      dripValves: 'जैन ठिबक सोलेनोइड व्हॉल्व्ह',
      valveOpen: 'उघडा',
      valveClosed: 'बंद',
      manualPump: 'मॅन्युअल पंप सुरू करा',
      resetFault: 'व्होल्टेज त्रुटी रीसेट करा',
      simulateTrip: 'सिंगल-फेज ट्रिप सिम्युलेशन',
      mqttDiagnostics: 'एमक्यूटीटी पॅकेट दर आणि अडथळा निदान',
      packetRate: 'पॅकेट्स/सेकंद',
      totalPackets: 'एकूण पॅकेट्स',
      droppedPackets: 'गळती पॅकेट्स',
      latency: 'गेटवे विलंब वेळ',
      splitView: 'विभागलेले दृश्य',
      trafficChart: 'ट्रॅफिक आलेख',
      packetStream: 'पॅकेट प्रवाह',
    },
    kalman: {
      title: 'कालमन फिल्टर सिग्नल प्रोसेसिंग',
      subtitle: 'पंप स्टार्टरच्या इलेक्ट्रिकल स्पाइक्स व सेन्सरमधील अशुद्धतेचे निवारण',
      rawSignal: 'मूळ अशुद्ध सेन्सर सिग्नल',
      estimatedState: 'कालमन अंदाज स्थिती',
      kalmanGain: 'कालमन गेन (K)',
      noiseSuppression: 'गोंधळ/नॉईज निवारण प्रमाण',
      processNoise: 'प्रक्रिया नॉईज (Q)',
      measurementNoise: 'मापन नॉईज (R)',
      filterConvergence: 'फिल्टर अचूकता स्थैर्य',
    },
    rl: {
      title: 'मॉडेल-आधारित रिफ्लेक्स एजंट (MDP + Q-Learning)',
      subtitle: 'पाण्याची बचत व पीक उत्पादन वाढीसाठी मार्कोव्ह निर्णय प्रक्रिया',
      currentState: 'सद्य स्थिती',
      selectedAction: 'निवडलेली कृती',
      bellmanReward: 'बेलमन रिवॉर्ड (प्रतिफळ)',
      tdError: 'टीडी त्रुटी (TD Error)',
      explorationRate: 'शोध दर (ε)',
      totalTransitions: 'एकूण स्थित्यंतरे',
      explainDecision: 'निर्णयाचे कारण समजून घ्या (एआय)',
      explaining: 'स्पष्टीकरण तयार करत आहे...',
      actions: {
        optimalDrip: 'इष्टतम ठिबक सिंचन',
        holdForRain: 'पावसामुळे सिंचन थांबवा',
        boostPulse: 'वाढीव ठिबक पल्स (उष्णता)',
        aerationPause: 'मुळांच्या हवेसाठी विश्रांती',
        reduceRate: 'ठिबक पाणी दर कमी करा',
      },
    },
    yield: {
      title: 'उत्पादन आणि कृषी-हवामान अंदाज मॉडेल',
      subtitle: 'पीक बाष्पोत्सर्जन आणि ७-दिवसीय रिग्रेशन उत्पादन अंदाज',
      projectedYield: 'अंदाजित उत्पादन',
      baselineAverage: 'जिल्हा सरासरी उत्पादन',
      waterSaved: 'वाचवलेले सिंचन पाणी',
      stressDays: 'एकत्रित ताणाचे दिवस',
      gddAccumulated: 'एकत्रित उष्णता निर्देशांक (GDD)',
      refineModel: 'एआय द्वारे मॉडेल सुधारा',
      refining: 'उत्पादन मॉडेल सुधारत आहे...',
      trendTitle: 'ऐतिहासिक उत्पादन वाटचाल',
    },
    weather: {
      title: '७-दिवसीय स्थानिक हवामान अंदाज',
      searchGrounded: 'थेट सर्च आधारित',
      regionalAgromet: 'प्रादेशिक कृषी-हवामान मॉडेल',
      agrometDirective: 'सिंचन संदर्भ व कृषी-हवामान मार्गदर्शन',
      expectedPrecipitation: 'अंदाजित एकूण पाऊस',
      avgEt0: 'सरासरी ET0',
      sources: 'हवामान स्रोत',
      hideSources: 'स्रोत लपवा',
      refresh: 'ताजे करा',
      fetching: 'माहिती घेत आहे...',
      agrometEngine: 'कृषी-हवामान इंजिन',
      today: 'आज',
      maxTemp: 'कमाल',
      minTemp: 'किमान',
      rainProb: 'पाऊस शक्यता',
    },
    stressModal: {
      title: 'पिकावरील ताण (संकट) सिम्युलेट करा',
      subtitle: 'रिफ्लेक्स एजंट, कालमन फिल्टर आणि सुरक्षा यंत्रणेची चाचणी घ्या',
      heatWave: 'विदर्भातील तीव्र उष्णतेची लाट (४३°C व उच्च VPD)',
      heatWaveDesc: 'पानांचे तापमान उच्च, वरची माती वेगाने सुकणे, पर्णरंध्रे बंद होण्याचा तीव्र धोका.',
      canalClosure: 'कालवा पाणी टंचाई (मुळांच्या भागातील दुष्काळ)',
      canalClosureDesc: 'वरच्या व खोल दोन्ही मातीतील ओलावा अत्यंत कमी पातळीवर जातो.',
      voltageSag: 'ग्रामीण ३-फेज सिंगल-फेजिंग वीज ट्रिप',
      voltageSagDesc: 'फिडर व्होल्टेज १६२V वर घसरून स्टार्टर रिले ओव्हरलोड ट्रिप होतो.',
      sensorNoise: 'स्टार्टर रिलेमुळे सेन्सर त्रुटी / नॉईज',
      sensorNoiseDesc: 'मातीतील ओलावा मोजणाऱ्या एडीसी सिग्नलमध्ये इलेक्ट्रिकल गोंधळ निर्माण होतो.',
      monsoonSurge: 'पावसाची वादळी सर (जास्त पाऊस)',
      monsoonSurgeDesc: 'जमिनीत पाणी साचण्याचा धोका व बाष्पोत्सर्जन मागणीत अचानक मोठी घट.',
      restoreOptimal: 'इष्टतम परिस्थिती पूर्ववत करा',
      restoreOptimalDesc: '५-सेन्सर मॅट्रिक्स आदर्श शेत क्षमतेवर (३०% VWC, २१० किग्रा/हेक्टर N, ४१५V निरोगी ग्रिड) रीसेट करतो.',
      injectButton: 'ताण लागू करा',
      close: 'बंद करा',
    },
    aiModal: {
      title: 'एआय कृषी तज्ज्ञ सल्ला व तांत्रिक मार्गदर्शन',
      subtitle: 'भारतीय कृषी संशोधन परिषद (ICAR) व पंजाब कृषी विद्यापीठ मार्गदर्शक तत्त्वांवर आधारित',
      reRunAnalysis: 'पुन्हा तपासणी करा',
      consulting: 'जेमिनी एग्रो-मॉडेल सल्ला घेत आहे...',
      primaryStress: 'मुख्य कृषी ताण',
      confidence: 'मॉडेल विश्वासार्हता',
      ndviAnalysis: 'एनडीव्हीआय परावर्तन विश्लेषण',
      recommendations: 'शिफारस केलेल्या कृती',
      waterDose: 'सिंचन पाणी (लिटर / चौ. मी.)',
      fertigation: 'खतांचे प्रमाण (NPK Fertigation)',
      urgency: 'कृतीची निकड',
      contextTitle: 'भारतीय कृषी-हवामान संदर्भ',
      close: 'बंद करा',
    },
    heatmap: {
      title: 'संसाधन कार्यक्षमता हीटमॅप',
      subtitle: 'सध्याच्या सिंचन व फर्टिगेशन धोरणानुसार सर्व शेत विभागांचे स्थानिक कार्यक्षमता मॅट्रिक्स',
      resourceEfficiencyIndex: 'संसाधन कार्यक्षमता निर्देशांक (REI)',
      currentStrategy: 'सक्रिय सिंचन धोरण',
      benchmarkTarget: 'मानक उद्दिष्ट',
      underperformingAlert: 'कमी कार्यक्षम उपविभाग आढळले',
      allZonesView: 'सर्व ४ शेत विभाग (१६ लॅटरल उपविभाग)',
      underperformingOnly: 'केवळ कमी कार्यक्षम भाग (< ७५% REI)',
      waterEfficiency: 'पाणी वितरण समानता',
      cwsiIndex: 'पीक पाणी ताण (CWSI)',
      lateralPressure: 'लॅटरल एमीटर दाब',
      underperformingBadge: 'कमी कार्यक्षम / सुधारणा आवश्यक',
      optimalBadge: 'इष्टतम कार्यक्षमता',
      jumpToZone: 'विभाग निवडा व तपासा',
      applyOptimization: 'धोरणात सुधारणा करा',
      sectors: 'उपविभाग',
      overallMean: 'शेत सरासरी REI',
      lateralHeader: 'हेडर लॅटरल (प्रवेश)',
      midLateral: 'मध्य लॅटरल',
      tailEnd: 'शेवटचा टोक (टेल-एंड)',
      primaryStressFactor: 'मुख्य ताण घटक',
      limitingFactor: 'मर्यादित करणारा घटक',
      stressMetric: 'मर्यादित करणारे परिमाण',
      efficiencyImpact: 'कार्यक्षमतेवर परिणाम',
      recommendedRemediation: 'शिफारस केलेली कृती',
      hoverTooltipHint: 'मुख्य ताण घटक व मूळ कारण पाहण्यासाठी होव्हर करा',
      stressFactors: {
        lowMoisture: 'कमी मातीतील ओलावा (Low Soil Moisture)',
        highVpd: 'उच्च बाष्प दाब तूट (High VPD)',
        lowNitrogen: 'कमी नायट्रोजन (Low Nitrogen)',
        lowPressure: 'कमी लॅटरल दाब (Low Lateral Pressure)',
        gridSag: '३-फेज ग्रिड व्होल्टेज घसरण',
        waterlogging: 'जमिनीत पाणी साचणे',
        optimalEquilibrium: 'इष्टतम संतुलन (Optimal Dynamic Equilibrium)',
      },
    },
    exportTelemetry: {
      modalTitle: '२४-तासांचा सेन्सर टेलिमेट्री व RL एजंट कृती डेटा निर्यात करा',
      modalSubtitle:
        'एक्सेल, पायथॉन/पांडास किंवा आर मध्ये व्यावसायिक कृषी विश्लेषणासाठी ५-सेन्सर टेलिमेट्री, सूक्ष्म-हवामानशास्त्र, कालमान फिल्टर स्थिती आणि रीइन्फोर्समेंट लर्निंग निर्णयांचा काल-मालिका डेटा डाउनलोड करा.',
      downloadCsv: '२४-तासांचा CSV डेटासेट डाउनलोड करा',
      downloading: 'डेटासेट तयार होत आहे...',
      zoneScope: 'शेत विभाग (झोन) निवड',
      currentZoneOnly: 'फक्त सक्रिय विभाग (Active Zone Only)',
      allZones: 'सर्व शेत विभाग (सर्व ४ ब्लॉक्स)',
      samplingInterval: 'नमुना वारंवारता (Sampling Frequency)',
      interval15m: '१५-मिनिट अंतर (९६ ओळी/विभाग)',
      interval30m: '३०-मिनिट अंतर (४८ ओळी/विभाग - शिफारस केलेले)',
      interval60m: '१-तास अंतर (२४ ओळी/विभाग)',
      includedSubsystems: 'डेटासेटमध्ये समाविष्ट उपप्रणाली',
      subsystems: {
        sensors: 'रूट झोन टेलिमेट्री (१५/४५ सेमी VWC, NPK, EC, pH)',
        climate: 'सूक्ष्म हवामानशास्त्र व कॅनोपी (VPD, सौर, CWSI, ET0)',
        hardware: 'विद्युत व हायड्रॉलिक (४१५V, ॲम्पीअर, दाब, व्हेंचुरी)',
        rlReflex: 'RL एजंट व रिफ्लेक्स स्तर (बेलमन रिवॉर्ड्स, कृती, सुरक्षा नियम)',
      },
      previewTitle: 'डेटासेट पूर्वावलोकन (नवीनतम नोंदी)',
      totalRecords: 'एकूण नोंदी',
      totalColumns: 'वैशिष्ट्य स्तंभ',
      timeHorizon: 'कालावधी',
      last24Hours: 'मागील २४ तास',
      fileFormat: 'प्रारूप',
      rfcCompliant: 'RFC-4180 CSV मेटाडेटा शीर्षकासह',
      toastTitle: '२४-तासांचा टेलिमेट्री डेटासेट निर्यात केला',
      toastDesc: 'सेन्सर टेलिमेट्री, हवामान आणि RL एजंट कृतींची २४ तासांची काल-मालिका CSV स्वरूपात डाउनलोड झाली.',
    },
    fertilizerScheduler: {
      title: 'स्वयंचलित NPK खत शेड्यूलर',
      subtitle: 'रिअल-टाइम मातीतील NPK सेन्सर पातळी व पीक वाढीच्या टप्प्यांवर आधारित अचूक व्हेंचुरी रसायन-इंजेक्‍शन चक्र ठरवा.',
      venturiInjector: 'व्हेंचुरी डोसिंग प्रणाली',
      soilNpkStatus: 'माती NPK टेलिमेट्री व कमतरता विश्लेषण',
      optimalRange: 'इष्टतम मर्यादा',
      activeSchedules: 'सक्रिय वेळापत्रके',
      newSchedule: 'नवीन स्वयंचलित वेळापत्रक',
      dosingLogs: 'इंजेक्‍शन नोंदी',
      recipe: 'खत फॉर्म्युलेशन',
      doseAmount: 'डोस प्रमाण',
      intervalCadence: 'सिम्युलेशन मध्यांतर चक्र',
      deficitThreshold: 'सेन्सर कमतरता मर्यादा',
      nextDoseIn: 'पुढील डोस',
      doseNow: 'आत्ताच डोस द्या',
      pause: 'थांबवा',
      resume: 'पुन्हा सुरू करा',
      delete: 'हटवा',
      createSchedule: 'स्वयंचलित वेळापत्रक जतन करा',
      autoPreset: 'कमतरतेनुसार आपोआप शिफारस',
      interlockNotice: 'DOL मोटर इंटरलॉकिंग: ग्रिड व्होल्टेज घसरणीमुळे (< 340V) मोटर बंद. ४१५V पुरवठा पूर्ववत होईपर्यंत स्थगित.',
      dosingActive: 'व्हेंचुरी इंजेक्‍शन सुरू आहे',
      successDose: 'स्वयंचलित NPK फर्टीगेशन पल्स यशस्वीरित्या कार्यान्वित झाले.',
    },
  },
};
