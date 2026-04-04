import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { X, AlertTriangle, Lightbulb, CheckCircle, Info, TrendingUp, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { isPast, isToday, differenceInDays } from 'date-fns';
import { generateAIInsights, isGeminiConfigured } from '../lib/gemini';
import { generateInsights as generateHeuristicInsights, type Insight } from '../lib/insights';
import type { Task, TaskAssignee, TeamMember } from '../lib/types';

interface StatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  members: TeamMember[];
  taskAssignees: TaskAssignee[];
}

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done',
};

const STATUS_COLORS = ['#6b7280', '#3b82f6', '#f59e0b', '#22c55e'];
const PRIORITY_COLORS = ['#ef4444', '#f59e0b', '#22c55e'];

const insightIcons: Record<Insight['type'], typeof Info> = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
  tip: Lightbulb,
};

const insightStyles: Record<Insight['type'], string> = {
  warning: 'text-warning bg-warning-muted',
  info: 'text-info bg-info-muted',
  success: 'text-success bg-success-muted',
  tip: 'text-accent bg-accent-muted',
};

const tooltipWrapperStyle: React.CSSProperties = {
  transition: 'opacity 0.15s ease',
  pointerEvents: 'none' as const,
};

interface TooltipPayloadEntry {
  name?: string;
  value?: number;
  payload?: { name?: string };
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  return (
    <div
      className="stats-tooltip bg-bg-elevated border border-border rounded-lg px-3 py-2 shadow-xl"
      style={{
        opacity: active && payload?.length ? 1 : 0,
        transition: 'opacity 0.15s ease',
      }}
    >
      {active && payload?.length && (
        <>
          <p className="text-xs font-medium text-text">{payload[0].name || payload[0].payload?.name}</p>
          <p className="text-[11px] text-text-secondary mt-0.5">{payload[0].value} tasks</p>
        </>
      )}
    </div>
  );
}

function StackedTooltip({ active, payload }: ChartTooltipProps) {
  return (
    <div
      className="stats-tooltip bg-bg-elevated border border-border rounded-lg px-3 py-2 shadow-xl"
      style={{
        opacity: active && payload?.length ? 1 : 0,
        transition: 'opacity 0.15s ease',
      }}
    >
      {active && payload?.length && (
        <>
          <p className="text-xs font-medium text-text mb-1">{payload[0]?.payload?.name}</p>
          {payload.map((entry, i) => (
            <p key={i} className="text-[11px] text-text-secondary">
              {entry.name}: {entry.value}
            </p>
          ))}
        </>
      )}
    </div>
  );
}

export function StatsPanel({ isOpen, onClose, tasks, members, taskAssignees }: StatsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [isAI, setIsAI] = useState(false);
  const hasLoadedRef = useRef(false);

  const loadInsights = useCallback(async () => {
    if (tasks.length === 0) {
      setInsights([]);
      return;
    }

    const geminiAvailable = isGeminiConfigured();
    setIsAI(geminiAvailable);

    if (geminiAvailable) {
      setInsightsLoading(true);
      try {
        const result = await generateAIInsights(tasks, members, taskAssignees);
        setInsights(result);
      } catch {
        setInsights(generateHeuristicInsights(tasks, members, taskAssignees));
        setIsAI(false);
      } finally {
        setInsightsLoading(false);
      }
    } else {
      setInsights(generateHeuristicInsights(tasks, members, taskAssignees));
    }
  }, [tasks, members, taskAssignees]);

  useEffect(() => {
    if (isOpen && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadInsights();
    }
    if (!isOpen) {
      hasLoadedRef.current = false;
    }
  }, [isOpen, loadInsights]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t =>
      t.due_date && t.status !== 'done' &&
      isPast(new Date(t.due_date + 'T00:00:00')) &&
      !isToday(new Date(t.due_date + 'T00:00:00'))
    ).length;

    return { total, done, inProgress, overdue };
  }, [tasks]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
    tasks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return Object.entries(counts).map(([key, value]) => ({
      name: STATUS_LABELS[key], value,
    }));
  }, [tasks]);

  const priorityData = useMemo(() => {
    const counts = { high: 0, normal: 0, low: 0 };
    tasks.filter(t => t.status !== 'done').forEach(t => {
      counts[t.priority] = (counts[t.priority] || 0) + 1;
    });
    return [
      { name: 'High', value: counts.high },
      { name: 'Normal', value: counts.normal },
      { name: 'Low', value: counts.low },
    ];
  }, [tasks]);

  const memberData = useMemo(() => {
    const counts: Record<string, { name: string; active: number; done: number }> = {};
    members.forEach(m => { counts[m.id] = { name: m.name, active: 0, done: 0 }; });

    tasks.forEach(t => {
      const assignedIds = taskAssignees
        .filter(ta => ta.task_id === t.id)
        .map(ta => ta.member_id);
      for (const mid of assignedIds) {
        if (counts[mid]) {
          if (t.status === 'done') counts[mid].done++;
          else counts[mid].active++;
        }
      }
    });

    return Object.values(counts);
  }, [tasks, members, taskAssignees]);

  const deadlineData = useMemo(() => {
    const now = new Date();
    const buckets = [
      { name: 'Overdue', count: 0 },
      { name: 'Today', count: 0 },
      { name: '1-3d', count: 0 },
      { name: '4-7d', count: 0 },
      { name: '7d+', count: 0 },
    ];

    tasks.filter(t => t.due_date && t.status !== 'done').forEach(t => {
      const d = new Date(t.due_date! + 'T00:00:00');
      const diff = differenceInDays(d, now);
      if (diff < 0) buckets[0].count++;
      else if (diff === 0) buckets[1].count++;
      else if (diff <= 3) buckets[2].count++;
      else if (diff <= 7) buckets[3].count++;
      else buckets[4].count++;
    });

    return buckets;
  }, [tasks]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex justify-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full max-w-lg bg-bg-elevated border-l border-border h-full overflow-y-auto"
            style={{ willChange: 'transform' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3.5 bg-bg-elevated/95 backdrop-blur-sm border-b border-border">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold text-text">Board Analytics</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover text-text-placeholder hover:text-text-secondary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Total', value: stats.total, color: 'text-text' },
                  { label: 'Done', value: stats.done, color: 'text-success' },
                  { label: 'Active', value: stats.inProgress, color: 'text-info' },
                  { label: 'Overdue', value: stats.overdue, color: 'text-danger' },
                ].map(s => (
                  <div key={s.label} className="bg-bg-surface border border-border rounded-lg p-3 text-center">
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-text-placeholder uppercase tracking-wider mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Status distribution */}
              <div>
                <h3 className="stats-section-title text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">Status Distribution</h3>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={140}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        dataKey="value"
                        stroke="none"
                        animationBegin={0}
                        animationDuration={600}
                        animationEasing="ease-out"
                      >
                        {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i]} />)}
                      </Pie>
                      <Tooltip
                        content={<ChartTooltip />}
                        wrapperStyle={tooltipWrapperStyle}
                        allowEscapeViewBox={{ x: true, y: true }}
                        cursor={false}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {statusData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[i] }} />
                        <span className="text-text-secondary flex-1 stats-label">{d.name}</span>
                        <span className="text-text font-semibold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Priority breakdown */}
              <div>
                <h3 className="stats-section-title text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">Priority Breakdown</h3>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={140}>
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        dataKey="value"
                        stroke="none"
                        animationBegin={100}
                        animationDuration={600}
                        animationEasing="ease-out"
                      >
                        {priorityData.map((_, i) => <Cell key={i} fill={PRIORITY_COLORS[i]} />)}
                      </Pie>
                      <Tooltip
                        content={<ChartTooltip />}
                        wrapperStyle={tooltipWrapperStyle}
                        allowEscapeViewBox={{ x: true, y: true }}
                        cursor={false}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {priorityData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PRIORITY_COLORS[i] }} />
                        <span className="text-text-secondary flex-1 stats-label">{d.name}</span>
                        <span className="text-text font-semibold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Team workload */}
              {memberData.length > 0 && (
                <div>
                  <h3 className="stats-section-title text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">Team Workload</h3>
                  <ResponsiveContainer width="100%" height={Math.max(120, memberData.length * 40)}>
                    <BarChart data={memberData} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={60}
                        tick={{ fontSize: 'var(--stats-axis-font, 10px)', fill: 'var(--color-text-secondary)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={<StackedTooltip />}
                        wrapperStyle={tooltipWrapperStyle}
                        allowEscapeViewBox={{ x: true, y: true }}
                        cursor={{ fill: 'var(--color-accent-subtle)', radius: 4 }}
                      />
                      <Bar dataKey="active" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} name="Active" animationBegin={200} animationDuration={500} />
                      <Bar dataKey="done" stackId="a" fill="#22c55e" radius={[0, 4, 4, 0]} name="Done" animationBegin={300} animationDuration={500} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-1.5">
                    <span className="flex items-center gap-1.5 text-[10px] text-text-placeholder stats-label">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#3b82f6' }} /> Active
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-text-placeholder stats-label">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#22c55e' }} /> Done
                    </span>
                  </div>
                </div>
              )}

              {/* Deadline timeline */}
              <div>
                <h3 className="stats-section-title text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">Deadline Overview</h3>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={deadlineData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 'var(--stats-axis-font, 9px)', fill: 'var(--color-text-placeholder)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      content={<ChartTooltip />}
                      wrapperStyle={tooltipWrapperStyle}
                      allowEscapeViewBox={{ x: true, y: true }}
                      cursor={{ fill: 'var(--color-accent-subtle)', radius: 4 }}
                    />
                    <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} name="Tasks" animationBegin={300} animationDuration={500} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* AI / Heuristic Insights */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="stats-section-title text-xs font-medium text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    {isAI ? <Sparkles className="w-3 h-3 text-accent" /> : <Lightbulb className="w-3 h-3" />}
                    {isAI ? 'AI Insights' : 'Insights'}
                  </h3>
                  {isGeminiConfigured() && (
                    <button
                      onClick={loadInsights}
                      disabled={insightsLoading}
                      className="flex items-center gap-1 text-[10px] text-text-tertiary hover:text-text transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${insightsLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  )}
                </div>

                {insightsLoading ? (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <Loader2 className="w-4 h-4 text-accent animate-spin" />
                    <span className="text-xs text-text-tertiary">Analyzing your board...</span>
                  </div>
                ) : insights.length > 0 ? (
                  <div className="space-y-2">
                    {insights.map((insight, index) => {
                      const Icon = insightIcons[insight.type];
                      return (
                        <motion.div
                          key={insight.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.06, duration: 0.25 }}
                          className="bg-bg-surface border border-border rounded-lg p-3"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className={`p-1 rounded-md flex-shrink-0 ${insightStyles[insight.type]}`}>
                              <Icon className="w-3 h-3" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-text">{insight.title}</p>
                              <p className="text-[11px] text-text-tertiary mt-0.5 leading-relaxed">{insight.detail}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-text-placeholder">No insights available</p>
                  </div>
                )}

                {!isGeminiConfigured() && (
                  <p className="text-[10px] text-text-placeholder mt-3 text-center">
                    Add <code className="px-1 py-0.5 bg-bg-hover rounded text-[9px] font-mono">VITE_GEMINI_API_KEY</code> to .env for AI-powered insights
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
