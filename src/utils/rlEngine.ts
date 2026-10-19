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
  LONG_DRIP_IRRIGATION: {
    id: "LONG_DRIP_IRRIGATION",
    name: "Sustained Drip",
    waterVolLiters: 4800,
    npkGrams: 0,
    durationMinutes: 60,
    costInr: 28,
    description: "Longer irrigation to charge deeper root zone.",
  },
  FOLIAR_FERTILIZER: {
    id: "FOLIAR_FERTILIZER",
    name: "Foliar NPK Application",
    waterVolLiters: 50,
    npkGrams: 100,
    durationMinutes: 10,
    costInr: 35,
    description: "Foliar feed for nutrient correction.",
  },
  EMERGENCY_SHUTDOWN: {
    id: "EMERGENCY_SHUTDOWN",
    name: "Emergency Shutdown",
    waterVolLiters: 0,
    npkGrams: 0,
    durationMinutes: 0,
    costInr: 0,
    description: "Immediate stop due to hazardous conditions.",
  },
};

export class QLearningReflexEngine {
  private qTable: Map<string, Record<AgentAction, number>> = new Map();
  private alpha: number = 0.2; // learning rate
  private gamma: number = 0.85; // discount factor
  private epsilon: number = 0.15; // exploration rate

  constructor(alpha?: number, gamma?: number, epsilon?: number) {
    if (alpha) this.alpha = alpha;
    if (gamma) this.gamma = gamma;
    if (epsilon) this.epsilon = epsilon;
  }

  private getStateKey(state: Record<string, any>): string {
    return Object.keys(state)
      .sort()
      .map((k) => `${k}:${String(state[k])}`)
      .join("|");
  }

  private ensureState(stateKey: string) {
    if (!this.qTable.has(stateKey)) {
      const entry: Record<AgentAction, number> = {
        IDLE_MONITOR: 0,
        PULSE_DRIP_IRRIGATION: 0,
        LONG_DRIP_IRRIGATION: 0,
        FOLIAR_FERTILIZER: 0,
        EMERGENCY_SHUTDOWN: 0,
      };
      this.qTable.set(stateKey, entry);
    }
  }

  public selectAction(state: Record<string, any>): AgentAction {
    const key = this.getStateKey(state);
    this.ensureState(key);
    const actions = this.qTable.get(key)!;
    // epsilon-greedy
    if (Math.random() < this.epsilon) {
      const keys = Object.keys(actions) as AgentAction[];
      return keys[Math.floor(Math.random() * keys.length)];
    }
    // greedy
    return (Object.keys(actions) as AgentAction[]).reduce((best, a) =>
      actions[a] > actions[best] ? a : best
    );
  }

  public updateQ(oldState: Record<string, any>, action: AgentAction, reward: number, newState: Record<string, any>) {
    const oldKey = this.getStateKey(oldState);
    const newKey = this.getStateKey(newState);
    this.ensureState(oldKey);
    this.ensureState(newKey);
    const oldQ = this.qTable.get(oldKey)![action];
    const maxFuture = Math.max(...Object.values(this.qTable.get(newKey)!));
    const updated = oldQ + this.alpha * (reward + this.gamma * maxFuture - oldQ);
    this.qTable.get(oldKey)![action] = updated;
  }

  // Model-Based Reflex Safety Layer
  public evaluateReflexRules(
    shallowMoisture: number,
    gridPhaseStatus: string,
    motorVoltage: number,
    rainRate: number,
    canopyTemp: number,
    ambientTemp: number
  ): { override: boolean; action?: AgentAction; rule?: ReflexRuleLog } {
    // Example rules
    if (gridPhaseStatus === "OUTAGE") {
      return { override: true, action: "EMERGENCY_SHUTDOWN", rule: { ruleId: "GRID_OUTAGE", reason: "Grid outage detected" } };
    }
    if (motorVoltage < 110) {
      return { override: true, action: "EMERGENCY_SHUTDOWN", rule: { ruleId: "LOW_VOLTAGE", reason: "Motor voltage below safe threshold" } };
    }
    if (rainRate > 0.5 && shallowMoisture > 18) {
      return { override: true, action: "IDLE_MONITOR", rule: { ruleId: "RAIN_AND_WET", reason: "Recent rain and sufficient moisture" } };
    }
    // No reflex trigger
    return { override: false };
  }
}
