/**
 * Analytics anomaly detection — compares current metrics against a baseline
 * period and flags significant deviations.
 * Used by analytics anomalies endpoint (10.9).
 */

export interface MetricSet {
  messageVolume: number;
  avgResponseTime: number;
  resolutionRate: number;
  csatAverage: number;
}

export type AnomalyType =
  | "volume_spike"
  | "slow_response"
  | "resolution_drop"
  | "csat_drop";

export type AnomalySeverity = "low" | "medium" | "high";

export interface Anomaly {
  type: AnomalyType;
  severity: AnomalySeverity;
  metric: string;
  current: number;
  baseline: number;
  message: string;
}

/**
 * Detect anomalies by comparing current metrics to a baseline period.
 *
 * Thresholds:
 * - volume_spike: current volume >= 2x baseline
 * - slow_response: current response time >= 1.5x baseline
 * - resolution_drop: current rate is 10+ percentage points below baseline
 * - csat_drop: current CSAT is 5+ percentage points below baseline
 */
export function detectAnomalies(
  current: MetricSet,
  baseline: MetricSet
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // Volume spike (2x or more)
  if (baseline.messageVolume > 0 && current.messageVolume >= baseline.messageVolume * 2) {
    const multiplier = Math.round((current.messageVolume / baseline.messageVolume) * 10) / 10;
    anomalies.push({
      type: "volume_spike",
      severity: multiplier >= 5 ? "high" : multiplier >= 3 ? "medium" : "low",
      metric: "messageVolume",
      current: current.messageVolume,
      baseline: baseline.messageVolume,
      message: `Message volume is ${multiplier}x higher than baseline (${current.messageVolume} vs ${baseline.messageVolume})`,
    });
  }

  // Slow response (1.5x or more)
  if (baseline.avgResponseTime > 0 && current.avgResponseTime >= baseline.avgResponseTime * 1.5) {
    const pctSlower = Math.round(
      ((current.avgResponseTime / baseline.avgResponseTime - 1) * 100)
    );
    anomalies.push({
      type: "slow_response",
      severity: pctSlower >= 200 ? "high" : pctSlower >= 100 ? "medium" : "low",
      metric: "avgResponseTime",
      current: current.avgResponseTime,
      baseline: baseline.avgResponseTime,
      message: `Response time is ${pctSlower}% slower than baseline (${current.avgResponseTime}ms vs ${baseline.avgResponseTime}ms)`,
    });
  }

  // Resolution rate drop (10+ percentage points)
  if (baseline.resolutionRate > 0 && current.resolutionRate < baseline.resolutionRate - 10) {
    const drop = Math.round((baseline.resolutionRate - current.resolutionRate) * 10) / 10;
    anomalies.push({
      type: "resolution_drop",
      severity: drop >= 25 ? "high" : drop >= 15 ? "medium" : "low",
      metric: "resolutionRate",
      current: current.resolutionRate,
      baseline: baseline.resolutionRate,
      message: `Resolution rate dropped by ${drop} percentage points (${current.resolutionRate}% vs ${baseline.resolutionRate}%)`,
    });
  }

  // CSAT drop (5+ percentage points)
  if (baseline.csatAverage > 0 && current.csatAverage < baseline.csatAverage - 5) {
    const drop = Math.round((baseline.csatAverage - current.csatAverage) * 10) / 10;
    anomalies.push({
      type: "csat_drop",
      severity: drop >= 15 ? "high" : drop >= 10 ? "medium" : "low",
      metric: "csatAverage",
      current: current.csatAverage,
      baseline: baseline.csatAverage,
      message: `CSAT score dropped by ${drop} points (${current.csatAverage}% vs ${baseline.csatAverage}%)`,
    });
  }

  return anomalies;
}
