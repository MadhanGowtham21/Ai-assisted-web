import {
  DatasetName,
  EventType,
  RawClickstreamEvent,
  IngestionParams,
  IngestionResult,
  SessionReconstructParams,
  UserSession,
  SessionResult,
  PrefixSpanParams,
  FrequentPattern,
  PrefixSpanResult,
  ClusteringParams,
  ClusterPoint,
  ClusterSummary,
  GraphNode,
  GraphLink,
  ClusteringResult,
  EvaluationResult,
  BenchmarkModel
} from '../types';

const PAGES = [
  'Home',
  'Search_Query',
  'Category_Electronics',
  'Category_Apparel',
  'Product_Laptop_Ultra',
  'Product_SmartWatch',
  'Product_NoiseCancelling_Headphones',
  'Cart_View',
  'Checkout_Shipping',
  'Checkout_Payment',
  'Order_Confirmation',
  'User_Reviews',
  'FAQ_Support'
];

/**
 * Deterministic pseudo-random generator with seed support
 */
function createSeededRandom(seed: number = 42) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * STEP 1: Ingestion Simulation
 */
export function simulateDataIngestion(params: IngestionParams): IngestionResult {
  const rand = createSeededRandom(params.sampleSize + params.dataset.length);
  const sampleCount = Math.min(params.sampleSize, 30000);

  const eventTypes: EventType[] = ['view', 'category_browse', 'search', 'add_to_cart', 'checkout_init', 'transaction'];
  // Weights based on realistic benchmark datasets
  let weights = [0.60, 0.20, 0.10, 0.06, 0.03, 0.01]; // RetailRocket typical funnel

  if (params.dataset.includes('YOOCHOOSE')) {
    weights = [0.68, 0.16, 0.08, 0.05, 0.02, 0.01];
  } else if (params.dataset.includes('Controlled')) {
    weights = [0.52, 0.22, 0.12, 0.08, 0.04, 0.02];
  }

  const events: RawClickstreamEvent[] = [];
  const distribution: Record<EventType, number> = {
    view: 0,
    category_browse: 0,
    search: 0,
    add_to_cart: 0,
    checkout_init: 0,
    transaction: 0
  };

  const visitorCount = Math.max(50, Math.floor(sampleCount / 6.2));
  const visitorPool = Array.from({ length: visitorCount }, (_, i) => `V-${1000 + i}`);
  const devices: ('Desktop' | 'Mobile' | 'Tablet')[] = ['Desktop', 'Mobile', 'Tablet'];

  let noiseEventsRemoved = 0;
  const baseTime = new Date('2026-10-15T08:00:00Z').getTime();

  for (let i = 0; i < sampleCount; i++) {
    const visitor = visitorPool[Math.floor(rand() * visitorPool.length)];
    const roll = rand();
    let cumulative = 0;
    let selectedType: EventType = 'view';

    for (let w = 0; w < weights.length; w++) {
      cumulative += weights[w];
      if (roll <= cumulative) {
        selectedType = eventTypes[w];
        break;
      }
    }

    const isBot = rand() < 0.035; // 3.5% bot rate in raw clickstream
    if (params.noiseFilter && isBot) {
      noiseEventsRemoved++;
      continue;
    }

    distribution[selectedType]++;
    const pageIndex = Math.floor(rand() * PAGES.length);
    const eventTime = new Date(baseTime + i * 2400 + Math.floor(rand() * 1200)).toISOString();
    const dwell = Math.max(2, Math.round(isBot ? 0.3 + rand() * 0.5 : 8 + rand() * 140));

    events.push({
      id: `EV-${100000 + i}`,
      visitorId: visitor,
      sessionId: `SES-${visitor}-${Math.floor(i / 15)}`,
      eventType: selectedType,
      page: PAGES[pageIndex],
      itemId: selectedType === 'add_to_cart' || selectedType === 'view' ? `ITM-${500 + (pageIndex % 7)}` : undefined,
      category: pageIndex > 6 ? 'Checkout' : pageIndex > 3 ? 'Consumer Electronics' : 'Discovery',
      timestamp: eventTime,
      dwellSeconds: dwell,
      device: devices[Math.floor(rand() * devices.length)],
      isBot
    });
  }

  const uniqueVisitors = new Set(events.map(e => e.visitorId)).size;
  const throughput = Math.round(18500 + rand() * 7500);

  return {
    totalEvents: events.length,
    uniqueVisitors,
    eventDistribution: distribution,
    throughputEventsPerSec: throughput,
    noiseEventsRemoved,
    events: events.slice(0, 1500) // Keep reasonable memory in client table while showing total stats
  };
}

/**
 * STEP 2: Session Reconstruction Simulation
 */
export function simulateSessionReconstruction(
  ingestion: IngestionResult,
  params: SessionReconstructParams
): SessionResult {
  const rand = createSeededRandom(params.inactivityThresholdMinutes * 31 + params.minSessionLength);
  const rawEvents = ingestion.totalEvents;

  // Approximate realistic segmentation based on inactivity threshold \tau
  // Higher \tau merges more events into fewer longer sessions
  const tauFactor = 30 / Math.max(5, params.inactivityThresholdMinutes);
  const baseSessionCount = Math.max(80, Math.round((rawEvents / (4.5 * (1 / Math.sqrt(tauFactor))))));

  const pathsCatalog = [
    ['Home', 'Category_Electronics', 'Product_Laptop_Ultra', 'Cart_View', 'Checkout_Shipping', 'Checkout_Payment', 'Order_Confirmation'],
    ['Home', 'Search_Query', 'Product_SmartWatch', 'User_Reviews', 'Product_SmartWatch', 'Cart_View'],
    ['Home', 'Category_Apparel', 'Home', 'Category_Electronics', 'Home'],
    ['Home', 'Search_Query', 'Product_NoiseCancelling_Headphones', 'Cart_View', 'Checkout_Shipping'],
    ['Category_Electronics', 'Product_Laptop_Ultra', 'User_Reviews', 'Product_Laptop_Ultra'],
    ['Home', 'FAQ_Support', 'Home'],
    ['Home', 'Product_SmartWatch', 'Cart_View', 'Checkout_Payment', 'Order_Confirmation'],
    ['Search_Query', 'Product_Laptop_Ultra', 'Cart_View', 'Home', 'Cart_View']
  ];

  const sessions: UserSession[] = [];
  let totalDwell = 0;
  const dwellValues: number[] = [];
  let convertedCount = 0;
  let bounceCount = 0;

  const sessionLimit = Math.min(baseSessionCount, 400);

  for (let i = 0; i < sessionLimit; i++) {
    const isBot = rand() < 0.04;
    const velocity = isBot ? 18 + rand() * 12 : 0.2 + rand() * 1.8;

    // Filter out bots if threshold exceeded
    if (velocity > params.botClickRateThreshold) {
      continue;
    }

    const pathTemplate = pathsCatalog[Math.floor(rand() * pathsCatalog.length)];
    // Randomize length around template
    let len = Math.max(1, Math.round(pathTemplate.length + (rand() * 4 - 2)));
    if (len < params.minSessionLength) {
      continue;
    }

    const trajectory = pathTemplate.slice(0, Math.min(len, pathTemplate.length));
    const converted = trajectory.includes('Order_Confirmation');
    if (converted) convertedCount++;

    const isBounce = trajectory.length <= 1;
    if (isBounce) bounceCount++;

    const dwells = trajectory.map(() => Math.round(15 + rand() * 180));
    const sessionDwell = dwells.reduce((a, b) => a + b, 0);
    totalDwell += sessionDwell;
    dwellValues.push(sessionDwell);

    const startTime = new Date(Date.now() - (sessionLimit - i) * 60000).toISOString();
    const endTime = new Date(Date.now() - (sessionLimit - i) * 60000 + sessionDwell * 1000).toISOString();

    sessions.push({
      sessionId: `SESS-${20000 + i}`,
      visitorId: `V-${1000 + (i % 80)}`,
      startTime,
      endTime,
      durationSeconds: sessionDwell,
      eventCount: trajectory.length,
      trajectory,
      dwellTimes: dwells,
      converted,
      isBotFlagged: isBot,
      avgVelocity: parseFloat(velocity.toFixed(2))
    });
  }

  dwellValues.sort((a, b) => a - b);
  const avgDwell = sessions.length ? Math.round(totalDwell / sessions.length) : 180;
  const medianDwell = dwellValues.length ? dwellValues[Math.floor(dwellValues.length / 2)] : 150;

  // Generate Dwell Histogram bins
  const bins = [
    { bin: '0 - 30s', count: Math.round(sessions.length * 0.12) },
    { bin: '31 - 90s', count: Math.round(sessions.length * 0.22) },
    { bin: '91 - 180s', count: Math.round(sessions.length * 0.28) },
    { bin: '181 - 360s', count: Math.round(sessions.length * 0.20) },
    { bin: '361 - 720s', count: Math.round(sessions.length * 0.11) },
    { bin: '720s+', count: Math.round(sessions.length * 0.07) }
  ];

  const dwellHistogram = bins.map(b => ({
    bin: b.bin,
    count: b.count,
    logCount: parseFloat(Math.log10(Math.max(1, b.count)).toFixed(2))
  }));

  const compressionRatio = parseFloat((rawEvents / Math.max(1, sessions.length)).toFixed(2));
  const bounceRatePercent = parseFloat(((bounceCount / Math.max(1, sessions.length)) * 100).toFixed(1));
  const conversionRatePercent = parseFloat(((convertedCount / Math.max(1, sessions.length)) * 100).toFixed(1));

  return {
    totalSessions: sessions.length,
    compressionRatio,
    avgDwellSeconds: avgDwell,
    medianDwellSeconds: medianDwell,
    bounceRatePercent: Math.max(12.4, bounceRatePercent),
    conversionRatePercent: Math.max(4.2, conversionRatePercent),
    sessions,
    dwellHistogram
  };
}

/**
 * STEP 3: PrefixSpan Algorithm Simulation
 */
export function simulatePrefixSpanMining(params: PrefixSpanParams): PrefixSpanResult {
  const rand = createSeededRandom(Math.round(params.minSupport * 1000) + params.maxPatternLength);

  // Mined frequent patterns derived from user parameters
  const candidatePatterns: Array<{ seq: string[]; baseSupp: number; lift: number; conf: number }> = [
    {
      seq: ['Home', 'Category_Electronics', 'Product_Laptop_Ultra'],
      baseSupp: 0.18,
      lift: 1.42,
      conf: 0.78
    },
    {
      seq: ['Home', 'Search_Query', 'Product_SmartWatch', 'Cart_View'],
      baseSupp: 0.12,
      lift: 2.15,
      conf: 0.65
    },
    {
      seq: ['Product_Laptop_Ultra', 'Cart_View', 'Checkout_Shipping', 'Checkout_Payment', 'Order_Confirmation'],
      baseSupp: 0.07,
      lift: 4.80,
      conf: 0.89
    },
    {
      seq: ['Home', 'Category_Apparel', 'Home'],
      baseSupp: 0.15,
      lift: 0.45,
      conf: 0.52
    },
    {
      seq: ['Category_Electronics', 'Product_Laptop_Ultra', 'User_Reviews'],
      baseSupp: 0.11,
      lift: 1.85,
      conf: 0.71
    },
    {
      seq: ['Product_NoiseCancelling_Headphones', 'Cart_View', 'Checkout_Shipping'],
      baseSupp: 0.08,
      lift: 2.90,
      conf: 0.64
    },
    {
      seq: ['Search_Query', 'Product_SmartWatch', 'User_Reviews'],
      baseSupp: 0.09,
      lift: 1.60,
      conf: 0.68
    },
    {
      seq: ['Cart_View', 'Checkout_Shipping', 'Checkout_Payment'],
      baseSupp: 0.14,
      lift: 3.50,
      conf: 0.82
    },
    {
      seq: ['Home', 'Search_Query', 'Category_Electronics'],
      baseSupp: 0.16,
      lift: 0.95,
      conf: 0.58
    },
    {
      seq: ['Product_SmartWatch', 'Cart_View', 'Checkout_Payment', 'Order_Confirmation'],
      baseSupp: 0.06,
      lift: 4.40,
      conf: 0.86
    },
    {
      seq: ['Home', 'Category_Electronics', 'Product_Laptop_Ultra', 'Cart_View'],
      baseSupp: 0.09,
      lift: 2.70,
      conf: 0.74
    },
    {
      seq: ['Home', 'FAQ_Support', 'Home'],
      baseSupp: 0.04,
      lift: 0.20,
      conf: 0.40
    }
  ];

  // Filter based on minSupport sigma and maxPatternLength k
  const filtered = candidatePatterns.filter(p => {
    if (p.seq.length > params.maxPatternLength) return false;
    if (p.baseSupp < params.minSupport) return false;
    if (params.targetOutcome === 'conversions' && p.lift < 2.0) return false;
    if (params.targetOutcome === 'dropoffs' && p.lift >= 1.0) return false;
    return true;
  });

  const patterns: FrequentPattern[] = filtered.map((p, idx) => {
    const relSupp = parseFloat((p.baseSupp * 100).toFixed(1));
    const absSupp = Math.round(p.baseSupp * 2450);
    const trend: 'up' | 'stable' | 'down' = p.lift > 1.5 ? 'up' : p.lift < 0.8 ? 'down' : 'stable';

    return {
      id: `PAT-${idx + 1}`,
      sequence: p.seq,
      absoluteSupport: absSupp,
      relativeSupport: relSupp,
      patternLength: p.seq.length,
      conversionLift: parseFloat(p.lift.toFixed(2)),
      confidenceToNext: parseFloat(p.conf.toFixed(2)),
      trend
    };
  });

  // Calculate realistic execution time in ms (PrefixSpan typically 120ms - 280ms)
  const executionTimeMs = Math.round(140 + (1 / params.minSupport) * 4.2 + params.maxPatternLength * 12 + rand() * 25);
  const projectedRecursions = Math.round(180 + patterns.length * 16 + rand() * 40);

  // Build Sankey Nodes & Links
  const sankeyNodes = [
    { name: 'Entrance (Home)', itemStyle: { color: '#6366F1' } },
    { name: 'Direct Search', itemStyle: { color: '#8B5CF6' } },
    { name: 'Electronics Category', itemStyle: { color: '#3B82F6' } },
    { name: 'Apparel Category', itemStyle: { color: '#06B6D4' } },
    { name: 'Product View (Laptop)', itemStyle: { color: '#0EA5E9' } },
    { name: 'Product View (SmartWatch)', itemStyle: { color: '#10B981' } },
    { name: 'User Reviews / Specs', itemStyle: { color: '#F59E0B' } },
    { name: 'Add to Cart', itemStyle: { color: '#0D9488' } },
    { name: 'Checkout Funnel', itemStyle: { color: '#4F46E5' } },
    { name: 'Successful Order', itemStyle: { color: '#059669' } },
    { name: 'Drop-off / Exit', itemStyle: { color: '#E11D48' } }
  ];

  const sankeyLinks = [
    { source: 'Entrance (Home)', target: 'Electronics Category', value: 420 },
    { source: 'Entrance (Home)', target: 'Apparel Category', value: 240 },
    { source: 'Entrance (Home)', target: 'Direct Search', value: 310 },
    { source: 'Direct Search', target: 'Product View (Laptop)', value: 180 },
    { source: 'Direct Search', target: 'Product View (SmartWatch)', value: 130 },
    { source: 'Electronics Category', target: 'Product View (Laptop)', value: 290 },
    { source: 'Electronics Category', target: 'Drop-off / Exit', value: 130 },
    { source: 'Apparel Category', target: 'Drop-off / Exit', value: 180 },
    { source: 'Product View (Laptop)', target: 'User Reviews / Specs', value: 140 },
    { source: 'Product View (Laptop)', target: 'Add to Cart', value: 210 },
    { source: 'Product View (Laptop)', target: 'Drop-off / Exit', value: 120 },
    { source: 'Product View (SmartWatch)', target: 'Add to Cart', value: 95 },
    { source: 'Product View (SmartWatch)', target: 'Drop-off / Exit', value: 35 },
    { source: 'User Reviews / Specs', target: 'Add to Cart', value: 110 },
    { source: 'User Reviews / Specs', target: 'Drop-off / Exit', value: 30 },
    { source: 'Add to Cart', target: 'Checkout Funnel', value: 315 },
    { source: 'Add to Cart', target: 'Drop-off / Exit', value: 100 },
    { source: 'Checkout Funnel', target: 'Successful Order', value: 245 },
    { source: 'Checkout Funnel', target: 'Drop-off / Exit', value: 70 }
  ];

  return {
    executionTimeMs,
    patternsMinedCount: patterns.length,
    projectedRecursions,
    patterns,
    sankeyNodes,
    sankeyLinks
  };
}

/**
 * STEP 4: Clustering & Directed Navigation Graph Simulation
 */
export function simulateClusteringAndGraph(params: ClusteringParams): ClusteringResult {
  const rand = createSeededRandom(params.clustersCount * 17 + (params.algorithm === 'HDBSCAN' ? 99 : 33));

  const clusterMetadata: Record<number, { name: string; color: string; desc: string; dwellBase: number; convBase: number }> = {
    0: {
      name: 'Exploratory Window Shoppers',
      color: '#3B82F6', // Blue
      desc: 'Broad navigation across catalog, high dwell time, low cart velocity, zero purchases.',
      dwellBase: 340,
      convBase: 1.2
    },
    1: {
      name: 'High-Intent Direct Buyers',
      color: '#0D9488', // Emerald Teal
      desc: 'Rapid target search, high cart velocity, immediate checkout transition, 84% conversion rate.',
      dwellBase: 110,
      convBase: 84.5
    },
    2: {
      name: 'Confused / Looping Visitors',
      color: '#E11D48', // Rose Red
      desc: 'High transition entropy, oscillating between specs and categories, high abandon rate at checkout.',
      dwellBase: 420,
      convBase: 6.8
    },
    3: {
      name: 'Deal & Discount Hunters',
      color: '#D97706', // Amber
      desc: 'Repeated cart additions followed by price checks and voucher searches before decision.',
      dwellBase: 260,
      convBase: 38.2
    },
    4: {
      name: 'Mobile Casual Browsers',
      color: '#8B5CF6', // Purple
      desc: 'Short fragmented sessions, high bounce from category pages, social referrer bias.',
      dwellBase: 75,
      convBase: 3.1
    },
    5: {
      name: 'Research & Review Analysts',
      color: '#6366F1', // Indigo
      desc: 'Extensive reading of customer testimonials, specifications, and warranty pages.',
      dwellBase: 390,
      convBase: 24.0
    }
  };

  const activeClustersCount = Math.min(params.clustersCount, 6);
  const totalPoints = 320;
  const points: ClusterPoint[] = [];

  // Cluster centers for 2D PCA / t-SNE projection
  const centers = [
    { x: -3.2, y: 1.8 },
    { x: 3.4, y: 2.5 },
    { x: -1.2, y: -2.8 },
    { x: 2.1, y: -1.9 },
    { x: -4.0, y: -1.2 },
    { x: 0.8, y: 3.6 }
  ];

  const clusterCounts: Record<number, number> = {};
  for (let c = 0; c < activeClustersCount; c++) {
    clusterCounts[c] = 0;
  }

  for (let i = 0; i < totalPoints; i++) {
    const cluster = i % activeClustersCount;
    clusterCounts[cluster]++;
    const center = centers[cluster];
    const meta = clusterMetadata[cluster];

    // Add Gaussian-like scatter around center
    const spread = params.algorithm === 'HDBSCAN' ? 0.75 : 0.95;
    const x = parseFloat((center.x + (rand() + rand() - 1) * spread).toFixed(2));
    const y = parseFloat((center.y + (rand() + rand() - 1) * spread).toFixed(2));

    const dwell = Math.round(meta.dwellBase + (rand() * 80 - 40));
    const velocity = parseFloat((cluster === 1 ? 2.4 + rand() * 1.2 : 0.3 + rand() * 0.8).toFixed(2));
    const entropy = parseFloat((cluster === 2 ? 0.82 + rand() * 0.15 : 0.25 + rand() * 0.4).toFixed(2));
    const converted = rand() * 100 < meta.convBase;

    points.push({
      id: `PT-${i}`,
      sessionId: `SESS-${3000 + i}`,
      x,
      y,
      cluster,
      clusterName: meta.name,
      dwellTime: dwell,
      actionVelocity: velocity,
      entropy,
      converted,
      pathSnippet: cluster === 1 ? 'Search -> Cart -> Checkout' : cluster === 2 ? 'Cat -> Product -> Cat -> FAQ' : 'Home -> Browse -> Exit'
    });
  }

  const clusterSummaries: ClusterSummary[] = [];
  for (let c = 0; c < activeClustersCount; c++) {
    const meta = clusterMetadata[c];
    const count = clusterCounts[c];
    clusterSummaries.push({
      clusterId: c,
      name: meta.name,
      size: count,
      percentage: parseFloat(((count / totalPoints) * 100).toFixed(1)),
      color: meta.color,
      avgDwell: meta.dwellBase,
      conversionRate: meta.convBase,
      primaryBehavior: meta.desc
    });
  }

  // Directed Navigation Graph
  const graphNodes: GraphNode[] = [
    { id: 'n0', name: 'Home Landing', symbolSize: 58, category: 0, value: 1250, inDegree: 210, outDegree: 1200, dropOffRate: 22.4, isBottleneck: false },
    { id: 'n1', name: 'Search Query', symbolSize: 42, category: 1, value: 680, inDegree: 420, outDegree: 640, dropOffRate: 15.1, isBottleneck: false },
    { id: 'n2', name: 'Category: Electronics', symbolSize: 48, category: 1, value: 890, inDegree: 590, outDegree: 750, dropOffRate: 28.6, isBottleneck: false },
    { id: 'n3', name: 'Category: Apparel', symbolSize: 36, category: 1, value: 430, inDegree: 340, outDegree: 380, dropOffRate: 38.2, isBottleneck: false },
    { id: 'n4', name: 'Product: Laptop Ultra', symbolSize: 52, category: 2, value: 940, inDegree: 680, outDegree: 820, dropOffRate: 21.0, isBottleneck: false },
    { id: 'n5', name: 'Product: SmartWatch', symbolSize: 38, category: 2, value: 510, inDegree: 390, outDegree: 460, dropOffRate: 24.5, isBottleneck: false },
    { id: 'n6', name: 'Specs & Reviews', symbolSize: 32, category: 2, value: 380, inDegree: 320, outDegree: 340, dropOffRate: 18.0, isBottleneck: false },
    { id: 'n7', name: 'Cart View', symbolSize: 46, category: 3, value: 640, inDegree: 580, outDegree: 410, dropOffRate: 46.8, isBottleneck: true },
    { id: 'n8', name: 'Checkout: Shipping', symbolSize: 36, category: 3, value: 390, inDegree: 360, outDegree: 330, dropOffRate: 14.2, isBottleneck: false },
    { id: 'n9', name: 'Checkout: Payment', symbolSize: 38, category: 3, value: 330, inDegree: 310, outDegree: 245, dropOffRate: 42.5, isBottleneck: true },
    { id: 'n10', name: 'Order Confirmation', symbolSize: 40, category: 4, value: 245, inDegree: 245, outDegree: 0, dropOffRate: 0.0, isBottleneck: false },
    { id: 'n11', name: 'Customer Help / FAQ', symbolSize: 28, category: 5, value: 210, inDegree: 190, outDegree: 150, dropOffRate: 54.0, isBottleneck: false }
  ];

  const graphLinks: GraphLink[] = [
    { source: 'Home Landing', target: 'Category: Electronics', value: 450, probability: 0.38, isDropOff: false },
    { source: 'Home Landing', target: 'Search Query', value: 320, probability: 0.27, isDropOff: false },
    { source: 'Home Landing', target: 'Category: Apparel', value: 240, probability: 0.20, isDropOff: false },
    { source: 'Search Query', target: 'Product: Laptop Ultra', value: 260, probability: 0.41, isDropOff: false },
    { source: 'Search Query', target: 'Product: SmartWatch', value: 180, probability: 0.28, isDropOff: false },
    { source: 'Category: Electronics', target: 'Product: Laptop Ultra', value: 380, probability: 0.51, isDropOff: false },
    { source: 'Category: Electronics', target: 'Product: SmartWatch', value: 190, probability: 0.25, isDropOff: false },
    { source: 'Product: Laptop Ultra', target: 'Specs & Reviews', value: 180, probability: 0.22, isDropOff: false },
    { source: 'Product: Laptop Ultra', target: 'Cart View', value: 340, probability: 0.41, isDropOff: false },
    { source: 'Product: SmartWatch', target: 'Cart View', value: 160, probability: 0.35, isDropOff: false },
    { source: 'Specs & Reviews', target: 'Cart View', value: 150, probability: 0.44, isDropOff: false },
    { source: 'Cart View', target: 'Checkout: Shipping', value: 310, probability: 0.53, isDropOff: false },
    // Major Bottleneck Link (Cart Abandonment)
    { source: 'Cart View', target: 'Home Landing', value: 180, probability: 0.31, isDropOff: true },
    { source: 'Checkout: Shipping', target: 'Checkout: Payment', value: 280, probability: 0.85, isDropOff: false },
    // Payment Gateway Friction Bottleneck
    { source: 'Checkout: Payment', target: 'Customer Help / FAQ', value: 65, probability: 0.20, isDropOff: true },
    { source: 'Checkout: Payment', target: 'Order Confirmation', value: 215, probability: 0.65, isDropOff: false }
  ];

  const silhouetteScore = params.algorithm === 'HDBSCAN' ? 0.684 : 0.542;
  const executionTimeMs = Math.round(95 + activeClustersCount * 14 + rand() * 20);

  return {
    executionTimeMs,
    silhouetteScore,
    points,
    clusterSummaries,
    graphNodes,
    graphLinks
  };
}

/**
 * STEP 5: Research Benchmark Evaluation
 */
export function simulateEvaluation(): EvaluationResult {
  const models: BenchmarkModel[] = [
    {
      name: 'Baseline 1 (Raw RFM + K-Means)',
      tag: 'B1-RFM-KM',
      isProposed: false,
      silhouette: 0.382,
      daviesBouldin: 1.48,
      calinskiHarabasz: 412,
      seqCoherence: 0.41,
      runtimeMs: 42,
      memoryMb: 18.4,
      description: 'Static recency-frequency-monetary summarization without temporal ordering or sequential context.'
    },
    {
      name: 'Baseline 2 (PCA + GMM)',
      tag: 'B2-PCA-GMM',
      isProposed: false,
      silhouette: 0.441,
      daviesBouldin: 1.28,
      calinskiHarabasz: 526,
      seqCoherence: 0.49,
      runtimeMs: 98,
      memoryMb: 34.2,
      description: 'Linear dimension reduction on aggregate session features with Gaussian Mixture Modeling.'
    },
    {
      name: 'Baseline 3 (Flat Sequence + DBSCAN)',
      tag: 'B3-FLAT-DB',
      isProposed: false,
      silhouette: 0.518,
      daviesBouldin: 1.06,
      calinskiHarabasz: 684,
      seqCoherence: 0.63,
      runtimeMs: 312,
      memoryMb: 82.6,
      description: 'N-gram sequence bag-of-words without dwell weighting or graph topological constraints.'
    },
    {
      name: 'Proposed Framework (Graph-Temporal PrefixSpan + HDBSCAN)',
      tag: 'PROPOSED-GT-PS-HDB',
      isProposed: true,
      silhouette: 0.684,
      daviesBouldin: 0.718,
      calinskiHarabasz: 948,
      seqCoherence: 0.842,
      runtimeMs: 146,
      memoryMb: 46.8,
      description: 'Our M.E. Thesis Architecture: PrefixSpan trajectory mining fused with transition graph topology and density-based clustering.'
    }
  ];

  return {
    models,
    recommendedModel: 'Proposed Framework (Graph-Temporal PrefixSpan + HDBSCAN)',
    improvementOverBaselinePct: {
      silhouette: 32.0, // (+32% vs best baseline)
      daviesBouldin: -32.2, // (-32.2% lower error/separation)
      seqCoherence: 33.6 // (+33.6% higher trajectory integrity)
    }
  };
}
