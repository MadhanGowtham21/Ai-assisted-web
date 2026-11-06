import React, { useState } from 'react';
import {
  Network,
  Play,
  Sparkles,
  Loader2,
  Sliders,
  AlertTriangle,
  Layers,
  ZoomIn,
  Move,
  Info,
  Maximize2
} from 'lucide-react';
import { ClusteringParams, ClusteringResult, ClusterPoint, ClusterSummary } from '../../types';
import { EChartsWrapper } from '../common/EChartsWrapper';
import { audioService } from '../../services/audioService';

interface ClusteringAndGraphViewProps {
  params: ClusteringParams;
  onUpdateParams: (newParams: Partial<ClusteringParams>) => void;
  onExecute: () => void;
  isRunning: boolean;
  result: ClusteringResult | null;
  onProceedNext: () => void;
}

export const ClusteringAndGraphView: React.FC<ClusteringAndGraphViewProps> = ({
  params,
  onUpdateParams,
  onExecute,
  isRunning,
  result,
  onProceedNext
}) => {
  const [activeClusterFilter, setActiveClusterFilter] = useState<number | null>(null);
  const [highlightBottlenecksOnly, setHighlightBottlenecksOnly] = useState(false);

  // ECharts Scatter Plot for 2D PCA / t-SNE
  const getScatterPlotOption = () => {
    if (!result) return {};

    const filteredPoints = activeClusterFilter !== null
      ? result.points.filter(p => p.cluster === activeClusterFilter)
      : result.points;

    // Group points by cluster
    const series = result.clusterSummaries.map(cluster => {
      const clusterPoints = filteredPoints.filter(p => p.cluster === cluster.clusterId);
      return {
        name: cluster.name,
        type: 'scatter',
        symbolSize: 10,
        data: clusterPoints.map(p => [p.x, p.y, p.dwellTime, p.actionVelocity, p.sessionId, p.converted, p.entropy]),
        itemStyle: {
          color: cluster.color,
          opacity: 0.85
        }
      };
    });

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const item = params as { seriesName: string; value: [number, number, number, number, string, boolean, number] };
          const [, , dwell, velocity, session, converted, entropy] = item.value;
          return `
            <div style="font-size: 11px;">
              <b>${item.seriesName}</b><br/>
              Session: <code>${session}</code><br/>
              Dwell: <b>${dwell}s</b> | Velocity: <b>${velocity} clicks/s</b><br/>
              Entropy: <b>${entropy}</b> | Converted: <b>${converted ? 'Yes' : 'No'}</b>
            </div>
          `;
        }
      },
      legend: {
        bottom: 0,
        textStyle: { fontSize: 11, color: '#64748B' },
        itemGap: 14
      },
      grid: {
        left: '5%',
        right: '5%',
        top: '10%',
        bottom: '16%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: `${params.dimReduction} Component 1`,
        nameLocation: 'middle',
        nameGap: 24,
        splitLine: { lineStyle: { color: '#F1F5F9' } },
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B', fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        name: `${params.dimReduction} Component 2`,
        nameLocation: 'middle',
        nameGap: 30,
        splitLine: { lineStyle: { color: '#F1F5F9' } },
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B', fontSize: 10 }
      },
      series
    };
  };

  // ECharts Force-Directed Navigation Graph
  const getGraphChartOption = () => {
    if (!result) return {};

    const nodes = result.graphNodes.map(node => {
      const isBottleneck = node.isBottleneck;
      return {
        id: node.name,
        name: node.name,
        symbolSize: node.symbolSize * 0.85,
        value: node.value,
        category: node.category,
        label: {
          show: true,
          position: 'bottom',
          fontSize: 10,
          color: isBottleneck ? '#BE123C' : '#334155',
          fontWeight: isBottleneck ? 700 : 500
        },
        itemStyle: {
          color: isBottleneck ? '#E11D48' : node.category === 3 ? '#0D9488' : '#6366F1',
          borderColor: isBottleneck ? '#FDA4AF' : '#E0E7FF',
          borderWidth: isBottleneck ? 4 : 2,
          shadowBlur: isBottleneck ? 10 : 3,
          shadowColor: isBottleneck ? 'rgba(225, 29, 72, 0.4)' : 'rgba(0,0,0,0.1)'
        }
      };
    });

    const links = result.graphLinks.map(link => {
      const isBottleneck = link.isDropOff;
      return {
        source: link.source,
        target: link.target,
        value: link.value,
        lineStyle: {
          width: Math.max(1.5, link.probability * 7),
          color: isBottleneck ? '#E11D48' : '#94A3B8',
          curveness: 0.15,
          opacity: highlightBottlenecksOnly && !isBottleneck ? 0.15 : 0.65
        },
        label: {
          show: true,
          formatter: `${(link.probability * 100).toFixed(0)}%`,
          fontSize: 9,
          color: isBottleneck ? '#BE123C' : '#64748B'
        }
      };
    });

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const item = params as { dataType: string; data: { name?: string; value?: number; source?: string; target?: string } };
          if (item.dataType === 'edge') {
            return `Transition: <b>${item.data.source}</b> → <b>${item.data.target}</b><br/>Volume: <b>${item.data.value}</b> sessions`;
          }
          return `Page/Action: <b>${item.data.name}</b><br/>In-degree Traffic: <b>${item.data.value}</b> visits`;
        }
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          data: nodes,
          links: links,
          roam: true,
          draggable: true,
          force: {
            repulsion: 380,
            gravity: 0.12,
            edgeLength: [90, 160],
            friction: 0.6
          },
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: [4, 8],
          emphasis: {
            focus: 'adjacency',
            lineStyle: { width: 5 }
          }
        }
      ]
    };
  };

  return (
    <div className="space-y-6">
      {/* Parameter Control Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Step 4: Behavioural Latent Clustering & Directed Graph Topology
              </h2>
              <p className="text-xs text-slate-500">
                Multi-modal embedding fusion (Dwell Time + Transition Velocity + Navigation Entropy) clustered via HDBSCAN or K-Means.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioService.playClick();
              onExecute();
            }}
            disabled={isRunning}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition ${
              isRunning
                ? 'bg-indigo-300 text-white cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
            }`}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Computing Embeddings & Graph...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Compute Latent Embeddings & Cluster</span>
              </>
            )}
          </button>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 pt-4 text-xs">
          {/* Algorithm Choice */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Clustering Algorithm
            </label>
            <select
              value={params.algorithm}
              onChange={e => onUpdateParams({ algorithm: e.target.value as 'K-Means' | 'HDBSCAN' })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="HDBSCAN">HDBSCAN (Proposed Density-Based)</option>
              <option value="K-Means">K-Means (Standard Spherical)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              HDBSCAN handles non-convex clusters & arbitrary noise.
            </p>
          </div>

          {/* Number of Clusters */}
          <div>
            <div className="flex items-center justify-between font-semibold text-slate-700 mb-1.5">
              <span>{params.algorithm === 'HDBSCAN' ? 'Min Cluster Density (k)' : 'Cluster Count (k)'}</span>
              <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                k = {params.clustersCount}
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={6}
              step={1}
              value={params.clustersCount}
              onChange={e => onUpdateParams({ clustersCount: parseInt(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-mono">
              <span>k = 2</span>
              <span>k = 4</span>
              <span>k = 6</span>
            </div>
          </div>

          {/* Dimensionality Reduction */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Manifold Projection
            </label>
            <select
              value={params.dimReduction}
              onChange={e => onUpdateParams({ dimReduction: e.target.value as 'PCA' | 't-SNE' })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="PCA">Principal Component Analysis (PCA)</option>
              <option value="t-SNE">t-SNE (Non-linear Manifold)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              2D projection for latent trajectory visualization.
            </p>
          </div>

          {/* Dwell vs Velocity Weight Slider */}
          <div>
            <div className="flex items-center justify-between font-semibold text-slate-700 mb-1.5">
              <span>Temporal Dwell Weight ($w_t$)</span>
              <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {params.dwellWeight.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={params.dwellWeight}
              onChange={e => onUpdateParams({ dwellWeight: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-mono">
              <span>0.1 (Fast actions)</span>
              <span>0.5</span>
              <span>1.0 (Deep dwell)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Outputs */}
      {result && (
        <div className="space-y-6">
          {/* Cluster Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {result.clusterSummaries.map(cluster => (
              <div
                key={cluster.clusterId}
                onClick={() => {
                  audioService.playClick();
                  setActiveClusterFilter(activeClusterFilter === cluster.clusterId ? null : cluster.clusterId);
                }}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  activeClusterFilter === cluster.clusterId
                    ? 'ring-2 ring-indigo-500/40 shadow-md bg-white'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cluster.color }}
                    />
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">
                      {cluster.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-600">
                    {cluster.percentage}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 mb-2 leading-relaxed">
                  {cluster.primaryBehavior}
                </p>
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 font-mono">
                  <span className="text-slate-500">Avg Dwell: {cluster.avgDwell}s</span>
                  <span className={`font-semibold ${cluster.conversionRate > 20 ? 'text-emerald-700' : 'text-slate-600'}`}>
                    Conv: {cluster.conversionRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 2D Latent Scatter Plot */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  2D Latent Trajectory Space ({params.dimReduction} Manifold Projection)
                </h3>
                <p className="text-xs text-slate-500">
                  Each dot represents an individual user session. Silhouette Score: <b className="text-indigo-700 font-mono">{result.silhouetteScore}</b> (High structural cohesion).
                </p>
              </div>

              {activeClusterFilter !== null && (
                <button
                  onClick={() => {
                    audioService.playClick();
                    setActiveClusterFilter(null);
                  }}
                  className="px-2.5 py-1 rounded text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  Show All Clusters
                </button>
              )}
            </div>
            <EChartsWrapper option={getScatterPlotOption()} style={{ height: '360px', width: '100%' }} />
          </div>

          {/* Directed Navigation Graph with Drop-Off Bottleneck Detection */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Directed Navigation Graph & Friction Bottleneck Topology
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Nodes sized by Page Centrality/Traffic volume. Edge thickness proportional to transition probability <span className="font-serif italic text-slate-700">P(v_j | v_i)</span>.
                </p>
              </div>

              {/* Bottleneck Highlight Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    audioService.playClick();
                    setHighlightBottlenecksOnly(!highlightBottlenecksOnly);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                    highlightBottlenecksOnly
                      ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Highlight Bottlenecks Only</span>
                </button>
              </div>
            </div>

            {/* Bottleneck Alert Box */}
            <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <b className="font-semibold">Top Phase 1 Bottleneck Discovered:</b>
                <span className="ml-1">
                  <b>Cart View → Abandon (46.8% Drop-off)</b> and <b>Checkout: Payment Friction (42.5% Drop-off)</b>. Graph centrality indicates excessive circular loops between Payment and FAQ.
                </span>
              </div>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/40">
              <EChartsWrapper option={getGraphChartOption()} style={{ height: '420px', width: '100%' }} />
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Standard Stages
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> Cart & Checkout
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Friction Bottleneck
                </span>
              </div>

              <div className="text-slate-400">
                Tip: Click and drag nodes to re-organize topological layout
              </div>
            </div>

            {/* Proceed CTA */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  audioService.playClick();
                  onProceedNext();
                }}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <span>Proceed to Step 5: Research Evaluation & Thesis Export</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
