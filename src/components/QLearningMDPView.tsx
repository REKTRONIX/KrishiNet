import React from "react";
import { AgentAction } from "../types";

interface Props {
  stateKey?: string;
  qValues?: Record<AgentAction, number>;
}

export const QLearningMDPView: React.FC<Props> = ({ stateKey, qValues }) => {
  return (
    <div>
      <h3>QLearning MDP View</h3>
      <div>State: {stateKey}</div>
      <ul>
        {qValues && Object.entries(qValues).map(([a, v]) => (
          <li key={a}>{a}: {v.toFixed(3)}</li>
        ))}
      </ul>
    </div>
  );
};

export default QLearningMDPView;
