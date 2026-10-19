# KrishiNet Architectural Diagrams & Specifications

This document contains visual presentation models, Block Diagrams, Agent UML, and UML Sequence Diagrams for **KrishiNet: Autonomous Precision Agro-Agent & Microclimate Edge Intelligence System**.

---

## 1. System Block Diagram

```
+---------------------------------------------------------------------------------------------------+
|                                      KRISHINET ARCHITECTURE                                       |
+---------------------------------------------------------------------------------------------------+

     [ FARM FIELD SENSORS & ACTUATORS (IoT LAYER) ]
     +-------------------------------------------------------------+
     | - RS485 / Modbus 7-in-1 Soil Sensor (Moisture, Temp, EC, pH)|
     | - Optical NPK Spectrometer (Nitrogen, Phosphorus, Potassium)|
     | - SHT31 / BME280 Ambient Microclimate (Temp, RH, Vapor VPD) |
     | - Optical Leaf Wetness & PAR Solar Radiation Sensor         |
     | - Flow Meter & Line Pressure Sensor                         |
     | - 3-Phase Rural Grid Monitor (Voltage, Phase Symmetry)      |
     | - Field CCTV Camera (Visible/NIR Leaf Canopy Imaging)        |
     +------------------------------+------------------------------+
                                    |
                                    v (LoRa / RS-485 / Analog)
     +-------------------------------------------------------------+
     |                 EDGE HARDWARE LAYER (ESP32)                 |
     |  +-------------------------------------------------------+  |
     |  | - Hardware ADC Sampling & Debouncing                  |  |
     |  | - LoRaWAN Node Transceiver (SX1276, 865-867 MHz)      |  |
     |  | - Local Flash Ring Buffer (Store-and-Forward Offline) |  |
     |  | - Fast Hard-Realtime Reflex Safety Lockout            |  |
     |  |   (Single-phasing cutoff < 30ms, Pipe burst stop)     |  |
     |  +-------------------------------------------------------+  |
     +------------------------------+------------------------------+
                                    |
                                    v (MQTT over GSM / 4G / WiFi)
     +-------------------------------------------------------------+
     |               EDGE GATEWAY & TELEMETRY INGRESS              |
     |  - MQTT Broker / Ingress Controller                         |
     |  - Store-and-Forward Re-synchronizer                        |
     +------------------------------+------------------------------+
                                    |
                                    v
+----+-------------------------------------------------------------+----+
|    |           KRISHINET AUTONOMOUS AGENT CORE ENGINE            |    |
|    |                                                             |    |
|    |  +-------------------------------------------------------+  |    |
|    |  | 1. EXTENDED KALMAN FILTER (EKF) SENSOR FUSION         |  |    |
|    |  |    - Removes soil sensor noise & capacitive lag       |  |    |
|    |  |    - Predicts true Root-Zone Depletion (Dr) & ET0     |  |    |
|    |  +---------------------------+---------------------------+  |    |
|    |                              |                              |    |
|    |                              v                              |    |
|    |  +-------------------------------------------------------+  |    |
|    |  | 2. Q-LEARNING MDP REINFORCEMENT AGENT                 |  |    |
|    |  |    - State Space: {Dr, VPD, Stage, Grid, Nutrients}   |  |    |
|    |  |    - Action Space: {Idle, Pulse Drip, Fertigate, Aer} |  |    |
|    |  |    - Reward: Max Yield - Water/Power Cost - Penalty   |  |    |
|    |  +---------------------------+---------------------------+  |    |
|    |                              |                              |    |
|    |                              v                              |    |
|    |  +-------------------------------------------------------+  |    |
|    |  | 3. HARDWARE REFLEX SAFETY ENGINE                      |  |    |
|    |  |    - Rural Feeder Health Verification (380V-440V)     |  |    |
|    |  |    - Cavitation & Dry-Run Pump Protection             |  |    |
|    |  |    - Burst Pressure Emergency Shut-Off (<50ms)        |  |    |
|    |  +---------------------------+---------------------------+  |    |
|    |                              |                              |    |
|    |  +---------------------------v---------------------------+  |    |
|    |  | 4. CLOSED-LOOP ACTUATOR DISPATCHER                    |  |    |
|    |  |    - 3-Phase Starter Relay / Contactor                |  |    |
|    |  |    - Solenoid Drip Valves (Zone 1 - Zone 4)           |  |    |
|    |  |    - Venturi Fertigation Dosing Injector              |  |    |
|    |  +-------------------------------------------------------+  |    |
+----+-------------------------------------------------------------+----+
                                    |
        +---------------------------+---------------------------+
        |                                                       |
        v                                                       v
+-------------------------------+             +-------------------------------+
|     GEMINI AI ADVISORY &      |             |     FULL-STACK CLIENT UI      |
|    SEARCH-GROUNDED AGENT      |             |      (VITE + REACT + TS)      |
+-------------------------------+             +-------------------------------+
| - Multimodal Leaf Diagnostic  |             | - 5-Sensor Realtime Telemetry |
| - 7-Day Grounded Agroweather  |             | - Kalman vs Raw Signal Graphs |
| - Regional Yield Prediction   |             | - Q-Learning Matrix Inspector |
| - Multilingual Voice Advisory |             | - Indian 3-Phase Starter GUI  |
| - Custom Fertilizer Recipe    |             | - Live CCTV Vision Inspection |
+-------------------------------+             | - Multilingual (HI, MR, PA,   |
                                              |   GU, EN) & Telemetry Export  |
                                              +-------------------------------+
```

---

## 2. Agent UML Diagram

```
+-------------------------------------------------------------------------------------------------+
|                                        <<Agent>>                                                |
|                                  AutonomousAgroAgent                                            |
+-------------------------------------------------------------------------------------------------+
| - id: String                                                                                    |
| - activeZone: FarmZone                                                                          |
| - kalmanFilter: ExtendedKalmanFilter                                                            |
| - qLearningEngine: QLearningMDP                                                                 |
| - reflexEngine: HardwareSafetyReflexEngine                                                      |
| - irrigationSchedule: ScheduleState                                                             |
| - storeAndForwardQueue: TelemetryPacket[]                                                       |
+-------------------------------------------------------------------------------------------------+
| + observeSensors(rawTelemetry: RawSensorPacket): FilteredTelemetryState                         |
| + updateKalmanEstimate(z_k: MeasurementVector): StateEstimate                                   |
| + evaluateReflexRules(state: StateEstimate, grid: GridStatus): ReflexResult                     |
| + computeQAction(state: StateEstimate, epsilon: Float): AgentAction                             |
| + executeIrrigationPulse(valveId: String, durationSec: Integer): ExecutionReport                |
| + requestGeminiConsultation(query: AgroQuery): GeminiRecommendation                            |
| + export24HourDataset(): CSVDataset                                                             |
+-------------------------------------------------------------------------------------------------+
                                      |
                                      | uses
                 +--------------------+--------------------+
                 |                                         |
                 v                                         v
+-----------------------------------+     +-----------------------------------+
|      <<State Estimation>>         |     |          <<Policy / MDP>>         |
|      ExtendedKalmanFilter         |     |           QLearningMDP            |
+-----------------------------------+     +-----------------------------------+
| - x: Vector (Moisture, Depletion) |     | - QTable: Map<StateKey, Action[]> |
| - P: CovarianceMatrix             |     | - alpha: Float = 0.18             |
| - Q: ProcessNoiseMatrix           |     | - gamma: Float = 0.92             |
| - R: MeasurementNoiseMatrix       |     | - epsilon: Float = 0.05           |
+-----------------------------------+     +-----------------------------------+
| + predict(u: ControlInput): Void  |     | + discretizeState(s): StateKey    |
| + update(z: Measurement): State   |     | + chooseAction(state): Action     |
| + getTrueMoisture(): Float        |     | + updateQ(s, a, r, s_next): Void  |
+-----------------------------------+     +-----------------------------------+
                 |                                         |
                 v                                         v
+-----------------------------------+     +-----------------------------------+
|       <<Safety Interlock>>        |     |          <<AI Reasoner>>          |
|    HardwareSafetyReflexEngine     |     |       GeminiAgroIntelligence      |
+-----------------------------------+     +-----------------------------------+
| - voltageWindow: [380V, 440V]     |     | - model: gemini-3.8-flash         |
| - maxSafePressureBar: 3.5         |     | - tools: [googleSearch]           |
| - singlePhasingDetected: Boolean  |     | - multimodalVision: Enabled       |
+-----------------------------------+     +-----------------------------------+
| + verifyFeederSafety(): Boolean   |     | + diagnoseLeafPathology(img): Rep |
| + checkLineIntegrity(): Boolean   |     | + fetchGroundedForecast(): Fcst   |
| + enforceCutoffIfHazardous(): Bool|     | + generateCustomFertilizer(): Rec |
+-----------------------------------+     +-----------------------------------+
```

---

## 3. UML Sequence Diagram: Autonomous Cycle & Reflex Execution

```
[Soil Sensors]     [ESP32 Edge]       [Kalman Filter]     [Q-Learning Agent]     [Reflex Engine]     [Pump / Valve]     [Gemini & UI]
      |                  |                   |                    |                     |                   |                 |
      | 1. Read Raw      |                   |                    |                     |                   |                 |
      |--- Modbus/ADC -->|                   |                    |                     |                   |                 |
      |                  | 2. MQTT Packet    |                    |                     |                   |                 |
      |                  |--- (Telemetry) -->|                    |                     |                   |                 |
      |                  |                   | 3. Filter Noise    |                     |                   |                 |
      |                  |                   |--- & Drift ------->|                     |                   |                 |
      |                  |                   |                    | 4. Clean State      |                   |                 |
      |                  |                   |                    |--- (Dr, VPD, EC) -->|                   |                 |
      |                  |                   |                    |                     |                   |                 |
      |                  |                   |                    | 5. Select Optimal   |                   |                 |
      |                  |                   |                    |    Action (MDP)     |                   |                 |
      |                  |                   |                    |-------+             |                   |                 |
      |                  |                   |                    |       | Action:     |                   |                 |
      |                  |                   |                    |       | PULSE_DRIP  |                   |                 |
      |                  |                   |                    |<------+             |                   |                 |
      |                  |                   |                    |                     |                   |                 |
      |                  |                   |                    | 6. Submit Proposal  |                   |                 |
      |                  |                   |                    |-------------------->|                   |                 |
      |                  |                   |                    |                     |                   |                 |
      |                  |                   |                    |                     | 7. Validate:      |                 |
      |                  |                   |                    |                     |    - 3-Phase Norm |                 |
      |                  |                   |                    |                     |    - Pressure OK  |                 |
      |                  |                   |                    |                     |    - No Single-Ph |                 |
      |                  |                   |                    |                     |-------+           |                 |
      |                  |                   |                    |                     |       | APPROVED  |                 |
      |                  |                   |                    |                     |<------+           |                 |
      |                  |                   |                    |                     |                   |                 |
      |                  |                   |                    |                     | 8. Actuate Relay  |                 |
      |                  |                   |                    |                     |------------------>|                 |
      |                  |                   |                    |                     |                   | 9. Solenoid Open|
      |                  |                   |                    |                     |                   |----+ (180s drip)|
      |                  |                   |                    |                     |                   |    |            |
      |                  |                   |                    | 10. Reward Update   |                   |<---+            |
      |                  |                   |                    |<--------------------+                   |                 |
      |                  |                   |                    |                                         |                 |
      |                  |                   |                    | 11. Stream WebSocket Telemetry          |                 |
      |                  |                   |                    |---------------------------------------------------------->|
      |                  |                   |                    |                                                           | Update UI:
      |                  |                   |                    |                                                           | - Gauges
      |                  |                   |                    |                                                           | - Heatmap
      |                  |                   |                    |                                                           | - Alerts
      |                  |                   |                    |                                                           |
      |                  |                   |                    | 12. If Weather / Pest Query                               |
      |                  |                   |                    |---------------------------------------------------------->|
      |                  |                   |                    |                                                           | Call Gemini:
      |                  |                   |                    |                                                           | Search Grounded
      |                  |                   |                    |                                                           | Multimodal Vision
      |                  |                   |                    |                                                           |
```

---

## 4. Key Agent State Machine

```
              +---------------------+
              |    IDLE / SENSING   |
              +----------+----------+
                         |
           Sensor Read & Kalman Update
                         |
                         v
              +---------------------+
              |   STATE ESTIMATION  |
              |   (Dr, VPD, ET0)    |
              +----------+----------+
                         |
            Depletion > MAD Threshold?
                    /         \
                 YES           NO
                  /             \
                 v               v
    +--------------------+  +--------------------+
    |   EVALUATE MDP     |  |   AERATION / REST  |
    |  ACTION SELECTION  |  |   (Zero Water Use) |
    +---------+----------+  +--------------------+
              |
      Action Proposed
              |
              v
    +--------------------+
    |  REFLEX INTERLOCK  | <--- Grid Failure / Burst? ---> [EMERGENCY CUTOFF]
    | (Phase, Pressure)  |
    +---------+----------+
              | Safety Passed
              v
    +--------------------+
    |  IRRIGATION PULSE  |
    |  (120s - 300s Run) |
    +---------+----------+
              |
      Compute Transition
       & Update Q-Table
              |
              v
         [CYCLE END]
```
