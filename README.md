# KrishiNet: Autonomous Precision Agro-Agent & Microclimate Edge Intelligence

KrishiNet is an advanced, production-grade autonomous precision agricultural decision-support and edge irrigation engine engineered specifically for challenging farm environments, rural electrical grids, and variable microclimates across India and global dryland agricultural belts.

---

## 🌟 Key Features

1. **Extended Kalman Filter (EKF) Sensor Fusion**:
   - Eliminates noise, capacitive sensor drift, and salinity artifacts from raw soil moisture readings.
   - Computes true Root-Zone Depletion ($D_r$), Evapotranspiration ($ET_0$), and soil moisture tension in real time.

2. **Q-Learning Markov Decision Process (MDP)**:
   - Reinforcement learning agent dynamically optimizes irrigation pulse duration and fertigation schedules.
   - Rewards optimal crop growth while penalizing water waste, energy usage during peak tariff hours, and over-saturation leaching.

3. **Indian Rural 3-Phase Grid & Hardware Reflex Safety Engine**:
   - Protects 3-phase submersible and monoblock agricultural pump sets (Kirloskar, Crompton, Texmo, etc.).
   - Instantaneous single-phasing protection (<30ms trip) and auto-reversal lockout.
   - Cavitation detection, dry-run protection, and high-pressure line burst cutoff.

4. **Edge Gateway & LoRaWAN Store-and-Forward**:
   - Seamlessly tolerates intermittent rural GSM / cellular network dropouts.
   - Sensor nodes buffer telemetry in local flash ring buffers and forward upon signal recovery with monotonic timestamp preservation.

5. **Multimodal Vision & Leaf Diagnostics via Gemini AI**:
   - Integrates live field CCTV and leaf inspection cameras.
   - Multimodal diagnostic engine detects early-stage fungal blights, aphids, nutrient deficiencies, and thermal leaf curl.

6. **7-Day Weather Forecasting with Live Google Search Grounding**:
   - Synthesizes location-specific forecasts using `gemini-3.8-flash` with Google Search Grounding tools.
   - Issues smart irrigation directives such as `HOLD_FOR_RAIN`, `BOOST_PULSE`, or `DEFICIT_AERATION`.
   - Automatic fallback to deterministic regional agrometeorological models during API rate limit conditions.

7. **Multilingual Farmer Interface**:
   - Real-time localization in Hindi (हिन्दी), Marathi (मराठी), Punjabi (ਪੰਜਾਬੀ), Gujarati (ગુજરાતી), and English.
   - Multilingual audio alerts and voice advisories for field operators.

8. **24-Hour Telemetry & RL Action Dataset Export**:
   - Instant CSV export with full sensor channels, Kalman state estimates, MDP Q-values, and reflex intervention logs.

---

## 🚀 Quickstart & Setup

### Prerequisites
- Node.js 18+ or Node.js 22+
- npm or bun

### Installation
```bash
# Clone or extract repository
cd krishinet

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Optional: Add GEMINI_API_KEY in .env for live Gemini features
```

### Running Locally
```bash
# Start development server
npm run dev

# Open in browser at http://localhost:3000 (or the port specified by process.env.PORT)
```

### Building for Production
```bash
# Build React SPA and bundle server
npm run build

# Start production server
npm start
```

---

## 📁 Repository Structure

```
.
├── server.ts                       # Express backend + Vite middleware + Gemini AI endpoints
├── package.json                    # Dependencies, build scripts & metadata
├── vite.config.ts                  # Vite bundler configuration
├── tsconfig.json                   # TypeScript configuration
├── index.html                      # Single Page Application HTML entrypoint
├── krishinet_agro_agent.R          # Statistical agro-agent simulation in R
├── ARCHITECTURAL_DIAGRAMS.md       # Block diagram, Agent UML & Sequence Diagrams
├── public/
│   └── krishinet-app.zip          # Direct downloadable project archive
└── src/
    ├── main.tsx                    # React application bootstrap
    ├── App.tsx                     # Main layout & dashboard orchestrator
    ├── index.css                   # Tailwind styles & theme variables
    ├── types.ts                    # TypeScript domain models and state interfaces
    ├── context/
    │   └── LanguageContext.tsx     # Multilingual state provider (HI, MR, PA, GU, EN)
    ├── i18n/
    │   └── translations.ts         # Complete agricultural localized dictionary
    ├── components/
    │   ├── Header.tsx              # Top telemetry badges, controls & direct zip download
    │   ├── FiveSensorPanel.tsx     # Soil, microclimate, NPK, leaf wetness gauges
    │   ├── KalmanFilterView.tsx    # Raw vs EKF smoothed signals comparison
    │   ├── QLearningMDPView.tsx    # Q-Matrix heatmap, policy explorer & state breakdown
    │   ├── IndianHardwarePanel.tsx # 3-Phase voltage, motor starter & drip manifolds
    │   ├── LocalizedWeatherForecastWidget.tsx # 7-Day grounded agrometeorology
    │   ├── CCTVFeed.tsx            # Live canopy camera & visual inspection
    │   ├── GeminiAgronomistModal.tsx # AI agronomist chat & prescription generator
    │   ├── StressSimulatorModal.tsx # Heatwave, drought & grid disturbance injector
    │   ├── ExportTelemetryModal.tsx # CSV dataset exporter
    │   ├── ZoneResourceEfficiencyHeatmap.tsx # Multi-zone water/fertilizer efficiency
    │   ├── FertilizerScheduler.tsx # Venturi fertigation recipe scheduler
    │   ├── YieldAndClimateModel.tsx# Yield prediction vs thermal/water stress
    │   └── ToastContainer.tsx      # Real-time event toast notifications
    └── utils/
        ├── kalman.ts               # Extended Kalman Filter algorithm
        ├── rlEngine.ts             # Q-Learning discrete MDP engine
        ├── mockFarmData.ts         # Initial Indian farm zones (Sugarcane, Cotton, Wheat, Mustard)
        ├── mqttSimulator.ts        # Synthetic MQTT packet generator & jitter simulator
        ├── fertilizerRecipes.ts    # Crop-specific NPK & micronutrient formulations
        ├── pestKnowledge.ts        # Agronomic pest & disease knowledge base
        ├── telemetryExport.ts      # CSV dataset generation utility
        ├── audioAlerts.ts          # Speech synthesis & warning beeps
        └── yieldRegression.ts      # Crop yield estimation equations
```

---

## 📊 Architectural Diagrams

Refer to [`ARCHITECTURAL_DIAGRAMS.md`](./ARCHITECTURAL_DIAGRAMS.md) for detailed Block Diagrams, Agent UML specifications, and UML Sequence execution flows.

---

## 📜 License
Distributed under the MIT License. Developed for intelligent dryland agriculture and rural farm resilience.
