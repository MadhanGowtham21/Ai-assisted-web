import React, { useState } from 'react';
import {
  Layers,
  Play,
  Clock,
  Sparkles,
  Loader2,
  Sliders,
  ArrowRight,
  ShieldAlert,
  Percent,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  Search
} from 'lucide-react';
import { SessionReconstructParams, SessionResult, UserSession } from '../../types';
import { EChartsWrapper } from '../common/EChartsWrapper';
import { audioService } from '../../services/audioService';

interface SessionReconstructionViewProps {
  params: SessionReconstructParams;
  onUpdateParams: (newParams: Partial<SessionReconstructParams>) => void;
  onExecute: () => void;
  isRunning: boolean;
  result: SessionResult | null;
  onProceedNext: () => void;
}

export const SessionReconstructionView: React.FC<SessionReconstructionViewProps> = ({
  params,
  onUpdateParams,
  onExecute,
  isRunning,
  result,
  onProceedNext
}) => {
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null);
  const [sessionSearch, setSessionSearch] = useState('');
  const [filterConversion, setFilterConversion] = useState<'all' | 'converted' | 'abandoned'>('all');

  // Filtered session list
  const filteredSessions = result?.sessions.filter(s => {
    const matchesSearch =
      s.sessionId.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      s.visitorId.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      s.trajectory.some(p => p.toLowerCase().includes(sessionSearch.toLowerCase()));

    const matchesConv =
      filterConversion === 'all' ||
      (filterConversion === 'converted' && s.converted) ||
      (filterConversion === 'abandoned' && !s.converted);

    return matchesSearch && matchesConv;
  }) || [];

  // ECharts Histogram for Dwell Time Distribution
  const getDwellHistogramOption = () => {
    if (!result) return {};

    const categories = result.dwellHistogram.map(d => d.bin);
    const counts = result.dwellHistogram.map(d => d.count);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const item = (params as Array<{ name: string; value: number }>)[0];
          return `Duration Interval: <b>${item.name}</b><br/>Sessions: <b>${item.value}</b> (${((item.value / result.totalSessions) * 100).toFixed(1)}%)`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        top: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: { color: '#64748B', fontSize: 11 },
        axisLine: { lineStyle: { color: '#E2E8F0' } }
      },
      yAxis: {
        type: 'value',
        name: 'Session Count (Log-scaled)',
        nameTextStyle: { color: '#64748B', fontSize: 11 },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
        axisLabel: { color: '#64748B', fontSize: 11 }
      },
      series: [
        {
          name: 'Sessions',
          type: 'bar',
          barWidth: '40%',
          data: counts.map(val => ({
            value: val,
            itemStyle: {
              color: '#4F46E5',
              borderRadius: [6, 6, 0, 0]
            }
          })),
          markLine: {
            symbol: ['none', 'none'],
            label: {
              position: 'insideEndTop',
              formatter: `Avg: ${result.avgDwellSeconds}s`,
              color: '#D97706',
              fontSize: 10
            },
            lineStyle: {
              color: '#D97706',
              type: 'dashed',
              width: 2
            },
            data: [{ xAxis: '91 - 180s' }]
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
                Step 2: Dynamic Session Reconstruction & Temporal Boundary Formulation
              </h2>
              <p className="text-xs text-slate-500">
                Mathematical segmentation using temporal inactivity thresholding <span className="math-tex text-indigo-700 font-semibold font-serif">T_session = Δt &gt; τ</span> and anti-bot velocity filters.
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
                <span>Segmenting Sessions...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Reconstruct User Sessions</span>
              </>
            )}
          </button>
        </div>

        {/* Mathematical Equation Callout */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-900">
            <span className="font-semibold text-slate-700">Formal Thesis Definition:</span>
            <code className="bg-white px-2 py-0.5 rounded border border-indigo-100 text-indigo-700 font-mono text-[11px]">
              S_k = ⟨e_1, e_2, ..., e_m⟩ where t(e_{'{'}i+1{'}'}) - t(e_i) ≤ τ
            </code>
          </div>
          <div className="text-slate-500 text-[11px]">
            Sessions segmented when user inactivity exceeds threshold <span className="font-serif italic font-semibold text-slate-700">τ</span>.
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 text-xs">
          {/* Inactivity Threshold Slider */}
          <div>
            <div className="flex items-center justify-between font-semibold text-slate-700 mb-1.5">
              <span>Inactivity Threshold (<span className="font-serif italic font-bold">τ</span>)</span>
              <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {params.inactivityThresholdMinutes} minutes
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={params.inactivityThresholdMinutes}
              onChange={e => onUpdateParams({ inactivityThresholdMinutes: Number(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-mono">
              <span>5 min (Aggressive)</span>
              <span>30 min (Standard)</span>
              <span>60 min (Permissive)</span>
            </div>
          </div>

          {/* Min Session Length Slider */}
          <div>
            <div className="flex items-center justify-between font-semibold text-slate-700 mb-1.5">
              <span>Minimum Session Length (<span className="font-serif italic font-bold">L_min</span>)</span>
              <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                ≥ {params.minSessionLength} events
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={params.minSessionLength}
              onChange={e => onUpdateParams({ minSessionLength: Number(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-mono">
              <span>1 (Include bounces)</span>
              <span>2 (Trajectories)</span>
              <span>5 (Deep intent)</span>
            </div>
          </div>

          {/* Bot Traffic Threshold */}
          <div>
            <div className="flex items-center justify-between font-semibold text-slate-700 mb-1.5">
              <span>Bot Velocity Cap</span>
              <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {params.botClickRateThreshold} clicks/sec
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={params.botClickRateThreshold}
              onChange={e => onUpdateParams({ botClickRateThreshold: Number(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-mono">
              <span>5 clicks/s</span>
              <span>15 (Standard)</span>
              <span>30 clicks/s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Outputs */}
      {result && (
        <div className="space-y-6">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Reconstructed Sessions</span>
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">
                {result.totalSessions.toLocaleString()}
              </div>
              <div className="text-[11px] text-indigo-600 font-medium mt-1">
                From continuous event stream
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Compression Ratio</span>
                <Percent className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">
                {result.compressionRatio}x
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                N_raw / N_sessions
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Average Dwell Time</span>
                <Clock className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">
                {result.avgDwellSeconds}s
              </div>
              <div className="text-[11px] text-teal-600 font-medium mt-1">
                Median: {result.medianDwellSeconds}s
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Single-Event Bounces</span>
                <ShieldAlert className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">
                {result.bounceRatePercent}%
              </div>
              <div className="text-[11px] text-amber-600 font-medium mt-1">
                Immediate abandonment
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition col-span-2 md:col-span-1">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">End Conversion Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">
                {result.conversionRatePercent}%
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                Finished transactions
              </div>
            </div>
          </div>

          {/* Dwell Time Distribution Histogram */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Session Dwell Time Distribution (Temporal Decay Analysis)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Inactivity Window τ = {params.inactivityThresholdMinutes}m
              </span>
            </div>
            <EChartsWrapper option={getDwellHistogramOption()} style={{ height: '260px', width: '100%' }} />
          </div>

          {/* Session Sequence Explorer */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Reconstructed Trajectory Paths ({filteredSessions.length} sessions)
                </h3>
                <p className="text-xs text-slate-500">
                  Click any trajectory to inspect chronological timestamps and action dwell times.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search session ID, pages..."
                    value={sessionSearch}
                    onChange={e => setSessionSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 w-44 sm:w-56 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={filterConversion}
                  onChange={e => setFilterConversion(e.target.value as 'all' | 'converted' | 'abandoned')}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
                >
                  <option value="all">All Outcomes</option>
                  <option value="converted">Converted Only</option>
                  <option value="abandoned">Abandoned Only</option>
                </select>
              </div>
            </div>

            {/* List of Session Cards */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {filteredSessions.slice(0, 40).map(session => (
                <div
                  key={session.sessionId}
                  onClick={() => {
                    audioService.playClick();
                    setSelectedSession(session.sessionId === selectedSession?.sessionId ? null : session);
                  }}
                  className={`p-3 rounded-lg border transition cursor-pointer ${
                    selectedSession?.sessionId === session.sessionId
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50/60 hover:bg-slate-100/70 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 mb-2">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-indigo-700">{session.sessionId}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-600">{session.visitorId}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-500 font-sans">{session.durationSeconds}s duration</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-500 font-sans">{session.eventCount} steps</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {session.converted ? (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Converted
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Drop-off
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual Trajectory Chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {session.trajectory.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <span className={`px-2 py-0.8 text-[11px] font-medium rounded-md border ${
                          step.includes('Order') || step.includes('Confirmation')
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                            : step.includes('Cart') || step.includes('Checkout')
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : step.includes('Product')
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}>
                          {step}
                        </span>
                        {idx < session.trajectory.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Expanded Session Detail */}
                  {selectedSession?.sessionId === session.sessionId && (
                    <div className="mt-3 pt-3 border-t border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Start Timestamp</span>
                        <span className="font-mono text-slate-700">{session.startTime}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Action Velocity</span>
                        <span className="font-mono text-slate-700">{session.avgVelocity} clicks/sec</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Dwell Sequence</span>
                        <span className="font-mono text-slate-700">[{session.dwellTimes.join('s, ')}s]</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
                <span>Proceed to Step 3: PrefixSpan Sequence Mining</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
