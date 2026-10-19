export type AgentAction =
  | "IDLE_MONITOR"
  | "PULSE_DRIP_IRRIGATION"
  | "LONG_DRIP_IRRIGATION"
  | "FOLIAR_FERTILIZER"
  | "EMERGENCY_SHUTDOWN";

export interface AgentActionSpec {
  id: AgentAction;
  name: string;
  waterVolLiters: number;
  npkGrams: number;
  durationMinutes: number;
  costInr: number;
  description?: string;
}

export interface QTableEntry {
  state: string;
  actionValues: Record<AgentAction, number>;
}

export interface ReflexRuleLog {
  ruleId: string;
  reason: string;
  severity?: number;
}

export interface KalmanState {
  estimate: number;
  estimateError: number;
}
