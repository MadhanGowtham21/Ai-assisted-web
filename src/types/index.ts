export type DatasetName = 'RetailRocket E-Commerce (2.75M Events Benchmark)' | 'YOOCHOOSE RecSys-15 Clickstream' | 'Controlled Demo Synthetic';

export type EventType = 'view' | 'category_browse' | 'search' | 'add_to_cart' | 'checkout_init' | 'transaction';

export interface RawClickstreamEvent {
  id: string;
  visitorId: string;
  sessionId: string;
  eventType: EventType;
  page: string;
  itemId?: string;
  category: string;
  timestamp: string; // ISO string
  dwellSeconds: number;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  isBot?: boolean;
}

export interface IngestionParams {
  dataset: DatasetName;
  sampleSize: number;
  noiseFilter: boolean;
  dateRange: string;
}

export interface IngestionResult {
  totalEvents: number;
  uniqueVisitors: number;
  eventDistribution: Record<EventType, number>;
  throughputEventsPerSec: number;
  noiseEventsRemoved: number;
  events: RawClickstreamEvent[];
}

export interface SessionReconstructParams {
  inactivityThresholdMinutes: number; // \tau
  minSessionLength: number; // L_min
  botClickRateThreshold: number; // clicks/sec
  temporalDecayFactor: number; // \lambda
}

export interface UserSession {
  sessionId: string;
  visitorId: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  eventCount: number;
  trajectory: string[]; // e.g. ['Home', 'Electronics', 'Laptop_X', 'AddToCart', 'Checkout']
  dwellTimes: number[];
  converted: boolean;
  isBotFlagged: boolean;
  avgVelocity: number; // clicks/sec
}

export interface SessionResult {
  totalSessions: number;
  compressionRatio: number; // rawEvents / sessions
  avgDwellSeconds: number;
  medianDwellSeconds: number;
  bounceRatePercent: number;
  conversionRatePercent: number;
  sessions: UserSession[];
  dwellHistogram: { bin: string; count: number; logCount: number }[];
}

export interface PrefixSpanParams {
  minSupport: number; // \sigma (0.01 - 0.20)
  maxPatternLength: number; // k (2 - 8)
  closedSequenceFilter: boolean;
  targetOutcome: 'all' | 'conversions' | 'dropoffs';
}

export interface FrequentPattern {
  id: string;
  sequence: string[];
  absoluteSupport: number;
  relativeSupport: number; // percentage
  patternLength: number;
  conversionLift: number; // relative lift vs average
  confidenceToNext: number; // e.g. 0.74
  trend: 'up' | 'stable' | 'down';
}

export interface PrefixSpanResult {
  executionTimeMs: number;
  patternsMinedCount: number;
  projectedRecursions: number;
  patterns: FrequentPattern[];
  sankeyNodes: { name: string; itemStyle?: { color?: string } }[];
  sankeyLinks: { source: string; target: string; value: number }[];
}

export interface ClusteringParams {
  algorithm: 'K-Means' | 'HDBSCAN';
  clustersCount: number; // 2 to 6
  dwellWeight: number; // 0 to 1
  cartVelocityWeight: number; // 0 to 1
  entropyWeight: number; // 0 to 1
  dimReduction: 'PCA' | 't-SNE';
}

export interface ClusterPoint {
  id: string;
  sessionId: string;
  x: number;
  y: number;
  cluster: number;
  clusterName: string;
  dwellTime: number;
  actionVelocity: number;
  entropy: number;
  converted: boolean;
  pathSnippet: string;
}

export interface ClusterSummary {
  clusterId: number;
  name: string;
  size: number;
  percentage: number;
  color: string;
  avgDwell: number;
  conversionRate: number;
  primaryBehavior: string;
}

export interface GraphNode {
  id: string;
  name: string;
  symbolSize: number;
  category: number;
  value: number; // in-degree / traffic
  inDegree: number;
  outDegree: number;
  dropOffRate: number; // percentage
  isBottleneck: boolean;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number; // transition count
  probability: number; // P(v_j | v_i)
  isDropOff: boolean;
}

export interface ClusteringResult {
  executionTimeMs: number;
  silhouetteScore: number;
  points: ClusterPoint[];
  clusterSummaries: ClusterSummary[];
  graphNodes: GraphNode[];
  graphLinks: GraphLink[];
}

export interface BenchmarkModel {
  name: string;
  tag: string;
  isProposed: boolean;
  silhouette: number; // higher is better (-1 to 1)
  daviesBouldin: number; // lower is better
  calinskiHarabasz: number; // higher is better
  seqCoherence: number; // 0 to 1 higher is better
  runtimeMs: number;
  memoryMb: number;
  description: string;
}

export interface EvaluationResult {
  models: BenchmarkModel[];
  recommendedModel: string;
  improvementOverBaselinePct: {
    silhouette: number;
    daviesBouldin: number;
    seqCoherence: number;
  };
}

export interface LogMessage {
  id: string;
  timestamp: string;
  step: number;
  level: 'info' | 'success' | 'warn' | 'algorithm';
  text: string;
  memoryUsageMb?: number;
}
