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

  public update(measurement: number, trueVal: number = NaN, timestamp: number = Date.now()): number {
    // predict step (estimate remains same for scalar stationary model)
    this.estimateError = this.estimateError + this.processNoise;

    // update step
    this.kalmanGain = this.estimateError / (this.estimateError + this.measurementNoise);
    this.estimate = this.estimate + this.kalmanGain * (measurement - this.estimate);
    this.estimateError = (1 - this.kalmanGain) * this.estimateError;

    this.history.push({ time: timestamp, raw: measurement, filtered: this.estimate, trueVal });
    if (this.history.length > this.maxHistory) this.history.shift();

    return this.estimate;
  }

  public getState(): KalmanState {
    return { estimate: this.estimate, estimateError: this.estimateError };
  }

  public getHistory() {
    return this.history.slice();
  }
}
