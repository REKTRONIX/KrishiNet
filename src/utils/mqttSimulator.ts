export class MqttSimulator {
  private topics: Record<string, Array<(payload: any) => void>> = {};

  public publish(topic: string, payload: any) {
    const subs = this.topics[topic] || [];
    subs.forEach((cb) => cb(payload));
  }

  public subscribe(topic: string, cb: (payload: any) => void) {
    if (!this.topics[topic]) this.topics[topic] = [];
    this.topics[topic].push(cb);
    return () => {
      this.topics[topic] = this.topics[topic].filter((c) => c !== cb);
    };
  }
}
