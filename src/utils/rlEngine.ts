import { AgentAction, AgentActionSpec, QTableEntry, ReflexRuleLog } from "../types";

export const ACTION_SPECS: Record<AgentAction, AgentActionSpec> = {
  IDLE_MONITOR: {
    id: "IDLE_MONITOR",
    name: "Standby & Monitor",
    waterVolLiters: 0,
    npkGrams: 0,
    durationMinutes: 0,
    costInr: 0,
    description: "No water or chemical discharge. Low power continuous sensor telemetry.",
  },
  PULSE_DRIP_IRRIGATION: {
    id: "PULSE_DRIP_IRRIGATION",
    name: "Precision Drip Pulse",
    waterVolLiters: 1200,
    npkGrams: 0,
    durationMinutes: 20,
    costInr: 8.5,
    description: "Short pulse to rehydrate shallow root zone (15cm) minimizing runoff.",
  },
  DEEP_DRIP_SOAK: {
    id: "DEEP_DRIP_SOAK",
    name: "Deep Root Soak",
    waterVolLiters: 3200,
    npkGrams: 0,
    durationMinutes: 50,
    costInr: 22.0,
    description: "Deep soak reaching 45cm taproot buffer, replenishing soil moisture reserve.",
  },
  FERTIGATION_VENTURI_NPK: {
    id: "FERTIGATION_VENTURI_NPK",
    name: "Venturi Fertigation (19:19:19)",
    waterVolLiters: 1800,
    npkGrams: 4500,
    durationMinutes: 30,
    costInr: 85.0,
    description: "Automated suction through Venturi manifold with balanced water-soluble NPK.",
  },
  CANOPY_MICRO_MIST: {
    id: "CANOPY_MICRO_MIST",
    name: "Micro-Mist Canopy Cooling",
    waterVolLiters: 650,
    npkGrams: 0,
    durationMinutes: 12,
    costInr: 5.0,
    description: "Atomized overhead mist to drop ambient canopy temperature & reduce VPD.",
  },
};

export const ALL_ACTIONS: AgentAction[] = [
  "IDLE_MONITOR",
  "PULSE_DRIP_IRRIGATION",
  "DEEP_DRIP_SOAK",
  "FERTIGATION_VENTURI_NPK",
  "CANOPY_MICRO_MIST",
];

export function discretizeState(moisture: number, nitrogen: number, vpd: number): string {
  // Moisture: DRY (< 24), OPTIMAL (24-36), SATURATED (> 36)
  let mTag = "OPT";
  if (moisture < 24) mTag = "DRY";
  else if (moisture > 36) mTag = "SAT";

  // Nitrogen: DEFICIENT (< 175), ADEQUATE (175-230), RICH (> 230)
  let nTag = "BAL";
  if (nitrogen < 175) nTag = "LOW_N";
  else if (nitrogen > 230) nTag = "HIGH_N";

  // VPD / Heat stress: NORMAL (<= 2.2 kPa), HIGH_VPD (> 2.2 kPa)
  let vTag = vpd > 2.2 ? "HIGH_VPD" : "NORM_VPD";

  return `${mTag}__${nTag}__${vTag}`;
}

export function getStateLabel(stateKey: string): string {
  const parts = stateKey.split("__");
  const m = parts[0] === "DRY" ? "Dry Soil" : parts[0] === "SAT" ? "Saturated" : "Ideal Moisture";
  const n = parts[1] === "LOW_N" ? "Low N" : parts[1] === "HIGH_N" ? "High N" : "Balanced N";
  const v = parts[2] === "HIGH_VPD" ? "High Heat/VPD" : "Normal Climate";
  return `${m} | ${n} | ${v}`;
}

export class QLearningReflexEngine {
  private qTable: Map<string, Record<AgentAction, number>> = new Map();
  private alpha: number = 0.2; // learning rate
  private gamma: number = 0.85; // discount factor
  private epsilon: number = 0.15; // exploration rate
  private totalSteps: number = 0;
  private cumulativeReward: number = 0;
  private recentRewards: number[] = [];

  constructor() {
    this.initializeDefaultQTable();
  }

  private initializeDefaultQTable() {
    const moistureStates = ["DRY", "OPT", "SAT"];
    const nitrogenStates = ["LOW_N", "BAL", "HIGH_N"];
    const vpdStates = ["NORM_VPD", "HIGH_VPD"];

    for (const m of moistureStates) {
      for (const n of nitrogenStates) {
        for (const v of vpdStates) {
          const key = `${m}__${n}__${v}`;
          const qVals: Record<AgentAction, number> = {
            IDLE_MONITOR: 0,
            PULSE_DRIP_IRRIGATION: 0,
            DEEP_DRIP_SOAK: 0,
            FERTIGATION_VENTURI_NPK: 0,
            CANOPY_MICRO_MIST: 0,
          };

          // Seed with intuitive agronomic priors
          if (m === "DRY") {
            qVals.PULSE_DRIP_IRRIGATION = 6.0;
            qVals.DEEP_DRIP_SOAK = 8.5;
            qVals.IDLE_MONITOR = -12.0;
          } else if (m === "OPT") {
            qVals.IDLE_MONITOR = 5.0;
            qVals.DEEP_DRIP_SOAK = -4.0;
          } else if (m === "SAT") {
            qVals.IDLE_MONITOR = 10.0;
            qVals.DEEP_DRIP_SOAK = -15.0;
            qVals.PULSE_DRIP_IRRIGATION = -8.0;
          }

          if (n === "LOW_N") {
            qVals.FERTIGATION_VENTURI_NPK += 7.0;
          } else if (n === "HIGH_N") {
            qVals.FERTIGATION_VENTURI_NPK -= 10.0;
          }

          if (v === "HIGH_VPD") {
            qVals.CANOPY_MICRO_MIST += 7.5;
          }

          this.qTable.set(key, qVals);
        }
      }
    }
  }

  public getQValues(stateKey: string): Record<AgentAction, number> {
    if (!this.qTable.has(stateKey)) {
      this.qTable.set(stateKey, {
        IDLE_MONITOR: 0,
        PULSE_DRIP_IRRIGATION: 0,
        DEEP_DRIP_SOAK: 0,
        FERTIGATION_VENTURI_NPK: 0,
        CANOPY_MICRO_MIST: 0,
      });
    }
    return this.qTable.get(stateKey)!;
  }

  private static ruleCounter: number = 0;

  // Model-Based Reflex Safety Layer
  public evaluateReflexRules(
    shallowMoisture: number,
    gridPhaseStatus: string,
    motorVoltage: number,
    rainRate: number,
    canopyTemp: number,
    ambientTemp: number
  ): { override: boolean; action?: AgentAction; rule?: ReflexRuleLog } {
    const timestamp = new Date().toLocaleTimeString();
    const nextRuleId = (prefix: string) => {
      QLearningReflexEngine.ruleCounter += 1;
      return `${prefix}-${Date.now()}-${QLearningReflexEngine.ruleCounter}-${Math.random().toString(36).substring(2, 7)}`;
    };

    // Reflex Rule 1: Single-phasing or voltage sag (protection of Indian 3-phase motor)
    if (gridPhaseStatus === "SINGLE_PHASING_FAULT" || motorVoltage < 330) {
      return {
        override: true,
        action: "IDLE_MONITOR",
        rule: {
          id: nextRuleId("RULE-PWR"),
          timestamp,
          type: "SAFETY_TRIP",
          trigger: `Single-phasing or severe line voltage drop (${motorVoltage}V < 340V threshold)`,
          actionTaken: "Emergency motor cutout to prevent 3-phase stator winding burnout",
          overriddenRL: true,
          status: "INTERVENED",
        },
      };
    }

    // Reflex Rule 2: Sudden torrential monsoon rain
    if (rainRate > 10.0) {
      return {
        override: true,
        action: "IDLE_MONITOR",
        rule: {
          id: nextRuleId("RULE-RAIN"),
          timestamp,
          type: "OPTIMIZATION",
          trigger: `Natural precipitation detected at ${rainRate} mm/hr`,
          actionTaken: "Inhibit all irrigation valves to conserve pumping energy & prevent root rot",
          overriddenRL: true,
          status: "EXECUTED",
        },
      };
    }

    // Reflex Rule 3: Extreme water deficit emergency (< 14% VWC)
    if (shallowMoisture < 14) {
      return {
        override: true,
        action: "DEEP_DRIP_SOAK",
        rule: {
          id: nextRuleId("RULE-CRIT-DRY"),
          timestamp,
          type: "RAPID_REFLEX",
          trigger: `Root moisture collapsed to ${shallowMoisture}% (Below permanent wilting point threshold)`,
          actionTaken: "Immediate deep drip soak override (bypass RL exploration)",
          overriddenRL: true,
          status: "INTERVENED",
        },
      };
    }

    // Reflex Rule 4: Extreme thermal shock (Canopy temp > 40°C & Tc - Ta > 3.5°C)
    if (canopyTemp > 39 && canopyTemp - ambientTemp > 3.0) {
      return {
        override: true,
        action: "CANOPY_MICRO_MIST",
        rule: {
          id: nextRuleId("RULE-THERMAL"),
          timestamp,
          type: "RAPID_REFLEX",
          trigger: `Severe canopy heat depression ${canopyTemp}°C vs ambient ${ambientTemp}°C`,
          actionTaken: "Engage micro-sprinkler misting to prevent flower abortion & pollen sterility",
          overriddenRL: true,
          status: "EXECUTED",
        },
      };
    }

    return { override: false };
  }

  // Epsilon-Greedy Action Selection
  public selectAction(stateKey: string, isTraining: boolean = true): { action: AgentAction; isExploration: boolean } {
    const qVals = this.getQValues(stateKey);

    if (isTraining && Math.random() < this.epsilon) {
      const randomAction = ALL_ACTIONS[Math.floor(Math.random() * ALL_ACTIONS.length)];
      return { action: randomAction, isExploration: true };
    }

    // Exploit: Pick action with highest Q value
    let bestAction: AgentAction = "IDLE_MONITOR";
    let maxQ = -Infinity;

    for (const a of ALL_ACTIONS) {
      if (qVals[a] > maxQ) {
        maxQ = qVals[a];
        bestAction = a;
      }
    }

    return { action: bestAction, isExploration: false };
  }

  // Compute MDP Reward Function
  public computeReward(
    prevMoisture: number,
    newMoisture: number,
    nitrogen: number,
    vpd: number,
    action: AgentAction,
    cwsi: number
  ): number {
    let reward = 0;

    // 1. Moisture satisfaction
    if (newMoisture >= 26 && newMoisture <= 34) {
      reward += 15.0; // Optimal root hydration
    } else if (newMoisture < 20) {
      reward -= 18.0; // Moisture deficit penalty
    } else if (newMoisture > 40) {
      reward -= 10.0; // Waterlogging / soil compaction risk
    }

    // 2. CWSI (Crop Water Stress Index) penalty
    reward -= cwsi * 12.0;

    // 3. Resource Cost Penalty
    const spec = ACTION_SPECS[action];
    reward -= spec.waterVolLiters * 0.002; // Water conservation factor
    reward -= spec.costInr * 0.1; // Energy & chemical cost

    // 4. Appropriate Action Bonuses
    if (prevMoisture < 22 && (action === "PULSE_DRIP_IRRIGATION" || action === "DEEP_DRIP_SOAK")) {
      reward += 14.0; // Well-timed irrigation
    }
    if (nitrogen < 170 && action === "FERTIGATION_VENTURI_NPK") {
      reward += 16.0; // Replenished required nutrient
    }
    if (nitrogen > 230 && action === "FERTIGATION_VENTURI_NPK") {
      reward -= 14.0; // Over-fertilization / nitrate leaching penalty
    }
    if (vpd > 2.3 && action === "CANOPY_MICRO_MIST") {
      reward += 10.0; // Effective thermal cooling
    }
    if (prevMoisture > 34 && (action === "PULSE_DRIP_IRRIGATION" || action === "DEEP_DRIP_SOAK")) {
      reward -= 15.0; // Severe waste of water
    }

    return Number(reward.toFixed(2));
  }

  // Bellman Q-Learning Update
  public updateQ(
    prevStateKey: string,
    action: AgentAction,
    reward: number,
    nextStateKey: string
  ): { oldQ: number; newQ: number; tdError: number } {
    const currentQMap = this.getQValues(prevStateKey);
    const nextQMap = this.getQValues(nextStateKey);

    const oldQ = currentQMap[action];

    // max_a' Q(s', a')
    let maxNextQ = -Infinity;
    for (const a of ALL_ACTIONS) {
      if (nextQMap[a] > maxNextQ) {
        maxNextQ = nextQMap[a];
      }
    }

    // TD Error: r + gamma * maxQ(s') - Q(s, a)
    const tdError = reward + this.gamma * maxNextQ - oldQ;
    const newQ = oldQ + this.alpha * tdError;

    currentQMap[action] = Number(newQ.toFixed(3));
    this.totalSteps++;
    this.cumulativeReward += reward;

    this.recentRewards.push(reward);
    if (this.recentRewards.length > 50) {
      this.recentRewards.shift();
    }

    return { oldQ, newQ, tdError: Number(tdError.toFixed(3)) };
  }

  public getTableEntries(): QTableEntry[] {
    const entries: QTableEntry[] = [];
    this.qTable.forEach((qVals, stateKey) => {
      entries.push({
        stateKey,
        stateLabel: getStateLabel(stateKey),
        qValues: { ...qVals },
        visitCount: 10 + Math.floor(Math.abs(qVals.IDLE_MONITOR * 2)),
      });
    });
    return entries;
  }

  public getStats() {
    return {
      totalSteps: this.totalSteps,
      cumulativeReward: Number(this.cumulativeReward.toFixed(1)),
      avgRecentReward:
        this.recentRewards.length > 0
          ? Number((this.recentRewards.reduce((a, b) => a + b, 0) / this.recentRewards.length).toFixed(2))
          : 0,
      epsilon: this.epsilon,
      alpha: this.alpha,
      gamma: this.gamma,
    };
  }

  public setHyperparameters(alpha: number, gamma: number, epsilon: number) {
    this.alpha = alpha;
    this.gamma = gamma;
    this.epsilon = epsilon;
  }
}
