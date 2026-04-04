import { isPast, isToday, differenceInDays } from 'date-fns';
import type { Task, TaskAssignee, TeamMember } from './types';

export interface Insight {
  id: string;
  type: 'warning' | 'info' | 'success' | 'tip';
  title: string;
  detail: string;
}

export function generateInsights(tasks: Task[], members: TeamMember[], taskAssignees: TaskAssignee[] = []): Insight[] {
  const insights: Insight[] = [];
  if (tasks.length === 0) return insights;

  const now = new Date();
  const todo = tasks.filter(t => t.status === 'todo');
  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const inReview = tasks.filter(t => t.status === 'in_review');
  const done = tasks.filter(t => t.status === 'done');

  const overdue = tasks.filter(t =>
    t.due_date && t.status !== 'done' && isPast(new Date(t.due_date + 'T00:00:00')) && !isToday(new Date(t.due_date + 'T00:00:00'))
  );
  const dueThisWeek = tasks.filter(t => {
    if (!t.due_date || t.status === 'done') return false;
    const d = new Date(t.due_date + 'T00:00:00');
    const diff = differenceInDays(d, now);
    return diff >= 0 && diff <= 7;
  });
  const highPriority = tasks.filter(t => t.priority === 'high' && t.status !== 'done');

  const completionRate = tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0;

  if (overdue.length > 0) {
    insights.push({
      id: 'overdue',
      type: 'warning',
      title: `${overdue.length} task${overdue.length > 1 ? 's' : ''} overdue`,
      detail: `${overdue.map(t => `"${t.title}"`).slice(0, 3).join(', ')}${overdue.length > 3 ? ` and ${overdue.length - 3} more` : ''} — consider reprioritizing or updating deadlines.`,
    });
  }

  if (highPriority.length > 0) {
    const notStarted = highPriority.filter(t => t.status === 'todo');
    if (notStarted.length > 0) {
      insights.push({
        id: 'high-priority-blocked',
        type: 'warning',
        title: `${notStarted.length} high-priority task${notStarted.length > 1 ? 's' : ''} not started`,
        detail: `These need attention: ${notStarted.map(t => `"${t.title}"`).slice(0, 2).join(', ')}.`,
      });
    }
  }

  if (todo.length > inProgress.length + inReview.length + done.length) {
    insights.push({
      id: 'backlog-heavy',
      type: 'info',
      title: 'Backlog is growing',
      detail: `${Math.round((todo.length / tasks.length) * 100)}% of tasks are still in To Do. Consider breaking them into smaller pieces or prioritizing ruthlessly.`,
    });
  }

  if (inReview.length === 0 && inProgress.length > 0) {
    insights.push({
      id: 'review-empty',
      type: 'tip',
      title: 'No tasks in review',
      detail: `${inProgress.length} tasks are in progress but none are in review. Moving tasks to review can help track what needs feedback.`,
    });
  }

  if (dueThisWeek.length >= 3) {
    insights.push({
      id: 'busy-week',
      type: 'info',
      title: `${dueThisWeek.length} tasks due this week`,
      detail: `Busy stretch ahead. ${dueThisWeek.filter(t => t.priority === 'high').length} of these are high priority.`,
    });
  }

  if (completionRate >= 50) {
    insights.push({
      id: 'good-progress',
      type: 'success',
      title: `${completionRate}% completion rate`,
      detail: `You've completed ${done.length} of ${tasks.length} tasks. Great momentum — keep it up!`,
    });
  } else if (completionRate < 20 && tasks.length >= 5) {
    insights.push({
      id: 'low-completion',
      type: 'info',
      title: `Only ${completionRate}% completed`,
      detail: `${done.length} of ${tasks.length} tasks done. Focus on finishing in-progress work before starting new tasks.`,
    });
  }

  if (members.length > 0) {
    const assigneeCounts: Record<string, number> = {};
    const unassigned = tasks.filter(t => {
      if (t.status === 'done') return false;
      return !taskAssignees.some(ta => ta.task_id === t.id);
    });

    tasks.filter(t => t.status !== 'done').forEach(t => {
      const memberIds = taskAssignees
        .filter(ta => ta.task_id === t.id)
        .map(ta => ta.member_id);
      for (const mid of memberIds) {
        assigneeCounts[mid] = (assigneeCounts[mid] || 0) + 1;
      }
    });

    const entries = Object.entries(assigneeCounts).sort((a, b) => b[1] - a[1]);

    if (entries.length >= 2) {
      const [topId, topCount] = entries[0];
      const [, bottomCount] = entries[entries.length - 1];
      const topMember = members.find(m => m.id === topId);

      if (topCount >= bottomCount * 2 && topMember) {
        insights.push({
          id: 'workload-imbalance',
          type: 'tip',
          title: 'Uneven workload',
          detail: `${topMember.name} has ${topCount} active tasks — more than double some teammates. Consider redistributing.`,
        });
      }
    }

    if (unassigned.length >= 3) {
      insights.push({
        id: 'unassigned-tasks',
        type: 'tip',
        title: `${unassigned.length} tasks unassigned`,
        detail: `Assigning tasks helps track accountability and balance workload across the team.`,
      });
    }
  }

  const tasksWithDates = tasks.filter(t => t.due_date && t.status !== 'done');
  if (tasksWithDates.length > 0) {
    const soonest = tasksWithDates
      .map(t => ({ ...t, dateObj: new Date(t.due_date! + 'T00:00:00') }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())[0];

    if (soonest && isToday(soonest.dateObj)) {
      insights.push({
        id: 'due-today',
        type: 'warning',
        title: 'Task due today',
        detail: `"${soonest.title}" is due today${soonest.priority === 'high' ? ' and is high priority' : ''}.`,
      });
    }
  }

  const noDueDates = tasks.filter(t => !t.due_date && t.status !== 'done');
  if (noDueDates.length > tasks.length * 0.5 && noDueDates.length >= 3) {
    insights.push({
      id: 'missing-dates',
      type: 'tip',
      title: `${noDueDates.length} tasks have no due date`,
      detail: 'Adding due dates helps visualize timelines and prevent tasks from slipping through the cracks.',
    });
  }

  return insights.slice(0, 6);
}
