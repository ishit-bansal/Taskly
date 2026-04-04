import { isPast, isToday, differenceInDays } from 'date-fns';
import type { Task, TaskAssignee, TeamMember } from './types';
import { generateInsights as generateHeuristicInsights, type Insight } from './insights';

const GEMINI_MODEL = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface BoardSummary {
  total_tasks: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  completion_rate: string;
  overdue_tasks: { title: string; days_overdue: number; priority: string; assignee: string | null }[];
  due_today: { title: string; priority: string }[];
  due_this_week: { title: string; priority: string; days_until: number }[];
  team_workload: { name: string; active: number; done: number }[];
  unassigned_count: number;
  no_due_date_count: number;
  high_priority_not_started: number;
}

function buildBoardSummary(tasks: Task[], members: TeamMember[], taskAssignees: TaskAssignee[]): BoardSummary {
  const now = new Date();
  const byStatus: Record<string, number> = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
  const byPriority: Record<string, number> = { high: 0, normal: 0, low: 0 };

  tasks.forEach(t => {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
  });

  const done = tasks.filter(t => t.status === 'done').length;
  const completionRate = tasks.length > 0 ? `${Math.round((done / tasks.length) * 100)}%` : '0%';

  const getAssigneeNames = (taskId: string) => {
    const ids = taskAssignees.filter(ta => ta.task_id === taskId).map(ta => ta.member_id);
    return members.filter(m => ids.includes(m.id)).map(m => m.name);
  };

  const overdueTasks = tasks
    .filter(t => t.due_date && t.status !== 'done' && isPast(new Date(t.due_date + 'T00:00:00')) && !isToday(new Date(t.due_date + 'T00:00:00')))
    .map(t => ({
      title: t.title,
      days_overdue: Math.abs(differenceInDays(new Date(t.due_date! + 'T00:00:00'), now)),
      priority: t.priority,
      assignee: getAssigneeNames(t.id).join(', ') || null,
    }));

  const dueToday = tasks
    .filter(t => t.due_date && t.status !== 'done' && isToday(new Date(t.due_date + 'T00:00:00')))
    .map(t => ({ title: t.title, priority: t.priority }));

  const dueThisWeek = tasks
    .filter(t => {
      if (!t.due_date || t.status === 'done') return false;
      const d = new Date(t.due_date + 'T00:00:00');
      const diff = differenceInDays(d, now);
      return diff > 0 && diff <= 7;
    })
    .map(t => ({
      title: t.title,
      priority: t.priority,
      days_until: differenceInDays(new Date(t.due_date! + 'T00:00:00'), now),
    }));

  const teamWorkload = members.map(m => {
    const memberTaskIds = taskAssignees
      .filter(ta => ta.member_id === m.id)
      .map(ta => ta.task_id);
    const memberTasks = tasks.filter(t => memberTaskIds.includes(t.id));
    return {
      name: m.name,
      active: memberTasks.filter(t => t.status !== 'done').length,
      done: memberTasks.filter(t => t.status === 'done').length,
    };
  });

  const unassignedCount = tasks.filter(t =>
    t.status !== 'done' && !taskAssignees.some(ta => ta.task_id === t.id)
  ).length;

  return {
    total_tasks: tasks.length,
    by_status: byStatus,
    by_priority: byPriority,
    completion_rate: completionRate,
    overdue_tasks: overdueTasks,
    due_today: dueToday,
    due_this_week: dueThisWeek,
    team_workload: teamWorkload,
    unassigned_count: unassignedCount,
    no_due_date_count: tasks.filter(t => !t.due_date && t.status !== 'done').length,
    high_priority_not_started: tasks.filter(t => t.priority === 'high' && t.status === 'todo').length,
  };
}

const SYSTEM_PROMPT = `You are a project management analyst. Given a Kanban board's data summary, provide 4-5 concise, actionable insights. Be specific — reference task names, team members, and numbers. Mix practical advice with observations.

Return ONLY valid JSON in this exact format — no markdown, no code fences:
[
  { "type": "warning|info|success|tip", "title": "Short title (under 10 words)", "detail": "1-2 sentence explanation with specifics." }
]

Types:
- warning: urgent issues (overdue, blocked high-priority)
- info: neutral observations (trends, patterns)
- success: positive progress worth noting
- tip: actionable suggestions for improvement`;

export async function generateAIInsights(tasks: Task[], members: TeamMember[], taskAssignees: TaskAssignee[] = []): Promise<Insight[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return generateHeuristicInsights(tasks, members, taskAssignees);
  }

  if (tasks.length === 0) return [];

  const summary = buildBoardSummary(tasks, members, taskAssignees);

  try {
    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${SYSTEM_PROMPT}\n\nBoard data:\n${JSON.stringify(summary, null, 2)}`,
          }],
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      console.warn('Gemini API error, falling back to heuristics:', response.status);
      return generateHeuristicInsights(tasks, members, taskAssignees);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return generateHeuristicInsights(tasks, members, taskAssignees);
    }

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as Array<{ type: string; title: string; detail: string }>;

    return parsed.map((item, i) => ({
      id: `ai-${i}`,
      type: (['warning', 'info', 'success', 'tip'].includes(item.type) ? item.type : 'info') as Insight['type'],
      title: item.title,
      detail: item.detail,
    }));
  } catch (err) {
    console.warn('Gemini insight generation failed, using heuristics:', err);
    return generateHeuristicInsights(tasks, members, taskAssignees);
  }
}

export function getDataSummaryForDisplay(tasks: Task[], members: TeamMember[], taskAssignees: TaskAssignee[] = []): BoardSummary {
  return buildBoardSummary(tasks, members, taskAssignees);
}

export function isGeminiConfigured(): boolean {
  return !!import.meta.env.VITE_GEMINI_API_KEY;
}
