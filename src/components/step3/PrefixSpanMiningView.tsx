import React, { useState } from 'react';
import {
  GitBranch,
  Play,
  Sparkles,
  Loader2,
  Sliders,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  HelpCircle,
  Zap,
  Filter,
  BarChart2
} from 'lucide-react';
import { PrefixSpanParams, PrefixSpanResult, FrequentPattern } from '../../types';
import { EChartsWrapper } from '../common/EChartsWrapper';
import { audioService } from '../../services/audioService';

interface PrefixSpanMiningViewProps {
  params: PrefixSpanParams;
  onUpdateParams: (newParams: Partial<PrefixSpanParams>) => void;
  onExecute: () => void;
  isRunning: boolean;
  result: PrefixSpanResult | null;
  onProceedNext: () => void;
}

export const PrefixSpanMiningView: React.FC<PrefixSpanMiningViewProps> = ({
  params,
  onUpdateParams,
  onExecute,
  isRunning,
  result,
  onProceedNext
}) => {
  const [selectedPattern, setSelectedPattern] = useState<FrequentPattern | null>(null);

  // ECharts Sankey Diagram for User Flow Trajectories
  const getSankeyChartOption = () => {
    if (!result) return {};

    return {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: (info: unknown) => {
          const item = info as { data: { source?: string; target?: string; value?: number; name?: string } };
          if (item.data.source && item.data.target) {
            return `Flow: <b>${item.data.source}</b> → <b>${item.data.target}</b><br/>Volume: <b>${item.data.value}</b> sessions`;
          }
          return `Stage: <b>${item.data.name}</b>`;
        }
      },
      series: [
        {
          type: 'sankey',
          layout: 'none',
          emphasis: { focus: 'adjacency' },
          data: result.sankeyNodes,
          links: result.sankeyLinks,
          orient: 'horizontal',
          nodeWidth: 16,
          nodeGap: 14,
          label: {
            position: 'right',
            color: '#334155',
            fontSize: 11,
            fontWeight: 500
          },
          lineStyle: {
            color: 'gradient',
            curveness: 0.5,
            opacity: 0.35
          }
        }
      ]
    };
  };

  const getTrendIcon = (trend: FrequentPattern['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />;
      case 'down':
        return <TrendingDown className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Minus className="w-3.5 h-3.5 text-slate-400" />;
    }
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
                Step 3: PrefixSpan Sequential Pattern Mining Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Discovers frequent trajectory subsequences with projected database recursion and minimum support constraint <span className="font-serif italic font-semibold text-indigo-700">Supp(S) ≥ σ</span>.
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
                <span>Mining Frequent Trajectories...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Mine Frequent Trajectories (PrefixSpan)</span>
              </>
            )}
          </button>
        </div>

        {/* Mathematical Equation Callout */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-900">
            <span className="font-semibold text-slate-700">Mathematical Support Metric:</span>
            <code className="bg-white px-2 py-0.5 rounded border border-indigo-100 text-indigo-700 font-mono text-[11px]">
              Supp(S) = |{'{'}s ∈ D | S ⊑ s{'}'}| / |D| ≥ σ
            </code>
          </div>
          <div className="text-slate-500 text-[11px]">
            Prefix-projected pattern growth guarantees exact discovery without full candidate generation.
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 pt-4 text-xs">
          {/* Minimum Support Threshold Slider */}
          <div>
            <div className="flex items-center justify-between font-semibold text-slate-700 mb-1.5">
              <span>Min Support (<span className="font-serif italic font-bold">σ</span>)</span>
              <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {(params.minSupport * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min={0.02}
              max={0.20}
              step={0.01}
              value={params.minSupport}
              onChange={e => onUpdateParams({ minSupport: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-mono">
              <span>2% (Granular)</span>
              <span>10%</span>
              <span>20% (Macro)</span>
            </div>
          </div>

          {/* Max Pattern Length Slider */}
          <div>
            <div className="flex items-center justify-between font-semibold text-slate-700 mb-1.5">
              <span>Max Path Length (<span className="font-serif italic font-bold">k</span>)</span>
              <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                k ≤ {params.maxPatternLength}
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={8}
              step={1}
              value={params.maxPatternLength}
              onChange={e => onUpdateParams({ maxPatternLength: parseInt(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-mono">
              <span>k = 2</span>
              <span>k = 5</span>
              <span>k = 8</span>
            </div>
          </div>

          {/* Target Outcome */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Target Outcome Filter
            </label>
            <select
              value={params.targetOutcome}
              onChange={e => onUpdateParams({ targetOutcome: e.target.value as 'all' | 'conversions' | 'dropoffs' })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="all">All Sequences</option>
              <option value="conversions">High Conversion Trajectories</option>
              <option value="dropoffs">High Friction / Abandonment</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Filter mined patterns by outcome lift
            </p>
          </div>

          {/* Closed Sequences Toggle */}
          <div className="flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <span className="block font-semibold text-slate-700">Closed Sequences</span>
                <span className="text-[11px] text-slate-500">
                  Prune redundant non-maximal sub-patterns
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.closedSequenceFilter}
                  onChange={e => onUpdateParams({ closedSequenceFilter: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
              Optimization: {params.closedSequenceFilter ? 'Closed (Compact representation)' : 'Full Lattice'}
            </div>
          </div>
        </div>
      </div>

      {/* When Mined: Show Outputs */}
      {result && (
        <div className="space-y-6">
          {/* Mining Latency & Performance Stat Banner */}
          <div className="bg-gradient-to-r from-indigo-50 via-white to-slate-50 border border-indigo-100 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-600 text-white">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm">
                  PrefixSpan Algorithm Convergence Reached
                </div>
                <div className="text-slate-500">
                  Discovered <b className="text-indigo-700 font-mono">{result.patternsMinedCount}</b> frequent subsequences with support σ ≥ {(params.minSupport * 100).toFixed(0)}%.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono">
              <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 text-[10px] block">RUNTIME LATENCY</span>
                <span className="text-indigo-700 font-bold text-sm">{result.executionTimeMs} ms</span>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 text-[10px] block">PROJECTED RECURSIONS</span>
                <span className="text-slate-700 font-bold text-sm">{result.projectedRecursions} trees</span>
              </div>
            </div>
          </div>

          {/* Interactive Multi-Step User Flow (Sankey Diagram) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Interactive Sequential Flow Diagram (Sankey Projection)
                </h3>
                <p className="text-xs text-slate-500">
                  Visualizes multi-stage traffic funnel and drop-off divergence discovered across mined navigation trajectories.
                </p>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                Red nodes = Drop-off / Abandonment
              </span>
            </div>
            <EChartsWrapper option={getSankeyChartOption()} style={{ height: '340px', width: '100%' }} />
          </div>

          {/* Ranked Frequent Patterns Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Ranked Frequent Trajectories by Support & Outcome Lift
                </h3>
                <p className="text-xs text-slate-500">
                  Ordered by empirical support frequency across session database D.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2.5">Pattern ID</th>
                    <th className="px-3.5 py-2.5">Trajectory Sequence Path ($S$)</th>
                    <th className="px-3.5 py-2.5">Length ($k$)</th>
                    <th className="px-3.5 py-2.5">Relative Support</th>
                    <th className="px-3.5 py-2.5">Absolute Count</th>
                    <th className="px-3.5 py-2.5">Conversion Lift</th>
                    <th className="px-3.5 py-2.5">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {result.patterns.map((pat, idx) => (
                    <tr
                      key={pat.id}
                      onClick={() => {
                        audioService.playClick();
                        setSelectedPattern(pat.id === selectedPattern?.id ? null : pat);
                      }}
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${
                        selectedPattern?.id === pat.id ? 'bg-indigo-50/60 ring-1 ring-indigo-300' : ''
                      }`}
                    >
                      <td className="px-3.5 py-2.5 font-mono text-indigo-700 font-semibold">
                        #{idx + 1} ({pat.id})
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex flex-wrap items-center gap-1">
                          {pat.sequence.map((step, sIdx) => (
                            <React.Fragment key={sIdx}>
                              <span className={`px-2 py-0.5 text-[11px] font-medium rounded border ${
                                step.includes('Order')
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : step.includes('Cart')
                                  ? 'bg-teal-50 text-teal-800 border-teal-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {step}
                              </span>
                              {sIdx < pat.sequence.length - 1 && (
                                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono font-medium">{pat.patternLength}</td>
                      <td className="px-3.5 py-2.5 font-mono font-bold text-slate-800">
                        {pat.relativeSupport}%
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-600">
                        {pat.absoluteSupport.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className={`px-2 py-0.5 rounded font-mono font-semibold text-[11px] flex items-center gap-1 w-max ${
                          pat.conversionLift >= 2.0
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : pat.conversionLift < 1.0
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {getTrendIcon(pat.trend)}
                          {pat.conversionLift}x
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-600">
                        {(pat.confidenceToNext * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <span>Proceed to Step 4: Clustering & Directed Navigation Graph</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
