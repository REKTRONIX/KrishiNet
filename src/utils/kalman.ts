import { KalmanState } from "../types";

export class SingleKalmanFilter {
  private estimate: number;
  private estimateError: number;
  private processNoise: number;
  private measurementNoise: number;
  private kalmanGain: number = 0;
  private history: Array<{ time: number; raw: number; filtered: number; trueVal: number }> = [];
  private maxHistory: number = 40;

  constructor(initialValue: number, q: number = 0.05, r: number = 0.8) {
    this.estimate = initialValue;
    this.estimateError = 1.0;
    this.processNoise = q;
    this.measurementNoise = r;
  }

  public update(measurement: number, groundTruth: number = measurement): number {
    // 1. Time Update (Predict)
    // For scalar random walk / slow dynamic soil:
    const predictedEstimate = this.estimate;
    const predictedError = this.estimateError + this.processNoise;

    // 2. Measurement Update (Correct)
    this.kalmanGain = predictedError / (predictedError + this.measurementNoise);
    this.estimate = predictedEstimate + this.kalmanGain * (measurement - predictedEstimate);
    this.estimateError = (1 - this.kalmanGain) * predictedError;

    // 3. Keep circular history buffer
    this.history.push({
      time: Date.now(),
      raw: Number(measurement.toFixed(2)),
      filtered: Number(this.estimate.toFixed(2)),
      trueVal: Number(groundTruth.toFixed(2)),
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    return this.estimate;
  }

  public setNoiseParameters(q: number, r: number) {
    this.processNoise = Math.max(0.001, q);
    this.measurementNoise = Math.max(0.01, r);
  }

  public getState(): KalmanState {
    return {
      raw: this.history.length > 0 ? this.history[this.history.length - 1].raw : this.estimate,
      filtered: Number(this.estimate.toFixed(2)),
      estimateError: Number(this.estimateError.toFixed(4)),
      kalmanGain: Number(this.kalmanGain.toFixed(4)),
      processNoise: this.processNoise,
      measurementNoise: this.measurementNoise,
      history: [...this.history],
    };
  }

  public reset(value: number) {
    this.estimate = value;
    this.estimateError = 1.0;
    this.history = [];
  }
}
