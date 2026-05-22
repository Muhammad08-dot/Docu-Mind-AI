import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Target,
  Shield,
  Clock,
  Zap,
  Activity,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { EvalEntry, SystemStats } from '../types';
import { cn } from '../utils/cn';

interface EvaluationViewProps {
  evalEntries: EvalEntry[];
  systemStats: SystemStats;
  latencyTrend: { date: string; avgLatency: number; p95: number }[];
  metricsTrend: { date: string; precision: number; faithfulness: number; relevance: number }[];
  queryDistribution: { name: string; value: number; color: string }[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  color: string;
  trend?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        {trend && (
          <span className="flex items-center gap-0.5 text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
            <TrendingUp className="w-2.5 h-2.5" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-dark-800">{value}</p>
      <p className="text-xs text-dark-500 mt-0.5">{label}</p>
      {subValue && <p className="text-[10px] text-dark-400 mt-1">{subValue}</p>}
    </div>
  );
}

function MetricGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const percentage = value * 100;
  const circumference = 2 * Math.PI * 40;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-dark-800">{percentage.toFixed(0)}%</span>
        </div>
      </div>
      <p className="text-xs text-dark-400 mt-2 font-medium">{label}</p>
    </div>
  );
}

export default function EvaluationView({
  evalEntries,
  systemStats,
  latencyTrend,
  metricsTrend,
  queryDistribution,
}: EvaluationViewProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'details'>('overview');

  const customTooltipStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '12px',
    color: '#334155',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border glass">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-dark-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              AI Evaluation Dashboard
            </h2>
            <p className="text-xs text-dark-400 mt-0.5">
              Real-time RAG metrics monitoring • Powered by RAGAS framework
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTab('overview')}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                selectedTab === 'overview'
                  ? 'bg-primary-50 text-primary-600 border border-primary-200'
                  : 'text-dark-400 hover:bg-slate-100'
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedTab('details')}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                selectedTab === 'details'
                  ? 'bg-primary-50 text-primary-600 border border-primary-200'
                  : 'text-dark-400 hover:bg-slate-100'
              )}
            >
              Query Log
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {selectedTab === 'overview' ? (
          <div className="space-y-6">
            {/* Top Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Activity}
                label="Total Queries"
                value={systemStats.totalQueries.toLocaleString()}
                subValue="Last 30 days"
                color="bg-primary-600"
                trend="+12%"
              />
              <StatCard
                icon={Clock}
                label="Avg Latency"
                value={`${systemStats.avgLatency}ms`}
                subValue="End-to-end response time"
                color="bg-purple-600"
                trend="-8%"
              />
              <StatCard
                icon={Zap}
                label="Vector Chunks"
                value={systemStats.totalChunks.toLocaleString()}
                subValue="Across all documents"
                color="bg-accent-600"
              />
              <StatCard
                icon={Eye}
                label="Uptime"
                value={`${systemStats.uptimeHours}h`}
                subValue="99.8% availability"
                color="bg-amber-600"
              />
            </div>

            {/* RAG Quality Gauges */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-dark-800 mb-1 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-500" />
                RAG Quality Metrics
              </h3>
              <p className="text-[11px] text-dark-500 mb-6">
                Evaluated using RAGAS framework on the latest 100 queries
              </p>
              <div className="flex items-center justify-around">
                <MetricGauge value={systemStats.avgPrecision} label="Context Precision" color="#3b82f6" />
                <MetricGauge value={systemStats.avgFaithfulness} label="Faithfulness" color="#22c55e" />
                <MetricGauge value={systemStats.avgRelevance} label="Answer Relevance" color="#a78bfa" />
              </div>
              <div className="mt-6 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-dark-700 font-medium">Anti-Hallucination Guard Active</p>
                    <p className="text-[11px] text-dark-500 mt-0.5">
                      47 queries in the last 30 days were correctly rejected with "I don't know based on the provided documents." — 2.5% rejection rate.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Metrics Trend */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-dark-800 mb-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Quality Metrics Trend
                </h3>
                <p className="text-[11px] text-dark-500 mb-4">Daily averages over the past 9 days</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={metricsTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis domain={[0.8, 1]} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip contentStyle={customTooltipStyle} formatter={(value: any) => `${(Number(value) * 100).toFixed(1)}%`} />
                    <Line type="monotone" dataKey="precision" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Precision" />
                    <Line type="monotone" dataKey="faithfulness" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Faithfulness" />
                    <Line type="monotone" dataKey="relevance" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} name="Relevance" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Latency Trend */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-dark-800 mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  Latency Performance
                </h3>
                <p className="text-[11px] text-dark-500 mb-4">Average and P95 response times (ms)</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={latencyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip contentStyle={customTooltipStyle} formatter={(value: any) => `${value}ms`} />
                    <Area type="monotone" dataKey="p95" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.1} strokeWidth={1.5} name="P95" />
                    <Area type="monotone" dataKey="avgLatency" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} name="Avg" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Query Distribution */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-dark-800 mb-1 flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-500" />
                  Query Distribution
                </h3>
                <p className="text-[11px] text-dark-500 mb-4">By document category</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={queryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {queryDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={customTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {queryDistribution.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[11px] text-dark-600">{entry.name}</span>
                      </div>
                      <span className="text-[11px] text-dark-400 font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-Query Scores */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-dark-800 mb-1 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary-500" />
                  Recent Query Scores
                </h3>
                <p className="text-[11px] text-dark-500 mb-4">Per-query evaluation breakdown</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={evalEntries.slice(0, 8)} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="id" tick={{ fontSize: 9, fill: '#64748b' }} />
                    <YAxis domain={[0.7, 1]} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip contentStyle={customTooltipStyle} formatter={(value: any) => `${(Number(value) * 100).toFixed(1)}%`} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="contextPrecision" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Precision" />
                    <Bar dataKey="faithfulness" fill="#22c55e" radius={[2, 2, 0, 0]} name="Faithfulness" />
                    <Bar dataKey="answerRelevance" fill="#a78bfa" radius={[2, 2, 0, 0]} name="Relevance" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          /* Query Log Tab */
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-dark-500 uppercase tracking-wider">
                <div className="col-span-4">Query</div>
                <div className="col-span-2 text-center">Precision</div>
                <div className="col-span-2 text-center">Faithfulness</div>
                <div className="col-span-2 text-center">Relevance</div>
                <div className="col-span-2 text-center">Latency</div>
              </div>
              {evalEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors items-center"
                >
                  <div className="col-span-4">
                    <p className="text-sm text-dark-700 truncate">{entry.query}</p>
                    <p className="text-[10px] text-dark-500 mt-0.5">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={cn(
                      'inline-block px-2 py-0.5 rounded-full text-[11px] font-medium',
                      entry.contextPrecision >= 0.9 ? 'bg-green-50 text-green-600' :
                      entry.contextPrecision >= 0.8 ? 'bg-amber-50 text-amber-600' :
                      'bg-red-50 text-red-500'
                    )}>
                      {(entry.contextPrecision * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={cn(
                      'inline-block px-2 py-0.5 rounded-full text-[11px] font-medium',
                      entry.faithfulness >= 0.9 ? 'bg-green-50 text-green-600' :
                      entry.faithfulness >= 0.8 ? 'bg-amber-50 text-amber-600' :
                      'bg-red-50 text-red-500'
                    )}>
                      {(entry.faithfulness * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={cn(
                      'inline-block px-2 py-0.5 rounded-full text-[11px] font-medium',
                      entry.answerRelevance >= 0.9 ? 'bg-green-50 text-green-600' :
                      entry.answerRelevance >= 0.8 ? 'bg-amber-50 text-amber-600' :
                      'bg-red-50 text-red-500'
                    )}>
                      {(entry.answerRelevance * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={cn(
                      'text-[11px] font-medium',
                      entry.latency <= 1500 ? 'text-green-600' :
                      entry.latency <= 2000 ? 'text-amber-600' :
                      'text-red-500'
                    )}>
                      {entry.latency}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
