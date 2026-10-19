import React from "react";

interface Props {
  filtered?: number;
  raw?: number;
}

export const KalmanFilterView: React.FC<Props> = ({ filtered, raw }) => {
  return (
    <div>
      <h3>Kalman Filter</h3>
      <div>Raw: {raw}</div>
      <div>Filtered: {filtered}</div>
    </div>
  );
};

export default KalmanFilterView;
