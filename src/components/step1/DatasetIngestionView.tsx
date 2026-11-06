import React, { useState } from 'react';
import {
  Database,
  Play,
  Filter,
  CheckCircle,
  Users,
  Eye,
  ShoppingCart,
  CreditCard,
  Search,
  Sparkles,
  Loader2,
  Sliders,
  FileSpreadsheet
} from 'lucide-react';
import { DatasetName, IngestionParams, IngestionResult } from '../../types';
import { EChartsWrapper } from '../common/EChartsWrapper';
import { audioService } from '../../services/audioService';

interface DatasetIngestionViewProps {
  params: IngestionParams;
  onUpdateParams: (newParams: Partial<IngestionParams>) => void;
  onExecute: () => void;
  isRunning: boolean;
  result: IngestionResult | null;
  onProceedNext: () => void;
}

export const DatasetIngestionView: React.FC<DatasetIngestionViewProps> = ({
  params,
  onUpdateParams,
  onExecute,
  isRunning,
  result,
  onProceedNext
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 12;

  // Filtered raw events for the table
  const filteredEvents = result?.events.filter(e => {
    const matchesSearch =
      e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.visitorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.page.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.itemId && e.itemId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'all' || e.eventType === filterType;
    return matchesSearch && matchesType;
  }) || [];

  const paginatedEvents = filteredEvents.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
  const totalPages = Math.ceil(filteredEvents.length / pageSize) || 1;

  // ECharts Bar Chart for Event Distribution
  const getDistributionChartOption = () => {
    if (!result) return {};

    const categories = ['Page Views', 'Category Browse', 'Search', 'Add to Cart', 'Checkout Init', 'Transactions'];
    const data = [
      result.eventDistribution.view || 0,
      result.eventDistribution.category_browse || 0,
      result.eventDistribution.search || 0,
      result.eventDistribution.add_to_cart || 0,
      result.eventDistribution.checkout_init || 0,
      result.eventDistribution.transaction || 0
    ];

    const colors = ['#6366F1', '#3B82F6', '#8B5CF6', '#0D9488', '#F59E0B', '#10B981'];

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: '{b}: <b>{c}</b> events'
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
        axisLabel: {
          interval: 0,
          rotate: 15,
          fontSize: 11,
          color: '#64748B'
        },
        axisLine: { lineStyle: { color: '#E2E8F0' } }
      },
      yAxis: {
        type: 'value',
        name: 'Event Volume',
        nameTextStyle: { color: '#64748B', fontSize: 11 },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
        axisLabel: { color: '#64748B', fontSize: 11 }
      },
      series: [
        {
          name: 'Events',
          type: 'bar',
          barWidth: '45%',
          data: data.map((val, i) => ({
            value: val,
            itemStyle: {
              color: colors[i],
              borderRadius: [6, 6, 0, 0]
            }
          })),
          label: {
            show: true,
            position: 'top',
            color: '#475569',
            fontSize: 11,
            formatter: '{c}'
          }
        }
      ]
    };
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'transaction':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">Transaction</span>;
      case 'checkout_init':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-indigo-100 text-indigo-800 border border-indigo-200">Checkout</span>;
      case 'add_to_cart':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-teal-100 text-teal-800 border border-teal-200">Add to Cart</span>;
      case 'search':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-purple-100 text-purple-800 border border-purple-200">Search</span>;
      case 'category_browse':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-blue-100 text-blue-800 border border-blue-200">Category</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-slate-100 text-slate-700 border border-slate-200">View</span>;
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
                Step 1: Dataset Ingestion & Clickstream Preprocessing Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Select benchmark benchmark repository, sample volume, and apply noise filtration for M.E. CSE Phase 1 analysis.
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
                <span>Ingesting Clickstream Stream...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Ingest & Validate Event Stream</span>
              </>
            )}
          </button>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 text-xs">
          {/* Dataset Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Benchmark Dataset Repository
            </label>
            <select
              value={params.dataset}
              onChange={e => onUpdateParams({ dataset: e.target.value as DatasetName })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="RetailRocket E-Commerce (2.75M Events Benchmark)">
                RetailRocket E-Commerce (2.75M Events Benchmark)
              </option>
              <option value="YOOCHOOSE RecSys-15 Clickstream">
                YOOCHOOSE RecSys-15 Clickstream
              </option>
              <option value="Controlled Demo Synthetic">
                Controlled Demo Synthetic (Isolated Behavioral Clusters)
              </option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Standardized Kaggle/ACM RecSys research clickstream benchmark.
            </p>
          </div>

          {/* Sample Size Slider */}
          <div>
            <div className="flex items-center justify-between font-semibold text-slate-700 mb-1.5">
              <span>Sample Event Window ($N$)</span>
              <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {params.sampleSize.toLocaleString()} events
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={30000}
              step={1000}
              value={params.sampleSize}
              onChange={e => onUpdateParams({ sampleSize: Number(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-mono">
              <span>1,000</span>
              <span>15,000</span>
              <span>30,000</span>
            </div>
          </div>

          {/* Noise Filter Toggle */}
          <div className="flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <span className="block font-semibold text-slate-700">Sub-100ms Noise & Bot Filter</span>
                <span className="text-[11px] text-slate-500">
                  Prune rapid crawler pings and accidental double clicks
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.noiseFilter}
                  onChange={e => onUpdateParams({ noiseFilter: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
              Filter status: {params.noiseFilter ? 'Active (Auto-filtering noise <100ms)' : 'Raw (Preserves all uncleaned signals)'}
            </div>
          </div>
        </div>
      </div>

      {/* When Ingested: Display Outputs */}
      {result && (
        <div className="space-y-6">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Total Ingested Events</span>
                <Database className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">
                {result.totalEvents.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                <CheckCircle className="w-3 h-3" />
                <span>Validated schema integrity</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Unique Visitors</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">
                {result.uniqueVisitors.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Avg {(result.totalEvents / Math.max(1, result.uniqueVisitors)).toFixed(1)} events per user
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Add-to-Cart Funnel</span>
                <ShoppingCart className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">
                {result.eventDistribution.add_to_cart || 0}
              </div>
              <div className="text-[11px] text-teal-600 font-medium mt-1">
                {(((result.eventDistribution.add_to_cart || 0) / result.totalEvents) * 100).toFixed(1)}% of total volume
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Pruned Noise Events</span>
                <Filter className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">
                {result.noiseEventsRemoved}
              </div>
              <div className="text-[11px] text-amber-600 font-medium mt-1">
                {result.throughputEventsPerSec.toLocaleString()} events/sec ingested
              </div>
            </div>
          </div>

          {/* Event Distribution Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Event Frequency Distribution Across Site Stages
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Dataset: {params.dataset.split(' ')[0]}
              </span>
            </div>
            <EChartsWrapper option={getDistributionChartOption()} style={{ height: '280px', width: '100%' }} />
          </div>

          {/* Virtualized/Searchable Event Stream Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Validated Clickstream Stream (Showing sample {filteredEvents.length} records)
                </h3>
              </div>

              {/* Search & Filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search visitor, page, ID..."
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      setPageNumber(1);
                    }}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 w-48 sm:w-56 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={e => {
                    setFilterType(e.target.value);
                    setPageNumber(1);
                  }}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
                >
                  <option value="all">All Types</option>
                  <option value="view">Views</option>
                  <option value="category_browse">Category Browse</option>
                  <option value="search">Search</option>
                  <option value="add_to_cart">Add To Cart</option>
                  <option value="checkout_init">Checkout</option>
                  <option value="transaction">Transaction</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2.5">Event ID</th>
                    <th className="px-3.5 py-2.5">Visitor</th>
                    <th className="px-3.5 py-2.5">Type</th>
                    <th className="px-3.5 py-2.5">Page / Target</th>
                    <th className="px-3.5 py-2.5">Dwell Time</th>
                    <th className="px-3.5 py-2.5">Timestamp</th>
                    <th className="px-3.5 py-2.5">Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-500 italic">
                        No clickstream records match current search filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedEvents.map(event => (
                      <tr key={event.id} className="hover:bg-slate-50/80 transition font-mono">
                        <td className="px-3.5 py-2 text-indigo-700 font-medium">{event.id}</td>
                        <td className="px-3.5 py-2 text-slate-600">{event.visitorId}</td>
                        <td className="px-3.5 py-2 font-sans">{getEventTypeBadge(event.eventType)}</td>
                        <td className="px-3.5 py-2 font-sans font-medium text-slate-800">
                          {event.page}
                          {event.itemId && (
                            <span className="ml-1 text-[10px] text-slate-500 font-mono">
                              ({event.itemId})
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2">{event.dwellSeconds}s</td>
                        <td className="px-3.5 py-2 text-[11px] text-slate-500">{event.timestamp.slice(11, 19)}</td>
                        <td className="px-3.5 py-2 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                            {event.device}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls & Proceed CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-3 text-xs">
              <div className="text-slate-500">
                Showing {Math.min(filteredEvents.length, (pageNumber - 1) * pageSize + 1)} - {Math.min(filteredEvents.length, pageNumber * pageSize)} of {filteredEvents.length} records
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      audioService.playClick();
                      setPageNumber(p => Math.max(1, p - 1));
                    }}
                    disabled={pageNumber === 1}
                    className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="px-2 py-1 font-mono text-slate-600">
                    {pageNumber} / {totalPages}
                  </span>
                  <button
                    onClick={() => {
                      audioService.playClick();
                      setPageNumber(p => Math.min(totalPages, p + 1));
                    }}
                    disabled={pageNumber === totalPages}
                    className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>

                <button
                  onClick={() => {
                    audioService.playClick();
                    onProceedNext();
                  }}
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition"
                >
                  <span>Proceed to Step 2: Session Reconstruction</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
