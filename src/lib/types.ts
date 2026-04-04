export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'normal' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  user_id: string;
  due_date: string | null;
  assignee_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export interface TaskLabel {
  task_id: string;
  label_id: string;
}

export interface TaskAssignee {
  task_id: string;
  member_id: string;
}

export interface TeamMember {
  id: string;
  name: string;
  color: string;
  avatar_url: string | null;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  details: string | null;
  created_at: string;
}

export interface Column {
  id: TaskStatus;
  title: string;
}

export const COLUMNS: Column[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' },
];

export const LABEL_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#ec4899', '#f43f5e', '#78716c',
];
