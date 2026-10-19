import { MqttPacketType, MqttTrafficBucket, MqttGatewayMetrics } from "../types";

export interface MqttPacket {
  id: string;
  timestamp: string;
  topic: string;
  payload: Record<string, any>;
  qos: 0 | 1 | 2;
  retained: boolean;
  gatewayCached?: boolean;
  packetType: MqttPacketType;
  latencyMs: number;
}

export class LocalEdgeGatewayMqtt {
  private packets: MqttPacket[] = [];
  private offlineBuffer: MqttPacket[] = [];
  private isOnline: boolean = true;
  private maxLogs: number = 40;
  private brokerAddress: string = "tcp://192.168.1.100:1883 (Local Mosquitto Edge Gateway)";
  private trafficBuckets: MqttTrafficBucket[] = [];

  constructor() {
    this.initHourlyTrafficBuckets();
  }

  private initHourlyTrafficBuckets(): void {
    const now = new Date();
    const offsets = [-55, -50, -45, -40, -35, -30, -25, -20, -15, -10, -5, 0];

    this.trafficBuckets = offsets.map((offset, idx) => {
      const bucketDate = new Date(now.getTime() + offset * 60 * 1000);
      const timeLabel = bucketDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      // Scenario simulation for historical rural edge network:
      // At -35m: Rural feeder voltage sag & GSM modem drop
      if (offset === -35) {
        return {
          id: `bucket-${idx}`,
          minuteOffset: offset,
          timeLabel,
          telemetryCount: 14,
          commandCount: 1,
          heartbeatCount: 2,
          alarmCount: 5,
          bufferedCount: 16,
          totalPackets: 38,
          avgLatencyMs: 248,
          packetLossPercent: 6.8,
          isBottleneck: true,
          bottleneckType: "OFFLINE_BACKPRESSURE",
          bottleneckReason:
            "Rural 3-Phase Voltage Sag (312V): Edge gateway lost cellular link; 16 telemetry frames buffered in ESP32 SPIFFS ring memory.",
          recommendedAction:
            "Local store-and-forward preserved all sensor frames. Check DOL starter auto-reset contactor timing.",
        };
      }

      // At -30m: Reconnection burst drain & QoS 1 retry storm
      if (offset === -30) {
        return {
          id: `bucket-${idx}`,
          minuteOffset: offset,
          timeLabel,
          telemetryCount: 34,
          commandCount: 4,
          heartbeatCount: 5,
          alarmCount: 1,
          bufferedCount: 19,
          totalPackets: 63,
          avgLatencyMs: 142,
          packetLossPercent: 2.1,
          isBottleneck: true,
          bottleneckType: "VOLTAGE_FLICKER_BURST",
          bottleneckReason:
            "Burst Drain & Reconnection Storm: Gateway re-authenticated and flushed buffered telemetry at high message frequency.",
          recommendedAction:
            "Rate-limit bulk burst replay to 8 pkts/sec to avoid local Mosquitto inbound socket queue saturation.",
        };
      }

      // At -20m: Mild LoRa RSSI drop / channel contention
      if (offset === -20) {
        return {
          id: `bucket-${idx}`,
          minuteOffset: offset,
          timeLabel,
          telemetryCount: 24,
          commandCount: 3,
          heartbeatCount: 5,
          alarmCount: 0,
          bufferedCount: 2,
          totalPackets: 34,
          avgLatencyMs: 76,
          packetLossPercent: 1.4,
          isBottleneck: false,
          bottleneckType: "HEALTHY",
          bottleneckReason: "Nominal packet delivery; transient sub-gigahertz LoRa preamble collision resolved via CSMA.",
        };
      }

      // Normal healthy operational buckets
      const baseTelem = 22 + (idx % 5);
      const baseCmd = 2 + (idx % 3);
      const baseHb = 5;
      const total = baseTelem + baseCmd + baseHb;

      return {
        id: `bucket-${idx}`,
        minuteOffset: offset,
        timeLabel,
        telemetryCount: baseTelem,
        commandCount: baseCmd,
        heartbeatCount: baseHb,
        alarmCount: 0,
        bufferedCount: 0,
        totalPackets: total,
        avgLatencyMs: 32 + (idx % 7) * 2,
        packetLossPercent: 0.1 + (idx % 3) * 0.1,
        isBottleneck: false,
        bottleneckType: "HEALTHY",
        bottleneckReason: "Optimal 868MHz LoRaWAN + Ethernet/Wi-Fi edge throughput (RSSI -62 dBm, SNR +8.5).",
      };
    });
  }

  public publish(
    topic: string,
    payload: Record<string, any>,
    qos: 0 | 1 | 2 = 1,
    retained: boolean = false,
    forcedType?: MqttPacketType
  ): MqttPacket {
    // Determine packet category
    let packetType: MqttPacketType = forcedType || "TELEMETRY";
    if (!forcedType) {
      if (
        topic.includes("pump/command") ||
        topic.includes("valve") ||
        topic.includes("venturi") ||
        payload.action
      ) {
        packetType = "COMMAND";
      } else if (
        topic.includes("alert") ||
        topic.includes("fault") ||
        topic.includes("trip") ||
        payload.pumpStatus === "TRIPPED" ||
        payload.lineVoltage < 340
      ) {
        packetType = "ALARM_FAULT";
      } else if (topic.includes("heartbeat") || topic.includes("ping") || topic.includes("watchdog")) {
        packetType = "HEARTBEAT";
      } else if (!this.isOnline) {
        packetType = "BUFFERED_SYNC";
      } else {
        packetType = "TELEMETRY";
      }
    }

    const latencyMs = this.isOnline
      ? Math.floor(28 + Math.random() * 24)
      : Math.floor(180 + Math.random() * 120);

    const packet: MqttPacket = {
      id: `PKT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`,
      timestamp: new Date().toLocaleTimeString(),
      topic,
      payload,
      qos,
      retained,
      gatewayCached: !this.isOnline,
      packetType,
      latencyMs,
    };

    if (!this.isOnline) {
      this.offlineBuffer.push(packet);
    }

    this.packets.unshift(packet);
    if (this.packets.length > this.maxLogs) {
      this.packets.pop();
    }

    // Update active current bucket (index 11, minuteOffset === 0)
    this.recordPacketInCurrentBucket(packetType, latencyMs);

    return packet;
  }

  private recordPacketInCurrentBucket(type: MqttPacketType, latencyMs: number): void {
    if (this.trafficBuckets.length === 0) return;
    const currentBucket = this.trafficBuckets[this.trafficBuckets.length - 1];

    currentBucket.totalPackets += 1;
    switch (type) {
      case "COMMAND":
        currentBucket.commandCount += 1;
        break;
      case "HEARTBEAT":
        currentBucket.heartbeatCount += 1;
        break;
      case "ALARM_FAULT":
        currentBucket.alarmCount += 1;
        break;
      case "BUFFERED_SYNC":
        currentBucket.bufferedCount += 1;
        break;
      case "TELEMETRY":
      default:
        currentBucket.telemetryCount += 1;
        break;
    }

    if (!this.isOnline) {
      currentBucket.bufferedCount += 1;
      currentBucket.isBottleneck = true;
      currentBucket.bottleneckType = "OFFLINE_BACKPRESSURE";
      currentBucket.bottleneckReason = `Offline Gateway Backpressure: ${this.offlineBuffer.length} telemetry frames actively buffered in local RAM storage.`;
      currentBucket.recommendedAction = "Restore edge internet uplink to flush queued MQTT frames.";
    }

    // Recalculate moving average latency
    currentBucket.avgLatencyMs = Math.round((currentBucket.avgLatencyMs * 4 + latencyMs) / 5);
  }

  public toggleGatewayNetwork(): boolean {
    this.isOnline = !this.isOnline;
    if (this.isOnline && this.offlineBuffer.length > 0) {
      const flushedCount = this.offlineBuffer.length;
      console.log(`[Edge Gateway] Reconnected to Cloud. Synced ${flushedCount} cached MQTT frames.`);

      // Log flush event as packet
      this.publish(
        "farm/edge-gateway/sync/reconnected",
        {
          event: "BUFFER_FLUSH_COMPLETE",
          flushedPackets: flushedCount,
          drainRatePps: 8.5,
          timestamp: Date.now(),
        },
        1,
        false,
        "BUFFERED_SYNC"
      );

      // Record recovery burst in current bucket
      const currentBucket = this.trafficBuckets[this.trafficBuckets.length - 1];
      if (currentBucket) {
        currentBucket.bufferedCount += flushedCount;
        currentBucket.totalPackets += flushedCount;
        currentBucket.isBottleneck = true;
        currentBucket.bottleneckType = "VOLTAGE_FLICKER_BURST";
        currentBucket.bottleneckReason = `Reconnection Drain: Emptied local offline ring buffer (${flushedCount} packets transmitted with QoS 1 confirmation).`;
        currentBucket.recommendedAction = "Edge buffer safely emptied without dropping telemetry.";
      }

      this.offlineBuffer = [];
    } else if (!this.isOnline) {
      // Log offline event
      this.publish(
        "farm/edge-gateway/status/offline",
        {
          event: "CARRIER_SIGNAL_LOST",
          mode: "STORE_AND_FORWARD_ACTIVE",
          timestamp: Date.now(),
        },
        0,
        false,
        "ALARM_FAULT"
      );
    }
    return this.isOnline;
  }

  public simulateBottleneckEvent(type: "RETRY_SPIKE" | "OFFLINE_BACKPRESSURE" | "CHANNEL_CONGESTION"): void {
    const currentBucket = this.trafficBuckets[this.trafficBuckets.length - 1];
    if (!currentBucket) return;

    if (type === "RETRY_SPIKE") {
      currentBucket.alarmCount += 4;
      currentBucket.bufferedCount += 8;
      currentBucket.totalPackets += 12;
      currentBucket.avgLatencyMs = 210;
      currentBucket.packetLossPercent = 7.5;
      currentBucket.isBottleneck = true;
      currentBucket.bottleneckType = "RETRY_SPIKE";
      currentBucket.bottleneckReason =
        "LoRaWAN 868MHz Duty-Cycle Congestion: Retransmission storm on Sub-GHz band; PUBACK timeout reached 3500ms.";
      currentBucket.recommendedAction =
        "Spread sensor reporting jitter (+/- 800ms) or switch non-critical metrics to QoS 0.";
    } else if (type === "OFFLINE_BACKPRESSURE") {
      currentBucket.bufferedCount += 15;
      currentBucket.totalPackets += 15;
      currentBucket.avgLatencyMs = 290;
      currentBucket.isBottleneck = true;
      currentBucket.bottleneckType = "OFFLINE_BACKPRESSURE";
      currentBucket.bottleneckReason =
        "ESP32 Edge Buffer Backpressure: Inbound broker queue throttled by cellular modem timeout.";
      currentBucket.recommendedAction =
        "Enable flash-backed circular ring buffer to prevent heap memory exhaustion.";
    } else {
      currentBucket.commandCount += 8;
      currentBucket.totalPackets += 12;
      currentBucket.avgLatencyMs = 175;
      currentBucket.isBottleneck = true;
      currentBucket.bottleneckType = "CHANNEL_CONGESTION";
      currentBucket.bottleneckReason =
        "Reflex Actuator Flood: Simultaneous Jain drip manifold valve commands and pump triggers saturated edge bus.";
      currentBucket.recommendedAction =
        "Stagger solenoid actuation sequence by 500ms intervals.";
    }

    // Add alarm packet to log
    this.publish(
      "farm/edge-gateway/diagnostic/bottleneck",
      {
        bottleneckType: type,
        latencyMs: currentBucket.avgLatencyMs,
        lossPercent: currentBucket.packetLossPercent,
        timestamp: Date.now(),
      },
      1,
      false,
      "ALARM_FAULT"
    );
  }

  public getHourlyTraffic(): MqttTrafficBucket[] {
    return [...this.trafficBuckets];
  }

  public getGatewayMetrics(): MqttGatewayMetrics {
    const totalPackets = this.trafficBuckets.reduce((acc, b) => acc + b.totalPackets, 0);
    const totalLatency = this.trafficBuckets.reduce((acc, b) => acc + b.avgLatencyMs * b.totalPackets, 0);
    const avgLatency = totalPackets > 0 ? Math.round(totalLatency / totalPackets) : 42;
    const bottleneckEvents = this.trafficBuckets.filter((b) => b.isBottleneck).length;

    const currentBucket = this.trafficBuckets[this.trafficBuckets.length - 1];
    const activeBottleneck = currentBucket?.isBottleneck ? currentBucket.bottleneckType || "ACTIVE" : null;

    // Estimate success rate
    const totalLossPackets = this.trafficBuckets.reduce(
      (acc, b) => acc + (b.totalPackets * b.packetLossPercent) / 100,
      0
    );
    const successRate = totalPackets > 0 ? Math.max(88, Number((100 - (totalLossPackets / totalPackets) * 100).toFixed(1))) : 99.4;

    return {
      totalPacketsLastHour: totalPackets,
      packetsPerMinute: Number((totalPackets / 60).toFixed(1)),
      successRatePercent: successRate,
      avgLatencyMs: avgLatency,
      bottleneckEventsCount: bottleneckEvents,
      activeBottleneck,
      bufferUsagePercent: Math.min(100, Math.round((this.offlineBuffer.length / 50) * 100)),
    };
  }

  public getStatus() {
    return {
      isOnline: this.isOnline,
      broker: this.brokerAddress,
      bufferedCount: this.offlineBuffer.length,
      recentPackets: [...this.packets],
      hourlyTraffic: this.getHourlyTraffic(),
      metrics: this.getGatewayMetrics(),
    };
  }

  public clearLogs() {
    this.packets = [];
  }
}

